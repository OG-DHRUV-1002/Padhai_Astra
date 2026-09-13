import { useState, useEffect, useCallback } from 'react';

const createEmptyGrid = () => Array(4).fill().map(() => Array(4).fill(0));

export const use2048 = () => {
    const [grid, setGrid] = useState(createEmptyGrid());
    const [score, setScore] = useState(0);

    const addRandomTile = (currentGrid) => {
        const available = [];
        currentGrid.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell === 0) available.push({ r, c });
            });
        });

        if (available.length === 0) return currentGrid;

        const { r, c } = available[Math.floor(Math.random() * available.length)];
        currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
        return currentGrid;
    };

    const initGame = useCallback(() => {
        let newGrid = createEmptyGrid();
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Logic helpers
    const slide = (row) => {
        let arr = row.filter(val => val);
        let missing = 4 - arr.length;
        let zeros = Array(missing).fill(0);
        arr = arr.concat(zeros);
        return arr;
    };

    const combine = (row, currentScore) => {
        let newScore = currentScore;
        for (let i = 0; i < 3; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
                row[i] = row[i] * 2;
                row[i + 1] = 0;
                newScore += row[i];
            }
        }
        return { row, newScore };
    };

    const operate = (row, currentScore) => {
        row = slide(row);
        const result = combine(row, currentScore);
        row = result.row;
        row = slide(row);
        return { row, newScore: result.newScore };
    };

    // Rotate grid clockwise 90 degrees
    const rotate = (matrix) => {
        const N = 4;
        const res = Array(N).fill().map(() => Array(N).fill(0));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                res[i][j] = matrix[N - 1 - j][i];
            }
        }
        return res;
    };

    const rotateTimes = (matrix, times) => {
        let res = matrix;
        for (let i = 0; i < times; i++) {
            res = rotate(res);
        }
        return res;
    };

    const move = (direction) => {
        // 0: Left, 1: Up, 2: Right, 3: Down
        // We want to transform all moves to "Left" moves.
        // Left (0) -> Rotate 0
        // Up (1) -> Rotate 3 times (270 deg) makes Up face Left
        // Right (2) -> Rotate 2 times (180 deg) makes Right face Left
        // Down (3) -> Rotate 1 time (90 deg) makes Down face Left

        // Wait, verifying rotation:
        // Generic approach: Rotate grid so the desired direction is pointing Left.
        // If we want to slide UP (1): The top row becomes left column. 
        // A single 90 deg rotation makes Top -> Right. 
        // Actually, let's just stick to the C# logic concept but implementation might differ.
        // C# logic used: rotate 'direction' times. 
        // Let's implement simpler:
        // Left: 0 rot
        // Down: 1 rot (if we rotate 90 deg clockwise, Down becomes Left? No. Left becomes Up. Down becomes Left.)
        // Right: 2 rot
        // Up: 3 rot

        let rotations = 0;
        if (direction === 0) rotations = 0; // Left
        else if (direction === 1) rotations = 3; // Up (requires 270 deg or -90)
        else if (direction === 2) rotations = 2; // Right
        else if (direction === 3) rotations = 1; // Down

        // Let's verify:
        // [1 2]   Rot 90 ->  [3 1]
        // [3 4]              [4 2]
        // If we want to move Down (slide 3 and 4 to bottom). After 1 rot, 3 and 4 are on Left. Slide Left works!
        // So Down = 1 rotation.

        let newGrid = JSON.parse(JSON.stringify(grid));
        let newScore = score;

        newGrid = rotateTimes(newGrid, rotations);

        let changed = false;

        for (let i = 0; i < 4; i++) {
            const oldRow = [...newGrid[i]];
            const result = operate(newGrid[i], newScore);
            newGrid[i] = result.row;
            newScore = result.newScore;
            if (JSON.stringify(oldRow) !== JSON.stringify(newGrid[i])) changed = true;
        }

        // Rotate back: 4 - rotations
        newGrid = rotateTimes(newGrid, (4 - rotations) % 4);

        if (changed) {
            newGrid = addRandomTile(newGrid);
            setGrid(newGrid);
            setScore(newScore);
            return true;
        }
        return false;
    };

    const moveLeft = () => move(0);
    const moveUp = () => move(1);
    const moveRight = () => move(2);
    const moveDown = () => move(3);

    return { grid, score, moveLeft, moveUp, moveRight, moveDown, initGame };
};
