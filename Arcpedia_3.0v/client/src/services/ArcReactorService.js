
// Helper to generate generic fallback questions if API fails
const generateGenericQuestions = (subjectName) => {
    return Array.from({ length: 10 }, (_, i) => ({
        question: `Sample Question ${i + 1} for ${subjectName}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswerIndex: 0,
        explanation: "This is a placeholder explanation for the correct answer."
    }));
};

export const ArcReactorService = {
    getSubjectQuiz: async (subjectName) => {
        try {
            const response = await fetch('/api/arc-reactor/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: subjectName })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
                // Ensure we always return exactly 10 questions
                const questions = data.quiz.slice(0, 10);
                if (questions.length < 10) {
                    const needed = 10 - questions.length;
                    return [...questions, ...generateGenericQuestions(subjectName).slice(0, needed)];
                }
                return questions;
            }

            throw new Error('Invalid quiz data from API');
        } catch (error) {
            console.error('[ArcReactorService] API quiz generation failed, using fallback:', error);
            // Fallback to generic questions
            return generateGenericQuestions(subjectName);
        }
    }
};
