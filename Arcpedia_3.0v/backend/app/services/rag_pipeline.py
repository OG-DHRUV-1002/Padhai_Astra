"""
RAG pipeline — production-ready orchestration of the full
Retrieval-Augmented Generation workflow.

Connects:
  - OllamaClient  → embeddings + text generation
  - VectorStore    → tenant-isolated vector storage & retrieval
  - Chunker        → document splitting

Every operation is tenant-scoped. There is no code path that can
access another tenant's data.

Pipeline flow:
  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │  Ingest  │───▶│  Chunk   │───▶│  Embed (LLM) │───▶│  Store   │
  └──────────┘    └──────────┘    └──────────────┘    └──────────┘

  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │  Query   │───▶│  Embed query │───▶│ Retrieve │───▶│ Build prompt │───▶│ Generate │
  └──────────┘    └──────────────┘    └──────────┘    └──────────────┘    └──────────┘
"""

import logging
import uuid
from typing import AsyncIterator, Optional

from app.config import settings
from app.services.ollama_client import (
    OllamaClient,
    OllamaConnectionError,
    OllamaModelNotFoundError,
    ollama_client,
)
from app.services.vector_store import VectorStore, vector_store
from app.services.chunker import chunk_text, TextChunk

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# System prompt template for RAG-augmented generation
# ---------------------------------------------------------------------------

_RAG_SYSTEM_PROMPT = """You are Archi, an AI academic assistant for Arcpedia.
You help students understand their course material by answering questions
based on their personal notes and study materials.

INSTRUCTIONS:
- Answer the student's question using ONLY the provided context below.
- If the context does not contain enough information to answer, say so
  honestly — do NOT make up information.
- Cite which source document(s) you drew from when possible.
- Be concise, clear, and helpful. Use markdown formatting where appropriate.
- If the student asks something outside the provided context, let them know
  the answer isn't in their uploaded materials.

CONTEXT FROM STUDENT'S DOCUMENTS:
{context}
"""

_DEFAULT_SYSTEM_PROMPT = """You are Archi, an AI academic assistant for Arcpedia.
You help students with their studies. Be concise, clear, and helpful.
Use markdown formatting where appropriate."""


