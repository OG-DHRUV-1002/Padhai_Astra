"""
Centralised configuration via pydantic-settings.

Reads from the project-root .env.local file so that both
the Next.js frontend and this Python backend share a single
source of truth for environment variables.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve the project root .env.local (one level up from backend/)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env.local"


class Settings(BaseSettings):
    """Application settings — all values have safe defaults for local dev."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",  # ignore the many Next.js / Firebase vars
    )

    # -- Ollama / Local LLM -------------------------------------------------
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma2:9b"
    ollama_embed_model: str = "nomic-embed-text"
    ollama_timeout: float = 180.0           # seconds; generous for large prompts
    ollama_embed_batch_size: int = 32       # how many texts to embed per batch

    # -- ChromaDB ------------------------------------------------------------
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_collection_prefix: str = "arcpedia"
    chroma_persist_dir: str = "./chroma_data"  # used by PersistentClient fallback

    # -- RAG Backend ---------------------------------------------------------
    rag_backend_url: str = "http://localhost:8080"
    rag_backend_secret: str = "change-me-in-production"

    # -- Multi-Tenant RAG ---------------------------------------------------
    rag_tenant_isolation: str = "student"
    rag_default_chunk_size: int = 512
    rag_default_chunk_overlap: int = 64


# Singleton — import this everywhere
settings = Settings()
