import React, { useState } from 'react';
import jokesData from '../data/jokes.json';
import { Smile, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TempleOfCalm = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextJoke = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % jokesData.length);
    };

    const currentJoke = jokesData[currentIndex];

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 mb-2 flex items-center justify-center gap-3">
                    <Smile className="text-teal-400" size={40} />
                    Temple of Calm
                </h1>
                <p className="text-slate-400">Dopamine hits for the academic soul.</p>
            </div>

            <div className="relative w-full max-w-xl h-96">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-0 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl"
                    >
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
                            {currentJoke && currentJoke.major ? currentJoke.major : "General"}
                        </span>

                        <p className="text-2xl font-bold text-white mb-8 leading-relaxed">
                            {currentJoke && currentJoke.text ? currentJoke.text : "Loading jokes..."}
                        </p>

                        <div className="flex items-center gap-6 mt-auto">
                            <button className="p-4 rounded-full bg-white/5 hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors">
                                <ThumbsUp size={24} />
                            </button>
                            <button className="p-4 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                                <ThumbsDown size={24} />
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <button
                onClick={nextJoke}
                className="mt-8 px-8 py-3 bg-slate-800 border border-slate-700 text-teal-400 font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-teal-500/10"
            >
                Next Dose
                <ArrowRight size={20} />
            </button>
        </div>
    );
};

export default TempleOfCalm;
