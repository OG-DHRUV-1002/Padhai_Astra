"""Pydantic v2 schemas for the telemetry and dead-zone detection engine."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ZoneState(str, Enum):
    """Tri-state zone classification for a tracked device."""

    OUTDOOR = "OUTDOOR"
    ENTRANCE_BREACH = "ENTRANCE_BREACH"
    CANTEEN_INDOOR = "CANTEEN_INDOOR"


class RushLevel(str, Enum):
    """Qualitative rush classification for occupancy reporting."""

    LOW = "LOW"
    MODERATE = "MODERATE"
    PEAK = "PEAK"


class OccupancySnapshot(BaseModel):
    """Point-in-time canteen occupancy report."""

    current_count: int = Field(..., ge=0, description="Active indoor device count")
    capacity: int = Field(250, gt=0, description="Maximum canteen capacity")
    capacity_percent: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Occupancy as a percentage of capacity",
    )
    rush_status: RushLevel = Field(..., description="Qualitative rush classification")


class DeviceStateSnapshot(BaseModel):
    """Serialisable view of a single device's telemetry state."""

    uid: str
    current_zone: ZoneState
    last_seen_elapsed_s: float = Field(
        ...,
        ge=0.0,
        description="Seconds since the device's last heartbeat",
    )
    entered_canteen_at_elapsed_s: float | None = Field(
        None,
        description="Seconds since canteen entry (None if not inside)",
    )
    consecutive_exterior_pings: int = Field(0, ge=0)
    last_rssi_dbm: int | None = None
    at_entrance_geofence: bool = False


class HeartbeatPayload(BaseModel):
    """Inbound telemetry ping from client mobile/web runtime."""

    uid: str = Field(..., min_length=1, description="Unique client/device identifier")
    inside_entrance_polygon: bool = Field(
        ...,
        description="True if device GPS falls inside the canteen entrance polygon",
    )
    rssi_dbm: int | None = Field(
        None,
        description="Received signal strength indicator in dBm",
    )


class HeartbeatResponse(BaseModel):
    """Ultra-low latency acknowledgement for client heartbeat."""

    status: str = Field("recorded", description="Ingestion status")
    uid: str = Field(..., description="Echoed device identifier")
    server_time: float = Field(..., description="Unix epoch timestamp on server")


class SweepResponse(BaseModel):
    """Response returned when triggering dead-zone transition sweeps."""

    promoted_uids: list[str] = Field(..., description="List of UIDs transitioned to indoor")
    count: int = Field(..., ge=0, description="Total number of transitions applied")
    server_time: float = Field(..., description="Unix epoch timestamp of sweep")
