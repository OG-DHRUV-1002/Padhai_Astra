import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, ChevronRight, BookOpen, AlertCircle, Loader2, Sparkles, RefreshCcw, BrainCircuit, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ArcBookLM = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
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

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to analyze document.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === quizData[currentQuestion].correctIndex) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
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
        <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/arc-reactor')}
                            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 flex items-center gap-3">
                                <BookOpen className="text-blue-400" size={24} />
                                Arc Book - LM
                            </h1>
                            <span className="text-xs text-slate-400 tracking-wide uppercase">Neural Notebook Clone</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[calc(100vh-140px)]">

                    <AnimatePresence mode='wait'>
                        {!quizData ? (
                            // UPLOAD STATE
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center h-full"
                            >
                                <div className="max-w-2xl w-full">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="mb-10"
                                    >
                                        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-6 ring-1 ring-white/10">
                                            <BrainCircuit className="w-12 h-12 text-indigo-400" />
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                            Feed the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Core</span>
                                        </h2>
                                        <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto">
                                            Upload your lecture notes (PDF/TXT) to instantly generate a deep-dive revision quiz powered by Gemini 2.5.
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="relative group max-w-xl mx-auto"
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
                                                "block w-full border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer relative overflow-hidden",
                                                file
                                                    ? "border-emerald-500/50 bg-emerald-500/10"
                                                    : "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50"
                                            )}
                                        >
                                            <div className="flex flex-col items-center gap-4 relative z-10">
                                                {file ? (
                                                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                                                ) : (
                                                    <Upload className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                                )}

                                                <div className="flex flex-col">
                                                    <span className={clsx("text-lg font-medium transition-colors", file ? "text-emerald-300" : "text-slate-300 group-hover:text-white")}>
                                                        {file ? file.name : "Drop PDF or Click to Browse"}
                                                    </span>
                                                    {!file && <span className="text-sm text-slate-500">Supported: PDF, TXT (Max 10MB)</span>}
                                                </div>
                                            </div>
                                        </label>
                                    </motion.div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl max-w-xl mx-auto"
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
                                        className="mt-8 px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 w-full max-w-xl mx-auto"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                Processing Neural Data...
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
                                <div className="md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
                                    <div>
                                        <div className="mb-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                                            <div className="flex items-end gap-2 mt-1">
                                                <span className="text-4xl font-light text-white">{currentQuestion + 1}</span>
                                                <span className="text-lg text-slate-500 mb-1">/ {quizData.length}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                                    style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Current Score</span>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <CheckCircle size={18} className="text-emerald-400" />
                                                </div>
                                                <span className="text-2xl font-bold text-white">{score}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Question Area */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">

                                    <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-center">
                                        <motion.h3
                                            key={currentQuestion}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-2xl md:text-3xl font-medium text-white mb-8 leading-relaxed"
                                        >
                                            {quizData[currentQuestion].question}
                                        </motion.h3>

                                        <div className="grid gap-3">
                                            {quizData[currentQuestion].options.map((option, idx) => {
                                                const isCorrect = idx === quizData[currentQuestion].correctIndex;
                                                const isSelected = selectedOption === idx;

                                                // Dynamic Colors logic
                                                let containerClass = "bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-white/20";
                                                let textClass = "text-slate-300";
                                                let icon = null;

                                                if (isAnswered) {
                                                    if (isCorrect) {
                                                        containerClass = "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50";
                                                        textClass = "text-emerald-200 font-medium";
                                                        icon = <CheckCircle className="text-emerald-400 w-5 h-5" />;
                                                    } else if (isSelected) {
                                                        containerClass = "bg-red-500/10 border-red-500/50 ring-1 ring-red-500/50";
                                                        textClass = "text-red-200 font-medium";
                                                        icon = <XCircle className="text-red-400 w-5 h-5" />;
                                                    } else {
                                                        containerClass = "bg-slate-900/20 border-white/5 opacity-50";
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
                                                            "w-full text-left p-6 rounded-xl border transition-all flex items-center justify-between group",
                                                            containerClass
                                                        )}
                                                    >
                                                        <span className={clsx("flex-1 text-lg", textClass)}>{option}</span>
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
                                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
                                                        <div className="flex items-start gap-3">
                                                            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                                                            <div>
                                                                <span className="font-bold text-indigo-300 block mb-1 text-sm uppercase tracking-wide">AI Insight</span>
                                                                <p className="text-indigo-100/90 leading-relaxed">
                                                                    {quizData[currentQuestion].explanation}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="mt-8 flex justify-end h-14">
                                            {isAnswered && (
                                                <motion.button
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    onClick={handleNext}
                                                    className="px-8 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2"
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
                                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="max-w-md w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-1 rounded-3xl shadow-2xl relative overflow-hidden mb-10">
                                    <div className="bg-slate-900/90 rounded-[22px] p-8 backdrop-blur-sm h-full">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                                            <span className="text-3xl font-bold">{Math.round((score / quizData.length) * 100)}%</span>
                                        </div>

                                        <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
                                        <p className="text-slate-400 mb-6">
                                            You mastered {score} out of {quizData.length} concepts from your document.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                                <span className="text-xs text-slate-500 uppercase">Correct</span>
                                                <span className="block text-xl font-bold text-emerald-400">{score}</span>
                                            </div>
                                            <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                                <span className="text-xs text-slate-500 uppercase">Incorrect</span>
                                                <span className="block text-xl font-bold text-red-400">{quizData.length - score}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={reset}
                                        className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 hover:scale-[1.02] transition-all flex items-center gap-2"
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
        </div>
    );
};

export default ArcBookLM;
