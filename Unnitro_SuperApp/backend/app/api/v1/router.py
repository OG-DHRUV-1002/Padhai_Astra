"""Aggregated API v1 router.

Mounts domain-specific routers under unified /api/v1 prefixes:
- /navigation: 3D A* multi-floor routing & campus node topology
- /telemetry: High-frequency GPS/BLE heartbeats & canteen dead-zone tracking
- /ai: Non-blocking proxy to Pod Gamma AI microservice
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import ai_proxy, navigation, telemetry

router = APIRouter()

# ---------------------------------------------------------------------------
# Core Engine Router Mounts
# ---------------------------------------------------------------------------

router.include_router(
    navigation.router,
    prefix="/navigation",
    tags=["Navigation Engine"],
)

router.include_router(
    telemetry.router,
    prefix="/telemetry",
    tags=["Telemetry & Dead-Zone Engine"],
)

router.include_router(
    ai_proxy.router,
    prefix="/ai",
    tags=["Pod Gamma AI Engine"],
)
