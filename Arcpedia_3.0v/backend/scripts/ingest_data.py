#!/usr/bin/env python3
"""
Standalone data ingestion script for Arcpedia.

Chunks text files, generates embeddings via Ollama, and stores vectors
in ChromaDB — all with mandatory tenant_id metadata on every vector.

Usage:
  # Ingest a single file
  python scripts/ingest_data.py --file notes.txt --tenant-id student123

  # Ingest all files in a directory
  python scripts/ingest_data.py --dir ./study-materials --tenant-id student123

  # Ingest with custom chunking
  python scripts/ingest_data.py --file notes.txt --tenant-id student123 \
      --chunk-size 1024 --chunk-overlap 128 --collection textbooks

  # List ingested documents
  python scripts/ingest_data.py --list --tenant-id student123

  # Delete a document
  python scripts/ingest_data.py --delete doc_abc123 --tenant-id student123

Prerequisites:
  - Ollama running locally with an embedding model pulled:
      ollama serve
      ollama pull nomic-embed-text
  - Python dependencies installed:
      pip install -r requirements.txt

CRITICAL MULTI-TENANCY:
  Every vector stored includes a `tenant_id` metadata field.
  The --tenant-id flag is MANDATORY for all operations.
"""

import argparse
import asyncio
import logging
import sys
import uuid
from pathlib import Path

# Add the backend directory to the Python path so we can import app modules
_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))

from app.config import settings
from app.services.ollama_client import (
    OllamaClient,
    OllamaConnectionError,
    OllamaModelNotFoundError,
)
from app.services.vector_store import VectorStore
from app.services.chunker import chunk_text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ingest")


# ---------------------------------------------------------------------------
# Supported file types
# ---------------------------------------------------------------------------

_TEXT_EXTENSIONS = {".txt", ".md", ".markdown", ".text", ".csv", ".json", ".py", ".ts", ".js"}
_PDF_EXTENSIONS = {".pdf"}
_ALL_SUPPORTED = _TEXT_EXTENSIONS | _PDF_EXTENSIONS


# ---------------------------------------------------------------------------
# File reading
# ---------------------------------------------------------------------------

def read_file(filepath: Path) -> str:
    """
    Read a file and return its text content.

    Supports plain text files and basic PDF extraction.
    """
    ext = filepath.suffix.lower()

    if ext in _TEXT_EXTENSIONS:
        try:
            return filepath.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return filepath.read_text(encoding="latin-1")

    elif ext in _PDF_EXTENSIONS:
        return _read_pdf(filepath)

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _read_pdf(filepath: Path) -> str:
    """Extract text from a PDF file."""
    try:
        import pypdf
        reader = pypdf.PdfReader(str(filepath))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)
    except ImportError:
        raise RuntimeError(
            "PDF support requires 'pypdf'. Install it: pip install pypdf"
        )


# ---------------------------------------------------------------------------
# Ingestion logic
# ---------------------------------------------------------------------------

