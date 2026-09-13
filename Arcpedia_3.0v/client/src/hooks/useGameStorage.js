import { useState, useEffect } from 'react';

export const useGameStorage = (gameKey) => {
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem(`antigravity_${gameKey}_highscore`);
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        localStorage.setItem(`antigravity_${gameKey}_highscore`, highScore.toString());
    }, [highScore, gameKey]);

    const updateHighScore = (score) => {
        if (score > highScore) {
            setHighScore(score);
        }
    };

    return { highScore, updateHighScore };
};
