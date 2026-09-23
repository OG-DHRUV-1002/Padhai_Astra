"""In-memory telemetry TTL store and canteen dead-zone detection engine.

Designed to intercept high-frequency 10-second client GPS heartbeats without
incurring Cloud Firestore write costs.  The state machine implements a
multi-stage anti-flapping protocol that prevents phantom occupancy swings
caused by signal reflections, fleeting entrance proximity, and intermittent
GPS fixes near building perimeters.

Thread safety
-------------
All mutations to the shared ``_devices`` dictionary and the ``_occupancy``
counter are guarded by a single ``threading.Lock``.  This is correct for
uvicorn's default event-loop model where background sweepers or sync
callers may touch state from different OS threads.

State machine
-------------
::

    ┌──────────┐  entrance ping   ┌──────────────────┐  silence > 15 s   ┌─────────────────┐
    │ OUTDOOR  │ ───────────────> │ ENTRANCE_BREACH  │ ─────────────────> │ CANTEEN_INDOOR  │
    └──────────┘ <─────────────── └──────────────────┘                    └─────────────────┘
        ^         exit entrance                                               │
        │                                                                     │
        └─────────────── 4 stable exterior pings + dwell > 300 s ─────────────┘
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field

from app.schemas.telemetry import OccupancySnapshot, RushLevel, ZoneState

# ---------------------------------------------------------------------------
# Tuning constants
# ---------------------------------------------------------------------------

CANTEEN_CAPACITY: int = 250  # max occupancy
CANTEEN_DEADZONE_TIMEOUT: float = 15.0  # seconds of silence -> indoor
MINIMUM_DWELL_SECONDS: float = 300.0  # 5-minute lock-in
REQUIRED_EXIT_PINGS: int = 4  # consecutive clean exterior pings to confirm exit
RSSI_LEAK_THRESHOLD_DBM: int = -85  # interior window reflection ceiling
RSSI_CLEAN_EXIT_DBM: int = -75  # minimum signal for a credible exterior ping


# ---------------------------------------------------------------------------
# Per-device mutable state
# ---------------------------------------------------------------------------


@dataclass
class DeviceState:
    """Mutable telemetry state for a single tracked device."""

    uid: str
    current_zone: ZoneState = ZoneState.OUTDOOR
    last_seen_monotonic: float = field(default_factory=time.monotonic)
    entered_canteen_at: float | None = None
    consecutive_exterior_pings: int = 0
    last_rssi_dbm: int | None = None
    at_entrance_geofence: bool = False


# ---------------------------------------------------------------------------
# Core store
# ---------------------------------------------------------------------------


class TelemetryMemoryStore:
    """Thread-safe in-memory store for GPS heartbeat tracking and canteen
    dead-zone inference.

    Usage
    -----
    1.  On every client GPS ping, call :meth:`ingest_ping`.
    2.  Run :meth:`sweep_deadzone_transitions` periodically (e.g. every 5 s)
        from a background task to promote ``ENTRANCE_BREACH`` devices that
        have gone silent into ``CANTEEN_INDOOR``.
    3.  Query :meth:`get_canteen_occupancy` for a real-time snapshot.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._devices: dict[str, DeviceState] = {}
        self._occupancy: int = 0

    # -- Heartbeat ingestion -------------------------------------------------

    def ingest_ping(
        self,
        uid: str,
        *,
        at_entrance_geofence: bool,
        rssi_dbm: int | None = None,
    ) -> ZoneState:
        """Process an incoming GPS/BLE heartbeat from device *uid*.

        Parameters
        ----------
        uid:
            Unique device / user identifier.
        at_entrance_geofence:
            ``True`` when the device coordinates fall inside the canteen
            entrance geofence polygon.
        rssi_dbm:
            Received signal strength indicator in dBm (optional).  Used
            for the weak-signal leak filter.

        Returns
        -------
        ZoneState
            The device's zone **after** applying the state transition rules.
        """
        now = time.monotonic()

        with self._lock:
            dev = self._devices.get(uid)

            if dev is None:
                dev = DeviceState(uid=uid)
                self._devices[uid] = dev

            dev.last_seen_monotonic = now
            dev.last_rssi_dbm = rssi_dbm
            dev.at_entrance_geofence = at_entrance_geofence

            # ----- State transitions -----

            if dev.current_zone is ZoneState.OUTDOOR:
                if at_entrance_geofence:
                    # User has breached the entrance polygon
                    dev.current_zone = ZoneState.ENTRANCE_BREACH
                    dev.consecutive_exterior_pings = 0
                # Else: remains OUTDOOR, nothing to do.

            elif dev.current_zone is ZoneState.ENTRANCE_BREACH:
                if not at_entrance_geofence:
                    # Stepped back outside → revert to OUTDOOR
                    dev.current_zone = ZoneState.OUTDOOR
                    dev.consecutive_exterior_pings = 0
                # Else: stays at ENTRANCE_BREACH; the sweep timer handles
                # the silence-based promotion to CANTEEN_INDOOR.

            elif dev.current_zone is ZoneState.CANTEEN_INDOOR:
                self._handle_indoor_ping(dev, at_entrance_geofence, rssi_dbm, now)

            return dev.current_zone

    def process_heartbeat(
        self,
        uid: str,
        *,
        inside_entrance_polygon: bool,
        rssi_dbm: int | None = None,
    ) -> ZoneState:
        """Alias for :meth:`ingest_ping` accepting payload field names."""
        return self.ingest_ping(
            uid=uid,
            at_entrance_geofence=inside_entrance_polygon,
            rssi_dbm=rssi_dbm,
        )

    # -- Indoor ping sub-handler ---------------------------------------------

    def _handle_indoor_ping(
        self,
        dev: DeviceState,
        at_entrance_geofence: bool,
        rssi_dbm: int | None,
        now: float,
    ) -> None:
        """Apply indoor-specific transition rules.  Caller must hold the lock."""

        # Weak-signal leak filter: interior window reflections catching
        # outdoor towers produce low-RSSI pings that should be discarded.
        if rssi_dbm is not None and rssi_dbm < RSSI_LEAK_THRESHOLD_DBM:
            dev.consecutive_exterior_pings = 0
            return  # treat as interior artefact

        # Dwell-time lock: ignore exit attempts before 5 minutes
        if dev.entered_canteen_at is not None:
            dwell = now - dev.entered_canteen_at
            if dwell < MINIMUM_DWELL_SECONDS:
                dev.consecutive_exterior_pings = 0
                return

        # The device is still pinging, so it is alive.
        if at_entrance_geofence:
            # Near the entrance but still inside — not yet a confirmed exit
            dev.consecutive_exterior_pings = 0
            return

        # Outside the entrance geofence and past the dwell window
        if rssi_dbm is not None and rssi_dbm >= RSSI_CLEAN_EXIT_DBM:
            dev.consecutive_exterior_pings += 1
        elif rssi_dbm is None:
            # No RSSI available — count the ping conservatively
            dev.consecutive_exterior_pings += 1
        else:
            # Weak outdoor signal — reset counter
            dev.consecutive_exterior_pings = 0
            return

        if dev.consecutive_exterior_pings >= REQUIRED_EXIT_PINGS:
            # Confirmed exit
            dev.current_zone = ZoneState.OUTDOOR
            dev.entered_canteen_at = None
            dev.consecutive_exterior_pings = 0
            self._occupancy = max(0, self._occupancy - 1)

    # -- Dead-zone sweep -----------------------------------------------------

    def sweep_deadzone_transitions(self) -> list[str]:
        """Promote silent ``ENTRANCE_BREACH`` devices to ``CANTEEN_INDOOR``.

        Call this method periodically (recommended: every 5 seconds) from a
        background asyncio task or scheduler.

        Returns
        -------
        list[str]
            UIDs of devices that were transitioned into ``CANTEEN_INDOOR``
            during this sweep.
        """
        now = time.monotonic()
        promoted: list[str] = []

        with self._lock:
            for dev in self._devices.values():
                if dev.current_zone is not ZoneState.ENTRANCE_BREACH:
                    continue

                silence = now - dev.last_seen_monotonic
                if silence >= CANTEEN_DEADZONE_TIMEOUT:
                    dev.current_zone = ZoneState.CANTEEN_INDOOR
                    dev.entered_canteen_at = now
                    dev.consecutive_exterior_pings = 0
                    self._occupancy += 1
                    promoted.append(dev.uid)

        return promoted

    # -- Occupancy snapshot --------------------------------------------------

    def get_canteen_occupancy(self) -> OccupancySnapshot:
        """Return a point-in-time occupancy snapshot for the canteen."""
        with self._lock:
            count = self._occupancy
        pct = round((count / CANTEEN_CAPACITY) * 100.0, 2) if CANTEEN_CAPACITY else 0.0

        if pct < 45.0:
            rush = RushLevel.LOW
        elif pct < 80.0:
            rush = RushLevel.MODERATE
        else:
            rush = RushLevel.PEAK

        return OccupancySnapshot(
            current_count=count,
            capacity=CANTEEN_CAPACITY,
            capacity_percent=min(pct, 100.0),
            rush_status=rush,
        )

    # -- Diagnostics ---------------------------------------------------------

    def get_device_state(self, uid: str) -> DeviceState | None:
        """Return a copy of the device state for debugging.  Thread-safe."""
        with self._lock:
            dev = self._devices.get(uid)
            if dev is None:
                return None
            # Return a shallow copy so the caller cannot mutate internal state
            return DeviceState(
                uid=dev.uid,
                current_zone=dev.current_zone,
                last_seen_monotonic=dev.last_seen_monotonic,
                entered_canteen_at=dev.entered_canteen_at,
                consecutive_exterior_pings=dev.consecutive_exterior_pings,
                last_rssi_dbm=dev.last_rssi_dbm,
                at_entrance_geofence=dev.at_entrance_geofence,
            )

    @property
    def tracked_device_count(self) -> int:
        with self._lock:
            return len(self._devices)

    def remove_device(self, uid: str) -> bool:
        """Evict a device from the store.  Returns ``True`` if it was present."""
        with self._lock:
            dev = self._devices.pop(uid, None)
            if dev is None:
                return False
            if dev.current_zone is ZoneState.CANTEEN_INDOOR:
                self._occupancy = max(0, self._occupancy - 1)
            return True


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

telemetry_store = TelemetryMemoryStore()
