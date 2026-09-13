export const ReactorService = {
    uploadFile: async (file) => {
        // Simulate upload progress
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    fileId: "doc_" + Math.random().toString(36).substr(2, 9),
                    analysis: {
                        topic: "Biology",
                        complexity: "High",
                        suggestedQuizzes: 3
                    }
                });
            }, 2000);
        });
    },

    generateQuiz: async (fileId) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [
            {
                id: 1,
                question: "What is the powerhouse of the cell?",
                options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
                correctAnswer: 1,
                explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions."
            },
            {
                id: 2,
                question: "Which process divides a cell into two daughter cells?",
                options: ["Meiosis", "Mitosis", "Osmosis", "Diffusion"],
                correctAnswer: 1,
                explanation: "Mitosis is a part of the cell cycle when replicated chromosomes are separated into two new nuclei."
            },
            {
                id: 3,
                question: "DNA stands for?",
                options: ["Deoxyribonucleic Acid", "Deoxyribogenetic Acid", "Dinucleic Acid", "None of the above"],
                correctAnswer: 0,
                explanation: "DNA is the molecule that carries genetic information for the development and functioning of an organism."
            }
        ];
    }
};
