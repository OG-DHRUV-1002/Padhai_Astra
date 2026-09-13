import { NextResponse } from 'next/server';
import { callGeminiJSON, getKeysForFeature } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { preferences, courses } = await request.json();

        const prompt = `
        You are an intelligent academic scheduler.
        Create a weekly timetable for a student based on these available courses:
        ${JSON.stringify(courses)}

        Student Preferences: "${preferences}"

        Constraints:
        1. Days: Monday, Tuesday, Wednesday, Thursday, Friday.
        2. Hours: 9, 10, 11, 12, 13, 14, 15, 16 (24-hour format integers).
        3. Output MUST be valid JSON array of objects with keys: "day", "hour", "subject".
        4. Do NOT include any markdown formatting like \`\`\`json. Just raw JSON.
        5. Ensure a balanced distribution.
        6. Use EXACT subject names from the list provided.

        Example Output Format:
        [
            { "day": "Monday", "hour": 9, "subject": "Core Java" },
            { "day": "Monday", "hour": 10, "subject": "Web Development" }
        ]
        `;

        const schedule = await callGeminiJSON({
            feature: 'arctable',
            prompt,
        });

        return NextResponse.json({ schedule });
    } catch (error: any) {
        console.error('[Timetable Generation] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
