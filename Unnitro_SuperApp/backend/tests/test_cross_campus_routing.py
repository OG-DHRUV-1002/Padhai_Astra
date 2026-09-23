"""Cross-Campus Multi-Floor Navigation and Route Solver Test Suite.

Validates complex multi-floor navigation trips across the full Somaiya Vidyavihar campus:
1. Test Case 1: Indoor multi-floor descent (KJSCE F3 -> KJSCE F0 Lobby), checking
   dynamic elevator vs. stairs exclusion based on accessibility constraints.
2. Test Case 2: Cross-campus transit (Polytechnic F2 -> Outdoor Pathways -> Central Canteen),
   validating compound turn-by-turn guidance and distance metrics.
3. Test Case 3: Complete campus node discovery catalogue for Pod Alpha frontend.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_indoor_multi_floor_routing() -> None:
    """Test Case 1: KJSCE Floor 3 Classroom to KJSCE Floor 0 Lobby.
    Validates dynamic exclusion of stairs when accessible_only=True.
    """
    with TestClient(app) as client:
        # Standard route (stairs permitted)
        std_payload = {
            "origin": "kjsce_f3_classroom_301",
            "destination": "kjsce_f0_lobby",
            "accessible_only": False,
        }
        std_resp = client.post("/api/v1/navigation/route", json=std_payload)
        assert std_resp.status_code == 200, f"Standard route failed: {std_resp.text}"
        std_data = std_resp.json()

        assert std_data["accessible_route"] is False
        assert 0 < std_data["total_distance_meters"] < 300
        assert std_data["node_sequence"][0] == "kjsce_f3_classroom_301"
        assert std_data["node_sequence"][-1] == "kjsce_f0_lobby"
        # Verify stairs are used in standard path
        has_stairs = any("stairs" in n for n in std_data["node_sequence"])
        assert has_stairs, "Expected stairs in standard multi-floor descent"

        # Accessible route (stairs strictly forbidden)
        acc_payload = {
            "origin": "kjsce_f3_classroom_301",
            "destination": "kjsce_f0_lobby",
            "accessible_only": True,
        }
        acc_resp = client.post("/api/v1/navigation/route", json=acc_payload)
        assert acc_resp.status_code == 200, f"Accessible route failed: {acc_resp.text}"
        acc_data = acc_resp.json()

        assert acc_data["accessible_route"] is True
        assert 0 < acc_data["total_distance_meters"] < 300
        # Assert NO stairs in accessible sequence
        for node_id in acc_data["node_sequence"]:
            assert "stairs" not in node_id, f"Inaccessible stair node {node_id} found in accessible route"

        # Assert elevator nodes are used
        has_elevator = any("elevator" in n for n in acc_data["node_sequence"])
        assert has_elevator, "Expected elevator in accessible multi-floor route"

        instructions = [w["instruction"] for w in acc_data["waypoints"]]
        assert any("elevator" in i.lower() for i in instructions), "Missing elevator instruction"

        print("  [PASS] Test Case 1: Indoor multi-floor descent & accessibility switching verified.")


def test_cross_campus_transit_routing() -> None:
    """Test Case 2: Polytechnic Floor 2 Classroom to Central Canteen North Dining Hall.
    Validates corridor -> vertical stairs -> outdoor walkways -> building entrance transitions.
    """
    with TestClient(app) as client:
        payload = {
            "origin": "poly_f2_classroom_201",
            "destination": "canteen_f0_dining_hall_north",
            "accessible_only": False,
        }
        resp = client.post("/api/v1/navigation/route", json=payload)
        assert resp.status_code == 200, f"Cross-campus route failed: {resp.text}"
        data = resp.json()

        assert 0 < data["total_distance_meters"] < 1000, (
            f"Distance out of reasonable campus bounds: {data['total_distance_meters']} m"
        )
        assert len(data["node_sequence"]) >= 6, "Expected multi-segment journey"

        # Check start and end nodes
        assert data["node_sequence"][0] == "poly_f2_classroom_201"
        assert data["node_sequence"][-1] == "canteen_f0_dining_hall_north"

        # Verify cross-building traversal in node sequence
        node_seq = data["node_sequence"]
        assert any("poly" in n for n in node_seq), "Missing Polytechnic origin segments"
        assert any("outdoor" in n for n in node_seq), "Missing outdoor transit segments"
        assert any("canteen" in n for n in node_seq), "Missing Canteen arrival segments"

        # Check turn-by-turn guidance sequence
        instructions = [w["instruction"] for w in data["waypoints"]]
        assert ("start" in instructions[0].lower() or "polytechnic" in instructions[0].lower())
        assert ("arrive" in instructions[-1].lower() or "canteen" in instructions[-1].lower())

        print(
            f"  [PASS] Test Case 2: Cross-campus transit verified ({data['total_distance_meters']}m across {len(node_seq)} waypoints)."
        )


def test_full_campus_node_catalogue_discovery() -> None:
    """Test Case 3: Verify GET /api/v1/navigation/nodes returns the complete Somaiya catalogue."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/navigation/nodes")
        assert resp.status_code == 200
        nodes = resp.json()

        assert isinstance(nodes, list)
        assert len(nodes) >= 40, f"Expected comprehensive campus catalogue, got {len(nodes)} nodes"

        buildings_found = {n["building"] for n in nodes}
        assert "Engineering Complex (KJSCE)" in buildings_found
        assert "SSBAS (Science & Commerce)" in buildings_found
        assert "Polytechnic Building" in buildings_found
        assert "Central Library & Administration" in buildings_found
        assert "Central Canteen & Amenities" in buildings_found
        assert "Outdoor Arterial Walkways" in buildings_found

        print(f"  [PASS] Test Case 3: Complete campus node catalogue verified ({len(nodes)} nodes across {len(buildings_found)} complexes).")


if __name__ == "__main__":
    print("\n--- Running Cross-Campus Routing Tests ---")
    test_indoor_multi_floor_routing()
    test_cross_campus_transit_routing()
    test_full_campus_node_catalogue_discovery()
    print("--- All Cross-Campus Routing Tests Passed ---\n")
