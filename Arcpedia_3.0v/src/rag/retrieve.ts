import { getCollection } from "./db";
import { generateEmbedding } from "./embed";

export interface RetrievalResult {
    document: string;
    distance: number;
    metadata: Record<string, any>;
}

/**
 * Retrieves relevant text chunks for a given query.
 * 
 * CRITICAL MULTI-TENANCY REQUIREMENT:
 * This function enforces a strict metadata filter so it ONLY retrieves 
 * chunks matching the provided `user_id`.
 * 
 * @param query The search query string.
 * @param userId The ID of the student/tenant requesting the data.
 * @param topK The number of relevant chunks to return (default 3).
 */
export async function retrieveRelevantContext(query: string, userId: string, topK: number = 3): Promise<RetrievalResult[]> {
    // 1. Strict Validation
    if (!userId || userId.trim() === "") {
        throw new Error("CRITICAL SECURITY ERROR: user_id is strictly required for data retrieval to prevent cross-tenant data leakage.");
    }

    const collection = await getCollection();
    
    // 2. Generate Query Embedding
    const queryEmbedding = await generateEmbedding(query);

    // 3. Query Database with STRICT METADATA FILTER
    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        // STRICT MULTI-TENANCY ENFORCEMENT: ONLY return documents for this exact user_id
        where: { user_id: userId },
    });

    const formattedResults: RetrievalResult[] = [];
    
    // 4. Format and Return Results
    if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
            const document = results.documents[0][i];
            
            // In ChromaDB, a smaller distance means a higher similarity (when using cosine)
            const distance = results.distances?.[0][i] ?? 0;
            const metadata = results.metadatas?.[0][i] ?? {};

            if (document) {
                formattedResults.push({ document, distance, metadata });
            }
        }
    }

    return formattedResults;
}
