import Groq from 'groq-sdk';

// Initialize the Groq SDK using the API key from .env.local
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates an embedding for a given text using Groq.
 * Note: Groq recently introduced API support for the nomic-embed-text-v1_5 embedding model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await groq.embeddings.create({
            model: "nomic-embed-text-v1_5",
            input: text,
            encoding_format: "float"
        });
        
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate embedding vector.");
    }
}
