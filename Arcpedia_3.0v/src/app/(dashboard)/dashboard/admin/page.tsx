"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Building2,
    Activity,
    ShieldAlert,
    Settings,
    Database,
    Server,
    Lock,
    Search,
    Plus,
    MapPin,
    GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    getRecentActivity,
    ActivityEvent
} from "@/lib/activity-store";
import {
    getSystemStats as getDbSystemStats,
    getColleges,
    getTeachers,
    createCollege,
    createTeacher
} from "@/lib/db-service";
import { seedDemoData } from "@/lib/seed";
import { useStudent } from "@/context/student-context";
import { College, UserData } from "@/lib/types";

export default function AdminDashboard() {
    const { studentData } = useStudent();
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [teachers, setTeachers] = useState<UserData[]>([]);
    const [seeding, setSeeding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!studentData?.uid) return;
            try {
                const [dbStats, recentActivity, collegesData] = await Promise.all([
                    getDbSystemStats(),
                    getRecentActivity(20),
                    getColleges(studentData.uid)
                ]);
                setStats(dbStats);
                setActivities(recentActivity || []);
                setColleges(collegesData);

                // Fetch teachers for the first college found (or all if we want)
                // For now, let's just fetch all teachers associated with these colleges
                if (collegesData.length > 0) {
                    const allTeachers = await Promise.all(collegesData.map(c => getTeachers(c.id)));
                    setTeachers(allTeachers.flat());
                }

            } catch (err) {
                console.error("Admin Dashboard: Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [studentData]);

    const handleSeed = async () => {
        if (!studentData?.uid) return;
        setSeeding(true);
        await seedDemoData();
        setSeeding(false);
        alert("Database seeded!");
        window.location.reload();
    };

    const handleCreateCollege = async () => {
        const name = prompt("Enter Name (College or Organization):");
        if (!name) return;
        const typeChoice = prompt("Enter Type (1 for College, 2 for Organization):", "1");
        const type = typeChoice === "2" ? "organization" : "college";

        const location = prompt("Enter Location (Optional):");

        try {
            await createCollege({
                name,
                adminId: studentData?.uid,
                type,
                location: location || undefined
            });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`);
            window.location.reload();
        } catch (error) {
            console.error("Failed to create college:", error);
            alert("Failed to create college. Check console for details.");
        }
    };

    const handleCreateTeacher = async () => {
        const name = prompt("Enter Teacher Name:");
        const email = prompt("Enter Teacher Email:");
        const pCollegeId = prompt("Enter College ID for this teacher:", colleges[0]?.id);

        if (!name || !email || !pCollegeId) return;

        await createTeacher({
            uid: `TEACHER-${Date.now()}`, // Mock UID generation
            name,
            email,
            role: "teacher",
            collegeId: pCollegeId,
            createdById: studentData?.uid
        });
        window.location.reload();
    };


    const systemStats = [
        { label: "Total Users", value: stats?.totalUsers || "--", trend: "+12% this week", icon: Users, color: "text-blue-400" },
        { label: "Colleges", value: colleges.length, trend: "Managed Aggregators", icon: Building2, color: "text-purple-400" },
        { label: "Teachers", value: teachers.length, trend: "Active Faculty", icon: GraduationCap, color: "text-pink-400" },
        { label: "System Load", value: "34%", trend: "-2% vs peak", icon: Server, color: "text-amber-400" },
    ];

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    System Overwatch
                </h1>
                <p className="text-muted-foreground">
                    Global administration, security monitoring, and infrastructure control.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-black/20 border border-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="colleges">Colleges</TabsTrigger>
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-8">
                    {/* SYSTEM STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {systemStats.map((stat, i) => (
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
                                        <stat.icon className={`h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity ${stat.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground">{stat.trend}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: System Logs (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-black/20 border-white/5 backdrop-blur-xl h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-headline">System Activity Log</CardTitle>
                                            <CardDescription>Real-time stream of all user interactions.</CardDescription>
                                        </div>
                                        <Database className="h-5 w-5 text-slate-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-[400px]">
                                    <ScrollArea className="h-[500px] pr-4">
                                        <div className="space-y-2 font-mono text-xs">
                                            {(activities || []).length === 0 ? (
                                                <div className="text-center text-muted-foreground py-10 opacity-50">
                                                    No logs available.
                                                </div>
                                            ) : (
                                                activities.map((log, i) => (
                                                    <div key={i} className="flex gap-4 p-2 hover:bg-white/5 rounded border-b border-white/5 last:border-0 transition-colors">
                                                        <span className="opacity-50 w-24 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                        <span className={`font-bold ${log.type.includes('error') ? 'text-red-400' :
                                                            log.type.includes('warning') ? 'text-amber-400' :
                                                                'text-emerald-400'
                                                            }`}>[{log.type.toUpperCase()}]</span>
                                                        <span className="opacity-80 break-all">{log.detail || log.title}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Quick Actions (1/3) */}
                        <div className="space-y-6">
                            <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline">User Management</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search user by UID/Email..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder:text-muted-foreground/50"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-red-950/20 border-red-500/20 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-400">
                                        <ShieldAlert className="h-5 w-5" />
                                        Safe Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <button onClick={handleSeed} disabled={seeding} className="w-full text-left p-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all text-sm font-bold text-orange-500 flex items-center gap-2">
                                        <Database className="h-4 w-4" /> {seeding ? "Seeding..." : "Seed Database"}
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* COLLEGES TAB */}
                <TabsContent value="colleges" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Managed Colleges</h2>
                        <Button onClick={handleCreateCollege} className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" /> Add College
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {colleges.map(college => (
                            <Card key={college.id} className="bg-black/40 border-white/5 hover:border-white/20 transition-all">
                                <CardHeader>
                                    <CardTitle className="flex items-start justify-between">
                                        {college.name}
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> {college.location || "No location"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                            <span>ID:</span> <span className="font-mono text-white">{college.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Admin:</span> <span className="text-white">You</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* TEACHERS TAB */}
                <TabsContent value="teachers" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Faculty Members</h2>
                        <Button onClick={handleCreateTeacher} className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" /> Add Teacher
                        </Button>
                    </div>
                    <Card className="bg-black/20 border-white/5">
                        <div className="p-4">
                            {teachers.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No teachers found. Add one to a college.</p>
                            ) : (
                                <div className="space-y-4">
                                    {teachers.map(teacher => (
                                        <div key={teacher.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                    <GraduationCap className="h-5 w-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{teacher.name}</p>
                                                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                                                    {colleges.find(c => c.id === teacher.collegeId)?.name || teacher.collegeId}
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
