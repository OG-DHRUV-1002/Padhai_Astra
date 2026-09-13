'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, BookOpen, GraduationCap, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/use-courses";

// Default units structure — each course gets 6 learning units
const UNITS = [
    "Unit 1: Introduction",
    "Unit 2: Core Concepts",
    "Unit 3: Advanced Theory",
    "Unit 4: Practical Application",
    "Unit 5: Integration",
    "Unit 6: Mastery & Project"
];

export function SubjectProgress() {
    const { courses, loading } = useCourses();

    // State to track completed units: { "CourseName-UnitIndex": true/false }
    const [completedUnits, setCompletedUnits] = useState<Record<string, boolean>>({});
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const saved = localStorage.getItem('arcProgress');
        if (saved) {
            setCompletedUnits(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('arcProgress', JSON.stringify(completedUnits));
        }
    }, [completedUnits, isClient]);

    const toggleUnit = (courseName: string, unitIndex: number) => {
        const key = `${courseName}-${unitIndex}`;
        setCompletedUnits(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getProgress = (courseName: string) => {
        let count = 0;
        for (let i = 0; i < 6; i++) {
            if (completedUnits[`${courseName}-${i}`]) count++;
        }
        return (count / 6) * 100;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading courses...</p>
            </div>
        );
    }

    if (!isClient) return null;

    // Map courses to subjects structure
    const subjects = courses.map(c => ({
        name: c.name,
        professor: c.instructor || "TBA"
    }));

    if (subjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-10 w-10 text-indigo-400/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No courses enrolled</h3>
                <p className="text-sm text-muted-foreground">Course tracking will appear here once you&apos;re enrolled in courses.</p>
            </div>
        );
    }

    // Helper statistics
    const totalUnits = subjects.length * 6;
    const completedCount = Object.values(completedUnits).filter(Boolean).length;
    const totalPercentage = Math.round((completedCount / totalUnits) * 100);

    return (
        <div className="space-y-8">
            {/* Overall Summary Card */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass dark:glass-dark border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Academic Velocity</CardTitle>
                        <GraduationCap className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPercentage}%</div>
                        <p className="text-xs text-muted-foreground">Total Curriculum Completion</p>
                    </CardContent>
                </Card>

                <Card className="glass dark:glass-dark">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mastered Units</CardTitle>
                        <Check className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedCount}</div>
                        <p className="text-xs text-muted-foreground">Across {subjects.length} Subjects</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject, idx) => {
                    const progress = getProgress(subject.name);

                    return (
                        <motion.div
                            key={subject.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="h-full glass dark:glass-dark hover:border-primary/40 transition-colors group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <CardTitle className="text-base font-bold line-clamp-1" title={subject.name}>
                                                {subject.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1 flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" />
                                                {subject.professor}
                                            </CardDescription>
                                        </div>
                                        <div className="text-xs font-bold bg-secondary px-2 py-1 rounded-full">
                                            {Math.round(progress)}%
                                        </div>
                                    </div>
                                    <Progress value={progress} className="h-2 mt-3" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {UNITS.map((unitName, unitIdx) => {
                                            const isCompleted = completedUnits[`${subject.name}-${unitIdx}`];
                                            return (
                                                <div
                                                    key={unitIdx}
                                                    onClick={() => toggleUnit(subject.name, unitIdx)}
                                                    className={cn(
                                                        "flex items-center p-2 rounded-lg text-sm transition-all cursor-pointer border hover:shadow-sm",
                                                        isCompleted
                                                            ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
                                                            : "bg-background/50 border-transparent hover:bg-background text-muted-foreground"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors",
                                                        isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
                                                    )}>
                                                        {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <span className={cn(
                                                        "flex-1 font-medium",
                                                        isCompleted && "line-through opacity-70"
                                                    )}>
                                                        {unitName}
                                                        {isCompleted && <span className="ml-2 text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full no-underline inline-block">Done</span>}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
