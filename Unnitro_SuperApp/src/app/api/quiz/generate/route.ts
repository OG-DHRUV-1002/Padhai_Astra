import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';

const MOCK_FALLBACK_QUIZ = [
    {
        question: "Which principle of OOP allows a child class to inherit properties from a parent?",
        options: ["Polymorphism", "Encapsulation", "Inheritance", "Abstraction"],
        correct: 2,
        explanation: "Inheritance is the mechanism where a new class derives properties and characteristics from an existing class."
    },
    {
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(n^2)", "O(log n)", "O(1)"],
        correct: 2,
        explanation: "Binary search divides the search interval in half essentially at every step, making it O(log n)."
    },
    {
        question: "In React, what hook is used to handle side effects?",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correct: 1,
        explanation: "useEffect is designed to handle side effects like data fetching, subscriptions, or manually changing the DOM."
    },
    {
        question: "What does SQL stand for?",
        options: ["Structured Query Language", "Simple Query List", "Standard Question Logic", "System Query Layer"],
        correct: 0,
        explanation: "SQL stands for Structured Query Language, used for managing data in relational database management systems."
    },
    {
        question: "Which OSI layer is responsible for routing?",
        options: ["Physical", "Data Link", "Network", "Transport"],
        correct: 2,
        explanation: "The Network layer (Layer 3) handles routing and forwarding data packets."
    },
    {
        question: "What is a 'deadlock' in an operating system?",
        options: ["System shutdown", "Two processes waiting for each other indefinitely", "Memory leak", "CPU idle time"],
        correct: 1,
        explanation: "Deadlock occurs when two or more processes are blocked forever, each waiting on the other."
    },
    {
        question: "Which of these is NOT a solid state drive form factor?",
        options: ["M.2", "2.5 inch", "3.5 inch", "mSATA"],
        correct: 2,
        explanation: "3.5 inch is typically a hard disk drive (HDD) form factor."
    },
    {
        question: "What is the purpose of DNS?",
        options: ["Encrypt data", "Assign IP addresses", "Translate domain names to IPs", "Filter packets"],
        correct: 2,
        explanation: "DNS (Domain Name System) translates human-readable domain names to machine-readable IP addresses."
    },
    {
        question: "In Python, which keyword defines a function?",
        options: ["func", "def", "function", "lambda"],
        correct: 1,
        explanation: "Python uses the 'def' keyword to define a standard function."
    },
    {
        question: "What is the main goal of Agile methodology?",
        options: ["Comprehensive documentation", "Contract negotiation", "Rigid planning", "Iterative development and customer feedback"],
        correct: 3,
        explanation: "Agile prioritizes iterative delivery, flexibility, and customer collaboration over rigid plans."
    }
];

export async function POST(request: Request) {
    try {
        const { subject } = await request.json();
        console.log(`[Quiz API] Generating for: ${subject}`);

        const seed = Math.floor(Math.random() * 99999);

        const prompt = `Generate a dynamic multiple-choice quiz (MCQ) for the subject: "${subject}".
        Random seed for uniqueness: ${seed}
        - Create exactly 10 questions.
        - Difficulty: Mix of easy, moderate, and hard.
        - Questions must be UNIQUE and DIFFERENT each time.
        - Return ONLY raw JSON. No markdown.
        - Format: 
        [
          {
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correct": 0,
            "explanation": "Explanation here"
          }
        ]`;

        try {
            const quiz = await callGeminiJSON({
                feature: 'reactor',
                prompt,
            });

            if (Array.isArray(quiz) && quiz.length > 0) {
                return NextResponse.json({ quiz });
            }
        } catch (aiError) {
            console.error('[Quiz API] AI generation failed:', aiError);
        }

        console.warn('[Quiz API] Using fallback quiz data.');
        return NextResponse.json({ quiz: MOCK_FALLBACK_QUIZ });

    } catch (error: any) {
        console.error('[Quiz API] Critical Failure:', error);
        return NextResponse.json({ quiz: MOCK_FALLBACK_QUIZ });
    }
}
