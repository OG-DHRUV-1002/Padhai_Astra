"""Active telemetry and canteen dead-zone detection endpoints.

Intercepts high-frequency mobile GPS/BLE heartbeats, manages anti-flapping
dead-zone state transitions, and serves low-latency real-time canteen occupancy.
"""

from __future__ import annotations

import time

from fastapi import APIRouter

from app.core.telemetry_store import telemetry_store
from app.schemas.telemetry import (
    HeartbeatPayload,
    HeartbeatResponse,
    OccupancySnapshot,
    SweepResponse,
)

router = APIRouter()


@router.post(
    "/heartbeat",
    response_model=HeartbeatResponse,
    summary="Ingest client GPS/BLE telemetry heartbeat",
    response_description="Fast acknowledgement of telemetry packet recording",
)
async def ingest_heartbeat(payload: HeartbeatPayload) -> HeartbeatResponse:
    """Process an incoming client telemetry heartbeat in < 1 ms.

    Updates internal device tracking state and entrance geofence status
    without triggering blocking disk or external database I/O.
    """
    telemetry_store.process_heartbeat(
        uid=payload.uid,
        inside_entrance_polygon=payload.inside_entrance_polygon,
        rssi_dbm=payload.rssi_dbm,
    )

    return HeartbeatResponse(
        status="recorded",
        uid=payload.uid,
        server_time=time.time(),
    )


@router.get(
    "/occupancy",
    response_model=OccupancySnapshot,
    summary="Retrieve real-time canteen occupancy snapshot",
    response_description="Active occupant count, capacity percentage, and rush status",
)
async def get_canteen_occupancy() -> OccupancySnapshot:
    """Return the current canteen occupancy state derived from in-memory
    dead-zone tracking and dwell-time inference.
    """
    return telemetry_store.get_canteen_occupancy()


@router.post(
    "/sweep",
    response_model=SweepResponse,
    summary="Trigger dead-zone transition sweep",
    response_description="Summary of devices promoted to indoor status",
)
async def trigger_deadzone_sweep() -> SweepResponse:
    """Perform a dead-zone sweep over tracked devices.

    Promotes devices silent at the entrance geofence beyond the dead-zone
    timeout threshold into confirmed indoor occupants. Intended for background
    workers and test harnesses.
    """
    promoted = telemetry_store.sweep_deadzone_transitions()
    return SweepResponse(
        promoted_uids=promoted,
        count=len(promoted),
        server_time=time.time(),
    )
