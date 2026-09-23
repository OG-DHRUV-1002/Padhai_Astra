"""Pydantic v2 schemas for the 3D A* navigation engine.

These models define the strict input/output contracts for route calculation
endpoints and the internal algorithm interface.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class Coordinate3D(BaseModel):
    """A point in campus 3D space."""

    x: float = Field(..., description="East-West position in metres")
    y: float = Field(..., description="North-South position in metres")
    z: float = Field(..., description="Altitude / floor height in metres")


class WaypointStep(BaseModel):
    """A single turn-by-turn instruction along the computed path."""

    node_id: str = Field(..., description="Graph node identifier")
    x: float
    y: float
    z: float
    floor: int = Field(..., description="Logical floor number (0-indexed)")
    building: str = Field(..., description="Building identifier")
    instruction: str = Field(
        ...,
        description=(
            "Human-readable navigation instruction, e.g. "
            "'Turn left', 'Take elevator to Floor 3'"
        ),
    )
    cumulative_distance_m: float = Field(
        ...,
        ge=0.0,
        description="Distance from origin to this waypoint in metres",
    )


class PathResponse(BaseModel):
    """Complete A* route result returned to the caller."""

    total_distance_meters: float = Field(
        ...,
        ge=0.0,
        description="Total path length in metres (rounded to 2 decimals)",
    )
    estimated_duration_seconds: float = Field(
        ...,
        ge=0.0,
        description="Walking time at 1.3 m/s average velocity",
    )
    node_sequence: list[str] = Field(
        ...,
        description="Ordered list of graph node IDs forming the path",
    )
    waypoints: list[WaypointStep] = Field(
        ...,
        description="Turn-by-turn navigation instructions with coordinates",
    )
    accessible_route: bool = Field(
        False,
        description="Whether this route was computed with accessibility constraints",
    )


class PathRequest(BaseModel):
    """Inbound request specifying origin and destination for route computation."""

    origin_node: str = Field(
        ...,
        alias="origin",
        description="Starting graph node ID",
    )
    destination_node: str = Field(
        ...,
        alias="destination",
        description="Target graph node ID",
    )
    accessible_only: bool = Field(
        False,
        description="If true, exclude stairs and inaccessible edges",
    )

    model_config = {
        "populate_by_name": True,
    }


class NodeMetadata(BaseModel):
    """Graph node descriptor for frontend map discovery."""

    node_id: str = Field(..., description="Unique graph node identifier")
    building: str = Field(..., description="Building identifier (e.g. SSBAS, Canteen)")
    floor: int = Field(..., description="Logical floor number (0-indexed)")
    x: float = Field(..., description="Local horizontal X coordinate in metres")
    y: float = Field(..., description="Local horizontal Y coordinate in metres")
    z: float = Field(..., description="Local vertical Z coordinate in metres")
    is_accessible: bool = Field(True, description="Wheelchair accessible point")
