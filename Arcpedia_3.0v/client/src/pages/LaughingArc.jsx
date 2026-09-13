import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { ArchiService } from '../services/ArchiService';
import clsx from 'clsx';

const LaughingArc = () => {
    const [jokeState, setJokeState] = useState({
        setup: "",
        punchline: "",
        fullText: "",
        topic: "",
        avatar: "🤖",
        isLoading: true,
        error: null
    });

    const TOPICS = ["Coding", "Exams", "Coffee", "Dating", "WiFi", "Parents", "Debugging", "Group Projects", "Internships", "Student Loans"];
    const AVATARS = ["🤖", "🤡", "🦄", "🐱", "👾", "🦊", "🐼", "👽"];

    const getRandomJoke = async () => {
        setJokeState(prev => ({ ...prev, isLoading: true, error: null, setup: "", punchline: "" }));

        try {
            const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
            const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

            const prompt = `Tell me a short, witty joke about ${randomTopic}. Make it relatable for a college student. strictly under 2 lines. Do not include markdown.`;

            // Call the simulated AI service
            const response = await ArchiService.getChatResponseAsync(prompt, []);

            let setup = "";
            let punchline = "";
            let fullText = response;

            // Simple parsing logic similar to the C# code
            if (!response) {
                fullText = "The AI is speechless (Empty Response).";
            } else if (response.includes('\n')) {
                const parts = response.split('\n').filter(line => line.trim() !== '');
                if (parts.length >= 2) {
                    setup = parts[0];
                    punchline = parts.slice(1).join(' ');
                } else {
                    fullText = response;
                }
            } else if (response.includes('?')) {
                const qIndex = response.indexOf('?');
                setup = response.substring(0, qIndex + 1);
                punchline = response.substring(qIndex + 1).trim();
            } else {
                fullText = response;
            }

            setJokeState({
                setup,
                punchline,
                fullText: setup && punchline ? "" : fullText,
                topic: randomTopic,
                avatar: randomAvatar,
                isLoading: false,
                error: null
            });

        } catch (err) {
            setJokeState(prev => ({
                ...prev,
                isLoading: false,
                error: "The comedian is having connection issues. Try again!"
            }));
        }
    };

    useEffect(() => {
        getRandomJoke();
    }, []);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">

            {/* Header */}
            <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500 mb-2 flex items-center justify-center gap-3">
                    <Zap className="text-yellow-400 fill-current" />
                    Laughing Arc
                </h1>
                <p className="text-slate-400 font-medium">Your AI Comedy Companion</p>
            </div>

            {/* Stage Card */}
            <div className="relative w-full max-w-2xl animate-in fade-in zoom-in duration-500">
                {/* Glass Effect Card */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-2xl min-h-[400px] flex flex-col">

                    {jokeState.isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-blue-400 font-bold animate-pulse">Consulting the Comedy Algorithms...</p>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12 flex flex-col items-center text-center flex-1">

                            {/* Avatar Header */}
                            <div className="bg-slate-700/50 p-1 rounded-full border border-slate-600 mb-6">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-5xl shadow-inner">
                                    {jokeState.avatar}
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full">
                                    Topic: {jokeState.topic}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 w-full max-w-lg space-y-6 flex flex-col justify-center">
                                {jokeState.error ? (
                                    <div className="text-red-400 font-bold bg-red-500/10 p-4 rounded-xl">
                                        {jokeState.error}
                                    </div>
                                ) : (
                                    <>
                                        {jokeState.setup && (
                                            <p className="text-2xl text-slate-300 font-light leading-relaxed">
                                                {jokeState.setup}
                                            </p>
                                        )}

                                        {(jokeState.punchline || jokeState.fullText) && (
                                            <p className={clsx(
                                                "text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-tight",
                                                jokeState.punchline && "animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200"
                                            )}>
                                                {jokeState.punchline || jokeState.fullText}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Divider with Glow */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent my-8 opacity-50"></div>

                            {/* Actions */}
                            <button
                                onClick={getRandomJoke}
                                className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Next Joke
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Background Decoration */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
            </div>
        </div>
    );
};

export default LaughingArc;
