"""Unnitro SuperApp — Pod Beta FastAPI Gateway.

Application entry point. Creates the FastAPI instance with:
* **Lifespan-managed httpx connection pool** — shared across all async
  handlers and drained gracefully on shutdown.
* **Campus Topology Ingestion** — populates the full Somaiya graph network on startup.
* **Background Dead-Zone Sweeper** — continuous async task executing
  canteen silence sweeps every 5 seconds.
* **CORS** — whitelists the Pod Alpha Next.js frontend at
  ``http://localhost:3000`` with credential support.
* **Health probe** — ``GET /health`` for load-balancer and container
  orchestrator readiness checks with subsystem reporting.
* **v1 API fabric** — all domain routers mounted under ``/api/v1``.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.navigation import campus_graph
from app.api.v1.router import router as v1_router
from app.core.telemetry_store import telemetry_store
from app.services.graph_loader import load_somaiya_topology

logger = logging.getLogger("unnitro.backend")

# ---------------------------------------------------------------------------
# Background Async Sweeper Worker
# ---------------------------------------------------------------------------


async def deadzone_sweeper() -> None:
    """Continuous background worker that executes dead-zone silence sweeps
    every 5 seconds.

    Catches and logs unexpected exceptions to guarantee continuous runtime
    survival without terminating the event loop worker.
    """
    logger.info("Background dead-zone sweeper worker started.")
    while True:
        try:
            promoted = telemetry_store.sweep_deadzone_transitions()
            if promoted:
                logger.info(
                    "Dead-zone sweep promoted %d device(s) to CANTEEN_INDOOR: %s",
                    len(promoted),
                    promoted,
                )
        except Exception as exc:
            logger.error(
                "Unexpected error in background dead-zone sweeper: %s",
                exc,
                exc_info=True,
            )
        await asyncio.sleep(5.0)


# ---------------------------------------------------------------------------
# Lifespan — shared httpx connection pool & background tasks
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    """Manage the lifecycle of the shared ``httpx.AsyncClient``, full campus
    topology loading, and background telemetry sweeper task.
    """
    # 1. Ingest Somaiya campus topology into shared navigation graph
    topology_summary = load_somaiya_topology(campus_graph)
    application.state.topology_summary = topology_summary
    logger.info(
        "Somaiya campus topology loaded on startup: %d nodes, %d edges across %s",
        topology_summary["nodes_count"],
        topology_summary["edges_count"],
        topology_summary["buildings"],
    )

    # 2. Initialise shared HTTP client for downstream AI proxy forwarding
    client = httpx.AsyncClient(
        limits=httpx.Limits(
            max_keepalive_connections=50,
            max_connections=200,
        ),
        timeout=httpx.Timeout(10.0, connect=5.0),
        follow_redirects=True,
    )
    application.state.http_client = client
    logger.info(
        "httpx.AsyncClient initialised (keepalive=%d, max_conn=%d)",
        50,
        200,
    )

    # 3. Spawn background dead-zone sweeper task
    sweep_task = asyncio.create_task(deadzone_sweeper())
    application.state.sweeper_task = sweep_task

    yield  # Application is running

    # Graceful shutdown: cancel background sweeper
    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        logger.info("Background dead-zone sweeper task cancelled cleanly.")

    # Drain and close shared HTTP client
    await client.aclose()
    logger.info("httpx.AsyncClient drained and closed.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    """Build and configure the FastAPI application instance."""

    application = FastAPI(
        title="Unnitro SuperApp — Pod Beta Gateway",
        version="1.0.0",
        description=(
            "Unified backend gateway for Unnitro SuperApp providing the "
            "3D A* navigation engine, GPS telemetry dead-zone inference, "
            "and AI microservice proxy."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # -- CORS ----------------------------------------------------------------
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_credentials=True,
        allow_headers=["*"],
        expose_headers=["X-Process-Time", "Content-Length"],
    )

    # -- Routers -------------------------------------------------------------
    application.include_router(v1_router, prefix="/api/v1")

    # -- Health probe --------------------------------------------------------

    @application.get("/health", tags=["System"])
    async def health_check() -> dict[str, object]:
        """Lightweight readiness probe for orchestrators and load balancers."""
        sweeper_task: asyncio.Task[None] | None = getattr(
            application.state, "sweeper_task", None
        )
        worker_status = (
            "running"
            if sweeper_task is not None and not sweeper_task.done()
            else "stopped"
        )

        return {
            "status": "online",
            "pod": "beta",
            "port": 8000,
            "services": {
                "deadzone_worker": worker_status,
                "astar_engine": "online",
                "telemetry_store": "online",
            },
        }

    return application


# ---------------------------------------------------------------------------
# Module-level app instance (uvicorn target: app.main:app)
# ---------------------------------------------------------------------------

app = create_app()
