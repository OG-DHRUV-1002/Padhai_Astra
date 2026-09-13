'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, ChevronRight, BookOpen, AlertCircle, Loader2, Sparkles, RefreshCcw, BrainCircuit, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArcBookLMPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState<any[] | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please upload a file first.');
            return;
        }

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/arc-book-lm', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');

            setQuizData(data.quiz);
            setCurrentQuestion(0);
            setScore(0);
            setShowResult(false);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to analyze document.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (isAnswered || !quizData) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === quizData[currentQuestion].correctIndex) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
        if (!quizData) return;
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(c => c + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    const reset = () => {
        setFile(null);
        setQuizData(null);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setShowResult(false);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] relative gap-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/quizzes')}
                        className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground flex items-center gap-3">
                            Arc Book - LM
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase tracking-wider">Beta</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">AI-Powered Notebook & Quiz Generator</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative min-h-[600px]">

                <AnimatePresence mode='wait'>
                    {!quizData ? (
                        // UPLOAD STATE
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center h-full relative"
                        >
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                            </div>

                            <div className="max-w-xl w-full relative z-10">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-10"
                                >
                                    <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-6 ring-1 ring-white/10 shadow-lg shadow-indigo-500/10">
                                        <BookOpen className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <h2 className="text-4xl font-headline font-bold text-foreground mb-4 tracking-tight">
                                        Feed the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 animate-gradient">Core</span>
                                    </h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Upload your lecture notes (PDF/TXT) to instantly generate a deep-dive revision quiz powered by Gemini 2.5.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="relative group w-full"
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={clsx(
                                            "block w-full border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer relative overflow-hidden group",
                                            file
                                                ? "border-emerald-500/50 bg-emerald-500/5"
                                                : "border-slate-300 dark:border-white/10 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-4 relative z-10">
                                            {file ? (
                                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-indigo-500/20 transition-colors flex items-center justify-center">
                                                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <span className={clsx("text-lg font-medium transition-colors", file ? "text-emerald-400" : "text-foreground group-hover:text-white")}>
                                                    {file ? file.name : "Drop PDF or Click to Browse"}
                                                </span>
                                                {!file && <span className="text-sm text-muted-foreground mt-2">Supported: PDF, TXT (Max 10MB)</span>}
                                            </div>
                                        </div>
                                    </label>
                                </motion.div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl"
                                    >
                                        <AlertCircle size={16} />
                                        {error}
                                    </motion.div>
                                )}

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    onClick={handleUpload}
                                    disabled={!file || isLoading}
                                    className="mt-8 w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Reading Neural Patterns...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 fill-white" />
                                            Generate Smart Quiz
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : !showResult ? (
                        // QUIZ STATE
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col md:flex-row h-full overflow-hidden"
                        >
                            {/* Left: Progress & Status (Sidebar on Desktop) */}
                            <div className="md:w-72 bg-slate-50/50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between shrink-0">
                                <div>
                                    <div className="mb-8">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress</span>
                                        <div className="flex items-end gap-2 mt-2">
                                            <span className="text-5xl font-light text-foreground">{currentQuestion + 1}</span>
                                            <span className="text-xl text-muted-foreground mb-1.5">/ {quizData.length}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Current Score</span>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                <CheckCircle size={20} className="text-emerald-400" />
                                            </div>
                                            <span className="text-3xl font-bold text-foreground">{score}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Question Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-white/10">

                                <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-center">
                                    <motion.h3
                                        key={currentQuestion}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-2xl md:text-3xl font-medium text-foreground mb-8 leading-relaxed"
                                    >
                                        {quizData[currentQuestion].question}
                                    </motion.h3>

                                    <div className="grid gap-4">
                                        {quizData[currentQuestion].options.map((option: string, idx: number) => {
                                            const isCorrect = idx === quizData[currentQuestion].correctIndex;
                                            const isSelected = selectedOption === idx;

                                            // Dynamic Colors logic
                                            let containerClass = "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/20";
                                            let textClass = "text-muted-foreground group-hover:text-foreground";
                                            let icon = null;

                                            if (isAnswered) {
                                                if (isCorrect) {
                                                    containerClass = "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50";
                                                    textClass = "text-emerald-700 dark:text-emerald-200 font-medium";
                                                    icon = <CheckCircle className="text-emerald-400 w-5 h-5" />;
                                                } else if (isSelected) {
                                                    containerClass = "bg-red-500/10 border-red-500/50 ring-1 ring-red-500/50";
                                                    textClass = "text-red-700 dark:text-red-200 font-medium";
                                                    icon = <XCircle className="text-red-400 w-5 h-5" />;
                                                } else {
                                                    containerClass = "opacity-50 blur-[1px]";
                                                }
                                            }

                                            return (
                                                <motion.button
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={isAnswered}
                                                    className={clsx(
                                                        "w-full text-left p-6 rounded-xl border transition-all flex items-center justify-between group relative overflow-hidden",
                                                        containerClass
                                                    )}
                                                >
                                                    <span className={clsx("flex-1 text-lg relative z-10", textClass)}>{option}</span>
                                                    {icon}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation Card */}
                                    <AnimatePresence>
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-10 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
                                                    <div className="flex items-start gap-4 relative z-10">
                                                        <div className="p-2 bg-primary/20 rounded-lg shrink-0">
                                                            <Sparkles className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-primary block mb-1 text-sm uppercase tracking-wide">AI Insight</span>
                                                            <p className="text-foreground/90 leading-relaxed text-lg">
                                                                {quizData[currentQuestion].explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-10 flex justify-end h-14">
                                        {isAnswered && (
                                            <motion.button
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={handleNext}
                                                className="px-8 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2 shadow-lg shadow-white/10"
                                            >
                                                {currentQuestion === quizData.length - 1 ? "Finish Quiz" : "Next Question"}
                                                <ChevronRight size={18} />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // RESULT STATE
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 text-center relative"
                        >
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"></div>
                            </div>

                            <div className="max-w-md w-full relative z-10">
                                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 backdrop-blur-md shadow-2xl">
                                    <div className="w-32 h-32 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/25 ring-4 ring-white/10">
                                        <span className="text-4xl font-bold text-white">{Math.round((score / quizData.length) * 100)}%</span>
                                    </div>

                                    <h2 className="text-3xl font-headline font-bold text-foreground mb-2">Session Complete</h2>
                                    <p className="text-muted-foreground mb-8">
                                        You mastered {score} out of {quizData.length} concepts from your document.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Correct</span>
                                            <span className="block text-2xl font-bold text-emerald-400 mt-1">{score}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Incorrect</span>
                                            <span className="block text-2xl font-bold text-red-400 mt-1">{quizData.length - score}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8 relative z-10">
                                <button
                                    onClick={reset}
                                    className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 hover:scale-[1.05] transition-all flex items-center gap-2 shadow-xl shadow-white/5"
                                >
                                    <RefreshCcw size={18} />
                                    Analyze New Document
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
