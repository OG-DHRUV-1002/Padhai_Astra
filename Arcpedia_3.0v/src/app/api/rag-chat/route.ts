import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { retrieveRelevantContext } from "@/rag/retrieve";

// Initialize Groq SDK with the API key from .env.local
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, user_id } = await req.json();

    // Basic validation
    if (!message || !user_id) {
      return NextResponse.json(
        { error: "Both 'message' and 'user_id' are required." },
        { status: 400 }
      );
    }

    // 1. Retrieval Step: Fetch personalized context from our embedded ChromaDB
    // This strictly filters by user_id to maintain multi-tenant security
    const contextChunks = await retrieveRelevantContext(message, user_id, 3);
    
    // Join the retrieved text documents to form the context string
    const contextText = contextChunks
      .map((chunk, i) => `[Source ${i + 1}]:\n${chunk.document}`)
      .join("\n\n");

    // 2. Prompt Augmentation: Inject the context into the system prompt
    // This tells the LLM to act as a tutor and restricts its knowledge to the provided context.
    const systemPrompt = `
      You are Archi, a personalized, highly intelligent academic tutor. 
      Use ONLY the following context to answer the user's question. 
      If the answer is not contained within the context, politely inform the user that you don't have enough personalized data to answer accurately. 
      Do NOT invent information or use outside knowledge.

      === RETRIEVED CONTEXT ===
      ${contextText}
      =========================
    `.trim();

    // 3. Groq API Call: Use gemma2-9b-it model and request a streaming response
    const completion = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2, // Keep it deterministic for RAG tasks
      max_tokens: 1024,
      stream: true, // Enable streaming for better UX
    });

    // 4. Stream Handling: Convert the Groq async iterator into a Web ReadableStream
    // This allows Next.js to stream the text chunk-by-chunk to the frontend
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("Error in RAG Chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
