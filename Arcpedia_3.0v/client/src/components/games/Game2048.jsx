import React, { useEffect } from 'react';
import { use2048 } from '../../hooks/use2048';
import clsx from 'clsx';
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const Game2048 = ({ isActive }) => {
    const { grid, score, moveLeft, moveUp, moveRight, moveDown, initGame } = use2048();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isActive) return;

            // Prevent scrolling
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'ArrowLeft': moveLeft(); break;
                case 'ArrowRight': moveRight(); break;
                case 'ArrowUp': moveUp(); break;
                case 'ArrowDown': moveDown(); break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, moveLeft, moveRight, moveUp, moveDown]);

    const getColor = (value) => {
        const colors = {
            0: 'bg-slate-800',
            2: 'bg-slate-200 text-slate-800',
            4: 'bg-amber-100 text-amber-800',
            8: 'bg-amber-300 text-white',
            16: 'bg-amber-500 text-white',
            32: 'bg-orange-600 text-white',
            64: 'bg-red-500 text-white',
            128: 'bg-yellow-400 text-white text-3xl shadow-lg',
            256: 'bg-yellow-500 text-white text-3xl shadow-lg',
            512: 'bg-yellow-600 text-white text-3xl shadow-lg',
            1024: 'bg-violet-500 text-white text-2xl shadow-xl',
            2048: 'bg-violet-700 text-white text-2xl shadow-[0_0_30px_rgba(124,58,237,0.5)]'
        };
        return colors[value] || 'bg-slate-900';
    };

    return (
        <div className="flex flex-col items-center">

            {/* Score & Controls */}
            <div className="flex justify-between items-center w-full max-w-sm mb-6">
                <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                    <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Score</span>
                    <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
                </div>
                <button
                    onClick={initGame}
                    className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all active:scale-95 shadow-lg"
                    title="Reset Game"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Game Grid */}
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl relative">
                <div className="grid grid-cols-4 gap-2">
                    {grid.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                className={clsx(
                                    "w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center font-bold text-2xl transition-all duration-150 transform",
                                    getColor(cell),
                                    cell > 0 && "animate-in zoom-in duration-200"
                                )}
                            >
                                {cell !== 0 && cell}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 flex items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1"><ArrowLeft size={14} /> <ArrowRight size={14} /> <ArrowUp size={14} /> <ArrowDown size={14} /> to move</span>
            </div>
        </div>
    );
};

export default Game2048;
