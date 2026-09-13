import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, BarChart3, TrendingUp, CheckCircle, Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// FALLBACK DATA - Used only if API fails
const FALLBACK_COURSES = [
    { name: "Object Oriented Programming", professor: "Prof. Naina Vaidya" },
    { name: "Database Management System", professor: "Prof. Suchita Mandhare" },
    { name: "Data Structure and Algorithm using C", professor: "Prof. Vidya Sagvekar" },
    { name: "Applied Mathematics in Engineering", professor: "Prof. Prajakta Jadhav" },
    { name: "Discrete Structure for Data Science", professor: "Prof. Pankaj Deshmukh" },
    { name: "Web Development", professor: "Prof. Monali Deshpande" },
    { name: "Design and Analysis of Algorithm", professor: "Prof. Pravin Patil" },
    { name: "Core Java", professor: "Prof. Shriniwasan Aacharya" },
    { name: "Python Programming", professor: "Prof. Sunita Yadav" },
    { name: "Operating System & Linux", professor: "Prof. Ananaya Rao" }
];

const FALLBACK_UNIT_NAMES = [
    "Introduction & Basics",
    "Core Concepts & Theory",
    "Advanced Methodologies",
    "Practical Applications",
    "System Integration",
    "Final Project & Review"
];

// Generate fallback data using random progress
const generateFallbackProgress = () => {
    return FALLBACK_COURSES.map(course => {
        let completedCount = Math.floor(Math.random() * 7);
        if (Math.random() < 0.2) completedCount = 0;

        const units = FALLBACK_UNIT_NAMES.map((name, index) => ({
            name,
            isCompleted: index < completedCount
        }));

        return {
            courseName: course.name,
            professor: course.professor,
            units,
            completedUnitsCount: completedCount,
            progressPercentage: Math.round((completedCount / 6) * 100)
        };
    });
};

const Progress = () => {
    const [subjectProgresses, setSubjectProgresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProgress() {
            try {
                const res = await fetch('/api/progress/generate');
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                const data = await res.json();

                if (Array.isArray(data) && data.length > 0) {
                    // The AI returns data with same structure we need
                    setSubjectProgresses(data);
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                console.warn('AI progress data unavailable, using fallback:', error);
                setSubjectProgresses(generateFallbackProgress());
            } finally {
                setIsLoading(false);
            }
        }

        fetchProgress();
    }, []);

    // Derived Stats
    const totalUnits = subjectProgresses.reduce((acc, subj) => acc + (subj.units?.length || 0), 0);
    const totalUnitsCompleted = subjectProgresses.reduce((acc, subj) => acc + (subj.completedUnitsCount || 0), 0);
    const overallPercentage = totalUnits > 0 ? Math.round((totalUnitsCompleted / totalUnits) * 100) : 0;
    const subjectsCompleted = subjectProgresses.filter(s => s.completedUnitsCount === 6).length;
    const subjectsInProgress = subjectProgresses.filter(s => s.completedUnitsCount > 0 && s.completedUnitsCount < 6).length;

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-violet-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm animate-pulse">Generating progress data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
            <h1 className="text-3xl font-bold text-white">Progress Tracking</h1>

            {/* Overall Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <StatsCard
                    value={`${overallPercentage}%`}
                    label="Overall Completion"
                    icon={BarChart3}
                    color="text-violet-500"
                />
                <StatsCard
                    value={`${totalUnitsCompleted} / ${totalUnits}`}
                    label="Units Mastered"
                    icon={CheckCircle}
                    color="text-emerald-500"
                />
                <StatsCard
                    value={subjectsInProgress}
                    label="Subjects In Progress"
                    icon={Clock}
                    color="text-amber-500"
                />
                <StatsCard
                    value={subjectsCompleted}
                    label="Subjects Completed"
                    icon={TrendingUp}
                    color="text-blue-500"
                />
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectProgresses.map((subject, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={subject.courseName}>
                                {subject.courseName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">{subject.professor}</p>
                        </div>

                        <div className="p-5 flex-1 flex flex-col gap-4">
                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-700">Progress</span>
                                    <span className="font-bold text-slate-900">{subject.progressPercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div
                                        className="bg-slate-900 h-2.5 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${subject.progressPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-right">
                                    {subject.completedUnitsCount} / {subject.units?.length || 6} Units
                                </p>
                            </div>

                            {/* Units List */}
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2 mt-auto">
                                {(subject.units || []).slice(0, 3).map((unit, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {unit.isCompleted ? (
                                            <CheckSquare size={16} className="text-slate-900" fill="currentColor" stroke="white" />
                                        ) : (
                                            <Square size={16} className="text-slate-400" />
                                        )}
                                        <span className={clsx(
                                            "text-xs truncate",
                                            unit.isCompleted ? "text-slate-500 line-through" : "text-slate-700"
                                        )}>
                                            {unit.name}
                                        </span>
                                    </div>
                                ))}
                                {(subject.units || []).length > 3 && (
                                    <div className="text-xs text-slate-400 pl-6">
                                        + {(subject.units || []).length - 3} more units
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-sm font-medium text-slate-900 hover:text-slate-700 w-full transition-colors">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsCard = ({ value, label, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
        <div className={clsx("absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity", color)}>
            <Icon size={48} />
        </div>
        <span className="text-4xl font-bold text-slate-900 relative z-10">{value}</span>
        <span className="text-sm text-slate-500 mt-1 relative z-10">{label}</span>
    </div>
);

export default Progress;
