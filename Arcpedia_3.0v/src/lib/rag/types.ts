/**
 * TypeScript types for the RAG API.
 *
 * These mirror the Pydantic schemas defined in
 * backend/app/models/schemas.py — keep them in sync.
 */

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  /** Message role: 'user', 'assistant', or 'system' */
  role: "user" | "assistant" | "system";
  /** Message text content */
  content: string;
}

export interface ChatRequest {
  /** Conversation history */
  messages: ChatMessage[];
  /** Tenant/student ID */
  tenant_id: string;
  /** Override the default Ollama model */
  model?: string;
  /** Sampling temperature (0.0 – 2.0) */
  temperature?: number;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** If true, response is streamed via SSE (default: true) */
  stream?: boolean;
  /** If true, retrieves context from the vector store before generating */
  use_rag?: boolean;
  /** RAG collection to query (only if use_rag is true) */
  collection?: string;
  /** Number of RAG chunks to retrieve (1-20) */
  top_k?: number;
}

export interface ChatResponse {
  /** Generated response text */
  message: string;
  /** Source documents used (if RAG-augmented) */
  sources: Record<string, unknown>[];
  /** Tenant/student ID echoed back */
  tenant_id: string;
}

/**
 * A single chunk in a streaming SSE response.
 *
 * The frontend should accumulate `content` fields to build the full response.
 * When `done` is true, the stream is complete and `sources` may be populated.
 */
export interface StreamChunk {
  /** Text fragment */
  content: string;
  /** True when generation is complete */
  done: boolean;
  /** Source chunks (populated on final chunk only) */
  sources: Record<string, unknown>[];
  /** Error message if something went wrong */
  error?: string;
}

// ---------------------------------------------------------------------------
// RAG Query
// ---------------------------------------------------------------------------

export interface RAGQueryRequest {
  /** The user's question */
  query: string;
  /** Tenant/student ID */
  tenant_id: string;
  /** Target collection name */
  collection?: string;
  /** Number of chunks to retrieve (1–20) */
  top_k?: number;
  /** Sampling temperature */
  temperature?: number;
  /** If true, response is streamed via SSE (default: true) */
  stream?: boolean;
}

export interface RAGChunk {
  /** Chunk text content */
  content: string;
  /** Source document ID */
  document_id: string;
  /** Original filename */
  filename: string;
  /** Similarity score */
  score: number;
  /** Chunk metadata */
  metadata: Record<string, unknown>;
}

export interface RAGQueryResponse {
  /** Generated answer augmented with retrieved context */
  answer: string;
  /** Retrieved source chunks */
  chunks: RAGChunk[];
  /** Tenant/student ID echoed back */
  tenant_id: string;
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export interface IngestResponse {
  /** Status: 'accepted', 'completed', 'error' */
  status: "accepted" | "completed" | "error";
  /** Human-readable status message */
  message: string;
  /** Assigned document identifier */
  document_id: string;
  /** Number of chunks stored */
  chunks_created: number;
  /** Tenant/student ID */
  tenant_id: string;
}

// ---------------------------------------------------------------------------
// Document management
// ---------------------------------------------------------------------------

export interface DocumentInfo {
  document_id: string;
  filename: string;
  chunk_count: number;
  tenant_id: string;
}

export interface DeleteResponse {
  deleted: boolean;
  document_id: string;
  chunks_removed: number;
  tenant_id: string;
}
