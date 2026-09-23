"""Active navigation endpoint for Somaiya campus 3D A* route computation.

Provides real-time multi-floor pathfinding, accessibility routing, and
node discovery endpoints for Pod Alpha frontend integration.
"""

from __future__ import annotations

import networkx as nx
from fastapi import APIRouter, HTTPException, status

from app.algorithms.astar import CampusGraph
from app.schemas.navigation import NodeMetadata, PathRequest, PathResponse
from app.services.graph_loader import load_somaiya_topology

router = APIRouter()

# ---------------------------------------------------------------------------
# Module-level Campus Graph Instance
# ---------------------------------------------------------------------------

campus_graph: CampusGraph = CampusGraph()
load_somaiya_topology(campus_graph)


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/route",
    response_model=PathResponse,
    summary="Compute optimal 3D A* route across campus",
    response_description="Optimized waypoint sequence with turn-by-turn guidance",
)
async def compute_route(request: PathRequest) -> PathResponse:
    """Calculate the shortest multi-floor path between origin and destination.

    Supports dynamic wheelchair accessibility constraints, Euclidean 3D
    distance evaluation, vertical penalty weighing, and turn-by-turn instruction
    synthesis.
    """
    origin = request.origin_node.strip()
    destination = request.destination_node.strip()

    if not origin or not destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin and destination node identifiers must not be empty.",
        )

    if not campus_graph.has_node(origin):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Origin node '{origin}' not found in campus topology.",
        )

    if not campus_graph.has_node(destination):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination node '{destination}' not found in campus topology.",
        )

    try:
        path_res = campus_graph.find_path(
            origin=origin,
            destination=destination,
            accessible_only=request.accessible_only,
        )
        return path_res
    except nx.NetworkXNoPath:
        accessibility_note = " accessible" if request.accessible_only else ""
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No navigable{accessibility_note} path exists connecting "
                f"'{origin}' to '{destination}'."
            ),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.get(
    "/nodes",
    response_model=list[NodeMetadata],
    summary="List all registered navigable campus nodes",
    response_description="List of node descriptors with building and floor metadata",
)
async def list_nodes() -> list[NodeMetadata]:
    """Return metadata for all navigable points registered in the active
    campus graph topology for frontend discovery and visual rendering.
    """
    results: list[NodeMetadata] = []
    for node_id in sorted(campus_graph.list_nodes()):
        node = campus_graph.get_node(node_id)
        if node is not None:
            results.append(
                NodeMetadata(
                    node_id=node.node_id,
                    building=node.building,
                    floor=node.floor,
                    x=node.x,
                    y=node.y,
                    z=node.z,
                    is_accessible=node.is_accessible,
                )
            )
    return results
