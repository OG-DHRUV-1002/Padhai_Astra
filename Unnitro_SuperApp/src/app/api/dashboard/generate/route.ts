import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = new Date();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        const month = today.toLocaleString('en-US', { month: 'long' });
        const seed = Math.floor(Math.random() * 99999);

        const prompt = `You are a backend data generator for an EdTech student dashboard called Arcpedia.
Today is ${dayName}, ${month} ${today.getDate()}, ${today.getFullYear()}. Random seed: ${seed}.

Generate a FRESH, UNIQUE JSON object for a college Computer Science student's dashboard. Make the data look realistic and professional. Vary the numbers significantly each time.

JSON structure (return ONLY raw JSON, no markdown):
{
  "dailyTip": {
    "tip": "A concise, actionable study tip (1-2 sentences, unique and creative)",
    "emoji": "A single relevant emoji"
  },
  "weeklyActivity": [<7 integers between 1-10 representing study intensity for Mon through Sun>],
  "stats": {
    "totalQuizzes": <number 5-45>,
    "totalMemories": <number 3-30>,
    "totalResources": <number 8-60>,
    "totalJokes": <number 2-25>,
    "averageQuizScore": <number 55-98>
  },
  "motivationalQuote": {
    "text": "An inspiring academic/growth quote (not too common)",
    "author": "Real author name"
  },
  "streak": <number 1-30 representing day streak>,
  "level": <number 5-25>,
  "focusStatus": "<one of: Laser Focus, High, Moderate, Warming Up, Zen Mode>",
  "announcements": [
    {
      "title": "A realistic college announcement title",
      "content": "2-3 sentence realistic announcement content",
      "date": "${today.toISOString().split('T')[0]}"
    },
    {
      "title": "Another realistic announcement",
      "content": "2-3 sentence content",
      "date": "${today.toISOString().split('T')[0]}"
    }
  ]
}`;

        const data = await callGeminiJSON({
            feature: 'dashboard',
            prompt,
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Dashboard Generate] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
