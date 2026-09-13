"""
Pydantic request / response schemas for all API endpoints.

These models define the HTTP contract and are mirrored by the
TypeScript types in src/lib/rag/types.ts on the frontend.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """A single message in a chat conversation."""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    """
    Request body for the /api/chat endpoint.

    Supports both streaming and non-streaming modes via the `stream` flag.
    When streaming is enabled, the response is delivered as Server-Sent Events.
    """
    messages: list[ChatMessage] = Field(..., description="Conversation history")
    tenant_id: str = Field(..., description="Tenant/student ID")
    model: Optional[str] = Field(None, description="Override the default Ollama model")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(2048, ge=1, le=8192)
    stream: bool = Field(True, description="If true, response is streamed via SSE")
    use_rag: bool = Field(
        False,
        description="If true, retrieves context from the vector store before generating",
    )
    collection: str = Field("default", description="RAG collection to query (only if use_rag=True)")
    top_k: int = Field(5, ge=1, le=20, description="Number of RAG chunks to retrieve")


class ChatResponse(BaseModel):
    """Response body from the /api/chat endpoint (non-streaming mode)."""
    message: str = Field(..., description="Generated response text")
    sources: list[dict] = Field(default_factory=list, description="Source chunks used for RAG")
    tenant_id: str = Field(..., description="Tenant/student ID echoed back")


class StreamChunk(BaseModel):
    """
    A single chunk in a streaming response.

    The frontend should accumulate `content` fields to build the full response.
    When `done` is True, the stream is complete and `sources` may be populated.
    """
    content: str = Field("", description="Text fragment")
    done: bool = Field(False, description="True when generation is complete")
    sources: list[dict] = Field(default_factory=list, description="Source chunks (populated on final chunk)")
    error: Optional[str] = Field(None, description="Error message if something went wrong")


# ---------------------------------------------------------------------------
# RAG Query
# ---------------------------------------------------------------------------

class RAGQueryRequest(BaseModel):
    """Request body for the /api/rag/query endpoint."""
    query: str = Field(..., description="The user's question")
    tenant_id: str = Field(..., description="Tenant/student ID")
    collection: str = Field("default", description="Target collection name")
    top_k: int = Field(5, ge=1, le=20, description="Number of chunks to retrieve")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    stream: bool = Field(True, description="If true, response is streamed via SSE")


class RAGChunk(BaseModel):
    """A retrieved document chunk with its metadata."""
    content: str = Field(..., description="Chunk text content")
    document_id: str = Field(..., description="Source document ID")
    filename: str = Field("", description="Original filename")
    score: float = Field(..., description="Similarity score (lower = more similar for L2)")
    metadata: dict = Field(default_factory=dict, description="Chunk metadata")


class RAGQueryResponse(BaseModel):
    """Response body from the /api/rag/query endpoint (non-streaming mode)."""
    answer: str = Field(..., description="Generated answer augmented with retrieved context")
    chunks: list[RAGChunk] = Field(default_factory=list, description="Retrieved source chunks")
    tenant_id: str = Field(..., description="Tenant/student ID echoed back")


# ---------------------------------------------------------------------------
# Ingest
# ---------------------------------------------------------------------------

class IngestResponse(BaseModel):
    """Response body from the /api/ingest endpoint."""
    status: str = Field(..., description="'accepted', 'completed', 'error'")
    message: str = Field(..., description="Human-readable status message")
    document_id: str = Field(..., description="Assigned document identifier")
    chunks_created: int = Field(0, description="Number of chunks stored")
    tenant_id: str = Field(..., description="Tenant/student ID")


# ---------------------------------------------------------------------------
# Document management
# ---------------------------------------------------------------------------

class DocumentInfo(BaseModel):
    """Metadata about an ingested document."""
    document_id: str
    filename: str
    chunk_count: int
    tenant_id: str


class DeleteResponse(BaseModel):
    """Response body from document deletion."""
    deleted: bool
    document_id: str
    chunks_removed: int
    tenant_id: str
