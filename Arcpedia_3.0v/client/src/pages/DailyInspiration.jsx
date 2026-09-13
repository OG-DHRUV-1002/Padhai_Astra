import React, { useState, useEffect } from 'react';
import { useStudent } from '../context/StudentContext';
import quotesData from '../data/quotes.json';
import { Quote, Wind, Zap } from 'lucide-react';
import clsx from 'clsx';

const DailyInspiration = () => {
    const { vitals } = useStudent();
    const [mode, setMode] = useState('calm'); // 'calm' or 'hustle'
    const [currentQuote, setCurrentQuote] = useState(null);

    // Determine mode based on stress level
    useEffect(() => {
        if (vitals.stressLevel > 60) {
            setMode('calm');
        } else {
            setMode('hustle');
        }
    }, [vitals.stressLevel]);

    // Select random quote based on mode
    useEffect(() => {
        const relevantQuotes = quotesData.filter(q => q.category === mode);
        const random = relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)];
        setCurrentQuote(random);
    }, [mode]);

    const toggleMode = () => {
        setMode(prev => prev === 'calm' ? 'hustle' : 'calm');
    };

    if (!currentQuote) return null;

    return (
        <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-3xl min-h-[70vh]">
            {/* Background Video/Animation Placeholder */}
            <div className={clsx(
                "absolute inset-0 transition-colors duration-1000",
                mode === 'calm' ? "bg-[#1a2e35]" : "bg-[#2a1a1a]"
            )}>
                {mode === 'calm' ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e35] via-transparent to-[#1a2e35] opacity-50"></div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/40 to-red-900/40 animate-pulse"></div>
                )}
            </div>

            <div className="z-10 max-w-2xl px-8 text-center">
                <div className="mb-8 flex justify-center">
                    <button
                        onClick={toggleMode}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2 rounded-full border transition-all",
                            mode === 'calm'
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                        )}
                    >
                        {mode === 'calm' ? <Wind size={18} /> : <Zap size={18} />}
                        <span>{mode === 'calm' ? "Calm Mode" : "Hustle Mode"}</span>
                    </button>
                </div>

                <div className="mb-8">
                    <Quote size={48} className={clsx("mx-auto mb-6 opacity-50", mode === 'calm' ? "text-emerald-400" : "text-orange-400")} />
                    <h2 className="text-3xl md:text-5xl font-serif leading-tight text-white mb-6">
                        "{currentQuote.text}"
                    </h2>
                    <p className="text-xl text-slate-400 font-medium">— {currentQuote.author}</p>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => setCurrentQuote(quotesData.filter(q => q.category === mode)[Math.floor(Math.random() * quotesData.filter(q => q.category === mode).length)])}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                    >
                        New Quote
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyInspiration;
