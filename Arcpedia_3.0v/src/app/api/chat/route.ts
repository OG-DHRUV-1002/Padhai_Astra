import { NextResponse } from 'next/server';
import { getKeysForFeature } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { message, history } = await request.json();

        // Build conversation contents
        const conversationHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const keys = getKeysForFeature('archi');
        if (keys.length === 0) {
            return NextResponse.json({ error: 'Archi API keys not configured' }, { status: 500 });
        }

        const contents = [
            ...conversationHistory,
            { role: 'user', parts: [{ text: message }] }
        ];

        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
        let lastError = null;

        for (const key of shuffledKeys) {
            try {
                let response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents })
                    }
                );

                if (response.status === 429) {
                    console.warn(`[Archi Chat] Key ...${key.slice(-4)} rate limited on 2.5-flash, trying 2.0-flash`);
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents })
                        }
                    );
                }

                if (response.status === 429) {
                    lastError = 'Rate limit exceeded';
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[Archi Chat] Key ...${key.slice(-4)} error: ${errText}`);
                    lastError = `API Error ${response.status}`;
                    continue;
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                    return NextResponse.json({ response: text });
                }

                lastError = 'Empty response';
            } catch (err: any) {
                console.error(`[Archi Chat] Exception:`, err);
                lastError = err.message;
            }
        }

        throw new Error(`All keys failed. Last error: ${lastError}`);
    } catch (error: any) {
        console.error('[Archi Chat] Fatal Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
    }
}
