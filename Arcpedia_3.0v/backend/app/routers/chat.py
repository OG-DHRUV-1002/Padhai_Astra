"""
Chat router — streaming and non-streaming chat with Gemma 2 via Ollama.

This is the primary chat endpoint for the Arcpedia frontend.
It supports:
  - Streaming responses via Server-Sent Events (SSE)
  - Non-streaming (blocking) responses
  - Optional RAG augmentation (when use_rag=True in the request)
  - Multi-turn conversation history

Error handling:
  - Returns a structured error SSE event if Ollama is not running
  - Returns 503 for non-streaming requests if Ollama is unreachable
  - Returns 404 if the requested model is not available
"""

import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, StreamChunk
from app.services.rag_pipeline import rag_pipeline
from app.services.ollama_client import (
    OllamaConnectionError,
    OllamaModelNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/chat — Main chat endpoint
# ---------------------------------------------------------------------------

@router.post(
    "",
    summary="Chat with Gemma 2 via Ollama",
    description=(
        "Sends a conversation to the local Gemma 2 9B model through Ollama. "
        "Supports streaming (SSE) and non-streaming modes. "
        "When `use_rag` is true, retrieves relevant context from the "
        "student's vector store before generating."
    ),
    responses={
        200: {
            "description": "Successful response (JSON for non-streaming, "
            "text/event-stream for streaming)",
        },
        404: {"description": "Model not found in Ollama"},
        503: {"description": "Ollama service unreachable"},
    },
)
async def chat(request: ChatRequest):
    """
    Handle a chat request. Routes to streaming or non-streaming based
    on the request's `stream` flag.
    """
    if request.stream:
        return await _chat_streaming(request)
    else:
        return await _chat_blocking(request)


# ---------------------------------------------------------------------------
# Streaming implementation (SSE)
# ---------------------------------------------------------------------------

async def _chat_streaming(request: ChatRequest) -> StreamingResponse:
    """
    Stream the model's response as Server-Sent Events.

    SSE format:
      data: {"content": "token", "done": false}
      data: {"content": "", "done": true, "sources": [...]}

    On error:
      data: {"content": "", "done": true, "error": "message"}
    """

    async def event_generator():
        try:
            # Convert Pydantic messages to plain dicts for the pipeline
            messages = [
                {"role": m.role, "content": m.content}
                for m in request.messages
            ]

            # Call the RAG pipeline's chat_stream method
            chunks, token_stream = await rag_pipeline.chat_stream(
                tenant_id=request.tenant_id,
                messages=messages,
                use_rag=request.use_rag,
                collection=request.collection,
                top_k=request.top_k,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )

            # Stream tokens as SSE events
            async for token in token_stream:
                event = StreamChunk(content=token, done=False)
                yield f"data: {event.model_dump_json()}\n\n"

            # Final event with sources
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
                content="",
                done=True,
                error=(
                    "Cannot reach the local Gemma model. "
                    "Please ensure Ollama is running: `ollama serve`"
                ),
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

        except OllamaModelNotFoundError as err:
            logger.error("Model not found: %s", err)
            error_event = StreamChunk(
                content="",
                done=True,
                error=str(err),
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

        except Exception as err:
            logger.exception("Unexpected error during chat streaming")
            error_event = StreamChunk(
                content="",
                done=True,
                error=f"Internal server error: {type(err).__name__}: {err}",
            )
            yield f"data: {error_event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering if present
        },
    )


# ---------------------------------------------------------------------------
# Non-streaming implementation
# ---------------------------------------------------------------------------

async def _chat_blocking(request: ChatRequest) -> ChatResponse:
    """
    Generate a complete response (no streaming).

    Returns a ChatResponse JSON object.
    """
    try:
        messages = [
            {"role": m.role, "content": m.content}
            for m in request.messages
        ]

        # For non-streaming, we still use chat_stream but collect all tokens
        chunks, token_stream = await rag_pipeline.chat_stream(
            tenant_id=request.tenant_id,
            messages=messages,
            use_rag=request.use_rag,
            collection=request.collection,
            top_k=request.top_k,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        # Collect the full response
        full_response = ""
        async for token in token_stream:
            full_response += token

        sources = [
            {
                "document_id": c.get("document_id", ""),
                "filename": c.get("filename", ""),
                "score": c.get("score", 0.0),
            }
            for c in chunks
        ]

        return ChatResponse(
            message=full_response,
            sources=sources,
            tenant_id=request.tenant_id,
        )

    except OllamaConnectionError as err:
        logger.error("Ollama not reachable: %s", err)
        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot reach the local Gemma model. "
                "Please ensure Ollama is running: `ollama serve`"
            ),
        )

    except OllamaModelNotFoundError as err:
        logger.error("Model not found: %s", err)
        raise HTTPException(status_code=404, detail=str(err))
