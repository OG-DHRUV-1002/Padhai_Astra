"""Non-blocking AI microservice proxy endpoint.

Forwards student, faculty, and admin prompts to Pod Gamma's local RAG
engine (``http://127.0.0.1:8001/rag/query``) via the shared
``httpx.AsyncClient`` stored on ``app.state.http_client``.

The proxy implements a circuit-breaker pattern:
*  **Timeout guard** (8 s) — prevents a hung downstream from starving
   FastAPI's event-loop worker.
*  **Connection-error fallback** — returns a graceful HTTP 200 with
   ``is_fallback=True`` so the frontend can display a helpful message
   rather than a raw error screen.
"""

from __future__ import annotations

import time

import httpx
from fastapi import APIRouter, Request

from app.schemas.ai import AIQueryRequest, AIQueryResponse

router = APIRouter()

# Pod Gamma's local RAG service endpoint
_DOWNSTREAM_URL: str = "http://127.0.0.1:8001/rag/query"
_DOWNSTREAM_TIMEOUT: float = 8.0  # seconds


@router.post(
    "/query",
    response_model=AIQueryResponse,
    summary="Forward a natural-language query to Pod Gamma's AI engine",
    response_description="AI-generated answer (or a graceful fallback)",
)
async def ai_query(body: AIQueryRequest, request: Request) -> AIQueryResponse:
    """Accept a user prompt, relay it to the downstream RAG microservice,
    and return the result.  On timeout or connection failure the endpoint
    returns a deterministic fallback response rather than raising an HTTP
    error.
    """
    client: httpx.AsyncClient = request.app.state.http_client
    t_start = time.perf_counter()

    payload = {
        "prompt": body.prompt,
        "user_uid": body.user_uid,
        "role": body.role.value,
        "context_flags": body.context_flags,
    }

    try:
        response = await client.post(
            _DOWNSTREAM_URL,
            json=payload,
            timeout=_DOWNSTREAM_TIMEOUT,
        )

        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)

        if response.status_code == 200:
            data = response.json()
            return AIQueryResponse(
                status="ok",
                answer=data.get("answer", data.get("response", "")),
                model=data.get("model", "pod-gamma-rag"),
                is_fallback=False,
                tools_used=data.get("tools_used", []),
                latency_ms=latency_ms,
            )

        # Downstream returned a non-200 status — treat as degraded
        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        return AIQueryResponse(
            status=f"downstream_error_{response.status_code}",
            answer=(
                "The campus AI service returned an unexpected status.  "
                "Please try again in a moment or contact support if the "
                "issue persists."
            ),
            model="fallback",
            is_fallback=True,
            latency_ms=latency_ms,
        )

    except httpx.TimeoutException:
        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        return AIQueryResponse(
            status="fallback_timeout",
            answer=(
                "The campus AI engine is currently processing a high volume "
                "of requests and could not respond within the allotted time.  "
                "Your query has been noted — please try again shortly."
            ),
            model="fallback",
            is_fallback=True,
            latency_ms=latency_ms,
        )

    except httpx.RequestError:
        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        return AIQueryResponse(
            status="service_unreachable",
            answer=(
                "The campus AI service is temporarily unavailable.  "
                "This may be due to a scheduled maintenance window or a "
                "network interruption.  Core campus features remain fully "
                "operational."
            ),
            model="fallback",
            is_fallback=True,
            latency_ms=latency_ms,
        )
