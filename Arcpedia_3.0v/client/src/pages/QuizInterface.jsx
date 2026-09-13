import React, { useState, useEffect } from 'react';
import { ReactorService } from '../services/ReactorService';
import { CheckCircle, XCircle, ChevronRight, RefreshCcw, Award } from 'lucide-react';
import clsx from 'clsx';
import { useStudent } from '../context/StudentContext';

const QuizInterface = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizComplete, setQuizComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const { updateXP } = useStudent();

    useEffect(() => {
        const loadQuiz = async () => {
            const data = await ReactorService.generateQuiz('mock_id');
            setQuestions(data);
            setLoading(false);
        };
        loadQuiz();
    }, []);

    const handleAnswer = (index) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);

        const isCorrect = index === questions[currentQuestion].correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
            updateXP(50);
        }
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setQuizComplete(true);
            updateXP(100); // Bonus for completion
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        </div>
    );

    if (quizComplete) return (
        <div className="max-w-2xl mx-auto text-center pt-10">
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-3xl p-10">
                <div className="h-24 w-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award size={48} className="text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
                <p className="text-slate-400 mb-8">You scored {score} out of {questions.length}</p>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                        <RefreshCcw size={18} />
                        Retry
                    </button>
                </div>
            </div>
        </div>
    );

    const question = questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-6 text-sm text-slate-400">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Score: {score}</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
                <div
                    className="h-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-8">{question.question}</h2>

                <div className="space-y-4">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={isAnswered}
                            className={clsx(
                                "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group",
                                isAnswered
                                    ? idx === question.correctAnswer
                                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                        : idx === selectedAnswer
                                            ? "bg-red-500/10 border-red-500/50 text-red-400"
                                            : "bg-white/5 border-transparent opacity-50"
                                    : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            <span className="font-medium text-lg">{option}</span>
                            {isAnswered && idx === question.correctAnswer && <CheckCircle size={20} />}
                            {isAnswered && idx === selectedAnswer && idx !== question.correctAnswer && <XCircle size={20} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Adaptive Feedback */}
            {isAnswered && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                        <h4 className="flex items-center gap-2 text-blue-400 font-semibold mb-2">
                            Explanation
                        </h4>
                        <p className="text-slate-300">{question.explanation}</p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={nextQuestion}
                            className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            {currentQuestion === questions.length - 1 ? "Finish" : "Next Question"}
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizInterface;
