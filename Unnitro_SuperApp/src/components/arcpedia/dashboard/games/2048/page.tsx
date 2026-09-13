"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Trophy, Frown, RotateCcw } from "lucide-react";

export default function Game2048Page() {
    const [board, setBoard] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);

    // Initial Load
    useEffect(() => {
        initializeGame();
        const savedHigh = localStorage.getItem("2048-highscore");
        if (savedHigh) setHighScore(parseInt(savedHigh));
    }, []);

    // Check Game Over whenever board changes
    useEffect(() => {
        if (checkGameOver(board)) {
            setGameOver(true);
        }
    }, [board]);

    const initializeGame = () => {
        let newBoard = Array(4).fill(0).map(() => Array(4).fill(0));
        newBoard = addRandomTile(addRandomTile(newBoard));
        setBoard(newBoard);
        setScore(0);
        setGameOver(false);
    };

    const addRandomTile = (currentBoard: number[][]) => {
        const available = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentBoard[r][c] === 0) available.push({ r, c });
            }
        }
        if (available.length === 0) return currentBoard;

        const { r, c } = available[Math.floor(Math.random() * available.length)];
        const newBoard = currentBoard.map(row => [...row]);
        newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
        return newBoard;
    };

    const checkGameOver = (currentBoard: number[][]) => {
        // 1. Check for empty cells
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentBoard[r][c] === 0) return false;
            }
        }

        // 2. Check for adjacent matches
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const current = currentBoard[r][c];
                // Check right
                if (c < 3 && current === currentBoard[r][c + 1]) return false;
                // Check down
                if (r < 3 && current === currentBoard[r + 1][c]) return false;
            }
        }

        return true;
    };

    const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (gameOver) return;

        let rotatedBoard = board.map(row => [...row]);
        let moves = 0;

        // Rotate board to simplify logic (always move left)
        if (direction === 'up') rotatedBoard = rotateLeft(rotatedBoard);
        if (direction === 'down') rotatedBoard = rotateLeft(rotateLeft(rotateLeft(rotatedBoard)));
        if (direction === 'right') rotatedBoard = rotateLeft(rotateLeft(rotatedBoard));

        // Shift & Merge
        let scoreGain = 0;
        for (let r = 0; r < 4; r++) {
            let row = rotatedBoard[r].filter(val => val !== 0);
            for (let c = 0; c < row.length - 1; c++) {
                if (row[c] === row[c + 1]) {
                    row[c] *= 2;
                    scoreGain += row[c];
                    row.splice(c + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            if (row.join(',') !== rotatedBoard[r].join(',')) moves++;
            rotatedBoard[r] = row;
        }

        // Rotate back
        if (direction === 'up') rotatedBoard = rotateLeft(rotateLeft(rotateLeft(rotatedBoard)));
        if (direction === 'down') rotatedBoard = rotateLeft(rotatedBoard);
        if (direction === 'right') rotatedBoard = rotateLeft(rotateLeft(rotatedBoard));

        if (moves > 0) {
            setBoard(prev => addRandomTile(rotatedBoard));
            setScore(prev => {
                const newScore = prev + scoreGain;
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem("2048-highscore", newScore.toString());
                }
                return newScore;
            });
        }
    }, [board, gameOver, highScore]);

    // Handle KeyPress
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault(); // Prevent scrolling
                if (e.key === "ArrowUp") move("up");
                if (e.key === "ArrowDown") move("down");
                if (e.key === "ArrowLeft") move("left");
                if (e.key === "ArrowRight") move("right");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [move]);

    function rotateLeft(matrix: number[][]) {
        const N = matrix.length;
        const result = Array(N).fill(0).map(() => Array(N).fill(0));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[i][j] = matrix[j][N - 1 - i];
            }
        }
        return result;
    }

    const getTileColor = (value: number) => {
        switch (value) {
            case 2: return "bg-gray-200 text-gray-800";
            case 4: return "bg-amber-100 text-gray-800";
            case 8: return "bg-orange-200 text-white";
            case 16: return "bg-orange-400 text-white";
            case 32: return "bg-orange-500 text-white";
            case 64: return "bg-orange-600 text-white";
            case 128: return "bg-yellow-400 text-white";
            case 256: return "bg-yellow-500 text-white";
            case 512: return "bg-yellow-600 text-white";
            case 1024: return "bg-yellow-700 text-white";
            case 2048: return "bg-yellow-800 text-white";
            default: return "bg-gray-300";
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 py-10">
            <div className="flex justify-between w-full max-w-md items-end px-2">
                <div>
                    <h1 className="text-5xl font-black text-amber-500 font-headline tracking-tighter">2048</h1>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Brainstorming Module</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Score</p>
                        <p className="text-2xl font-bold">{score}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Best</p>
                        <p className="text-2xl font-bold text-amber-500">{highScore}</p>
                    </div>
                </div>
            </div>

            <Card className="p-4 bg-amber-900/10 border-amber-900/20 rounded-2xl shadow-2xl relative">
                <div className="grid grid-cols-4 gap-3 bg-amber-900/20 p-3 rounded-xl">
                    {board?.map((row: number[], r: number) =>
                        row?.map((cell: number, c: number) => (
                            <div
                                key={`${r}-${c}`}
                                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center font-bold text-3xl rounded-lg shadow-sm transition-all duration-200 ${getTileColor(cell)}`}
                            >
                                {cell !== 0 && cell}
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <div className="flex items-center gap-6">
                <Button onClick={initializeGame} variant="outline" className="border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500">
                    <RotateCcw className="mr-2 h-4 w-4" /> Restart
                </Button>
                <p className="text-muted-foreground text-sm font-medium">Use <span className="text-foreground font-bold">Arrow Keys</span> to move tiles</p>
            </div>

            <AlertDialog open={gameOver}>
                <AlertDialogContent className="glass-dark border-white/10">
                    <AlertDialogHeader>
                        <div className="mx-auto h-16 w-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                            <Frown className="h-8 w-8 text-rose-500" />
                        </div>
                        <AlertDialogTitle className="text-center text-3xl font-headline">Game Over</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg">
                            Out of moves! You scored <span className="font-bold text-white">{score}</span> points.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center mt-4">
                        <AlertDialogAction onClick={initializeGame} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-2 rounded-xl">
                            Try Again
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
