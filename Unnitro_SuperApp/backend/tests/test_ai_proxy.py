"""Pod Gamma AI Proxy Circuit Breaker and Resilience Test Suite.

Validates:
1. Downstream offline fallback (HTTP 200 with status='service_unreachable', is_fallback=True).
2. Downstream timeout circuit breaker (HTTP 200 with status='fallback_timeout', is_fallback=True).
3. Graceful error handling for HTTP 500 downstream responses.
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_ai_proxy_service_unreachable() -> None:
    """Test A: When Pod Gamma (port 8001) is offline, the proxy returns a
    deterministic HTTP 200 fallback response rather than propagating a 502/503 error.
    """
    with TestClient(app) as client:
        payload = {
            "prompt": "Where is the computer lab in KJSCE?",
            "user_uid": "student_test_101",
            "role": "student",
            "context_flags": {"floor": "1", "building": "KJSCE"},
        }
        resp = client.post("/api/v1/ai/query", json=payload)
        assert resp.status_code == 200, f"Expected HTTP 200 fallback, got {resp.status_code}"

        data = resp.json()
        assert data["status"] == "service_unreachable", f"Unexpected status: {data['status']}"
        assert data["is_fallback"] is True
        assert data["model"] == "fallback"
        assert len(data["answer"]) > 10
        assert "temporarily unavailable" in data["answer"].lower()
        print("  [PASS] Test A: Downstream offline fallback verified (HTTP 200, status=service_unreachable).")


def test_ai_proxy_timeout_circuit_breaker() -> None:
    """Test B: When Pod Gamma downstream times out (> 8.0s), the circuit breaker
    trips immediately and returns HTTP 200 with status='fallback_timeout'.
    """
    with TestClient(app) as client:
        # Mock the app.state.http_client to simulate a TimeoutException
        mock_http = AsyncMock()
        mock_http.post.side_effect = httpx.TimeoutException("Mocked downstream timeout after 8.0s")

        original_client = app.state.http_client
        app.state.http_client = mock_http

        try:
            payload = {
                "prompt": "Explain Dijkstra vs A* algorithm",
                "user_uid": "student_test_102",
                "role": "student",
                "context_flags": {},
            }
            resp = client.post("/api/v1/ai/query", json=payload)
            assert resp.status_code == 200, f"Expected HTTP 200 fallback on timeout, got {resp.status_code}"

            data = resp.json()
            assert data["status"] == "fallback_timeout", f"Unexpected status: {data['status']}"
            assert data["is_fallback"] is True
            assert data["model"] == "fallback"
            assert "processing a high volume" in data["answer"].lower()
            print("  [PASS] Test B: Timeout circuit-breaker verified (HTTP 200, status=fallback_timeout).")
        finally:
            app.state.http_client = original_client


def test_ai_proxy_downstream_error_fallback() -> None:
    """Test C: When Pod Gamma returns a 500 error, the proxy returns a graceful fallback."""
    with TestClient(app) as client:
        mock_response = httpx.Response(
            status_code=500,
            json={"error": "Internal downstream LLM crash"},
            request=httpx.Request("POST", "http://127.0.0.1:8001/rag/query"),
        )
        mock_http = AsyncMock()
        mock_http.post.return_value = mock_response

        original_client = app.state.http_client
        app.state.http_client = mock_http

        try:
            payload = {
                "prompt": "What is my attendance?",
                "user_uid": "student_test_103",
                "role": "student",
            }
            resp = client.post("/api/v1/ai/query", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "downstream_error_500"
            assert data["is_fallback"] is True
            print("  [PASS] Test C: Downstream 500 handled gracefully with is_fallback=True.")
        finally:
            app.state.http_client = original_client


if __name__ == "__main__":
    print("\n--- Running AI Proxy Resilience Tests ---")
    test_ai_proxy_service_unreachable()
    test_ai_proxy_timeout_circuit_breaker()
    test_ai_proxy_downstream_error_fallback()
    print("--- All AI Proxy Resilience Tests Passed ---\n")
