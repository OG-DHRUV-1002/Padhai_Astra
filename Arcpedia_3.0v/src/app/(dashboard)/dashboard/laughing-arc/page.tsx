'use client';

import React, { useState } from 'react';
import PageHeader from "@/components/dashboard/page-header";
import { logActivity } from "@/lib/activity-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Sparkles, RefreshCw, Mic, Ghost, Book, Code, User, Play, Copy, Check, History, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const JOKE_STYLES = [
    { id: "Stand-up", label: "Stand-up", icon: Mic, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "Dad Joke", label: "Dad Joke", icon: User, color: "text-green-500", bg: "bg-green-500/10" },
    { id: "Programmer", label: "Programmer", icon: Code, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "Dark Humor", label: "Dark(ish)", icon: Ghost, color: "text-gray-500", bg: "bg-gray-500/10" },
    { id: "Academic", label: "Academic", icon: Book, color: "text-orange-500", bg: "bg-orange-500/10" },
];

const TOPICS = [
    "Software Engineering", "College Life", "Exams", "Coffee", "Relationships", "AI", "Debugging", "Monday Mornings"
];

export default function LaughingArcPage() {
    const [selectedStyle, setSelectedStyle] = useState(JOKE_STYLES[0]);
    const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
    const [currentJoke, setCurrentJoke] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jokeHistory, setJokeHistory] = useState<{ joke: string; style: string; topic: string }[]>([]);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const generateJoke = async () => {
        setIsLoading(true);
        setError(null);
        setCurrentJoke(null); // Reset for animation

        try {
            const response = await fetch('/api/laughing-arc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: selectedTopic, style: selectedStyle.id })
            });

            if (!response.ok) throw new Error("Failed to crack a joke");

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setCurrentJoke(data.joke);
            // Add to history (keep last 8)
            setJokeHistory(prev => [{ joke: data.joke, style: selectedStyle.id, topic: selectedTopic }, ...prev].slice(0, 8));
            // Log activity
            logActivity({
                type: "joke_generated",
                title: selectedTopic,
                detail: `${selectedStyle.id} joke about ${selectedTopic}`,
            });
        } catch (err) {
            setError("The comedian is having stage fright. Try again!");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8">
            <div className="text-center mb-8">
                <PageHeader
                    title="Laughing Arc"
                    description="Your personal AI comedian. Select a vibe, pick a topic, and get ready to laugh (or groan)."
                />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Controls */}
                <Card className="col-span-1 border-white/10 dark:border-white/10 border-indigo-200/50 bg-white/60 dark:bg-white/5 backdrop-blur-md h-fit">
                    <CardContent className="p-6 space-y-6">
                        {/* Styles */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comedy Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                {JOKE_STYLES.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border",
                                            selectedStyle.id === style.id
                                                ? cn("bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-300", style.bg)
                                                : "bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-muted-foreground"
                                        )}
                                    >
                                        <style.icon className={cn("h-5 w-5", selectedStyle.id === style.id ? style.color : "")} />
                                        <span className="text-xs font-medium">{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topics */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topic</label>
                            <select
                                className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                            >
                                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <Button
                            onClick={generateJoke}
                            disabled={isLoading}
                            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="h-5 w-5 mr-2" />
                            )}
                            {isLoading ? "Cooking up logic..." : "Hit Me!"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Stage */}
                <div className="col-span-1 md:col-span-2 min-h-[400px]">
                    <div className="relative h-full w-full bg-gradient-to-br from-indigo-100/80 dark:from-indigo-900/50 to-purple-100/80 dark:to-purple-900/50 rounded-3xl border border-slate-200 dark:border-white/10 p-8 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden">
                        {/* Spotlight Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/5 blur-[100px] -z-10 pointer-events-none"></div>

                        <AnimatePresence mode='wait'>
                            {currentJoke ? (
                                <motion.div
                                    key="joke"
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="relative z-10 max-w-lg"
                                >
                                    <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <Smile className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed tracking-tight">
                                        "{currentJoke}"
                                    </h2>
                                    <div className="mt-8 flex justify-center gap-3">
                                        <div className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground text-sm">
                                            Generated by AI &middot; {selectedStyle.label}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentJoke || '');
                                                setCopiedId(-1);
                                                setTimeout(() => setCopiedId(null), 2000);
                                            }}
                                            className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground text-sm hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors flex items-center gap-1.5"
                                        >
                                            {copiedId === -1 ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            {copiedId === -1 ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-muted-foreground flex flex-col items-center"
                                >
                                    <div className="w-20 h-20 mb-4 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <Mic className="h-8 w-8" />
                                    </div>
                                    <p className="text-lg font-medium">The stage is empty.</p>
                                    <p className="text-sm">Select a style and hit the button!</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-200 px-4 py-2 rounded-lg text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Joke History */}
            {jokeHistory.length > 0 && (
                <div className="w-full mt-8">
                    <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Joke History</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-muted-foreground">{jokeHistory.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {jokeHistory.map((entry, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 group hover:border-indigo-300 dark:hover:border-white/20 transition-colors"
                            >
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Smile className="h-4 w-4 text-pink-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground line-clamp-2">{entry.joke}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{entry.style} · {entry.topic}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(entry.joke);
                                        setCopiedId(idx);
                                        setTimeout(() => setCopiedId(null), 2000);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-indigo-500/10"
                                    title="Copy joke"
                                >
                                    {copiedId === idx ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
