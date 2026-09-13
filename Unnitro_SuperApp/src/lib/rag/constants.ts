/**
 * RAG-related constants.
 *
 * Centralises URLs, defaults, and headers so they can be
 * changed in one place during the local → production transition.
 */

/**
 * FastAPI backend URL — used for server-side requests.
 * Reads from the environment, falls back to localhost:8080.
 */
export const RAG_BACKEND_URL =
  process.env.RAG_BACKEND_URL ?? "http://localhost:8080";

/**
 * Proxy prefix for client-side requests.
 * Requests from the browser are routed through the Next.js
 * catch-all API route at /api/rag/*, which proxies to FastAPI.
 */
export const RAG_PROXY_PREFIX = "/api/rag";

/**
 * Default request headers for JSON API calls.
 */
export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/**
 * Feature flags — read from Next.js public env vars.
 */
export const FEATURE_FLAGS = {
  /** Whether the local LLM (Ollama) is enabled */
  localLlmEnabled:
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_LLM === "true",

  /** Whether the RAG pipeline is enabled */
  ragEnabled:
    process.env.NEXT_PUBLIC_RAG_ENABLED === "true",
} as const;

/**
 * RAG pipeline defaults.
 */
export const RAG_DEFAULTS = {
  chunkSize: 512,
  chunkOverlap: 64,
  topK: 5,
  temperature: 0.7,
  maxTokens: 2048,
  defaultCollection: "default",
} as const;
