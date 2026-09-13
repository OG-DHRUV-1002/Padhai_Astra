"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Brain, Clock, TrendingUp, Users, BarChart3, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const WEEKLY_SCORES = [
    { day: "Mon", score: 65 },
    { day: "Tue", score: 78 },
    { day: "Wed", score: 82 },
    { day: "Thu", score: 75 },
    { day: "Fri", score: 88 },
    { day: "Sat", score: 92 },
    { day: "Sun", score: 85 },
];

const ATTENDANCE_TREND = [
    { day: "Mon", pct: 92 },
    { day: "Tue", pct: 88 },
    { day: "Wed", pct: 95 },
    { day: "Thu", pct: 82 },
    { day: "Fri", pct: 90 },
    { day: "Sat", pct: 78 },
    { day: "Sun", pct: 85 },
];

const ENGAGEMENT_HEATMAP = [
    { student: "Aarav P.", mon: 4, tue: 3, wed: 5, thu: 2, fri: 5, sat: 1, sun: 0 },
    { student: "Diya S.", mon: 5, tue: 5, wed: 4, thu: 5, fri: 3, sat: 2, sun: 1 },
    { student: "Rohan K.", mon: 2, tue: 3, wed: 1, thu: 4, fri: 2, sat: 0, sun: 0 },
    { student: "Ananya M.", mon: 5, tue: 4, wed: 5, thu: 5, fri: 5, sat: 3, sun: 2 },
    { student: "Vikram J.", mon: 3, tue: 2, wed: 3, thu: 1, fri: 4, sat: 1, sun: 0 },
    { student: "Ishaan R.", mon: 4, tue: 5, wed: 4, thu: 3, fri: 5, sat: 2, sun: 1 },
    { student: "Meera L.", mon: 1, tue: 2, wed: 1, thu: 2, fri: 1, sat: 0, sun: 0 },
    { student: "Kavya T.", mon: 5, tue: 4, wed: 5, thu: 4, fri: 5, sat: 4, sun: 3 },
];

const TOP_STUDENTS = [
    { name: "Kavya T.", hours: 34, trend: "+12%" },
    { name: "Diya S.", hours: 29, trend: "+8%" },
    { name: "Ananya M.", hours: 28, trend: "+15%" },
    { name: "Ishaan R.", hours: 24, trend: "+3%" },
    { name: "Aarav P.", hours: 20, trend: "-2%" },
];

const RESOURCE_USAGE = [
    { name: "Video Lectures", pct: 42 },
    { name: "Practice Quizzes", pct: 28 },
    { name: "AI Chat (Archi)", pct: 18 },
    { name: "Memory Scroll", pct: 8 },
    { name: "Other", pct: 4 },
];

const SUBJECTS = [
    { name: "Mathematics", avgScore: 82, passRate: 94, atRisk: 2, color: "text-indigo-400", bg: "bg-indigo-500" },
    { name: "Physics", avgScore: 76, passRate: 88, atRisk: 4, color: "text-cyan-400", bg: "bg-cyan-500" },
    { name: "Computer Science", avgScore: 91, passRate: 98, atRisk: 0, color: "text-emerald-400", bg: "bg-emerald-500" },
    { name: "English Literature", avgScore: 78, passRate: 90, atRisk: 3, color: "text-amber-400", bg: "bg-amber-500" },
    { name: "Data Structures", avgScore: 85, passRate: 92, atRisk: 1, color: "text-violet-400", bg: "bg-violet-500" },
];

