import React from 'react';
import { useSudoku } from '../../hooks/useSudoku';
import { RotateCcw } from 'lucide-react';
import clsx from 'clsx';

const SudokuGame = () => {
    const { board, selectedCell, onCellClick, onNumberInput, mistakes, resetGame } = useSudoku();

    // Keypad Logic
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="flex flex-col items-center">
            <div className="flex justify-between w-full max-w-sm mb-4 text-white">
                <span>Mistakes: {mistakes}/3</span>
                <button onClick={resetGame} className="flex items-center gap-1 hover:text-violet-400">
                    <RotateCcw size={16} /> Reset
                </button>
            </div>

            <div className="grid grid-cols-9 gap-0.5 bg-slate-700 border-2 border-slate-700 mb-6">
                {board.map((row, rIndex) => (
                    row.map((cell, cIndex) => (
                        <div
                            key={`${rIndex}-${cIndex}`}
                            onClick={() => onCellClick(rIndex, cIndex)}
                            className={clsx(
                                "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors",
                                "bg-slate-900 text-white",
                                selectedCell?.row === rIndex && selectedCell?.col === cIndex ? "bg-violet-600" : "hover:bg-slate-800",
                                // Add borders for 3x3 blocks
                                (cIndex + 1) % 3 === 0 && cIndex !== 8 ? "border-r-2 border-slate-600" : "",
                                (rIndex + 1) % 3 === 0 && rIndex !== 8 ? "border-b-2 border-slate-600" : ""
                            )}
                        >
                            {cell !== 0 ? cell : ""}
                        </div>
                    ))
                ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-9 gap-2">
                {numbers.map(num => (
                    <button
                        key={num}
                        onClick={() => onNumberInput(num)}
                        className="w-10 h-10 rounded-lg bg-slate-800 text-violet-400 font-bold hover:bg-violet-600 hover:text-white transition-colors"
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SudokuGame;
