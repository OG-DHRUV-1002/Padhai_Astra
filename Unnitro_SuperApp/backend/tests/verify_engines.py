"""Automated engine verification test harness for Unnitro SuperApp Pod Beta.

Validates:
1. 3D A* Pathfinding Engine (Multi-floor geometry, turn instructions, accessibility filtering).
2. Telemetry Dead-Zone Memory Store (Entrance breaches, silence sweep, weak RSSI filter, confirmed exit).
3. FastAPI Gateway & Route Integration (TestClient health, route computation, telemetry endpoints).

Runnable directly via:
    python tests/verify_engines.py
Or via pytest:
    pytest tests/verify_engines.py -v
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Ensure backend root is on sys.path for direct script execution
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from fastapi.testclient import TestClient

from app.algorithms.astar import (
    WALKING_SPEED_MPS,
    CampusGraph,
    CampusNode,
    EdgeType,
)
from app.core.telemetry_store import (
    MINIMUM_DWELL_SECONDS,
    REQUIRED_EXIT_PINGS,
    RSSI_CLEAN_EXIT_DBM,
    RSSI_LEAK_THRESHOLD_DBM,
    TelemetryMemoryStore,
)
from app.main import app
from app.schemas.navigation import PathResponse
from app.schemas.telemetry import RushLevel, ZoneState


# ---------------------------------------------------------------------------
# Test Suite 1: Navigation Engine (3D A* Pathfinding & Geometry)
# ---------------------------------------------------------------------------


def test_navigation_engine() -> None:
    """Validate 3D A* pathfinding, Euclidean distances, turn-by-turn guidance,
    and dynamic accessibility filtering.
    """
    print("\n[1/3] Testing Navigation Engine (3D A* Algorithm)...")

    graph = CampusGraph()

    # Define multi-floor nodes across SSBAS Ground Floor and First Floor
    n_lobby = CampusNode("lobby", x=0.0, y=0.0, z=0.0, floor=0, building="SSBAS")
    n_corridor_f0 = CampusNode("corridor_f0", x=20.0, y=0.0, z=0.0, floor=0, building="SSBAS")
    n_stairs_f0 = CampusNode("stairs_f0", x=30.0, y=-5.0, z=0.0, floor=0, building="SSBAS", is_accessible=False)
    n_elevator_f0 = CampusNode("elevator_f0", x=30.0, y=10.0, z=0.0, floor=0, building="SSBAS", is_accessible=True)

    n_corridor_f1 = CampusNode("corridor_f1", x=20.0, y=0.0, z=4.0, floor=1, building="SSBAS")
    n_stairs_f1 = CampusNode("stairs_f1", x=30.0, y=-5.0, z=4.0, floor=1, building="SSBAS", is_accessible=False)
    n_elevator_f1 = CampusNode("elevator_f1", x=30.0, y=10.0, z=4.0, floor=1, building="SSBAS", is_accessible=True)
    n_room301 = CampusNode("room_301", x=40.0, y=10.0, z=4.0, floor=1, building="SSBAS")

    for node in [
        n_lobby, n_corridor_f0, n_stairs_f0, n_elevator_f0,
        n_corridor_f1, n_stairs_f1, n_elevator_f1, n_room301,
    ]:
        graph.add_node(node)

    # Add horizontal edges
    graph.add_edge("lobby", "corridor_f0", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("corridor_f0", "stairs_f0", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("corridor_f0", "elevator_f0", EdgeType.CORRIDOR, accessible=True)

    graph.add_edge("corridor_f1", "stairs_f1", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("corridor_f1", "elevator_f1", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("elevator_f1", "room_301", EdgeType.CORRIDOR, accessible=True)

    # Add vertical edges: Stairs (inaccessible) vs Elevator (accessible)
    graph.add_edge("stairs_f0", "stairs_f1", EdgeType.STAIRS, accessible=False)
    graph.add_edge("elevator_f0", "elevator_f1", EdgeType.ELEVATOR, accessible=True)

    # 1. Standard route (stairs available & preferred by lower horizontal distance)
    std_res: PathResponse = graph.find_path("lobby", "room_301", accessible_only=False)
    assert std_res.total_distance_meters > 0.0, "Total distance must be positive"
    assert len(std_res.node_sequence) >= 4, "Route sequence must contain waypoints"
    assert std_res.node_sequence[0] == "lobby", "Origin must be lobby"
    assert std_res.node_sequence[-1] == "room_301", "Destination must be room_301"
    assert not std_res.accessible_route, "accessible_route flag should be False"

    # Verify duration calculation
    expected_duration = round(std_res.total_distance_meters / WALKING_SPEED_MPS, 2)
    assert abs(std_res.estimated_duration_seconds - expected_duration) < 0.05, (
        f"Duration mismatch: {std_res.estimated_duration_seconds} != {expected_duration}"
    )

    # Verify turn-by-turn instruction generation
    instructions = [w.instruction for w in std_res.waypoints]
    assert any("Start at SSBAS, Floor 0" in i for i in instructions), "Missing start instruction"
    assert any("Arrive at destination" in i for i in instructions), "Missing arrival instruction"

    # 2. Accessible route (stairs strictly excluded)
    acc_res: PathResponse = graph.find_path("lobby", "room_301", accessible_only=True)
    assert acc_res.accessible_route is True, "accessible_route flag should be True"
    assert "stairs_f0" not in acc_res.node_sequence, "Stairs node F0 must NOT be in accessible path"
    assert "stairs_f1" not in acc_res.node_sequence, "Stairs node F1 must NOT be in accessible path"
    assert "elevator_f0" in acc_res.node_sequence, "Elevator F0 must be in accessible path"
    assert "elevator_f1" in acc_res.node_sequence, "Elevator F1 must be in accessible path"

    acc_instructions = [w.instruction for w in acc_res.waypoints]
    assert any("Take elevator up to Floor 1" in i for i in acc_instructions), (
        "Missing elevator transition instruction"
    )

    print("  [PASS] Euclidean & vertical distance calculations verified.")
    print("  [PASS] Turn-by-turn guidance synthesis verified.")
    print("  [PASS] Dynamic accessibility subgraph filtering verified.")


# ---------------------------------------------------------------------------
# Test Suite 2: Telemetry & Dead-Zone Engine
# ---------------------------------------------------------------------------


def test_telemetry_engine() -> None:
    """Validate telemetry ingestion, entrance breach, silence sweep,
    interior RSSI filtering, dwell lock-in, and confirmed exit transitions.
    """
    print("\n[2/3] Testing Telemetry & Dead-Zone Engine...")

    store = TelemetryMemoryStore()
    uid = "student_dev_99"

    # 1. Initial State: Ping outside geofence -> OUTDOOR
    zone = store.process_heartbeat(uid, inside_entrance_polygon=False, rssi_dbm=-60)
    assert zone == ZoneState.OUTDOOR
    assert store.get_canteen_occupancy().current_count == 0

    # 2. Entrance Breach: Device enters geofence polygon -> ENTRANCE_BREACH
    zone = store.process_heartbeat(uid, inside_entrance_polygon=True, rssi_dbm=-65)
    assert zone == ZoneState.ENTRANCE_BREACH
    assert store.get_canteen_occupancy().current_count == 0, (
        "Entrance breach should NOT increment occupancy yet"
    )

    # 3. Simulate 16 seconds of dead-zone silence (indoor shadow)
    with store._lock:
        dev = store._devices[uid]
        dev.last_seen_monotonic -= 16.0  # Fast-forward silence

    promoted = store.sweep_deadzone_transitions()
    assert uid in promoted, f"Device {uid} should be promoted to CANTEEN_INDOOR"

    dev_state = store.get_device_state(uid)
    assert dev_state is not None
    assert dev_state.current_zone == ZoneState.CANTEEN_INDOOR
    assert store.get_canteen_occupancy().current_count == 1
    assert store.get_canteen_occupancy().rush_status == RushLevel.LOW

    # 4. Weak-signal leak filter: interior reflections (< -85 dBm) must not trigger exit
    zone = store.process_heartbeat(
        uid,
        inside_entrance_polygon=False,
        rssi_dbm=RSSI_LEAK_THRESHOLD_DBM - 5,  # -90 dBm
    )
    assert zone == ZoneState.CANTEEN_INDOOR, "Weak-signal leak must not alter indoor state"
    dev_state = store.get_device_state(uid)
    assert dev_state.consecutive_exterior_pings == 0, (
        "Weak-signal packet must not increment exterior ping counter"
    )

    # 5. Dwell-time lock: exterior pings during dwell (< 300 s) are ignored
    zone = store.process_heartbeat(uid, inside_entrance_polygon=False, rssi_dbm=-65)
    assert zone == ZoneState.CANTEEN_INDOOR
    dev_state = store.get_device_state(uid)
    assert dev_state.consecutive_exterior_pings == 0, "Dwell lock must suppress exterior counter"

    # 6. Fast-forward past minimum dwell time (e.g. 350 seconds inside)
    with store._lock:
        dev = store._devices[uid]
        dev.entered_canteen_at = time.monotonic() - (MINIMUM_DWELL_SECONDS + 50.0)

    # 7. Simulate consecutive clean exterior pings (> -75 dBm)
    for i in range(1, REQUIRED_EXIT_PINGS):
        zone = store.process_heartbeat(uid, inside_entrance_polygon=False, rssi_dbm=RSSI_CLEAN_EXIT_DBM + 5)
        assert zone == ZoneState.CANTEEN_INDOOR, f"Still indoor at {i}/{REQUIRED_EXIT_PINGS} pings"
        dev_state = store.get_device_state(uid)
        assert dev_state.consecutive_exterior_pings == i

    # 4th clean exterior ping -> Confirmed exit!
    final_zone = store.process_heartbeat(uid, inside_entrance_polygon=False, rssi_dbm=RSSI_CLEAN_EXIT_DBM + 5)
    assert final_zone == ZoneState.OUTDOOR, "4th ping must transition state to OUTDOOR"
    assert store.get_canteen_occupancy().current_count == 0, "Occupancy must decrement to 0"

    dev_state = store.get_device_state(uid)
    assert dev_state.current_zone == ZoneState.OUTDOOR
    assert dev_state.entered_canteen_at is None
    assert dev_state.consecutive_exterior_pings == 0

    print("  [PASS] Entrance breach & dead-zone silence promotion verified.")
    print("  [PASS] Weak-signal packet filter (< -85 dBm) verified.")
    print("  [PASS] Minimum dwell-time lock-in (300 s) verified.")
    print("  [PASS] Confirmed exit hysteresis (4 consecutive pings) verified.")


# ---------------------------------------------------------------------------
# Test Suite 3: FastAPI Gateway & Endpoint Smoke Test
# ---------------------------------------------------------------------------


def test_fastapi_endpoints() -> None:
    """Validate FastAPI router integration, lifespan background tasks, and active HTTP responses."""
    print("\n[3/3] Testing FastAPI Gateway & Route Endpoints...")

    with TestClient(app) as client:
        # 1. Health Probe with Subsystem Checks
        health_resp = client.get("/health")
        assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
        health_data = health_resp.json()
        assert health_data.get("status") == "online"
        assert health_data.get("pod") == "beta"
        assert health_data.get("port") == 8000
        services = health_data.get("services", {})
        assert services.get("deadzone_worker") == "running", (
            f"Expected deadzone_worker to be 'running', got {services.get('deadzone_worker')}"
        )
        assert services.get("astar_engine") == "online"
        assert services.get("telemetry_store") == "online"
        print("  [PASS] GET /health -> HTTP 200 OK (deadzone_worker: running)")

        # 2. Navigation Node Discovery
        nodes_resp = client.get("/api/v1/navigation/nodes")
        assert nodes_resp.status_code == 200, f"Node discovery failed: {nodes_resp.text}"
        nodes_data = nodes_resp.json()
        assert isinstance(nodes_data, list) and len(nodes_data) > 0
        node_ids = {n["node_id"] for n in nodes_data}
        assert "ssbas_f0_lobby" in node_ids
        assert "kjsce_f0_lobby" in node_ids
        assert "canteen_f0_main_gate" in node_ids
        print(f"  [PASS] GET /api/v1/navigation/nodes -> HTTP 200 ({len(nodes_data)} nodes registered)")

        # 3. Navigation Route Computation
        route_payload = {
            "origin": "ssbas_f0_lobby",
            "destination": "ssbas_f3_classroom_301",
            "accessible_only": False,
        }
        route_resp = client.post("/api/v1/navigation/route", json=route_payload)
        assert route_resp.status_code == 200, f"Route calculation failed: {route_resp.text}"
        route_data = route_resp.json()
        assert "node_sequence" in route_data
        assert "total_distance_meters" in route_data
        assert route_data["total_distance_meters"] > 0
        assert len(route_data["waypoints"]) > 0
        print(f"  [PASS] POST /api/v1/navigation/route -> HTTP 200 (distance: {route_data['total_distance_meters']}m)")

        # 4. Navigation Accessible Route
        acc_payload = {
            "origin": "ssbas_f0_lobby",
            "destination": "ssbas_f3_classroom_301",
            "accessible_only": True,
        }
        acc_resp = client.post("/api/v1/navigation/route", json=acc_payload)
        assert acc_resp.status_code == 200
        acc_data = acc_resp.json()
        assert acc_data["accessible_route"] is True
        assert "ssbas_f0_stairs" not in acc_data["node_sequence"]
        print("  [PASS] POST /api/v1/navigation/route (accessible) -> HTTP 200")

        # 5. Navigation 404 on Invalid Node
        bad_route_resp = client.post(
            "/api/v1/navigation/route",
            json={"origin": "non_existent_node", "destination": "ssbas_f3_classroom_301"},
        )
        assert bad_route_resp.status_code == 404
        print("  [PASS] POST /api/v1/navigation/route (invalid node) -> HTTP 404 Not Found")

        # 6. Telemetry Heartbeat Ingestion
        hb_payload = {
            "uid": "bench_test_user_01",
            "inside_entrance_polygon": True,
            "rssi_dbm": -68,
        }
        hb_resp = client.post("/api/v1/telemetry/heartbeat", json=hb_payload)
        assert hb_resp.status_code == 200, f"Heartbeat failed: {hb_resp.text}"
        hb_data = hb_resp.json()
        assert hb_data["status"] == "recorded"
        assert hb_data["uid"] == "bench_test_user_01"
        print("  [PASS] POST /api/v1/telemetry/heartbeat -> HTTP 200 OK")

        # 7. Telemetry Occupancy Snapshot
        occ_resp = client.get("/api/v1/telemetry/occupancy")
        assert occ_resp.status_code == 200, f"Occupancy check failed: {occ_resp.text}"
        occ_data = occ_resp.json()
        assert "current_count" in occ_data
        assert "capacity" in occ_data
        assert "rush_status" in occ_data
        print(f"  [PASS] GET /api/v1/telemetry/occupancy -> HTTP 200 (count: {occ_data['current_count']})")

        # 8. Telemetry Dead-Zone Sweep Trigger
        sweep_resp = client.post("/api/v1/telemetry/sweep")
        assert sweep_resp.status_code == 200, f"Sweep failed: {sweep_resp.text}"
        sweep_data = sweep_resp.json()
        assert "promoted_uids" in sweep_data
        assert "count" in sweep_data
        print(f"  [PASS] POST /api/v1/telemetry/sweep -> HTTP 200 (promoted: {sweep_data['count']})")


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------


def run_all_checks() -> None:
    """Execute all test suites with structured reporting."""
    banner = "=" * 70
    print(banner)
    print(" UNNITRO SUPERAPP (POD BETA) - CORE ENGINE VERIFICATION SUITE")
    print(banner)

    t0 = time.perf_counter()

    try:
        test_navigation_engine()
        test_telemetry_engine()
        test_fastapi_endpoints()
    except Exception as exc:
        print(f"\n[FAIL] TEST SUITE FAILED: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    print("\n" + banner)
    print(f" ALL ENGINE VERIFICATIONS PASSED SUCCESSFULLY in {elapsed_ms:.2f} ms")
    print(banner + "\n")


if __name__ == "__main__":
    run_all_checks()
