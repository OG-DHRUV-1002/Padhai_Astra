import React, { useState } from 'react';
import {
    Book,
    DataObject,
    AccountTree,
    Functions,
    Code,
    Memory,
    Architecture,
    Public,
    ArrowBack,
    Check,
    CheckCircle,
    Cancel
} from '@mui/icons-material'; // Using MUI icons to match "Icons.Material.Filled"
// Note: We'll use lucide-react alternatives if MUI isn't installed, but let's try mapping standard lucide first for consistency with other files
// Actually, user's previous files used Lucide. The Blazor code used MudBlazor icons. 
// I will map them to Lucide equivalents for a consistent React codebase, or standard SVGs/Mui if preferred.
// Let's use Lucide as it's already in the project.

import {
    BookOpen,
    Database,
    Share2,
    Calculator,
    Terminal,
    Cpu,
    LayoutTemplate,
    Globe,
    ArrowLeft,
    Check as CheckIcon,
    XCircle,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { ArcReactorService } from '../services/ArcReactorService';

const SUBJECTS = [
    { name: "Object Oriented Programming", professor: "Naina Vaidya", icon: Database, glowColor: "from-pink-500 to-violet-500", color: "#ec4899" },
    { name: "Data Structure and Algorithm", professor: "Vidya Sagvekar", icon: Share2, glowColor: "from-blue-500 to-cyan-500", color: "#3b82f6" },
    { name: "Discrete Structure", professor: "Pankaj Deshmukh", icon: Calculator, glowColor: "from-amber-500 to-red-500", color: "#f59e0b" },
    { name: "Python Programming", professor: "Sunita Yadav", icon: Terminal, glowColor: "from-green-500 to-teal-500", color: "#22c55e" },
    { name: "Embedded Systems & IOT", professor: "Marielia Assumption", icon: Cpu, glowColor: "from-indigo-500 to-purple-500", color: "#6366f1" },
    { name: "Software Engineering", professor: "Monali Deshpande", icon: LayoutTemplate, glowColor: "from-red-500 to-rose-600", color: "#ef4444" },
    { name: "Environmental Sciences", professor: "Ashmita Jadhav", icon: Globe, glowColor: "from-lime-500 to-green-500", color: "#84cc16" }
];

const ArcReactor = () => {
    const [mode, setMode] = useState('dashboard'); // dashboard, quiz, results
    const [activeSubject, setActiveSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { 0: 1, 1: 3 } -> QuestionIndex: OptionIndex
    const [score, setScore] = useState(0);

    const startQuiz = async (subject) => {
        setActiveSubject(subject);
        setMode('quiz');
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuestions([]);
        try {
            const quizData = await ArcReactorService.getSubjectQuiz(subject.name);
            setQuestions(quizData);
        } catch (err) {
            console.error('Failed to load quiz:', err);
        }
    };

    const handleAnswerSelect = (optionIndex) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const submitQuiz = () => {
        let calculatedScore = 0;
        questions.forEach((q, index) => {
            if (userAnswers[index] === q.correctAnswerIndex) {
                calculatedScore++;
            }
        });
        setScore(calculatedScore);
        setMode('results');
    };

    const getScoreConfig = () => {
        if (score >= 9) return { color: "from-green-400 to-emerald-600", msg: "REACTOR CRITICAL! MAXIMUM POWER!" };
        if (score >= 7) return { color: "from-cyan-400 to-blue-600", msg: "System Stable. High Output." };
        if (score >= 5) return { color: "from-yellow-400 to-orange-600", msg: "Operating within Normal Parameters." };
        return { color: "from-red-400 to-pink-600", msg: "Core Unstable. Review Protocols." };
    };

    const navigate = React.useRouter ? React.useRouter() : null; // Checking for Next.js vs React Router
    // Since we are using react-router-dom in this project based on imports:
    const routerNavigate = require('react-router-dom').useNavigate();

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500">
            {/* New Arc Book LM Card */}
            <div className="group relative transition-all duration-300 hover:-translate-y-2 col-span-1 md:col-span-2 lg:col-span-2">
                <div className="absolute -inset-1 rounded-xl opacity-25 group-hover:opacity-100 blur transition duration-500 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="relative h-full rounded-xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 hover:border-indigo-400 transition-colors p-8 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg">
                                <BookOpen size={32} className="text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white leading-tight">Arc Book - LM</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-indigo-500/30 rounded text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                                        AI POWERED
                                    </span>
                                    <span className="text-xs text-indigo-300/80">NotebookLM Clone</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                            Upload your lecture notes (PDF/TXT) and let our AI generate custom revision quizzes for you instantly. The ultimate self-study tool.
                        </p>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={() => routerNavigate('/arc-book-lm')}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            LAUNCH NEURAL NOTEBOOK
                        </button>
                    </div>
                </div>
            </div>

            {SUBJECTS.map((subject, idx) => (
                <div key={idx} className="group relative transition-all duration-300 hover:-translate-y-2">
                    <div className={`absolute -inset-1 rounded-xl opacity-25 group-hover:opacity-100 blur transition duration-500 bg-gradient-to-r ${subject.glowColor}`}></div>
                    <div className="relative h-full rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 transition-colors p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <subject.icon size={32} style={{ color: subject.color }} />
                            <span className="px-2 py-1 bg-slate-700/50 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                REVISION
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-100 mb-1 leading-tight">{subject.name}</h3>
                        <p className="text-xs text-slate-400 mb-6">Prof. {subject.professor}</p>

                        <div className="mt-auto">
                            <button
                                onClick={() => startQuiz(subject)}
                                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                IGNITE CORE
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderQuiz = () => {
        const question = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="max-w-3xl mx-auto animate-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setMode('dashboard')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Core
                    </button>
                    <span className="text-cyan-400 font-bold">{activeSubject?.name}</span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="h-1 bg-slate-700 absolute top-0 left-0 w-full">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <h2 className="text-2xl font-bold text-slate-100 mt-2 leading-relaxed">
                                {question.question}
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {question.options.map((option, idx) => {
                                const isSelected = userAnswers[currentQuestionIndex] === idx;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleAnswerSelect(idx)}
                                        className={clsx(
                                            "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 group",
                                            isSelected
                                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-100"
                                                : "bg-slate-700/30 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-500 group-hover:border-slate-400"
                                        )}>
                                            {isSelected && <CheckIcon size={14} className="text-slate-900" strokeWidth={3} />}
                                        </div>
                                        <span className="font-medium">{option}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-between pt-4 border-t border-slate-700">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={submitQuiz}
                                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    Submit Core
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResults = () => {
        const scoreConfig = getScoreConfig();

        return (
            <div className="max-w-3xl mx-auto animate-in zoom-in duration-300">
                <div className="rounded-2xl bg-slate-800/90 border border-slate-700 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-10 text-center border-b border-slate-700">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Reactor Status</span>
                        <div className={`text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${scoreConfig.color} my-4`}>
                            {score}/{questions.length}
                        </div>
                        <p className="text-xl text-slate-300 font-medium">{scoreConfig.msg}</p>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {questions.map((q, idx) => {
                            const userAnswer = userAnswers[idx];
                            const isCorrect = userAnswer === q.correctAnswerIndex;

                            return (
                                <div key={idx} className="p-6 border-b border-slate-700/50 hover:bg-slate-700/10 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {isCorrect ? (
                                            <CheckCircle2 size={24} className="text-emerald-500 mt-1 shrink-0" />
                                        ) : (
                                            <XCircle size={24} className="text-red-500 mt-1 shrink-0" />
                                        )}
                                        <div>
                                            <h4 className="font-bold text-slate-200 mb-3 leading-snug">{q.question}</h4>

                                            <div className="space-y-2 text-sm mb-4">
                                                <div className={isCorrect ? "text-emerald-400" : "text-red-400"}>
                                                    <span className="opacity-70 mr-2">Your Answer:</span>
                                                    <span className="font-bold">
                                                        {userAnswer !== undefined ? q.options[userAnswer] : "Skipped"}
                                                    </span>
                                                </div>
                                                {!isCorrect && (
                                                    <div className="text-emerald-400">
                                                        <span className="opacity-70 mr-2">Correct Answer:</span>
                                                        <span className="font-bold">{q.options[q.correctAnswerIndex]}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                                <span className="font-bold text-cyan-500 block mb-1">Explanation:</span>
                                                <span className="text-slate-400 leading-relaxed">{q.explanation}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-slate-800 border-t border-slate-700 text-center">
                        <button
                            onClick={() => setMode('dashboard')}
                            className="w-full py-3 rounded-xl border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/10 transition-all uppercase tracking-wide"
                        >
                            Initialize New Core
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-4 md:px-8">
            <div className="mb-8 animate-in fade-in duration-700">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                    ARC REACTOR
                </h1>
                <p className="text-slate-400 text-lg">
                    Last Minute Revision Core. Initialize a subject to start the sequence.
                </p>
            </div>

            {mode === 'dashboard' && renderDashboard()}
            {mode === 'quiz' && renderQuiz()}
            {mode === 'results' && renderResults()}
        </div>
    );
};

export default ArcReactor;
