"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, CheckCircle, Clock, XCircle, ArrowRight, RefreshCw, AlertCircle, RotateCcw, Trophy, Zap, Sparkles, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_SUBJECTS, Subject } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useExam } from "@/context/exam-context";
import { logActivity } from "@/lib/activity-store";

// --- Types ---
interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

type ViewState = "selection" | "loading" | "quiz" | "result";

export default function ArcReactorPage() {
  const [view, setView] = useState<ViewState>("selection");
  const [activeSubjects, setActiveSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [quizData, setQuizData] = useState<Question[]>([]);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]); // Array of indices
  const [score, setScore] = useState(0);

  // Exam Proctoring
  const { startExam, endExam, tabSwitchCount, maxTabSwitches, isExamActive, registerAutoSubmit } = useExam();



  // Initial Load: Random 10 Subjects
  useEffect(() => {
    shuffleSubjects();
  }, []);

  const shuffleSubjects = () => {
    const shuffled = [...ALL_SUBJECTS].sort(() => 0.5 - Math.random());
    setActiveSubjects(shuffled.slice(0, 10));
  };

  const startQuiz = async (subject: Subject) => {
    setSelectedSubject(subject);
    setView("loading");

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.name })
      });

      if (!response.ok) throw new Error("Failed to generate quiz");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setQuizData(data.quiz);
      setUserAnswers(new Array(10).fill(null));
      setCurrentQuestionIndex(0);
      setView("quiz");
      // Activate exam proctoring
      startExam(subject.name);
    } catch (error) {
      console.error(error);
      // Fallback is handled by API mostly, but just in case
      alert("Connection interrupted. Re-establishing link...");
      setView("selection");
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < 9) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = useCallback(() => {
    let calculatedScore = 0;
    quizData.forEach((q, i) => {
      if (userAnswers[i] === q.correct) calculatedScore++;
    });
    setScore(calculatedScore);
    setView("result");
    // End exam proctoring
    endExam("completed");
    // Log activity to Firebase
    logActivity({
      type: "quiz_complete",
      title: selectedSubject?.name || "Unknown Subject",
      detail: `Scored ${calculatedScore}/${quizData.length}`,
      score: calculatedScore,
      total: quizData.length,
    });
  }, [quizData, userAnswers, endExam, selectedSubject]);

  // Register auto-submit so ExamProvider can call it on 3rd tab violation
  useEffect(() => {
    registerAutoSubmit(submitQuiz);
    return () => registerAutoSubmit(null);
  }, [submitQuiz, registerAutoSubmit]);

  // --- RENDERERS ---

  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <div className="relative h-32 w-32 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-headline tracking-tight">Synthesizing Module</h2>
          <p className="text-muted-foreground font-medium animate-pulse">Generating neural pathways for {selectedSubject?.name}...</p>
        </div>
      </div>
    );
  }

  if (view === "result") {
    return (
      <div className="space-y-10 max-w-5xl mx-auto pb-20 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] bg-white/70 dark:bg-gradient-to-br dark:from-black/60 dark:to-black/40 border border-slate-200/50 dark:border-white/10 p-10 text-center shadow-2xl"
        >
          <div className="absolute top-0 left-0 -z-10 h-[500px] w-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] bg-purple-500/20 rounded-full blur-[120px] opacity-50"></div>

          <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter mb-2">Assessment Complete</h2>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm mb-10">Module: {selectedSubject?.name}</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            {/* Score Circle */}
            <div className="relative h-48 w-48 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-slate-200 dark:text-white/5 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                <motion.circle
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 10) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn("stroke-current", score >= 7 ? "text-emerald-400" : score >= 4 ? "text-amber-400" : "text-rose-400")}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                ></motion.circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={cn("text-5xl font-black font-headline bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50")}>
                  {score * 10}%
                </span>
              </div>
            </div>

            {/* Feedback Text */}
            <div className="text-left space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                {score >= 8 ? <Trophy className="h-8 w-8 text-yellow-400" /> : score >= 5 ? <Zap className="h-8 w-8 text-amber-400" /> : <RotateCcw className="h-8 w-8 text-rose-400" />}
                <h3 className="text-2xl font-bold text-foreground">
                  {score === 10 ? "Flawless Performance!" :
                    score >= 7 ? "Excellent Work!" :
                      score >= 4 ? "Good Effort!" : "Needs Improvement"}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {score >= 9 ? "You've demonstrated exceptional mastery of this subject. Your neural pathways are optimized." :
                  score >= 7 ? "You have a strong grasp of the core concepts. A little more polish and you'll be perfect." :
                    "You have some gaps in your understanding. Review the detailed analysis below to strengthen your knowledge base."}
              </p>
              <div className="flex gap-4 pt-2">
                <Button onClick={() => setView("selection")} variant="outline" className="rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">New Module</Button>
                <Button onClick={() => startQuiz(selectedSubject!)} className="rounded-xl bg-white text-black hover:bg-white/90 font-bold">Retry</Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-headline pl-2 border-l-4 border-primary ml-2">Detailed Neural Analysis</h3>
          <div className="grid gap-6">
            {quizData.map((q, i) => {
              const isCorrect = userAnswers[i] === q.correct;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className={cn(
                    "group rounded-2xl border p-6 transition-all duration-300",
                    isCorrect ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30" : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30"
                  )}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5",
                      isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    )}>
                      {i + 1}
                    </div>
                    <h4 className="font-bold text-lg leading-snug pt-0.5">
                      {q.question}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={cn(
                        "p-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between",
                        idx === q.correct ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" :
                          idx === userAnswers[i] && !isCorrect ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-300" :
                            "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-muted-foreground opacity-70"
                      )}>
                        <span>{opt}</span>
                        {idx === q.correct && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                        {idx === userAnswers[i] && !isCorrect && <XCircle className="h-4 w-4 text-rose-400" />}
                      </div>
                    ))}
                  </div>

                  {!isCorrect && (
                    <div className="mt-4 ml-12 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-1">Concept Insight</h5>
                        <p className="text-sm text-blue-700 dark:text-blue-200/80 leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === "quiz") {
    const currentQ = quizData[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / 10) * 100;

    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-center pb-10">
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-end px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Question {currentQuestionIndex + 1} / 10</span>
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">{selectedSubject?.name}</Badge>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            className="flex-grow flex flex-col relative"
          >
            {/* Decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

            <Card className="glass-dark border-white/10 flex-grow flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">
              <CardHeader className="p-8 md:p-10 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold leading-relaxed font-headline tracking-wide">{currentQ.question}</h2>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col justify-center p-8 md:p-10 pt-4">
                <div className="grid gap-3">
                  {currentQ.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-5 text-lg group relative overflow-hidden",
                        userAnswers[currentQuestionIndex] === idx
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/10 hover:translate-x-1"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                        userAnswers[currentQuestionIndex] === idx ? "bg-white text-primary border-white" : "bg-slate-100 dark:bg-black/20 border-slate-300 dark:border-white/20 text-muted-foreground group-hover:border-indigo-400 dark:group-hover:border-white/40"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium z-10 relative">{opt}</span>

                      {/* Selection Highlight EFX */}
                      {userAnswers[currentQuestionIndex] === idx && (
                        <motion.div layoutId="highlight" className="absolute inset-0 bg-white/10 z-0" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-200 dark:border-white/5 p-8 bg-slate-50/50 dark:bg-black/20">
                <Button
                  variant="ghost"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="text-muted-foreground hover:text-foreground font-bold"
                >
                  Previous
                </Button>

                {currentQuestionIndex === 9 ? (
                  <Button onClick={submitQuiz} size="lg" className="rounded-xl px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20">
                    Complete Assessment
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} size="lg" className="rounded-xl px-10 font-bold" disabled={userAnswers[currentQuestionIndex] === null}>
                    Next Question <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Default: Selection View
  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <div className="relative rounded-[2rem] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 p-10 md:p-14 border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>
        <div className="absolute right-0 top-0 h-[400px] w-[400px] bg-primary/30 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge className="bg-indigo-100 dark:bg-white/10 hover:bg-indigo-200 dark:hover:bg-white/20 text-indigo-700 dark:text-white border-none py-1.5 px-3 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-400" />
            AI Powered Assessment Engine
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">
            Arc Reactor
          </h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
            A dynamic examination environment that adapts to your curriculum.
            Select a module to synthesize a unique assessment pattern.
          </p>
          <div className="flex gap-4 pt-2">
            <Button onClick={shuffleSubjects} variant="outline" className="rounded-xl border-slate-300 dark:border-white/20 bg-white/60 dark:bg-black/20 text-foreground hover:bg-white dark:hover:bg-white/10 font-bold tracking-wide backdrop-blur-md">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cycle Modules
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {activeSubjects.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Card className="glass-card hover:bg-primary/5 hover:border-primary/50 group cursor-pointer transition-all duration-500 h-full flex flex-col overflow-hidden relative border-white/10" onClick={() => startQuiz(sub)}>
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>

                <CardHeader className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 dark:from-white/5 to-slate-200 dark:to-white/10 border border-slate-200 dark:border-white/5 group-hover:border-primary/30 group-hover:from-primary/20 group-hover:to-purple-500/20 flex items-center justify-center mb-4 transition-all duration-500 shadow-lg">
                    <BookOpen className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight min-h-[3rem]">
                    {sub.name}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium pt-1">
                    {sub.professor}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="mt-auto relative z-10 border-t border-white/5 pt-4">
                  <div className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Adaptive AI</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 10 Min</span>
                  </div>
                </CardFooter>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
