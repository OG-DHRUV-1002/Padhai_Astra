import { useState, useCallback } from 'react';

// Simplified Sudoku Generator for Demo
const generateSudoku = () => {
    // This is a static valid puzzle for demonstration
    // 0 represents empty cells
    const initial = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    return initial;
};

const SOLVED_GRID = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

export const useSudoku = () => {
    const [board, setBoard] = useState(generateSudoku());
    const [initialBoard, setInitialBoard] = useState(JSON.parse(JSON.stringify(generateSudoku())));
    const [selectedCell, setSelectedCell] = useState(null);
    const [mistakes, setMistakes] = useState(0);

    const onCellClick = useCallback((row, col) => {
        if (initialBoard[row][col] !== 0) return; // Cannot select pre-filled cells
        setSelectedCell({ row, col });
    }, [initialBoard]);

    const onNumberInput = useCallback((num) => {
        if (!selectedCell) return;

        const { row, col } = selectedCell;

        // Validation check against solved grid for immediate feedback
        if (SOLVED_GRID[row][col] !== num) {
            setMistakes(prev => prev + 1);
            return;
        }

        const newBoard = [...board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = num;
        setBoard(newBoard);
    }, [board, selectedCell]);

    const resetGame = () => {
        setBoard(generateSudoku());
        setInitialBoard(generateSudoku());
        setMistakes(0);
        setSelectedCell(null);
    };

    return { board, initialBoard, selectedCell, onCellClick, onNumberInput, mistakes, resetGame };
};
