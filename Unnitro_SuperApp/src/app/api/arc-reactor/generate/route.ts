import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { subject } = await request.json();

        if (!subject) {
            return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
        }

        const seed = Math.floor(Math.random() * 99999);

        const prompt = `You are an expert educational quiz generator for a platform called Arcpedia.
Random seed: ${seed}

Generate exactly 10 Multiple Choice Questions (MCQs) for the subject: "${subject}".

The questions should:
- Cover a mix of difficulty levels (3 easy, 4 medium, 3 hard)
- Be based on actual academic curriculum for Computer Science / Engineering students
- Have exactly 4 options each
- Include clear, educational explanations
- Be DIFFERENT from any previous generations (use the random seed)

Return ONLY a raw JSON array (no markdown):
[
  {
    "question": "Clear, well-formed question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Detailed explanation of why the correct answer is right and key ones are wrong."
  }
]

IMPORTANT:
- correctAnswerIndex is 0-based (0, 1, 2, or 3)
- Generate exactly 10 questions
- Questions must be academically accurate
- Distribute correct answers across all positions (not all 0 or all 1)`;

        const quiz = await callGeminiJSON({
            feature: 'reactor',
            prompt,
        });

        return NextResponse.json({ quiz });
    } catch (error: any) {
        console.error('[Arc Reactor Generate] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