function HeatCell({ value }: { value: number }) {
    const opacity = value === 0 ? "bg-white/5" : value <= 2 ? "bg-indigo-500/20" : value <= 3 ? "bg-indigo-500/40" : value <= 4 ? "bg-indigo-500/60" : "bg-indigo-500/80";
    return (
        <div className={`h-8 w-8 rounded-sm ${opacity} flex items-center justify-center text-[10px] font-medium transition-colors hover:ring-1 hover:ring-white/20`}>
            {value > 0 ? value : ""}
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Class Pulse Analytics</h1>
                <p className="text-muted-foreground">Deep dive into student performance and engagement metrics.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Avg Engagement", value: "87%", delta: "+5% from last month", icon: Activity, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { title: "Quiz Completion", value: "94%", delta: "Top 5% of hierarchy", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { title: "Focus Time", value: "4.2h", delta: "Per student / day", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    { title: "Cognitive Load", value: "Optimal", delta: "Balanced workload", icon: Brain, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                ].map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={`${stat.bg}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.delta}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
                </TabsList>

                {/* ============ OVERVIEW ============ */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Weekly Quiz Score Trend</CardTitle>
                                <CardDescription>Average quiz scores over the last 7 days</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[260px] flex flex-col justify-end">
                                <div className="flex items-end gap-3 h-48 px-2">
                                    {WEEKLY_SCORES.map((d, i) => (
                                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${d.score * 1.8}px` }}
                                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                                className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-md relative group cursor-pointer hover:from-indigo-500 hover:to-violet-400 transition-colors"
                                            >
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {d.score}%
                                                </div>
                                            </motion.div>
                                            <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Weekly Attendance Trend</CardTitle>
                                <CardDescription>Average attendance percentage per day</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[260px] flex flex-col justify-end">
                                <div className="flex items-end gap-3 h-48 px-2">
                                    {ATTENDANCE_TREND.map((d, i) => (
                                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${d.pct * 1.8}px` }}
                                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                                className="w-full bg-gradient-to-t from-emerald-600 to-cyan-500 rounded-t-md relative group cursor-pointer hover:from-emerald-500 hover:to-cyan-400 transition-colors"
                                            >
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {d.pct}%
                                                </div>
                                            </motion.div>
                                            <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ============ ENGAGEMENT ============ */}
                <TabsContent value="engagement" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Heatmap */}
                        <Card className="lg:col-span-2 bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-400" />
                                    Student Engagement Heatmap
                                </CardTitle>
                                <CardDescription>Hours of active learning per day (0–5 scale)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {/* Header */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-24" />
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                                            <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] text-muted-foreground font-medium">{d}</div>
                                        ))}
                                    </div>
                                    {/* Rows */}
                                    {ENGAGEMENT_HEATMAP.map((row, i) => (
                                        <motion.div
                                            key={row.student}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="w-24 text-xs text-muted-foreground truncate">{row.student}</span>
                                            <HeatCell value={row.mon} />
                                            <HeatCell value={row.tue} />
                                            <HeatCell value={row.wed} />
                                            <HeatCell value={row.thu} />
                                            <HeatCell value={row.fri} />
                                            <HeatCell value={row.sat} />
                                            <HeatCell value={row.sun} />
                                        </motion.div>
                                    ))}
                                    {/* Legend */}
                                    <div className="flex items-center gap-2 pt-3 text-[10px] text-muted-foreground">
                                        <span>Less</span>
                                        <div className="h-4 w-4 rounded-sm bg-white/5" />
                                        <div className="h-4 w-4 rounded-sm bg-indigo-500/20" />
                                        <div className="h-4 w-4 rounded-sm bg-indigo-500/40" />
                                        <div className="h-4 w-4 rounded-sm bg-indigo-500/60" />
                                        <div className="h-4 w-4 rounded-sm bg-indigo-500/80" />
                                        <span>More</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Students */}
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-emerald-400" />
                                    Top Active Students
                                </CardTitle>
                                <CardDescription>By total study hours this week</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {TOP_STUDENTS.map((student, i) => (
                                    <motion.div
                                        key={student.name}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">{student.hours}h active</p>
                                        </div>
                                        <Badge variant="outline" className={
                                            student.trend.startsWith("+") ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-red-400 border-red-500/20 bg-red-500/10"
                                        }>
                                            {student.trend}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resource Usage */}
                    <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Resource Usage Breakdown</CardTitle>
                            <CardDescription>How students are spending their learning time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {RESOURCE_USAGE.map((res, i) => (
                                    <motion.div
                                        key={res.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="space-y-1.5"
                                    >
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{res.name}</span>
                                            <span className="text-muted-foreground">{res.pct}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${res.pct}%` }}
                                                transition={{ delay: i * 0.08, duration: 0.6 }}
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ SUBJECTS ============ */}
                <TabsContent value="subjects" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {SUBJECTS.map((subj, i) => (
                            <motion.div
                                key={subj.name}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <Card className="bg-black/20 border-white/5 backdrop-blur-xl hover:border-indigo-500/20 transition-all group">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">{subj.name}</CardTitle>
                                            {subj.atRisk > 0 && (
                                                <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10 text-[10px] gap-1">
                                                    <AlertTriangle className="h-3 w-3" />{subj.atRisk} at risk
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
                                                <p className="text-2xl font-bold">{subj.avgScore}%</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pass Rate</p>
                                                <p className="text-2xl font-bold text-emerald-400">{subj.passRate}%</p>
                                            </div>
                                        </div>
                                        {/* Score bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Class Performance</span>
                                                <span>{subj.avgScore}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${subj.avgScore}%` }}
                                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                                    className={`h-full rounded-full ${subj.bg}`}
                                                    style={{ opacity: 0.7 }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison Chart */}
                    <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-indigo-400" />
                                Subject Score Comparison
                            </CardTitle>
                            <CardDescription>Average scores across all subjects</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px] flex flex-col justify-end">
                            <div className="flex items-end gap-4 h-52 px-4">
                                {SUBJECTS.map((subj, i) => (
                                    <div key={subj.name} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${subj.avgScore * 2}px` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className={`w-full ${subj.bg} rounded-t-md relative group cursor-pointer transition-opacity hover:opacity-80`}
                                            style={{ opacity: 0.6 }}
                                        >
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {subj.avgScore}%
                                            </div>
                                        </motion.div>
                                        <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight max-w-[60px]">{subj.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
