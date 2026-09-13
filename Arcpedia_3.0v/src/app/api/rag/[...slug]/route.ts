/**
 * Catch-all proxy route — forwards RAG API requests from the
 * Next.js frontend to the FastAPI backend.
 *
 * This allows client-side code to call /api/rag/* without
 * worrying about CORS or exposing the backend URL directly.
 *
 * Route: /api/rag/[...slug]
 * Proxies to: RAG_BACKEND_URL/<slug>
 *
 * Examples:
 *   POST /api/rag/api/chat      → http://localhost:8080/api/chat
 *   POST /api/rag/api/rag/query → http://localhost:8080/api/rag/query
 *   POST /api/rag/api/ingest    → http://localhost:8080/api/ingest
 *   GET  /api/rag/health        → http://localhost:8080/health
 */

import { NextRequest, NextResponse } from "next/server";

const RAG_BACKEND_URL =
  process.env.RAG_BACKEND_URL ?? "http://localhost:8080";

/**
 * Forward the incoming request to the FastAPI backend.
 */
async function proxyRequest(
  request: NextRequest,
  slug: string[]
): Promise<NextResponse> {
  const path = `/${slug.join("/")}`;
  const targetUrl = `${RAG_BACKEND_URL}${path}`;

  try {
    // Build the headers to forward (skip host-related ones)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Forward the request body for non-GET methods
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // Stream the response back to the client
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[RAG Proxy] Failed to reach backend at ${targetUrl}:`, error);
    return NextResponse.json(
      {
        error: "RAG backend unavailable",
        detail: `Could not connect to ${RAG_BACKEND_URL}. Is the FastAPI server running?`,
      },
      { status: 502 }
    );
  }
}

// ---------------------------------------------------------------------------
// HTTP method handlers
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}
