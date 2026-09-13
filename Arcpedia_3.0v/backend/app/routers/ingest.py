"""
Ingest router — document ingestion into the tenant-scoped vector store.

Accepts file uploads (PDF, TXT, Markdown, etc.), extracts text,
chunks it, generates embeddings via Ollama, and stores everything
in ChromaDB with mandatory tenant_id metadata.

Supported file types:
  - .txt, .md, .markdown  → read as UTF-8 text
  - .pdf                  → extracted via a lightweight parser
  - (Phase 3 will add .docx, .pptx, etc.)
"""

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.models.schemas import IngestResponse
from app.services.rag_pipeline import rag_pipeline
from app.services.ollama_client import (
    OllamaConnectionError,
    OllamaModelNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum upload size: 20 MB
_MAX_FILE_SIZE = 20 * 1024 * 1024

# Supported file extensions and their MIME types
_SUPPORTED_EXTENSIONS = {".txt", ".md", ".markdown", ".text", ".pdf"}


# ---------------------------------------------------------------------------
# POST /api/ingest — Ingest a document
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=IngestResponse,
    summary="Ingest a document",
    description=(
        "Accepts a document file, extracts text, chunks it, generates "
        "embeddings via Ollama, and stores vectors in ChromaDB. "
        "Every chunk is tagged with the tenant_id for strict isolation."
    ),
    responses={
        200: {"description": "Document successfully ingested"},
        400: {"description": "Unsupported file type or empty content"},
        413: {"description": "File too large"},
        503: {"description": "Ollama service unreachable"},
    },
)
async def ingest_document(
    file: UploadFile = File(..., description="The document to ingest"),
    tenant_id: str = Form(..., description="Tenant/student ID for namespace isolation"),
    collection: str = Form(
        default="default",
        description="Target collection name within the tenant namespace",
    ),
    document_id: str = Form(
        default="",
        description="Optional custom document ID; auto-generated if empty",
    ),
) -> IngestResponse:
    """
    Full document ingestion pipeline:
      1. Validate file type and size
      2. Extract text content from the uploaded file
      3. Pass to RAGPipeline.ingest_document() for chunking + embedding + storage
      4. Return ingestion summary
    """
    # ── Validate tenant_id ───────────────────────────────────────────
    if not tenant_id or not tenant_id.strip():
        raise HTTPException(
            status_code=400,
            detail="tenant_id is required for multi-tenant isolation.",
        )

    # ── Validate file extension ──────────────────────────────────────
    filename = file.filename or "untitled"
    ext = Path(filename).suffix.lower()
    if ext not in _SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: '{ext}'. "
                f"Supported types: {', '.join(sorted(_SUPPORTED_EXTENSIONS))}"
            ),
        )

    # ── Read and validate file size ──────────────────────────────────
    content_bytes = await file.read()
    if len(content_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content_bytes):,} bytes). "
            f"Maximum size: {_MAX_FILE_SIZE:,} bytes (20 MB).",
        )

    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Extract text ─────────────────────────────────────────────────
    try:
        text_content = _extract_text(content_bytes, ext, filename)
    except Exception as err:
        logger.exception("Failed to extract text from '%s'", filename)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from '{filename}': {err}",
        )

    if not text_content or not text_content.strip():
        raise HTTPException(
            status_code=400,
            detail=f"No readable text found in '{filename}'.",
        )

    logger.info(
        "Extracted %d chars from '%s' for tenant '%s'",
        len(text_content), filename, tenant_id,
    )

    # ── Generate document ID ─────────────────────────────────────────
    doc_id = document_id.strip() if document_id else f"doc_{uuid.uuid4().hex[:12]}"

    # ── Ingest via the RAG pipeline ──────────────────────────────────
    try:
        result = await rag_pipeline.ingest_document(
            tenant_id=tenant_id,
            document_content=text_content,
            document_id=doc_id,
            filename=filename,
            collection=collection,
        )

        return IngestResponse(
            status="completed",
            message=(
                f"Successfully ingested '{filename}': "
                f"{result['chunks_created']} chunks created."
            ),
            document_id=result["document_id"],
            chunks_created=result["chunks_created"],
            tenant_id=tenant_id,
        )

    except OllamaConnectionError as err:
        logger.error("Ollama not reachable during ingestion: %s", err)
        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot reach Ollama for embedding generation. "
                "Please ensure Ollama is running: `ollama serve` "
                "and the embedding model is pulled: "
                "`ollama pull nomic-embed-text`"
            ),
        )

    except OllamaModelNotFoundError as err:
        logger.error("Embedding model not found: %s", err)
        raise HTTPException(status_code=404, detail=str(err))

    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


# ---------------------------------------------------------------------------
# Text extraction helpers
# ---------------------------------------------------------------------------

def _extract_text(content_bytes: bytes, ext: str, filename: str) -> str:
    """
    Extract text from file bytes based on the file extension.

    Supports plain text formats and basic PDF parsing.
    """
    if ext in {".txt", ".md", ".markdown", ".text"}:
        # Plain text / Markdown — decode as UTF-8 with fallback
        return _decode_text(content_bytes)

    elif ext == ".pdf":
        return _extract_pdf_text(content_bytes, filename)

    else:
        raise ValueError(f"No text extractor for extension: {ext}")


def _decode_text(content_bytes: bytes) -> str:
    """Decode bytes to string, trying UTF-8 first then latin-1 fallback."""
    try:
        return content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        logger.warning("UTF-8 decode failed, falling back to latin-1")
        return content_bytes.decode("latin-1")


def _extract_pdf_text(content_bytes: bytes, filename: str) -> str:
    """
    Extract text from a PDF file.

    Uses a lightweight approach: tries PyPDF2 / pypdf first (if available),
    falls back to a basic binary text extraction as last resort.
    """
    # Try pypdf (modern fork of PyPDF2)
    try:
        import pypdf
        from io import BytesIO

        reader = pypdf.PdfReader(BytesIO(content_bytes))
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        if pages:
            return "\n\n".join(pages)
    except ImportError:
        logger.info("pypdf not installed; trying alternative PDF extraction")
    except Exception as err:
        logger.warning("pypdf extraction failed for '%s': %s", filename, err)

    # Try pdf-parse style extraction (basic)
    try:
        # Attempt a crude text extraction from PDF binary
        text = content_bytes.decode("latin-1")
        # Extract text between stream/endstream markers (very basic)
        import re
        streams = re.findall(r"stream\s*\n(.*?)\nendstream", text, re.DOTALL)
        if streams:
            # Filter to printable text
            extracted = " ".join(
                "".join(c for c in s if c.isprintable() or c in "\n\t ")
                for s in streams
            )
            if len(extracted.strip()) > 50:
                return extracted.strip()
    except Exception:
        pass

    raise ValueError(
        f"Could not extract text from PDF '{filename}'. "
        "Install 'pypdf' for better PDF support: pip install pypdf"
    )
