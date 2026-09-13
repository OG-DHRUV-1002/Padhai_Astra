/**
 * RAG Backend API client.
 *
 * Typed fetch wrapper that communicates with the FastAPI backend.
 * Supports both JSON responses and SSE streaming for real-time
 * token-by-token delivery.
 *
 * All requests go through the Next.js proxy route (/api/rag/*)
 * on the client side, or directly to the FastAPI backend on the server.
 */

import {
  RAG_BACKEND_URL,
  RAG_PROXY_PREFIX,
  DEFAULT_HEADERS,
} from "./constants";
import type {
  ChatRequest,
  ChatResponse,
  RAGQueryRequest,
  RAGQueryResponse,
  IngestResponse,
  StreamChunk,
  DocumentInfo,
  DeleteResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the base URL — uses the Next.js proxy in the browser,
 * hits the FastAPI backend directly on the server.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return RAG_PROXY_PREFIX;
  }
  return RAG_BACKEND_URL;
}

/**
 * Generic fetch wrapper with error handling and JSON parsing.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `[RAG Client] ${response.status} ${response.statusText}: ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// SSE Streaming helper
// ---------------------------------------------------------------------------

/**
 * Callback type for streaming chat responses.
 *
 * @param chunk - The parsed StreamChunk from the SSE event
 */
export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Read an SSE (Server-Sent Events) stream and invoke a callback
 * for each parsed data event.
 *
 * Usage:
 *   await chatStream(request, (chunk) => {
 *     if (chunk.error) { showError(chunk.error); return; }
 *     if (chunk.done) { handleComplete(chunk.sources); return; }
 *     appendToken(chunk.content);
 *   });
 */
async function readSSEStream(
  path: string,
  body: object,
  onChunk: StreamCallback,
  signal?: AbortSignal,
): Promise<void> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `[RAG Client] Stream failed: ${response.status} ${response.statusText}: ${errorText}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("[RAG Client] Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const events = buffer.split("\n\n");
      // Keep the last incomplete chunk in the buffer
      buffer = events.pop() || "";

      for (const event of events) {
        const lines = event.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            try {
              const chunk: StreamChunk = JSON.parse(jsonStr);
              onChunk(chunk);
            } catch {
              // Skip malformed JSON
              console.warn("[RAG Client] Malformed SSE data:", jsonStr.slice(0, 100));
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Public API — Chat
// ---------------------------------------------------------------------------

/**
 * Send a chat message (non-streaming).
 * Returns the full response at once.
 */
export async function chat(req: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ ...req, stream: false }),
  });
}

/**
 * Send a chat message with streaming (SSE).
 *
 * Calls `onChunk` for each token as it arrives from the model.
 * The final chunk will have `done: true` and may include `sources`.
 *
 * @param req      - Chat request (stream flag is auto-set to true)
 * @param onChunk  - Callback invoked for each streaming chunk
 * @param signal   - Optional AbortSignal to cancel the stream
 *
 * @example
 * let fullText = "";
 * await chatStream(
 *   { messages: [...], tenant_id: "student123", use_rag: true },
 *   (chunk) => {
 *     if (chunk.error) { console.error(chunk.error); return; }
 *     if (!chunk.done) { fullText += chunk.content; updateUI(fullText); }
 *     else { showSources(chunk.sources); }
 *   }
 * );
 */
export async function chatStream(
  req: ChatRequest,
  onChunk: StreamCallback,
  signal?: AbortSignal,
): Promise<void> {
  return readSSEStream(
    "/api/chat",
    { ...req, stream: true },
    onChunk,
    signal,
  );
}

// ---------------------------------------------------------------------------
// Public API — RAG Query
// ---------------------------------------------------------------------------

/**
 * Execute a RAG-augmented query (non-streaming).
 */
export async function ragQuery(
  req: RAGQueryRequest
): Promise<RAGQueryResponse> {
  return request<RAGQueryResponse>("/api/rag/query", {
    method: "POST",
    body: JSON.stringify({ ...req, stream: false }),
  });
}

/**
 * Execute a RAG-augmented query with streaming (SSE).
 */
export async function ragQueryStream(
  req: RAGQueryRequest,
  onChunk: StreamCallback,
  signal?: AbortSignal,
): Promise<void> {
  return readSSEStream(
    "/api/rag/query",
    { ...req, stream: true },
    onChunk,
    signal,
  );
}

// ---------------------------------------------------------------------------
// Public API — Document management
// ---------------------------------------------------------------------------

/**
 * Ingest a document into the vector store.
 * Uses FormData for multipart file upload.
 */
export async function ingestDocument(
  file: File,
  tenantId: string,
  collection: string = "default"
): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenant_id", tenantId);
  formData.append("collection", collection);

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ingest`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type — browser sets it with boundary for FormData
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `[RAG Client] Ingest failed: ${response.status}: ${errorText}`
    );
  }

  return response.json() as Promise<IngestResponse>;
}

/**
 * List all ingested documents for a tenant.
 */
export async function listDocuments(
  tenantId: string,
  collection: string = "default"
): Promise<DocumentInfo[]> {
  return request<DocumentInfo[]>(
    `/api/rag/documents?tenant_id=${encodeURIComponent(tenantId)}&collection=${encodeURIComponent(collection)}`,
    { method: "GET" },
  );
}

/**
 * Delete a document and all its chunks.
 */
export async function deleteDocument(
  documentId: string,
  tenantId: string,
  collection: string = "default"
): Promise<DeleteResponse> {
  return request<DeleteResponse>(
    `/api/rag/documents/${encodeURIComponent(documentId)}?tenant_id=${encodeURIComponent(tenantId)}&collection=${encodeURIComponent(collection)}`,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Public API — Health
// ---------------------------------------------------------------------------

/**
 * Health check for the RAG backend.
 */
export async function healthCheck(): Promise<{
  status: string;
  ollama: { url: string; model: string; reachable: boolean };
  chroma: { host: string; port: number; mode: string };
}> {
  return request("/health", { method: "GET" });
}
