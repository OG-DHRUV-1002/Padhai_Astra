'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/dashboard/page-header";
import { SubjectProgress } from "@/components/dashboard/tracking/subject-progress";
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Target, BookOpen, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrackingPage() {
    const [progressData, setProgressData] = useState<{ total: number; completed: number; subjects: number }>({ total: 0, completed: 0, subjects: 0 });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Read progress from localStorage (same key as SubjectProgress)
        const saved = localStorage.getItem('arcProgress');
        if (saved) {
            const data = JSON.parse(saved) as Record<string, boolean>;
            const completed = Object.values(data).filter(Boolean).length;
            // Count unique subjects
            const subjects = new Set(Object.keys(data).map(k => k.replace(/-\d+$/, ''))).size;
            setProgressData({ total: subjects * 6, completed, subjects });
        }
    }, []);

    const percentage = progressData.total > 0 ? Math.round((progressData.completed / progressData.total) * 100) : 0;
    const circumference = 2 * Math.PI * 45; // circle radius = 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="h-full flex flex-col gap-6">
            <PageHeader
                title="Curriculum Tracker"
                description="Track your academic progress across all subjects. Mark units as completed effectively."
            />

            {/* Stats Overview with Progress Ring */}
            {isClient && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    {/* Progress Ring */}
                    <Card className="md:row-span-1 relative overflow-hidden border-white/10 dark:border-white/10 border-indigo-200/50 bg-gradient-to-br from-indigo-100/60 dark:from-indigo-950/40 to-violet-100/60 dark:to-violet-950/30 backdrop-blur-xl">
                        <CardContent className="p-5 flex items-center gap-5">
                            <div className="relative h-24 w-24 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="6" />
                                    <motion.circle
                                        cx="50" cy="50" r="45" fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-black text-foreground">{percentage}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-0.5">Overall Progress</p>
                                <p className="text-2xl font-black text-foreground">{progressData.completed}<span className="text-sm text-muted-foreground font-medium">/{progressData.total}</span></p>
                                <p className="text-xs text-muted-foreground">Units Completed</p>
                            </div>
                        </CardContent>
                    </Card>

                    {[
                        { label: 'Subjects', value: progressData.subjects, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Remaining', value: progressData.total - progressData.completed, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Mastery', value: percentage >= 80 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Building', icon: Award, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    ].map(stat => (
                        <Card key={stat.label} className="border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-xl font-black text-foreground">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}

            {/* Main Progress Logic */}
            <SubjectProgress />
        </div>
    );
}
