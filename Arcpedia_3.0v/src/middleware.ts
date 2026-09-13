// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow RAG API stream requests to bypass Basic Auth / Middleware redirection
  if (request.nextUrl.pathname.startsWith('/api/rag-chat')) {
    return NextResponse.next();
  }

  // Your existing authentication logic here...
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude static assets and the RAG stream route from auth middleware
    '/((?!_next/static|_next/image|favicon.ico|api/rag-chat).*)',
  ],
};
