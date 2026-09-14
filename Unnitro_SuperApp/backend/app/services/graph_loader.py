"""Somaiya Vidyavihar campus graph topology ingestion engine.

Constructs the complete 3D pedestrian navigation network across all major
campus anchors (Engineering Complex, SSBAS, Polytechnic, Central Library,
Central Canteen, and Arterial Outdoor Walkways).
"""

from __future__ import annotations

import logging
from typing import Any

from app.algorithms.astar import CampusGraph, CampusNode, EdgeType

logger = logging.getLogger("unnitro.backend.topology")

FLOOR_ELEVATION_METERS: float = 3.5  # Standard vertical floor clearance


def load_somaiya_topology(graph: CampusGraph) -> dict[str, Any]:
    """Populate the provided CampusGraph instance with the full Somaiya
    campus topology dataset.

    Clears any prior nodes/edges and instantiates nodes across 5 primary
    building complexes with multi-floor stair/elevator vertical cores and
    bidirectional ground-level walkways.

    Returns
    -------
    dict[str, Any]
        Summary metadata containing node count, edge count, and registered buildings.
    """
    graph.clear()

    buildings: list[str] = [
        "Engineering Complex (KJSCE)",
        "SSBAS (Science & Commerce)",
        "Polytechnic Building",
        "Central Library & Administration",
        "Central Canteen & Amenities",
        "Outdoor Arterial Walkways",
    ]

    # =========================================================================
    # 1. Engineering Complex (KJSCE / Aryabhata / Bhaskaracharya) - Floors 0..4
    # =========================================================================
    kjsce_base_x, kjsce_base_y = 80.0, 0.0
    stair_x, stair_y = kjsce_base_x - 5.0, kjsce_base_y - 10.0
    elev_x, elev_y = kjsce_base_x - 5.0, kjsce_base_y + 10.0

    for f in range(5):
        z = f * FLOOR_ELEVATION_METERS
        # Central floor corridor junction
        graph.add_node(
            CampusNode(
                node_id=f"kjsce_f{f}_corridor",
                x=kjsce_base_x,
                y=kjsce_base_y,
                z=z,
                floor=f,
                building="Engineering Complex (KJSCE)",
                is_accessible=True,
            )
        )
        # Vertical shafts
        graph.add_node(
            CampusNode(
                node_id=f"kjsce_f{f}_stairs",
                x=stair_x,
                y=stair_y,
                z=z,
                floor=f,
                building="Engineering Complex (KJSCE)",
                is_accessible=False,
            )
        )
        graph.add_node(
            CampusNode(
                node_id=f"kjsce_f{f}_elevator",
                x=elev_x,
                y=elev_y,
                z=z,
                floor=f,
                building="Engineering Complex (KJSCE)",
                is_accessible=True,
            )
        )
        # Connect corridor to vertical cores
        graph.add_edge(f"kjsce_f{f}_corridor", f"kjsce_f{f}_stairs", EdgeType.CORRIDOR, accessible=True)
        graph.add_edge(f"kjsce_f{f}_corridor", f"kjsce_f{f}_elevator", EdgeType.CORRIDOR, accessible=True)

        # Connect inter-floor vertical transitions
        if f > 0:
            prev_f = f - 1
            graph.add_edge(f"kjsce_f{prev_f}_stairs", f"kjsce_f{f}_stairs", EdgeType.STAIRS, accessible=False)
            graph.add_edge(f"kjsce_f{prev_f}_elevator", f"kjsce_f{f}_elevator", EdgeType.ELEVATOR, accessible=True)

    # Floor-specific rooms for KJSCE
    # Floor 0:
    graph.add_node(CampusNode("kjsce_f0_lobby", 65.0, 0.0, 0.0, 0, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f0_auditorium", 95.0, -10.0, 0.0, 0, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f0_workshop_bay", 95.0, 10.0, 0.0, 0, "Engineering Complex (KJSCE)", True))
    graph.add_edge("kjsce_f0_lobby", "kjsce_f0_corridor", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f0_corridor", "kjsce_f0_auditorium", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f0_corridor", "kjsce_f0_workshop_bay", EdgeType.CORRIDOR, accessible=True)

    # Floor 1:
    graph.add_node(CampusNode("kjsce_f1_lecture_hall_101", 95.0, -10.0, 3.5, 1, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f1_comp_lab_104", 95.0, 10.0, 3.5, 1, "Engineering Complex (KJSCE)", True))
    graph.add_edge("kjsce_f1_corridor", "kjsce_f1_lecture_hall_101", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f1_corridor", "kjsce_f1_comp_lab_104", EdgeType.CORRIDOR, accessible=True)

    # Floor 2:
    graph.add_node(CampusNode("kjsce_f2_vlsi_lab_201", 95.0, -10.0, 7.0, 2, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f2_seminar_204", 95.0, 10.0, 7.0, 2, "Engineering Complex (KJSCE)", True))
    graph.add_edge("kjsce_f2_corridor", "kjsce_f2_vlsi_lab_201", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f2_corridor", "kjsce_f2_seminar_204", EdgeType.CORRIDOR, accessible=True)

    # Floor 3:
    graph.add_node(CampusNode("kjsce_f3_classroom_301", 95.0, -10.0, 10.5, 3, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f3_ai_lab_305", 95.0, 10.0, 10.5, 3, "Engineering Complex (KJSCE)", True))
    graph.add_edge("kjsce_f3_corridor", "kjsce_f3_classroom_301", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f3_corridor", "kjsce_f3_ai_lab_305", EdgeType.CORRIDOR, accessible=True)

    # Floor 4:
    graph.add_node(CampusNode("kjsce_f4_robotics_lab_401", 95.0, -10.0, 14.0, 4, "Engineering Complex (KJSCE)", True))
    graph.add_node(CampusNode("kjsce_f4_research_centre_405", 95.0, 10.0, 14.0, 4, "Engineering Complex (KJSCE)", True))
    graph.add_edge("kjsce_f4_corridor", "kjsce_f4_robotics_lab_401", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("kjsce_f4_corridor", "kjsce_f4_research_centre_405", EdgeType.CORRIDOR, accessible=True)

    # =========================================================================
    # 2. SSBAS (Science & Commerce) - Floors 0..3
    # =========================================================================
    ssbas_base_x, ssbas_base_y = 0.0, 0.0
    ssbas_stair_x, ssbas_stair_y = 5.0, -12.0
    ssbas_elev_x, ssbas_elev_y = 5.0, 12.0

    for f in range(4):
        z = f * FLOOR_ELEVATION_METERS
        graph.add_node(CampusNode(f"ssbas_f{f}_corridor", ssbas_base_x, ssbas_base_y, z, f, "SSBAS (Science & Commerce)", True))
        graph.add_node(CampusNode(f"ssbas_f{f}_stairs", ssbas_stair_x, ssbas_stair_y, z, f, "SSBAS (Science & Commerce)", False))
        graph.add_node(CampusNode(f"ssbas_f{f}_elevator", ssbas_elev_x, ssbas_elev_y, z, f, "SSBAS (Science & Commerce)", True))

        graph.add_edge(f"ssbas_f{f}_corridor", f"ssbas_f{f}_stairs", EdgeType.CORRIDOR, accessible=True)
        graph.add_edge(f"ssbas_f{f}_corridor", f"ssbas_f{f}_elevator", EdgeType.CORRIDOR, accessible=True)

        if f > 0:
            prev_f = f - 1
            graph.add_edge(f"ssbas_f{prev_f}_stairs", f"ssbas_f{f}_stairs", EdgeType.STAIRS, accessible=False)
            graph.add_edge(f"ssbas_f{prev_f}_elevator", f"ssbas_f{f}_elevator", EdgeType.ELEVATOR, accessible=True)

    # SSBAS Rooms
    graph.add_node(CampusNode("ssbas_f0_lobby", 0.0, 15.0, 0.0, 0, "SSBAS (Science & Commerce)", True))
    graph.add_node(CampusNode("ssbas_f0_chem_lab", -15.0, -10.0, 0.0, 0, "SSBAS (Science & Commerce)", True))
    graph.add_node(CampusNode("ssbas_f0_dean_office", -15.0, 10.0, 0.0, 0, "SSBAS (Science & Commerce)", True))
    graph.add_edge("ssbas_f0_lobby", "ssbas_f0_corridor", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("ssbas_f0_corridor", "ssbas_f0_chem_lab", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("ssbas_f0_corridor", "ssbas_f0_dean_office", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("ssbas_f1_physics_lab_102", -15.0, -10.0, 3.5, 1, "SSBAS (Science & Commerce)", True))
    graph.add_node(CampusNode("ssbas_f1_lecture_hall_105", -15.0, 10.0, 3.5, 1, "SSBAS (Science & Commerce)", True))
    graph.add_edge("ssbas_f1_corridor", "ssbas_f1_physics_lab_102", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("ssbas_f1_corridor", "ssbas_f1_lecture_hall_105", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("ssbas_f2_math_dept_201", -15.0, -10.0, 7.0, 2, "SSBAS (Science & Commerce)", True))
    graph.add_node(CampusNode("ssbas_f2_stats_lab_204", -15.0, 10.0, 7.0, 2, "SSBAS (Science & Commerce)", True))
    graph.add_edge("ssbas_f2_corridor", "ssbas_f2_math_dept_201", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("ssbas_f2_corridor", "ssbas_f2_stats_lab_204", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("ssbas_f3_classroom_301", -15.0, -10.0, 10.5, 3, "SSBAS (Science & Commerce)", True))
    graph.add_node(CampusNode("ssbas_f3_seminar_304", -15.0, 10.0, 10.5, 3, "SSBAS (Science & Commerce)", True))
    graph.add_edge("ssbas_f3_corridor", "ssbas_f3_classroom_301", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("ssbas_f3_corridor", "ssbas_f3_seminar_304", EdgeType.CORRIDOR, accessible=True)

    # =========================================================================
    # 3. Polytechnic Building - Floors 0..2
    # =========================================================================
    poly_base_x, poly_base_y = -70.0, 30.0
    poly_stair_x, poly_stair_y = poly_base_x + 5.0, poly_base_y - 10.0
    poly_elev_x, poly_elev_y = poly_base_x + 5.0, poly_base_y + 10.0

    for f in range(3):
        z = f * FLOOR_ELEVATION_METERS
        graph.add_node(CampusNode(f"poly_f{f}_corridor", poly_base_x, poly_base_y, z, f, "Polytechnic Building", True))
        graph.add_node(CampusNode(f"poly_f{f}_stairs", poly_stair_x, poly_stair_y, z, f, "Polytechnic Building", False))
        graph.add_node(CampusNode(f"poly_f{f}_elevator", poly_elev_x, poly_elev_y, z, f, "Polytechnic Building", True))

        graph.add_edge(f"poly_f{f}_corridor", f"poly_f{f}_stairs", EdgeType.CORRIDOR, accessible=True)
        graph.add_edge(f"poly_f{f}_corridor", f"poly_f{f}_elevator", EdgeType.CORRIDOR, accessible=True)

        if f > 0:
            prev_f = f - 1
            graph.add_edge(f"poly_f{prev_f}_stairs", f"poly_f{f}_stairs", EdgeType.STAIRS, accessible=False)
            graph.add_edge(f"poly_f{prev_f}_elevator", f"poly_f{f}_elevator", EdgeType.ELEVATOR, accessible=True)

    # Poly Rooms
    graph.add_node(CampusNode("poly_f0_lobby", -55.0, 30.0, 0.0, 0, "Polytechnic Building", True))
    graph.add_node(CampusNode("poly_f0_mech_workshop", -85.0, 20.0, 0.0, 0, "Polytechnic Building", True))
    graph.add_node(CampusNode("poly_f0_civil_bay", -85.0, 40.0, 0.0, 0, "Polytechnic Building", True))
    graph.add_edge("poly_f0_lobby", "poly_f0_corridor", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("poly_f0_corridor", "poly_f0_mech_workshop", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("poly_f0_corridor", "poly_f0_civil_bay", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("poly_f1_drafting_hall_101", -85.0, 20.0, 3.5, 1, "Polytechnic Building", True))
    graph.add_node(CampusNode("poly_f1_elec_lab_104", -85.0, 40.0, 3.5, 1, "Polytechnic Building", True))
    graph.add_edge("poly_f1_corridor", "poly_f1_drafting_hall_101", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("poly_f1_corridor", "poly_f1_elec_lab_104", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("poly_f2_classroom_201", -85.0, 20.0, 7.0, 2, "Polytechnic Building", True))
    graph.add_node(CampusNode("poly_f2_cad_cam_lab_204", -85.0, 40.0, 7.0, 2, "Polytechnic Building", True))
    graph.add_edge("poly_f2_corridor", "poly_f2_classroom_201", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("poly_f2_corridor", "poly_f2_cad_cam_lab_204", EdgeType.CORRIDOR, accessible=True)

    # =========================================================================
    # 4. Central Library & Admin Block - Floors 0..3
    # =========================================================================
    lib_base_x, lib_base_y = -40.0, -50.0
    lib_stair_x, lib_stair_y = lib_base_x + 5.0, lib_base_y - 10.0
    lib_elev_x, lib_elev_y = lib_base_x + 5.0, lib_base_y + 10.0

    for f in range(4):
        z = f * FLOOR_ELEVATION_METERS
        graph.add_node(CampusNode(f"library_f{f}_corridor", lib_base_x, lib_base_y, z, f, "Central Library & Administration", True))
        graph.add_node(CampusNode(f"library_f{f}_stairs", lib_stair_x, lib_stair_y, z, f, "Central Library & Administration", False))
        graph.add_node(CampusNode(f"library_f{f}_elevator", lib_elev_x, lib_elev_y, z, f, "Central Library & Administration", True))

        graph.add_edge(f"library_f{f}_corridor", f"library_f{f}_stairs", EdgeType.CORRIDOR, accessible=True)
        graph.add_edge(f"library_f{f}_corridor", f"library_f{f}_elevator", EdgeType.CORRIDOR, accessible=True)

        if f > 0:
            prev_f = f - 1
            graph.add_edge(f"library_f{prev_f}_stairs", f"library_f{f}_stairs", EdgeType.STAIRS, accessible=False)
            graph.add_edge(f"library_f{prev_f}_elevator", f"library_f{f}_elevator", EdgeType.ELEVATOR, accessible=True)

    # Library Rooms
    graph.add_node(CampusNode("library_f0_lobby", -25.0, -50.0, 0.0, 0, "Central Library & Administration", True))
    graph.add_node(CampusNode("library_f0_circulation_desk", -55.0, -60.0, 0.0, 0, "Central Library & Administration", True))
    graph.add_node(CampusNode("library_f0_admin_admissions", -55.0, -40.0, 0.0, 0, "Central Library & Administration", True))
    graph.add_edge("library_f0_lobby", "library_f0_corridor", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("library_f0_corridor", "library_f0_circulation_desk", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("library_f0_corridor", "library_f0_admin_admissions", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("library_f1_reading_hall_101", -55.0, -60.0, 3.5, 1, "Central Library & Administration", True))
    graph.add_node(CampusNode("library_f1_periodicals", -55.0, -40.0, 3.5, 1, "Central Library & Administration", True))
    graph.add_edge("library_f1_corridor", "library_f1_reading_hall_101", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("library_f1_corridor", "library_f1_periodicals", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("library_f2_digital_archive_201", -55.0, -60.0, 7.0, 2, "Central Library & Administration", True))
    graph.add_node(CampusNode("library_f2_research_stack", -55.0, -40.0, 7.0, 2, "Central Library & Administration", True))
    graph.add_edge("library_f2_corridor", "library_f2_digital_archive_201", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("library_f2_corridor", "library_f2_research_stack", EdgeType.CORRIDOR, accessible=True)

    graph.add_node(CampusNode("library_f3_study_pods_301", -55.0, -60.0, 10.5, 3, "Central Library & Administration", True))
    graph.add_node(CampusNode("library_f3_provost_boardroom", -55.0, -40.0, 10.5, 3, "Central Library & Administration", True))
    graph.add_edge("library_f3_corridor", "library_f3_study_pods_301", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("library_f3_corridor", "library_f3_provost_boardroom", EdgeType.CORRIDOR, accessible=True)

    # =========================================================================
    # 5. Central Canteen & Amenities - Floors 0..1
    # =========================================================================
    canteen_base_x, canteen_base_y = 30.0, 70.0
    canteen_stair_x, canteen_stair_y = 35.0, 60.0
    canteen_elev_x, canteen_elev_y = 35.0, 80.0

    for f in range(2):
        z = f * FLOOR_ELEVATION_METERS
        graph.add_node(CampusNode(f"canteen_f{f}_stairs", canteen_stair_x, canteen_stair_y, z, f, "Central Canteen & Amenities", False))
        graph.add_node(CampusNode(f"canteen_f{f}_elevator", canteen_elev_x, canteen_elev_y, z, f, "Central Canteen & Amenities", True))

        if f > 0:
            graph.add_edge(f"canteen_f{f-1}_stairs", f"canteen_f{f}_stairs", EdgeType.STAIRS, accessible=False)
            graph.add_edge(f"canteen_f{f-1}_elevator", f"canteen_f{f}_elevator", EdgeType.ELEVATOR, accessible=True)

    # Canteen Floor 0 Nodes
    graph.add_node(CampusNode("canteen_f0_main_gate", 15.0, 60.0, 0.0, 0, "Central Canteen & Amenities", True))
    graph.add_node(CampusNode("canteen_f0_entrance_vestibule", 25.0, 70.0, 0.0, 0, "Central Canteen & Amenities", True))
    graph.add_node(CampusNode("canteen_f0_food_court", 40.0, 70.0, 0.0, 0, "Central Canteen & Amenities", True))
    graph.add_node(CampusNode("canteen_f0_dining_hall_north", 45.0, 80.0, 0.0, 0, "Central Canteen & Amenities", True))
    graph.add_node(CampusNode("canteen_f0_dining_hall_south", 45.0, 60.0, 0.0, 0, "Central Canteen & Amenities", True))

    graph.add_edge("canteen_f0_main_gate", "canteen_f0_entrance_vestibule", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("canteen_f0_entrance_vestibule", "canteen_f0_food_court", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f0_food_court", "canteen_f0_dining_hall_north", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f0_food_court", "canteen_f0_dining_hall_south", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f0_food_court", "canteen_f0_stairs", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f0_food_court", "canteen_f0_elevator", EdgeType.CORRIDOR, accessible=True)

    # Canteen Floor 1 Nodes (Mezzanine)
    graph.add_node(CampusNode("canteen_f1_mezzanine_dining", 45.0, 80.0, 3.5, 1, "Central Canteen & Amenities", True))
    graph.add_node(CampusNode("canteen_f1_faculty_lounge", 45.0, 60.0, 3.5, 1, "Central Canteen & Amenities", True))
    graph.add_edge("canteen_f1_stairs", "canteen_f1_mezzanine_dining", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f1_elevator", "canteen_f1_mezzanine_dining", EdgeType.CORRIDOR, accessible=True)
    graph.add_edge("canteen_f1_mezzanine_dining", "canteen_f1_faculty_lounge", EdgeType.CORRIDOR, accessible=True)

    # =========================================================================
    # 6. Outdoor Arterial Paths & Ground Walkway Connections
    # =========================================================================
    outdoor_nodes = [
        CampusNode("outdoor_quad_central", 0.0, 25.0, 0.0, 0, "Outdoor Arterial Walkways", True),
        CampusNode("outdoor_gargi_plaza", 20.0, 45.0, 0.0, 0, "Outdoor Arterial Walkways", True),
        CampusNode("outdoor_path_kjsce", 45.0, 10.0, 0.0, 0, "Outdoor Arterial Walkways", True),
        CampusNode("outdoor_path_poly", -35.0, 25.0, 0.0, 0, "Outdoor Arterial Walkways", True),
        CampusNode("outdoor_path_library", -20.0, -30.0, 0.0, 0, "Outdoor Arterial Walkways", True),
        CampusNode("outdoor_main_gate", 0.0, 110.0, 0.0, 0, "Outdoor Arterial Walkways", True),
    ]
    for onode in outdoor_nodes:
        graph.add_node(onode)

    # Arterial walkways between outdoor junctions
    graph.add_edge("outdoor_quad_central", "outdoor_gargi_plaza", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("outdoor_quad_central", "outdoor_path_kjsce", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("outdoor_quad_central", "outdoor_path_poly", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("outdoor_quad_central", "outdoor_path_library", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("outdoor_gargi_plaza", "outdoor_main_gate", EdgeType.WALKWAY, accessible=True)

    # Connect ground floor building entrances to arterial pathways
    graph.add_edge("ssbas_f0_lobby", "outdoor_quad_central", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("kjsce_f0_lobby", "outdoor_path_kjsce", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("poly_f0_lobby", "outdoor_path_poly", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("library_f0_lobby", "outdoor_path_library", EdgeType.WALKWAY, accessible=True)
    graph.add_edge("canteen_f0_main_gate", "outdoor_gargi_plaza", EdgeType.WALKWAY, accessible=True)

    summary = {
        "nodes_count": graph.node_count,
        "edges_count": graph.edge_count,
        "buildings": buildings,
    }

    logger.info(
        "Somaiya campus topology loaded: %d nodes, %d edges across %d complexes",
        summary["nodes_count"],
        summary["edges_count"],
        len(buildings),
    )

    return summary
