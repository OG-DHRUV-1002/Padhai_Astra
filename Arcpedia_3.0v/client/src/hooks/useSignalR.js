import { useState, useEffect, useRef } from 'react';

// Mock implementation of SignalR connection
export const useSignalR = (hubUrl) => {
    const [connectionState, setConnectionState] = useState('Disconnected');
    const [messages, setMessages] = useState([]);
    const subscribers = useRef({});

    useEffect(() => {
        // Simulate connection
        setConnectionState('Connecting');
        const timer = setTimeout(() => {
            setConnectionState('Connected');

            // Simulate incoming messages periodically
            const interval = setInterval(() => {
                if (Math.random() > 0.7) {
                    const mockMsg = {
                        id: Date.now(),
                        user: "Anonymous Oracle",
                        text: getRandomWisdom(),
                        timestamp: new Date().toLocaleTimeString(),
                        type: 'system'
                    };
                    setMessages(prev => [...prev, mockMsg]);
                }
            }, 5000);

            return () => clearInterval(interval);

        }, 1000);

        return () => clearTimeout(timer);
    }, [hubUrl]);

    const on = (methodName, callback) => {
        if (!subscribers.current[methodName]) {
            subscribers.current[methodName] = [];
        }
        subscribers.current[methodName].push(callback);
    };

    const off = (methodName, callback) => {
        if (!subscribers.current[methodName]) return;
        subscribers.current[methodName] = subscribers.current[methodName].filter(cb => cb !== callback);
    };

    const sendMessage = (text) => {
        const msg = {
            id: Date.now(),
            user: "Me", // In a real app this would be current user or "Masked Identity"
            text: text,
            timestamp: new Date().toLocaleTimeString(),
            type: 'user'
        };
        setMessages(prev => [...prev, msg]);
    };

    return { connectionState, messages, sendMessage, on, off };
};

const wisdoms = [
    "The only way to do great work is to love what you do.",
    "Calculus is the language of God.",
    "Don't panic about the exam. You prepared for this.",
    "Drink water. seriously.",
    "Anyone up for a Sudoku race?",
    "Found a great resource on Graph Theory in ArchiHub!"
];

const getRandomWisdom = () => wisdoms[Math.floor(Math.random() * wisdoms.length)];
