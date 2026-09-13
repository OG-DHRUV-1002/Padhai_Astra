import { NextResponse } from 'next/server';
import { callGeminiJSON, getKeysForFeature } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        let text = '';

        if (file.type === 'application/pdf') {
            console.warn("PDF parsing is temporarily disabled.");
            text = "PDF content parsing is currently disabled. Please convert to TXT.";
        } else {
            text = await file.text();
        }

        if (!text || text.length < 50) {
            return NextResponse.json({ error: 'Not enough text content found to generate a quiz.' }, { status: 400 });
        }

        const prompt = `
        You are an educational AI.
        Analyze the following text and generate exactly 10 Multiple Choice Questions (MCQs) for a student to revise the material.
        
        TEXT CONTENT:
        ${text.substring(0, 30000)}

        OUTPUT FORMAT:
        Return ONLY a raw JSON array (no markdown). Structure:
        [
            {
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctIndex": 0,
                "explanation": "Detailed explanation of why the answer is correct and others are wrong."
            }
        ]
        `;

        const quiz = await callGeminiJSON({
            feature: 'booklm',
            prompt,
        });

        return NextResponse.json({ quiz });
    } catch (error: any) {
        console.error("[Arc Book LM] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
