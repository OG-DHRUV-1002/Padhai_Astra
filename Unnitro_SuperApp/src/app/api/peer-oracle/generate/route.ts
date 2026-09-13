import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const seed = Math.floor(Math.random() * 99999);

        const prompt = `You are a backend data generator for a college peer forum called "Peer Oracle" on the Arcpedia platform.
Random seed: ${seed}

Generate 8-10 realistic anonymous forum posts from Computer Science engineering students. Include a mix of:
- Study questions and doubt clarifications
- Exam tips and experiences  
- Motivational messages
- Campus life observations
- Tech discussions

Each post should have 1-3 realistic replies from other students.

Return ONLY raw JSON (no markdown):
[
  {
    "id": "post-${seed}-1",
    "title": "Short catchy title",
    "content": "The full post content (2-4 sentences, natural student language)",
    "author": "Anonymous Oracle",
    "date": "${new Date().toISOString()}",
    "tags": ["CS", "Exam Tips"],
    "replies": [
      {
        "id": "reply-${seed}-1-1",
        "content": "A helpful or supportive reply (1-3 sentences)",
        "author": "Anonymous Peer",
        "timestamp": "${new Date().toISOString()}"
      }
    ]
  }
]

IMPORTANT:
- Make posts feel authentic and student-like
- Vary post lengths and topics
- Use realistic tags like: CS, DBMS, OOP, Python, Exams, Campus Life, Motivation, DSA, Web Dev, Career
- Each post should have 1-3 replies
- Keep it clean and positive`;

        const posts = await callGeminiJSON({
            feature: 'archi', // Reuse Archi key for peer oracle
            prompt,
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error('[Peer Oracle Generate] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
