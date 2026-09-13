import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const COURSES = [
    { name: "Object Oriented Programming", professor: "Prof. Naina Vaidya" },
    { name: "Database Management System", professor: "Prof. Suchita Mandhare" },
    { name: "Data Structure and Algorithm using C", professor: "Prof. Vidya Sagvekar" },
    { name: "Applied Mathematics in Engineering", professor: "Prof. Prajakta Jadhav" },
    { name: "Discrete Structure for Data Science", professor: "Prof. Pankaj Deshmukh" },
    { name: "Web Development", professor: "Prof. Monali Deshpande" },
    { name: "Design and Analysis of Algorithm", professor: "Prof. Pravin Patil" },
    { name: "Core Java", professor: "Prof. Shriniwasan Aacharya" },
    { name: "Python Programming", professor: "Prof. Sunita Yadav" },
    { name: "Operating System & Linux", professor: "Prof. Ananaya Rao" }
];

export async function GET() {
    try {
        const seed = Math.floor(Math.random() * 99999);

        const prompt = `You are a backend data generator for a student progress tracker called Arcpedia.
Random seed: ${seed}

You need to generate realistic syllabus progress data for a third-year Computer Science student across these courses:
${COURSES.map(c => `- ${c.name} (${c.professor})`).join('\n')}

For EACH course, generate 6 unit names (specific to that course's actual syllabus content) and a realistic completion status.
Some courses should be nearly complete, some in progress, and some barely started — vary them realistically.

Return ONLY a raw JSON array (no markdown):
[
  {
    "courseName": "Course Name",
    "professor": "Prof. Name",
    "units": [
      { "name": "Unit 1: Specific Topic Name", "isCompleted": true },
      { "name": "Unit 2: Another Topic", "isCompleted": true },
      { "name": "Unit 3: Topic", "isCompleted": false },
      { "name": "Unit 4: Topic", "isCompleted": false },
      { "name": "Unit 5: Topic", "isCompleted": false },
      { "name": "Unit 6: Topic", "isCompleted": false }
    ],
    "completedUnitsCount": 2,
    "progressPercentage": 33
  }
]

IMPORTANT:
- Use ACTUAL syllabus topics (not generic names) for each course
- completedUnitsCount must match the number of units with isCompleted=true
- progressPercentage = round((completedUnitsCount / 6) * 100)
- Include ALL 10 courses
- Use the EXACT professor names provided above`;

        const data = await callGeminiJSON({
            feature: 'progress',
            prompt,
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Progress Generate] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
