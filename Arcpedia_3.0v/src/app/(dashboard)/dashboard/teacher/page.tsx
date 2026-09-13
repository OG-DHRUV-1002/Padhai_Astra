"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStudent } from "@/context/student-context";
import {
    Activity,
    Users,
    Brain,
    AlertTriangle,
    TrendingUp,
    Search,
    BookOpen,
    Clock,
    CheckCircle2,
    Plus,
    GraduationCap,
    Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getRecentActivity, ActivityEvent } from "@/lib/activity-store";
import {
    getTeacherStats,
    getTeacherCourses,
    getAllCollegeStudents,
    createCourse,
    assignStudentToCourse
} from "@/lib/db-service";
import { Course, UserData } from "@/lib/types";

export default function TeacherDashboard() {
    const { studentData } = useStudent();
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<UserData[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!studentData?.uid) return;
            try {
                const [recent, teacherStats, teacherCourses] = await Promise.all([
                    getRecentActivity(20),
                    getTeacherStats(studentData.uid),
                    getTeacherCourses(studentData.uid)
                ]);
                setActivities(recent || []);
                setStats(teacherStats);
                setCourses(teacherCourses);

                if (studentData.collegeId) {
                    const collegeStudents = await getAllCollegeStudents(studentData.collegeId);
                    setStudents(collegeStudents);
                }

            } catch (err) {
                console.error("Teacher Dashboard: Failed to load data", err);
            }
        };

        if (studentData) {
            loadData();
            const interval = setInterval(loadData, 30000);
            return () => clearInterval(interval);
        }
    }, [studentData]);

    const handleCreateCourse = async () => {
        const name = prompt("Enter Course Name:");
        const credits = prompt("Enter Credits (e.g. 3):");
        if (!name || !credits) return;

        await createCourse({
            id: `COURSE-${Date.now()}`,
            name,
            instructor: studentData?.name || "Unknown",
            collegeId: studentData?.collegeId,
            teacherId: studentData?.uid,
            studentIds: [],
            attendance: 0,
            grade: 0,
            credits: parseInt(credits)
        } as Course);
        window.location.reload();
    };

    // Derived stats or defaults if loading
    const displayStats = [
        { label: "Avg Attendance", value: stats ? `${stats.avgAttendance}%` : "--", trend: "stable", status: "neutral", icon: Users },
        { label: "Avg Grade", value: stats ? `${stats.avgGrade}%` : "--", trend: "+2%", status: "good", icon: TrendingUp },
        { label: "Active Courses", value: courses.length, trend: "Now", status: "neutral", icon: BookOpen },
        { label: "Total Students", value: students.length, trend: "In College", status: "neutral", icon: GraduationCap },
    ];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "quiz_complete": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
            case "memory_added": return <BookOpen className="h-4 w-4 text-blue-400" />;
            case "resource_search": return <Search className="h-4 w-4 text-purple-400" />;
            default: return <Activity className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Professor's Command Center
                </h1>
                <p className="text-muted-foreground">
                    Real-time monitoring of student performance, wellbeing, and engagement.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-black/20 border border-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="courses">My Courses</TabsTrigger>
                    <TabsTrigger value="students">StudentsDirectory</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-8">
                    {/* CLASSROOM PULSE (Stats Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {displayStats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="bg-black/40 border-white/5 backdrop-blur-xl hover:bg-black/60 transition-colors group">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.label}
                                        </CardTitle>
                                        <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground">STATS</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Activity Feed (2/3 width) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-black/20 border-white/5 backdrop-blur-xl h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-headline">Live Student Activity</CardTitle>
                                            <CardDescription>Real-time feed of student interactions across the platform.</CardDescription>
                                        </div>
                                        <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-[400px]">
                                    <ScrollArea className="h-[500px] pr-4">
                                        <div className="space-y-4">
                                            {(activities || []).length === 0 ? (
                                                <div className="text-center text-muted-foreground py-10 opacity-50">
                                                    No recent activity detected.
                                                </div>
                                            ) : (
                                                activities.map((act, i) => (
                                                    <motion.div
                                                        key={i} // in real app use act.id
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                                                    >
                                                        <div className="mt-1 bg-white/5 p-2 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                                            {getActivityIcon(act.type)}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-medium text-sm text-foreground">
                                                                    {/* In a real app we'd fetch the user name associated with the ID */}
                                                                    Student <span className="text-muted-foreground font-normal">performed</span> {act.type.replace('_', ' ')}
                                                                </p>
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{act.detail}</p>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Alerts & Quick Actions (1/3 width) */}
                        <div className="space-y-6">
                            {/* ACADEMIC ALERTS */}
                            <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        Academic Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Mock Alerts for now - fetch from DB in future */}
                                    {[
                                        { id: 1, student: "Sarah J.", issue: "Missed 3 deadlines", severity: "high", time: "2h ago" },
                                        { id: 2, student: "Mike T.", issue: "Stress level spike (85%)", severity: "medium", time: "4h ago" },
                                        { id: 3, student: "Emma W.", issue: "Failed 'Quantum Physics' quiz", severity: "medium", time: "5h ago" },
                                    ].map((alert) => (
                                        <div key={alert.id} className={`p-3 rounded-lg border flex flex-col gap-1 ${getSeverityColor(alert.severity)}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm">{alert.student}</span>
                                                <span className="text-[10px] opacity-70">{alert.time}</span>
                                            </div>
                                            <p className="text-xs opacity-90">{alert.issue}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* COURSES TAB */}
                <TabsContent value="courses" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">My Courses</h2>
                        <Button onClick={handleCreateCourse} className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" /> Create Course
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                            <Card key={course.id} className="bg-black/40 border-white/5 hover:border-white/20 transition-all">
                                <CardHeader>
                                    <CardTitle className="flex items-start justify-between">
                                        {course.name}
                                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    </CardTitle>
                                    <CardDescription>
                                        Credits: {course.credits}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Enrolled:</span>
                                        <span className="text-white">{course.studentIds?.length || 0}</span>
                                    </div>
                                    <div className="mt-4">
                                        <Button variant="outline" size="sm" className="w-full">Manage Course</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* STUDENTS TAB */}
                <TabsContent value="students" className="space-y-4">
                    <h2 className="text-xl font-bold">Students Directory</h2>
                    <Card className="bg-black/20 border-white/5">
                        <div className="p-4">
                            {students.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No students found in your college.</p>
                            ) : (
                                <div className="space-y-4">
                                    {students.map(student => (
                                        <div key={student.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{student.name}</p>
                                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                                    Student
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
