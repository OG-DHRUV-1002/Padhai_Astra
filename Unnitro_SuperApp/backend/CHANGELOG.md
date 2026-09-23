# Release Changelog - Pod Beta Backend Gateway

## [v0.2.0-pod-beta] - 2026-09-15

### Core Architecture & API Gateway
- **FastAPI Gateway Setup**: Mounted high-performance FastAPI server on Port 8000 with custom middleware, CORS policies, and connection pooling.
- **OpenAPI 3.1.0 Specification**: Exported and validated full API schema contract to `docs/openapi_v1.json`.

### 3D Navigation & Campus Mapping Engine
- **Graph Topology Ingestion**: Loaded 101 Somaiya campus topology nodes across KJSCE, SSBAS, Poly, Library, and Canteen buildings.
- **3D A* Pathfinding**: Implemented 3D A* graph navigation engine supporting dynamic height/floor calculation, distance weighting, and wheelchair accessibility filtering.

### Real-Time Telemetry & Dead-Zone Sweeper
- **Thread-Safe Telemetry Cache**: Engineered in-memory telemetry store with thread safety, dead-zone hysteresis, and stale signal purging.
- **Background Sweeper Service**: Configured an automated 5-second interval background dead-zone sweeper integrated into the FastAPI lifespan context.

### Resilient AI Proxy
- **Pod Gamma Proxy Integration**: Built resilient AI proxy endpoint with an 8.0s circuit breaker threshold and fallback handling.

### Verification & Quality Assurance
- **Automated Test Suite**: Created and passed 10/10 unit, integration, and stress tests covering cross-campus routing, AI proxy resilience, and concurrent rush simulations.
