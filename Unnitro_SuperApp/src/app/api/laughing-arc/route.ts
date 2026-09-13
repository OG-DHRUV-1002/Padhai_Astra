import { NextResponse } from 'next/server';
import { callGemini, getKeysForFeature } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { topic, style } = await request.json();

        const prompt = `You are a professional comedian known for your quick wit and hilarious observations. 
        Tell a joke about "${topic}" in the style of "${style}". 
        Keep it concise, punchy, and suitable for a general audience (clean but funny). 
        Do not explain the joke. Just deliver the punchline.`;

        const joke = await callGemini({
            feature: 'laugharc',
            prompt,
        });

        return NextResponse.json({ joke });
    } catch (error: any) {
        console.error('[Laughing Arc] Critical Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate joke.' }, { status: 500 });
    }
}
