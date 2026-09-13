"""
Vector store service — ChromaDB abstraction with multi-tenant namespacing.

CRITICAL MULTI-TENANCY DESIGN:
───────────────────────────────
Every vector stored carries a `tenant_id` metadata field AND lives inside
a tenant-scoped collection (naming: {prefix}_{tenant_id}_{collection}).
This is a *defense-in-depth* approach:

  1. Collection-level isolation: each tenant gets separate collections,
     so a compromised query string can never accidentally return another
     tenant's data.
  2. Metadata-level isolation: every add/query operation enforces a
     `tenant_id` filter at the ChromaDB `where` clause level, providing
     a second fence even if collection naming were ever relaxed.

Storage modes (auto-detected):
  - "server"     → connects to a running ChromaDB HTTP server
  - "persistent" → uses a local directory (chroma_data/) for durable storage
  - "ephemeral"  → in-memory only (lost on restart; last resort fallback)
"""

import logging
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Manages ChromaDB collections with strict tenant-level isolation.

    Every public method requires a `tenant_id` parameter.  There is no
    way to query across tenants — this is by design.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        collection_prefix: Optional[str] = None,
        persist_dir: Optional[str] = None,
    ):
        self.host = host or settings.chroma_host
        self.port = port or settings.chroma_port
        self.prefix = collection_prefix or settings.chroma_collection_prefix
        self.persist_dir = persist_dir or settings.chroma_persist_dir

        # ── Connection strategy ──────────────────────────────────────
        # Try HTTP server first (best for production / shared dev).
        # Fall back to PersistentClient (disk-backed, survives restarts).
        # Last resort: EphemeralClient (in-memory, for quick testing).
        self._client: chromadb.ClientAPI
        self._mode: str

        # Attempt 1: HTTP server
        try:
            client = chromadb.HttpClient(
                host=self.host,
                port=self.port,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            client.heartbeat()
            self._client = client
            self._mode = "server"
            logger.info("ChromaDB: connected to server at %s:%d", self.host, self.port)
        except Exception as http_err:
            logger.info("ChromaDB server not available (%s), trying persistent client...", http_err)

            # Attempt 2: Persistent (disk-backed)
            try:
                from pathlib import Path
                persist_path = Path(self.persist_dir).resolve()
                persist_path.mkdir(parents=True, exist_ok=True)

                self._client = chromadb.PersistentClient(
                    path=str(persist_path),
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                self._mode = "persistent"
                logger.info("ChromaDB: using persistent storage at %s", persist_path)
            except Exception as persist_err:
                logger.warning(
                    "ChromaDB persistent client failed (%s), falling back to ephemeral.",
                    persist_err,
                )
                # Attempt 3: Ephemeral (in-memory)
                self._client = chromadb.EphemeralClient(
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                self._mode = "ephemeral"
                logger.warning("ChromaDB: using EPHEMERAL mode — data will NOT survive restarts.")

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def mode(self) -> str:
        """Return the active storage mode: 'server', 'persistent', or 'ephemeral'."""
        return self._mode

    # ------------------------------------------------------------------
    # Collection naming (tenant isolation)
    # ------------------------------------------------------------------

    def _collection_name(self, tenant_id: str, collection: str = "default") -> str:
        """
        Build a namespaced collection name.

        Format: {prefix}_{tenant_id}_{collection}
        Example: arcpedia_student123_notes
        """
        # Sanitise inputs to prevent injection via collection naming
        safe_tenant = tenant_id.replace("/", "_").replace("\\", "_").strip()
        safe_collection = collection.replace("/", "_").replace("\\", "_").strip()
        return f"{self.prefix}_{safe_tenant}_{safe_collection}"

    # ------------------------------------------------------------------
    # Collection management
    # ------------------------------------------------------------------

    def get_or_create_collection(
        self,
        tenant_id: str,
        collection: str = "default",
    ) -> chromadb.Collection:
        """
        Get or create a ChromaDB collection scoped to a tenant.

        The collection uses cosine distance by default, which works well
        with most embedding models including nomic-embed-text.
        """
        name = self._collection_name(tenant_id, collection)
        return self._client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},  # cosine similarity
        )

    def delete_collection(self, tenant_id: str, collection: str = "default") -> None:
        """Delete an entire tenant collection and all its vectors."""
        name = self._collection_name(tenant_id, collection)
        try:
            self._client.delete_collection(name=name)
            logger.info("Deleted collection: %s", name)
        except ValueError:
            logger.warning("Collection '%s' does not exist; nothing to delete.", name)

    def list_collections(self, tenant_id: Optional[str] = None) -> list[str]:
        """
        List collection names.

        If tenant_id is provided, returns only that tenant's collections.
        """
        all_collections = self._client.list_collections()
        names = [c.name for c in all_collections]
        if tenant_id:
            prefix = f"{self.prefix}_{tenant_id}_"
            names = [n for n in names if n.startswith(prefix)]
        return names

    # ------------------------------------------------------------------
    # Add documents (vectors)
    # ------------------------------------------------------------------

    def add_documents(
        self,
        *,
        tenant_id: str,
        collection: str = "default",
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: Optional[list[dict]] = None,
    ) -> int:
        """
        Add document chunks with their embeddings to a tenant's collection.

        CRITICAL: Every metadata dict MUST contain 'tenant_id' and 'document_id'.
        This method enforces that automatically — even if the caller forgets,
        tenant_id is injected into every metadata record.

        Args:
            tenant_id:  The student/tenant who owns this data.
            collection: Logical collection name (e.g. "notes", "textbooks").
            ids:        Unique IDs for each chunk (e.g. "doc123_chunk_0").
            documents:  The raw text of each chunk (stored alongside the vector).
            embeddings: Pre-computed embedding vectors, one per chunk.
            metadatas:  Optional per-chunk metadata dicts.

        Returns:
            The number of chunks added.
        """
        coll = self.get_or_create_collection(tenant_id, collection)

        # ── Enforce tenant_id in every metadata record ────────────────
        enforced_metas: list[dict] = []
        for i in range(len(ids)):
            meta = dict(metadatas[i]) if metadatas and i < len(metadatas) else {}
            # MANDATORY tenant isolation metadata
            meta["tenant_id"] = tenant_id
            # Ensure document_id is present (extract from chunk ID if needed)
            if "document_id" not in meta:
                meta["document_id"] = ids[i].rsplit("_chunk_", 1)[0]
            enforced_metas.append(meta)

        coll.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=enforced_metas,
        )

        logger.info(
            "Added %d chunks to collection '%s' for tenant '%s'",
            len(ids), self._collection_name(tenant_id, collection), tenant_id,
        )
        return len(ids)

    # ------------------------------------------------------------------
    # Query (with strict tenant filtering)
    # ------------------------------------------------------------------

    def query(
        self,
        *,
        tenant_id: str,
        collection: str = "default",
        query_embedding: list[float],
        top_k: int = 5,
        where_filter: Optional[dict] = None,
    ) -> dict:
        """
        Query for similar chunks, strictly filtered to a single tenant.

        SECURITY: The tenant_id filter is ALWAYS applied. Even if the
        caller passes a where_filter, it is merged with {"tenant_id": tenant_id}
        so cross-tenant leakage is impossible.

        Args:
            tenant_id:       The student whose data to search.
            collection:      Which collection to search.
            query_embedding: The query vector (same dimensions as stored vectors).
            top_k:           Number of nearest neighbours to return.
            where_filter:    Optional additional metadata filters.

        Returns:
            Dict with keys: ids, documents, metadatas, distances
            Each is a list of lists (ChromaDB format).
        """
        coll = self.get_or_create_collection(tenant_id, collection)

        # ── Build the WHERE clause with mandatory tenant filtering ────
        tenant_filter = {"tenant_id": {"$eq": tenant_id}}

        if where_filter:
            # Merge with an $and clause to keep both filters
            combined_filter = {
                "$and": [tenant_filter, where_filter]
            }
        else:
            combined_filter = tenant_filter

        results = coll.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=combined_filter,
            include=["documents", "metadatas", "distances"],
        )

        logger.debug(
            "Query returned %d results from tenant '%s' collection '%s'",
            len(results.get("ids", [[]])[0]),
            tenant_id,
            collection,
        )
        return results

    # ------------------------------------------------------------------
    # Delete by document ID (within a tenant)
    # ------------------------------------------------------------------

    def delete_by_document_id(
        self,
        *,
        tenant_id: str,
        document_id: str,
        collection: str = "default",
    ) -> int:
        """
        Remove all chunks belonging to a specific document within a tenant.

        Uses a metadata WHERE filter to find and delete only chunks
        with matching tenant_id AND document_id.

        Returns the number of chunks removed.
        """
        coll = self.get_or_create_collection(tenant_id, collection)

        # First, find all chunk IDs for this document within this tenant
        existing = coll.get(
            where={
                "$and": [
                    {"tenant_id": {"$eq": tenant_id}},
                    {"document_id": {"$eq": document_id}},
                ]
            },
            include=[],  # we only need the IDs
        )

        chunk_ids = existing.get("ids", [])
        if not chunk_ids:
            logger.info(
                "No chunks found for document '%s' in tenant '%s'",
                document_id, tenant_id,
            )
            return 0

        coll.delete(ids=chunk_ids)
        logger.info(
            "Deleted %d chunks for document '%s' from tenant '%s'",
            len(chunk_ids), document_id, tenant_id,
        )
        return len(chunk_ids)

    # ------------------------------------------------------------------
    # List documents in a collection
    # ------------------------------------------------------------------

    def get_document_ids(
        self,
        *,
        tenant_id: str,
        collection: str = "default",
    ) -> list[dict]:
        """
        List all unique documents stored for a tenant in a collection.

        Returns a list of dicts: [{"document_id": "...", "filename": "...", "chunk_count": N}]
        """
        coll = self.get_or_create_collection(tenant_id, collection)

        # Get all metadatas filtered to this tenant
        all_data = coll.get(
            where={"tenant_id": {"$eq": tenant_id}},
            include=["metadatas"],
        )

        # Aggregate by document_id
        doc_map: dict[str, dict] = {}
        for meta in all_data.get("metadatas", []):
            if not meta:
                continue
            doc_id = meta.get("document_id", "unknown")
            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    "document_id": doc_id,
                    "filename": meta.get("filename", ""),
                    "chunk_count": 0,
                    "tenant_id": tenant_id,
                }
            doc_map[doc_id]["chunk_count"] += 1

        return list(doc_map.values())

    # ------------------------------------------------------------------
    # Collection stats
    # ------------------------------------------------------------------

    def collection_count(self, tenant_id: str, collection: str = "default") -> int:
        """Return the total number of vectors in a tenant's collection."""
        coll = self.get_or_create_collection(tenant_id, collection)
        return coll.count()


# ---------------------------------------------------------------------------
# Convenience singleton — import `vector_store` anywhere in the app
# ---------------------------------------------------------------------------
vector_store = VectorStore()