async def ingest_file(
    filepath: Path,
    *,
    tenant_id: str,
    collection: str,
    chunk_size: int,
    chunk_overlap: int,
    ollama: OllamaClient,
    store: VectorStore,
) -> dict:
    """
    Ingest a single file into the vector store.

    Steps:
      1. Read the file
      2. Chunk the text
      3. Generate embeddings via Ollama
      4. Store in ChromaDB with tenant_id metadata

    Returns a summary dict.
    """
    filename = filepath.name
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    logger.info("─" * 50)
    logger.info("Ingesting: %s", filepath)
    logger.info("  Tenant:     %s", tenant_id)
    logger.info("  Collection: %s", collection)
    logger.info("  Doc ID:     %s", doc_id)

    # ── Step 1: Read ─────────────────────────────────────────────────
    text = read_file(filepath)
    logger.info("  Read %d chars", len(text))

    if not text.strip():
        logger.warning("  ⚠ File is empty, skipping.")
        return {"file": filename, "status": "skipped", "reason": "empty"}

    # ── Step 2: Chunk ────────────────────────────────────────────────
    chunks = chunk_text(
        text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        extra_metadata={
            "tenant_id": tenant_id,
            "document_id": doc_id,
            "filename": filename,
        },
    )
    logger.info("  Split into %d chunks", len(chunks))

    if not chunks:
        logger.warning("  ⚠ No chunks produced, skipping.")
        return {"file": filename, "status": "skipped", "reason": "no_chunks"}

    # ── Step 3: Embed ────────────────────────────────────────────────
    chunk_texts = [c.text for c in chunks]
    logger.info("  Generating embeddings...")
    embeddings = await ollama.embed_batch(chunk_texts)
    logger.info("  Generated %d embeddings", len(embeddings))

    # ── Step 4: Store with mandatory tenant_id metadata ──────────────
    chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "tenant_id": tenant_id,         # ← CRITICAL: multi-tenancy field
            "document_id": doc_id,
            "filename": filename,
            "chunk_index": c.index,
            "start_char": c.start_char,
            "end_char": c.end_char,
            "source_path": str(filepath),
        }
        for c in chunks
    ]

    stored = store.add_documents(
        tenant_id=tenant_id,
        collection=collection,
        ids=chunk_ids,
        documents=chunk_texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    logger.info("  ✓ Stored %d chunks", stored)

    return {
        "file": filename,
        "document_id": doc_id,
        "chunks_created": stored,
        "chars": len(text),
        "status": "completed",
    }


async def ingest_directory(
    dirpath: Path,
    *,
    tenant_id: str,
    collection: str,
    chunk_size: int,
    chunk_overlap: int,
    ollama: OllamaClient,
    store: VectorStore,
    recursive: bool = True,
) -> list[dict]:
    """Ingest all supported files in a directory."""
    pattern = "**/*" if recursive else "*"
    files = [
        f for f in dirpath.glob(pattern)
        if f.is_file() and f.suffix.lower() in _ALL_SUPPORTED
    ]

    if not files:
        logger.warning("No supported files found in %s", dirpath)
        return []

    logger.info("Found %d supported files in %s", len(files), dirpath)

    results = []
    for filepath in sorted(files):
        try:
            result = await ingest_file(
                filepath,
                tenant_id=tenant_id,
                collection=collection,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                ollama=ollama,
                store=store,
            )
            results.append(result)
        except Exception as err:
            logger.error("Failed to ingest %s: %s", filepath, err)
            results.append({
                "file": filepath.name,
                "status": "error",
                "error": str(err),
            })

    return results


# ---------------------------------------------------------------------------
# List / Delete operations
# ---------------------------------------------------------------------------

async def list_documents(tenant_id: str, collection: str, store: VectorStore):
    """List all documents for a tenant."""
    docs = store.get_document_ids(tenant_id=tenant_id, collection=collection)
    if not docs:
        logger.info("No documents found for tenant '%s' in collection '%s'", tenant_id, collection)
        return

    logger.info("Documents for tenant '%s' (collection: %s):", tenant_id, collection)
    logger.info("%-20s %-30s %s", "Document ID", "Filename", "Chunks")
    logger.info("-" * 60)
    for doc in docs:
        logger.info(
            "%-20s %-30s %d",
            doc["document_id"], doc.get("filename", "—"), doc.get("chunk_count", 0),
        )


async def delete_document(
    document_id: str, tenant_id: str, collection: str, store: VectorStore
):
    """Delete a document and all its chunks."""
    removed = store.delete_by_document_id(
        tenant_id=tenant_id,
        document_id=document_id,
        collection=collection,
    )
    if removed > 0:
        logger.info("✓ Deleted %d chunks for document '%s'", removed, document_id)
    else:
        logger.warning("No chunks found for document '%s' in tenant '%s'", document_id, tenant_id)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Arcpedia data ingestion tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Required
    parser.add_argument(
        "--tenant-id", required=True,
        help="MANDATORY. Student/tenant ID for multi-tenant isolation.",
    )

    # Ingest modes (mutually exclusive)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--file", type=Path, help="Path to a single file to ingest.")
    group.add_argument("--dir", type=Path, help="Path to a directory of files to ingest.")
    group.add_argument("--list", action="store_true", help="List ingested documents.")
    group.add_argument("--delete", type=str, help="Delete a document by ID.")

    # Options
    parser.add_argument(
        "--collection", default="default",
        help="Collection name within the tenant namespace (default: 'default').",
    )
    parser.add_argument(
        "--chunk-size", type=int, default=None,
        help=f"Chunk size in characters (default: {settings.rag_default_chunk_size}).",
    )
    parser.add_argument(
        "--chunk-overlap", type=int, default=None,
        help=f"Chunk overlap in characters (default: {settings.rag_default_chunk_overlap}).",
    )
    parser.add_argument(
        "--no-recursive", action="store_true",
        help="Don't recurse into subdirectories (with --dir).",
    )

    return parser


async def main():
    parser = build_parser()
    args = parser.parse_args()

    tenant_id = args.tenant_id.strip()
    collection = args.collection
    chunk_size = args.chunk_size or settings.rag_default_chunk_size
    chunk_overlap = args.chunk_overlap or settings.rag_default_chunk_overlap

    # ── Initialise services ──────────────────────────────────────────
    ollama = OllamaClient()
    store = VectorStore()

    logger.info("Vector store mode: %s", store.mode)

    # ── Dispatch to the right action ─────────────────────────────────
    try:
        if args.list:
            await list_documents(tenant_id, collection, store)

        elif args.delete:
            await delete_document(args.delete, tenant_id, collection, store)

        elif args.file:
            if not args.file.exists():
                logger.error("File not found: %s", args.file)
                sys.exit(1)

            # Check Ollama is running
            if not await ollama.health():
                logger.error(
                    "✗ Ollama is not reachable at %s. "
                    "Start it with: ollama serve",
                    settings.ollama_base_url,
                )
                sys.exit(1)

            result = await ingest_file(
                args.file,
                tenant_id=tenant_id,
                collection=collection,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                ollama=ollama,
                store=store,
            )
            _print_summary([result])

        elif args.dir:
            if not args.dir.exists():
                logger.error("Directory not found: %s", args.dir)
                sys.exit(1)

            # Check Ollama is running
            if not await ollama.health():
                logger.error(
                    "✗ Ollama is not reachable at %s. "
                    "Start it with: ollama serve",
                    settings.ollama_base_url,
                )
                sys.exit(1)

            results = await ingest_directory(
                args.dir,
                tenant_id=tenant_id,
                collection=collection,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                ollama=ollama,
                store=store,
                recursive=not args.no_recursive,
            )
            _print_summary(results)

        else:
            parser.print_help()

    except OllamaConnectionError as err:
        logger.error("✗ %s", err)
        sys.exit(1)

    except OllamaModelNotFoundError as err:
        logger.error("✗ %s", err)
        sys.exit(1)

    finally:
        await ollama.close()


def _print_summary(results: list[dict]):
    """Print a summary table of ingestion results."""
    logger.info("")
    logger.info("=" * 60)
    logger.info("INGESTION SUMMARY")
    logger.info("=" * 60)

    completed = [r for r in results if r.get("status") == "completed"]
    skipped = [r for r in results if r.get("status") == "skipped"]
    errors = [r for r in results if r.get("status") == "error"]

    total_chunks = sum(r.get("chunks_created", 0) for r in completed)
    total_chars = sum(r.get("chars", 0) for r in completed)

    logger.info("  Completed:  %d files (%d chunks, %d chars)", len(completed), total_chunks, total_chars)
    logger.info("  Skipped:    %d files", len(skipped))
    logger.info("  Errors:     %d files", len(errors))

    if errors:
        logger.info("")
        logger.info("Errors:")
        for r in errors:
            logger.info("  - %s: %s", r.get("file", "?"), r.get("error", "?"))


if __name__ == "__main__":
    asyncio.run(main())
