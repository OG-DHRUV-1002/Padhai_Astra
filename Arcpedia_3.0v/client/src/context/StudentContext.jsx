import React, { createContext, useContext, useState, useEffect } from 'react';

const StudentContext = createContext();

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }) => {
    // Mock Data - In a real app, this would come from an API
    const [studentProfile, setStudentProfile] = useState({
        name: "Alex",
        major: "Computer Science",
        year: "Junior",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        // New Dashboard Props
        urgentAlerts: ["Assignment 'Data Structures' due in 2 hours", "Library book overdue"],
        weakSubjects: ["Linear Algebra", "Organic Chemistry"],
        lastActivity: {
            title: "Advanced Calculus: Derivatives",
            timestamp: new Date().toISOString() // Current time for demo
        },
        sessionConfig: {
            showArcReactor: true,
            initialRoute: "/dashboard"
        },
        tableSettings: {
            visibleColumns: ["Code", "Name", "Credits", "Professor"]
        }
    });

    const [vitals, setVitals] = useState({
        stressLevel: 45, // 0-100
        agilityScore: 78, // 0-100 -> Mapped to Cognitive Agility
        sleepQuality: 82, // Percentage
        focusIndex: 65, // 0-100
    });

    const [learningStyle, setLearningStyle] = useState('Visual'); // 'Visual', 'Text', 'Auditory'

    const [activeCourse, setActiveCourse] = useState(null);

    // Gamification State
    const [xp, setXP] = useState(1250);
    const [level, setLevel] = useState(5);

    const updateStress = (value) => {
        setVitals(prev => ({ ...prev, stressLevel: Math.max(0, Math.min(100, value)) }));
    };

    const updateXP = (amount) => {
        setXP(prev => prev + amount);
        // Simple level up logic
        if (xp + amount > level * 1000) {
            setLevel(prev => prev + 1);
        }
    };

    const value = {
        studentProfile,
        vitals,
        learningStyle,
        setLearningStyle,
        activeCourse,
        setActiveCourse,
        updateStress,
        xp,
        level,
        updateXP
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};
