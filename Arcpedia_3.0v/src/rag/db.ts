import { ChromaClient } from 'chromadb';

/**
 * Database Initialization
 * 
 * Initializes the ChromaDB client. In a Node.js environment, this connects to 
 * a local ChromaDB instance (e.g., running via Docker or a local Python process).
 * We read the connection details from the environment variables, falling back to localhost.
 */

const host = process.env.CHROMA_HOST || 'localhost';
const port = process.env.CHROMA_PORT || '8000';

export const chromaClient = new ChromaClient({
    path: `http://${host}:${port}`
});

export const COLLECTION_NAME = "arcpedia_multi_tenant_kb";

/**
 * Utility to ensure the vector collection exists and return it.
 * We use cosine similarity for optimal matching with dense embeddings.
 */
export async function getCollection() {
    return await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { "hnsw:space": "cosine" }
    });
}
