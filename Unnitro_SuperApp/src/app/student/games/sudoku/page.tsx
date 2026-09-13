"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Undo2, Trophy, AlertTriangle, RotateCcw, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 6x6 Sudoku Logic (2x3 Boxes) ---
const GRID_SIZE = 6;
const BOX_ROWS = 2;
const BOX_COLS = 3;

function isValid(board: number[][], row: number, col: number, num: number) {
    // Check Row & Col
    for (let x = 0; x < GRID_SIZE; x++) {
        if (board[row][x] === num || board[x][col] === num) return false;
    }
    // Check Box
    const startRow = row - (row % BOX_ROWS);
    const startCol = col - (col % BOX_COLS);
    for (let i = 0; i < BOX_ROWS; i++) {
        for (let j = 0; j < BOX_COLS; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
}

function generateSudoku() {
    const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    solveRandomized(board);
    return board;
}

function solveRandomized(board: number[][]) {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === 0) {
                const nums = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
                for (const num of nums) {
                    if (isValid(board, i, j, num)) {
                        board[i][j] = num;
                        if (solveRandomized(board)) return true;
                        board[i][j] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function removeKDigits(board: number[][], k: number) {
    const copy = board.map(row => [...row]);
    let count = k;
    while (count !== 0) {
        let cellId = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
        let i = Math.floor(cellId / GRID_SIZE);
        let j = cellId % GRID_SIZE;
        if (copy[i][j] !== 0) {
            count--;
            copy[i][j] = 0;
        }
    }
    return copy;
}

export default function SudokuPage() {
    const [initialBoard, setInitialBoard] = useState<number[][]>([]);
    const [board, setBoard] = useState<number[][]>([]);
    const [solvedBoard, setSolvedBoard] = useState<number[][]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
    const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");

    const startNewGame = () => {
        const fullBoard = generateSudoku();
        const solution = fullBoard.map(row => [...row]);
        setSolvedBoard(solution);

        const playable = removeKDigits(fullBoard, 20);
        setInitialBoard(playable.map(row => [...row]));
        setBoard(playable);
        setMistakes(0);
        setGameState("playing");
        setSelectedCell(null);
    };

    useEffect(() => {
        startNewGame();
    }, []);

    const handleInputStrict = (num: number) => {
        if (gameState !== "playing" || !selectedCell) return;
        const { r, c } = selectedCell;
        if (initialBoard[r][c] !== 0) return;

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;
        setBoard(newBoard);

        if (num !== solvedBoard[r][c]) {
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            if (newMistakes >= 3) setGameState("lost");
        } else {
            // Check Win
            let filledAndCorrect = true;
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if (newBoard[i][j] !== solvedBoard[i][j]) {
                        filledAndCorrect = false;
                        break;
                    }
                }
            }
            if (filledAndCorrect) setGameState("won");
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 py-10 max-w-lg mx-auto min-h-[calc(100vh-4rem)] justify-center">
            {/* Header */}
            <div className="flex justify-between w-full items-end px-4">
                <div>
                    <h1 className="text-4xl font-black text-amber-500 font-headline tracking-tighter">Sudoku</h1>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-1">6x6 Brainstorm</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Mistakes</p>
                    <div className={cn("text-3xl font-black transition-colors font-headline", mistakes >= 2 ? "text-rose-500" : "text-foreground")}>
                        {mistakes}<span className="text-muted-foreground text-xl">/3</span>
                    </div>
                </div>
            </div>

            {/* Board Container */}
            <Card className="p-1 bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div
                    className="grid grid-cols-6 gap-[2px] bg-zinc-800 border-[2px] border-zinc-800"
                    style={{
                        width: 'min(90vw, 400px)',
                        height: 'min(90vw, 400px)',
                    }}
                >
                    {board.map((row, r) => (
                        row.map((cell, c) => {
                            const isInitial = initialBoard[r][c] !== 0;
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                            const isError = !isInitial && cell !== 0 && cell !== solvedBoard[r][c];

                            // Visual block separation logic via CSS classes
                            // Add extra margins to create "thick lines" visually
                            const isRightBorder = c === 2; // Vertical separator
                            const isBottomBorder = r === 1 || r === 3; // Horizontal separators

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => {
                                        if (gameState !== "playing") setGameState("playing");
                                        setSelectedCell({ r, c });
                                    }}
                                    className={cn(
                                        "relative flex items-center justify-center text-3xl font-bold cursor-pointer select-none transition-colors duration-100",
                                        "bg-white dark:bg-zinc-900", // Default cell color

                                        // Specific Borders for 2x3 blocks
                                        // We use border-right and border-bottom to create lines
                                        isRightBorder && "border-r-[3px] border-r-zinc-500",
                                        isBottomBorder && "border-b-[3px] border-b-zinc-500",

                                        // Selection & Error
                                        isSelected && "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 ring-inset ring-4 ring-amber-500 z-10",
                                        isError && "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",

                                        // Text Color for normal state
                                        !isSelected && !isError && (isInitial ? "text-black dark:text-white" : "text-amber-600 dark:text-amber-500"),
                                    )}
                                >
                                    {cell !== 0 ? cell : ""}
                                </div>
                            );
                        })
                    ))}
                </div>
            </Card>

            {/* Controls */}
            <div className="w-full space-y-6 px-4">
                {/* Numpad */}
                <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                        <Button
                            key={num}
                            onClick={() => handleInputStrict(num)}
                            className={cn(
                                "h-14 text-2xl font-bold rounded-xl transition-all hover:scale-105 active:scale-95",
                                "bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5",
                                "text-foreground hover:bg-amber-500 hover:text-white"
                            )}
                        >
                            {num}
                        </Button>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <Button
                        onClick={() => selectedCell && handleInputStrict(0)}
                        variant="ghost"
                        size="lg"
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                        disabled={!selectedCell || initialBoard[selectedCell.r][selectedCell.c] !== 0}
                    >
                        <Eraser className="h-5 w-5 mr-2" /> Clear Cell
                    </Button>

                    <Button onClick={startNewGame} size="lg" variant="outline" className="border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl px-8">
                        <RotateCcw className="h-4 w-4 mr-2" /> New Game
                    </Button>
                </div>
            </div>

            {/* Game Over Dialog */}
            <AlertDialog open={gameState === "lost"}>
                <AlertDialogContent className="glass-dark border-rose-500/20">
                    <AlertDialogHeader>
                        <div className="mx-auto h-20 w-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="h-10 w-10 text-rose-500" />
                        </div>
                        <AlertDialogTitle className="text-center text-3xl font-headline">Game Over</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg">
                            Three strikes! The puzzle reset itself out of confusion.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction onClick={startNewGame} className="bg-rose-500 hover:bg-rose-600 font-bold px-10 py-6 text-lg rounded-xl shadow-xl shadow-rose-500/20">Try Again</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Win Dialog */}
            <AlertDialog open={gameState === "won"}>
                <AlertDialogContent className="glass-dark border-emerald-500/20">
                    <AlertDialogHeader>
                        <div className="mx-auto h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                            <Trophy className="h-10 w-10 text-emerald-500" />
                        </div>
                        <AlertDialogTitle className="text-center text-4xl font-headline text-emerald-500">Solved!</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg">
                            Brain power overwhelming! You crushed the grid.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction onClick={startNewGame} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-10 py-6 text-lg rounded-xl shadow-xl shadow-emerald-500/20">Next Puzzle</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