class RAGPipeline:
    """
    Orchestrates the full Retrieval-Augmented Generation pipeline
    with strict multi-tenant isolation.

    All public methods require a `tenant_id` and enforce it through
    both the VectorStore (collection naming + metadata filtering)
    and the embedding/generation calls.
    """

    def __init__(
        self,
        llm: Optional[OllamaClient] = None,
        store: Optional[VectorStore] = None,
    ):
        self.llm = llm or ollama_client
        self.store = store or vector_store

    # ==================================================================
    # INGEST — Document → Chunks → Embeddings → Vector Store
    # ==================================================================

    async def ingest_document(
        self,
        *,
        tenant_id: str,
        document_content: str,
        document_id: Optional[str] = None,
        filename: str = "untitled",
        collection: str = "default",
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> dict:
        """
        Ingest a document into the tenant's vector store.

        Steps:
          1. Generate a unique document_id if not provided.
          2. Split the text into overlapping chunks.
          3. Generate embedding vectors for each chunk via Ollama.
          4. Store chunks + embeddings in ChromaDB with tenant metadata.

        Args:
            tenant_id:        Student/tenant who owns this document.
            document_content: The full text content of the document.
            document_id:      Optional custom ID; auto-generated if omitted.
            filename:         Original filename for citation metadata.
            collection:       Logical collection (e.g. "notes", "textbooks").
            chunk_size:       Override default chunk size.
            chunk_overlap:    Override default chunk overlap.

        Returns:
            Dict with: document_id, chunks_created, tenant_id, filename

        Raises:
            OllamaConnectionError:   If Ollama is not reachable.
            OllamaModelNotFoundError: If the embedding model isn't pulled.
            ValueError:               If document_content is empty.
        """
        # ── Validate ─────────────────────────────────────────────────
        if not document_content or not document_content.strip():
            raise ValueError("Cannot ingest an empty document.")

        if not tenant_id or not tenant_id.strip():
            raise ValueError("tenant_id is required for multi-tenant isolation.")

        # ── Generate document ID ─────────────────────────────────────
        doc_id = document_id or f"doc_{uuid.uuid4().hex[:12]}"

        logger.info(
            "Ingesting document '%s' (%s) for tenant '%s' — %d chars",
            doc_id, filename, tenant_id, len(document_content),
        )

        # ── Step 1: Chunk the text ───────────────────────────────────
        chunks: list[TextChunk] = chunk_text(
            document_content,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            extra_metadata={
                "tenant_id": tenant_id,
                "document_id": doc_id,
                "filename": filename,
            },
        )

        if not chunks:
            logger.warning("Chunking produced 0 chunks for document '%s'", doc_id)
            return {
                "document_id": doc_id,
                "chunks_created": 0,
                "tenant_id": tenant_id,
                "filename": filename,
            }

        logger.info("Split into %d chunks", len(chunks))

        # ── Step 2: Generate embeddings ──────────────────────────────
        chunk_texts = [c.text for c in chunks]
        embeddings = await self.llm.embed_batch(chunk_texts)

        logger.info("Generated %d embeddings", len(embeddings))

        # ── Step 3: Store in ChromaDB ────────────────────────────────
        chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "tenant_id": tenant_id,       # MANDATORY multi-tenancy field
                "document_id": doc_id,
                "filename": filename,
                "chunk_index": c.index,
                "start_char": c.start_char,
                "end_char": c.end_char,
            }
            for c in chunks
        ]

        stored = self.store.add_documents(
            tenant_id=tenant_id,
            collection=collection,
            ids=chunk_ids,
            documents=chunk_texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        logger.info(
            "Stored %d chunks for document '%s' in tenant '%s'",
            stored, doc_id, tenant_id,
        )

        return {
            "document_id": doc_id,
            "chunks_created": stored,
            "tenant_id": tenant_id,
            "filename": filename,
        }

    # ==================================================================
    # RETRIEVE — Query → Embed → Search → Return chunks
    # ==================================================================

    async def retrieve(
        self,
        *,
        tenant_id: str,
        query: str,
        collection: str = "default",
        top_k: int = 5,
    ) -> list[dict]:
        """
        Retrieve the most relevant chunks for a query from a tenant's store.

        This is the pure retrieval step — no generation.

        SECURITY: The tenant_id filter is ALWAYS enforced at the
        VectorStore layer, preventing cross-tenant data leakage.

        Args:
            tenant_id:  Student whose documents to search.
            query:      The natural language query to match against.
            collection: Which collection to search.
            top_k:      Number of nearest chunks to return.

        Returns:
            List of dicts, each with: content, document_id, filename,
            score (cosine distance), metadata.
        """
        # ── Embed the query ──────────────────────────────────────────
        query_embedding = await self.llm.embed(query)

        # ── Search the vector store (tenant-filtered) ────────────────
        results = self.store.query(
            tenant_id=tenant_id,
            collection=collection,
            query_embedding=query_embedding,
            top_k=top_k,
        )

        # ── Format results ───────────────────────────────────────────
        chunks: list[dict] = []
        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for i in range(len(ids)):
            meta = metadatas[i] if i < len(metadatas) else {}
            chunks.append({
                "content": documents[i] if i < len(documents) else "",
                "document_id": meta.get("document_id", ""),
                "filename": meta.get("filename", ""),
                "score": distances[i] if i < len(distances) else 0.0,
                "metadata": meta,
            })

        logger.info(
            "Retrieved %d chunks for tenant '%s' query: '%s'",
            len(chunks), tenant_id, query[:60],
        )
        return chunks

    # ==================================================================
    # QUERY (non-streaming) — Retrieve + Generate
    # ==================================================================

    async def query(
        self,
        *,
        tenant_id: str,
        query: str,
        collection: str = "default",
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> dict:
        """
        Execute a full RAG query: retrieve context, build prompt, generate.

        Args:
            tenant_id:   Student whose documents to search.
            query:       The student's question.
            collection:  Which collection to search.
            top_k:       Number of context chunks to retrieve.
            temperature: Generation temperature.
            max_tokens:  Maximum generation length.

        Returns:
            Dict with: answer (str), chunks (list[dict]), tenant_id (str)
        """
        # ── Retrieve relevant context ────────────────────────────────
        chunks = await self.retrieve(
            tenant_id=tenant_id,
            query=query,
            collection=collection,
            top_k=top_k,
        )

        # ── Build the augmented prompt ───────────────────────────────
        context = self._format_context(chunks)
        system_prompt = _RAG_SYSTEM_PROMPT.format(context=context)

        # ── Generate via Ollama ──────────────────────────────────────
        answer = await self.llm.generate(
            prompt=query,
            system=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return {
            "answer": answer,
            "chunks": chunks,
            "tenant_id": tenant_id,
        }

    # ==================================================================
    # QUERY (streaming) — Retrieve + Stream generation
    # ==================================================================

    async def query_stream(
        self,
        *,
        tenant_id: str,
        query: str,
        collection: str = "default",
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> tuple[list[dict], AsyncIterator[str]]:
        """
        Execute a streaming RAG query.

        Returns a tuple of:
          1. The retrieved chunks (available immediately)
          2. An async iterator that yields text tokens as they stream
             from the Gemma model

        The caller should first emit the chunks as metadata, then
        stream the tokens to the client.
        """
        # ── Retrieve relevant context ────────────────────────────────
        chunks = await self.retrieve(
            tenant_id=tenant_id,
            query=query,
            collection=collection,
            top_k=top_k,
        )

        # ── Build the augmented prompt ───────────────────────────────
        context = self._format_context(chunks)
        system_prompt = _RAG_SYSTEM_PROMPT.format(context=context)

        # ── Return chunks + a streaming generator ────────────────────
        token_stream = self.llm.generate_stream(
            prompt=query,
            system=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return chunks, token_stream

    # ==================================================================
    # CHAT (streaming) — Multi-turn with optional RAG
    # ==================================================================

    async def chat_stream(
        self,
        *,
        tenant_id: str,
        messages: list[dict],
        use_rag: bool = False,
        collection: str = "default",
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> tuple[list[dict], AsyncIterator[str]]:
        """
        Stream a multi-turn chat with optional RAG augmentation.

        If use_rag is True, the last user message is used to retrieve
        relevant context, which is injected as a system prompt.

        Returns:
          (source_chunks, token_iterator)
        """
        chunks: list[dict] = []

        # ── Extract the last user message for RAG query ──────────────
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "")
                break

        # ── Optionally retrieve context ──────────────────────────────
        if use_rag and last_user_msg:
            chunks = await self.retrieve(
                tenant_id=tenant_id,
                query=last_user_msg,
                collection=collection,
                top_k=top_k,
            )
            context = self._format_context(chunks)
            system_prompt = _RAG_SYSTEM_PROMPT.format(context=context)
        else:
            system_prompt = _DEFAULT_SYSTEM_PROMPT

        # ── Ensure system prompt is the first message ────────────────
        chat_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            if msg.get("role") != "system":  # skip any existing system msgs
                chat_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        # ── Stream the response ──────────────────────────────────────
        token_stream = self.llm.chat_stream(
            messages=chat_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return chunks, token_stream

    # ==================================================================
    # DOCUMENT MANAGEMENT
    # ==================================================================

    async def delete_document(
        self,
        *,
        tenant_id: str,
        document_id: str,
        collection: str = "default",
    ) -> int:
        """
        Remove all chunks for a document from the tenant's store.

        Returns the number of chunks removed.
        """
        removed = self.store.delete_by_document_id(
            tenant_id=tenant_id,
            document_id=document_id,
            collection=collection,
        )
        logger.info(
            "Deleted %d chunks for document '%s' from tenant '%s'",
            removed, document_id, tenant_id,
        )
        return removed

    async def list_documents(
        self,
        *,
        tenant_id: str,
        collection: str = "default",
    ) -> list[dict]:
        """
        List all ingested documents for a tenant.

        Returns list of dicts with: document_id, filename, chunk_count, tenant_id
        """
        return self.store.get_document_ids(
            tenant_id=tenant_id,
            collection=collection,
        )

    # ==================================================================
    # Internal helpers
    # ==================================================================

    @staticmethod
    def _format_context(chunks: list[dict]) -> str:
        """
        Format retrieved chunks into a context string for the system prompt.

        Each chunk is wrapped with its source metadata so the model
        can cite specific documents in its response.
        """
        if not chunks:
            return "(No relevant context found in the student's documents.)"

        parts: list[str] = []
        for i, chunk in enumerate(chunks, 1):
            filename = chunk.get("filename", "unknown")
            doc_id = chunk.get("document_id", "")
            content = chunk.get("content", "")
            parts.append(
                f"--- Source {i}: {filename} (ID: {doc_id}) ---\n{content}"
            )

        return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Convenience singleton — import `rag_pipeline` anywhere in the app
# ---------------------------------------------------------------------------
rag_pipeline = RAGPipeline()
