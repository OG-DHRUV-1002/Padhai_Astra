import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Gamepad2, Brain, Grid, Timer, Lock, Play, Pause } from 'lucide-react';
import SudokuGame from '../components/games/SudokuGame';
import Game2048 from '../components/games/Game2048';
import clsx from 'clsx';

const BrainstormingHub = () => {
    const location = useLocation();
    const [activeGame, setActiveGame] = useState('sudoku'); // 'sudoku' or '2048'
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const timerRef = useRef(null);

    useEffect(() => {
        if (location.state?.game) {
            setActiveGame(location.state.game);
        }
    }, [location.state]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            clearInterval(timerRef.current);
            // Optional: Play alert sound or show completion modal
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Brain className="text-violet-600" size={32} />
                        Neural Gym
                    </h1>
                    <p className="text-slate-500 text-sm">Cognitive Activation Center</p>
                </div>

                {/* Focus Timer */}
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
                    <div className={clsx(
                        "text-2xl font-mono font-bold tabular-nums",
                        timeLeft < 60 ? "text-red-500 animate-pulse" : "text-blue-600"
                    )}>
                        {formatTime(timeLeft)}
                    </div>
                    <button
                        onClick={toggleTimer}
                        className={clsx(
                            "px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
                            isActive
                                ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                                : "bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-900/20"
                        )}
                    >
                        {isActive ? <><Pause size={16} /> Pause Sprint</> : <><Play size={16} /> Start Sprint</>}
                    </button>
                </div>
            </div>

            {/* Game Selector Tabs */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setActiveGame('sudoku')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all font-bold",
                        activeGame === 'sudoku'
                            ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/25 scale-105"
                            : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white"
                    )}
                >
                    <Grid size={20} />
                    Arc Sudoku
                </button>
                <button
                    onClick={() => setActiveGame('2048')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all font-bold",
                        activeGame === '2048'
                            ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25 scale-105"
                            : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white"
                    )}
                >
                    <div className="border border-current rounded px-1 text-[10px] leading-tight">2048</div>
                    2048 Focus
                </button>
            </div>

            {/* Game Container */}
            <div className="relative min-h-[600px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                {/* Lock Overlay */}
                {!isActive && (
                    <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                        <div className="bg-slate-800 p-6 rounded-full mb-6 border border-white/10 shadow-xl">
                            <Lock className="text-violet-400" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Neural Gym Locked</h2>
                        <p className="text-slate-400 max-w-sm mb-8">
                            Start the Focus Sprint timer above to unlock the cognitive exercises and begin your training session.
                        </p>
                        <button
                            onClick={toggleTimer}
                            className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 flex items-center gap-2"
                        >
                            <Play size={20} />
                            Start Session
                        </button>
                    </div>
                )}

                <div className={clsx("p-8 h-full transition-opacity duration-500", !isActive && "opacity-20 blur-sm pointer-events-none")}>
                    {activeGame === 'sudoku' && <SudokuGame isActive={isActive} />}
                    {activeGame === '2048' && <Game2048 isActive={isActive} />}
                </div>

            </div>
        </div>
    );
};

export default BrainstormingHub;
