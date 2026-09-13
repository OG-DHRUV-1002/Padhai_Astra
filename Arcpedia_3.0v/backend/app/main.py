"""
Arcpedia RAG Backend — FastAPI entrypoint.

Serves the local Gemma 2 chat proxy, RAG query endpoints,
and document ingestion API. All CORS is scoped to localhost
for development.

Uses a lifespan context manager to cleanly initialise and
shut down the Ollama HTTP client and ChromaDB connections.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, rag, ingest

# Configure logging for the entire backend
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the application lifecycle.

    On startup:  logs configuration, checks Ollama connectivity.
    On shutdown: closes the Ollama HTTP client to free connections.
    """
    # ── Startup ──────────────────────────────────────────────────────
    from app.services.ollama_client import ollama_client
    from app.services.vector_store import vector_store

    logger.info("=" * 60)
    logger.info("Arcpedia RAG Backend starting up")
    logger.info("  Ollama URL:    %s", settings.ollama_base_url)
    logger.info("  Ollama Model:  %s", settings.ollama_model)
    logger.info("  Embed Model:   %s", settings.ollama_embed_model)
    logger.info("  ChromaDB:      %s:%d (mode: %s)",
                settings.chroma_host, settings.chroma_port, vector_store.mode)
    logger.info("  Chunk Size:    %d chars", settings.rag_default_chunk_size)
    logger.info("  Chunk Overlap: %d chars", settings.rag_default_chunk_overlap)
    logger.info("=" * 60)

    # Check Ollama connectivity (non-blocking, just a warning)
    ollama_ok = await ollama_client.health()
    if ollama_ok:
        logger.info("✓ Ollama is reachable")
        # List available models
        try:
            models = await ollama_client.list_models()
            model_names = [m.get("name", "?") for m in models]
            logger.info("  Available models: %s", ", ".join(model_names) or "(none)")
        except Exception:
            pass
    else:
        logger.warning(
            "⚠ Ollama is NOT reachable at %s. "
            "Chat and embedding endpoints will return errors until Ollama is started.",
            settings.ollama_base_url,
        )

    yield  # ← Application is running

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info("Shutting down — closing Ollama client...")
    await ollama_client.close()
    logger.info("Arcpedia RAG Backend shut down cleanly.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Arcpedia RAG Backend",
    description=(
        "Local RAG pipeline & Ollama/Gemma 2 proxy for Arcpedia. "
        "Provides streaming chat, document ingestion, and "
        "tenant-isolated retrieval-augmented generation."
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server (localhost:9002) only
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9002",
        "http://127.0.0.1:9002",
        "http://localhost:3000",   # common Next.js default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["Ingest"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    """
    Lightweight liveness probe.

    Returns the backend status along with connectivity info
    for Ollama and ChromaDB. Use this to verify the backend
    is running before sending requests.
    """
    from app.services.ollama_client import ollama_client
    from app.services.vector_store import vector_store

    ollama_ok = await ollama_client.health()

    return {
        "status": "ok",
        "ollama": {
            "url": settings.ollama_base_url,
            "model": settings.ollama_model,
            "embed_model": settings.ollama_embed_model,
            "reachable": ollama_ok,
        },
        "chroma": {
            "host": settings.chroma_host,
            "port": settings.chroma_port,
            "mode": vector_store.mode,
        },
    }
