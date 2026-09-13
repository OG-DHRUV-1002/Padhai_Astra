# Arcpedia RAG Backend

Local FastAPI backend powering the Multi-Tenant RAG pipeline and Ollama/Gemma 2 9B proxy for Arcpedia.

## Prerequisites

- **Python 3.11+**
- **Ollama** running locally with `gemma2:9b` and `nomic-embed-text` pulled
- **ChromaDB** (installed via pip, or running as a standalone server)

## Quick Start

```bash
# 1. Create a virtual environment
cd backend
python -m venv .venv

# 2. Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
uvicorn app.main:app --reload --port 8080
```

The API will be available at `http://localhost:8080`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/chat` | Chat with Gemma 2 via Ollama |
| `POST` | `/api/rag/query` | RAG-augmented query |
| `POST` | `/api/ingest` | Ingest a document into the vector store |

## Environment

All configuration is read from `../.env.local` (the project root). See the `OLLAMA_*`, `CHROMA_*`, and `RAG_*` variables.

## Architecture

```
app/
├── main.py          # FastAPI app + CORS + router mounts
├── config.py        # Pydantic settings from .env.local
├── routers/         # HTTP endpoint definitions
│   ├── chat.py      # /api/chat
│   ├── rag.py       # /api/rag
│   └── ingest.py    # /api/ingest
├── services/        # Business logic
│   ├── ollama_client.py   # Ollama HTTP client
│   ├── vector_store.py    # ChromaDB abstraction
│   └── rag_pipeline.py    # RAG orchestration
└── models/
    └── schemas.py   # Pydantic request/response models
```
