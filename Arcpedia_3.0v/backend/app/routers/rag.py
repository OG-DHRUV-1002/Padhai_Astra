"""
RAG router — retrieval-augmented generation query endpoints.

Provides:
  - POST /api/rag/query    — RAG query (streaming or blocking)
  - GET  /api/rag/documents — list ingested documents for a tenant
  - DELETE /api/rag/documents/{document_id} — remove a document

All endpoints enforce tenant isolation via the tenant_id parameter.
"""

import json
import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGChunk,
    StreamChunk,
    DocumentInfo,
    DeleteResponse,
)
from app.services.rag_pipeline import rag_pipeline
from app.services.ollama_client import (
    OllamaConnectionError,
    OllamaModelNotFoundError,
)
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/rag/query — RAG-augmented query
# ---------------------------------------------------------------------------

@router.post(
    "/query",
    summary="RAG-augmented query",
    description=(
        "Retrieves relevant document chunks from the tenant's vector store, "
        "augments the prompt with context, and generates a response via Gemma 2. "
        "Supports streaming (SSE) and non-streaming modes."
    ),
)
async def rag_query(request: RAGQueryRequest):
    """Route to streaming or blocking based on the request's stream flag."""
    if request.stream:
        return await _rag_query_streaming(request)
    else:
        return await _rag_query_blocking(request)


async def _rag_query_streaming(request: RAGQueryRequest) -> StreamingResponse:
    """
    Stream a RAG query response as Server-Sent Events.

    First emits the retrieved source chunks, then streams generated tokens.
    """

    async def event_generator():
        try:
            chunks, token_stream = await rag_pipeline.query_stream(
                tenant_id=request.tenant_id,
                query=request.query,
                collection=request.collection,
                top_k=request.top_k,
                temperature=request.temperature,
            )

            # Stream tokens
            async for token in token_stream:
                event = StreamChunk(content=token, done=False)
                yield f"data: {event.model_dump_json()}\n\n"

            # Final event with source chunks
            sources = [
                {
                    "document_id": c.get("document_id", ""),
                    "filename": c.get("filename", ""),
                    "score": c.get("score", 0.0),
                    "content_preview": c.get("content", "")[:200],
                }
                for c in chunks
            ]
            final = StreamChunk(content="", done=True, sources=sources)
            yield f"data: {final.model_dump_json()}\n\n"

        except OllamaConnectionError as err:
            logger.error("Ollama not reachable: %s", err)
            error_event = StreamChunk(
                content="", done=True,
                error="Cannot reach Ollama. Is it running? `ollama serve`",
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

        except OllamaModelNotFoundError as err:
            logger.error("Model not found: %s", err)
            error_event = StreamChunk(content="", done=True, error=str(err))
            yield f"data: {error_event.model_dump_json()}\n\n"

        except Exception as err:
            logger.exception("Unexpected error during RAG query streaming")
            error_event = StreamChunk(
                content="", done=True,
                error=f"Internal error: {type(err).__name__}: {err}",
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _rag_query_blocking(request: RAGQueryRequest) -> RAGQueryResponse:
    """Execute a blocking RAG query and return the full response."""
    try:
        result = await rag_pipeline.query(
            tenant_id=request.tenant_id,
            query=request.query,
            collection=request.collection,
            top_k=request.top_k,
            temperature=request.temperature,
        )

        rag_chunks = [
            RAGChunk(
                content=c.get("content", ""),
                document_id=c.get("document_id", ""),
                filename=c.get("filename", ""),
                score=c.get("score", 0.0),
                metadata=c.get("metadata", {}),
            )
            for c in result["chunks"]
        ]

        return RAGQueryResponse(
            answer=result["answer"],
            chunks=rag_chunks,
            tenant_id=request.tenant_id,
        )

    except OllamaConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach Ollama. Please ensure it's running.",
        )
    except OllamaModelNotFoundError as err:
        raise HTTPException(status_code=404, detail=str(err))


# ---------------------------------------------------------------------------
# GET /api/rag/documents — List ingested documents
# ---------------------------------------------------------------------------

@router.get(
    "/documents",
    response_model=list[DocumentInfo],
    summary="List ingested documents",
    description="Returns all documents in a tenant's collection with chunk counts.",
)
async def list_documents(
    tenant_id: str = Query(..., description="Tenant/student ID"),
    collection: str = Query("default", description="Collection name"),
) -> list[DocumentInfo]:
    """List all documents ingested for a specific tenant."""
    docs = await rag_pipeline.list_documents(
        tenant_id=tenant_id,
        collection=collection,
    )
    return [
        DocumentInfo(
            document_id=d["document_id"],
            filename=d.get("filename", ""),
            chunk_count=d.get("chunk_count", 0),
            tenant_id=tenant_id,
        )
        for d in docs
    ]


# ---------------------------------------------------------------------------
# DELETE /api/rag/documents/{document_id} — Delete a document
# ---------------------------------------------------------------------------

@router.delete(
    "/documents/{document_id}",
    response_model=DeleteResponse,
    summary="Delete a document",
    description="Removes all chunks for a specific document from a tenant's store.",
)
async def delete_document(
    document_id: str,
    tenant_id: str = Query(..., description="Tenant/student ID"),
    collection: str = Query("default", description="Collection name"),
) -> DeleteResponse:
    """Delete a document and all its chunks from the vector store."""
    removed = await rag_pipeline.delete_document(
        tenant_id=tenant_id,
        document_id=document_id,
        collection=collection,
    )
    return DeleteResponse(
        deleted=removed > 0,
        document_id=document_id,
        chunks_removed=removed,
        tenant_id=tenant_id,
    )
