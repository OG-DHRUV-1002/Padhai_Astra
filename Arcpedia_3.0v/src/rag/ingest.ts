import { getCollection } from "./db";
import { generateEmbedding } from "./embed";
import crypto from "crypto";

/**
 * A basic text chunker to divide large documents into manageable sizes.
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

/**
 * Ingests educational text into the embedded vector database.
 * 
 * CRITICAL MULTI-TENANCY REQUIREMENT:
 * Every embedded vector MUST be stored with a metadata tag for `user_id`.
 * 
 * @param text The educational content to ingest.
 * @param userId The ID of the student/tenant. This is strictly required.
 * @param source Optional source identifier (e.g., filename, lecture title).
 */
export async function ingestDocument(text: string, userId: string, source: string = "manual_upload") {
    // 1. Strict Validation
    if (!userId || userId.trim() === "") {
        throw new Error("CRITICAL SECURITY ERROR: user_id is strictly required for data ingestion to maintain multi-tenant isolation.");
    }

    const collection = await getCollection();
    
    // 2. Chunking
    const chunks = chunkText(text);
    console.log(`[Ingest] Processing ${chunks.length} chunks for user: ${userId}`);

    const ids: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: any[] = [];
    const documents: string[] = [];

    // 3. Generate Embeddings & Prepare Batch
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding via Groq
        const embedding = await generateEmbedding(chunk);
        
        // Generate a deterministic ID for idempotency
        const id = crypto.createHash("sha256").update(`${userId}-${source}-${i}`).digest("hex");

        ids.push(id);
        embeddings.push(embedding);
        documents.push(chunk);
        
        // STRICT MULTI-TENANCY ENFORCEMENT
        metadatas.push({
            user_id: userId,
            source: source,
            chunk_index: i
        });
    }

    // 4. Save to Database
    await collection.add({
        ids,
        embeddings,
        metadatas,
        documents
    });

    console.log(`[Ingest] Successfully saved ${chunks.length} vectors to the database for user: ${userId}`);
    return { success: true, chunksIngested: chunks.length };
}
