"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Users, Globe, ExternalLink, Loader2, Search, GraduationCap, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getColleges, getAllUsers, createCollege } from "@/lib/db-service";
import { College, UserData } from "@/lib/types";
import { useStudent } from "@/context/student-context";

export default function CollegesPage() {
    const { studentData: userData } = useStudent();
    const [colleges, setColleges] = useState<College[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [newType, setNewType] = useState<'college' | 'organization'>('college');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (userData?.uid) {
                try {
                    const [collegeData, usersData] = await Promise.all([
                        getColleges(userData.uid),
                        getAllUsers()
                    ]);
                    setColleges(collegeData);
                    setAllUsers(usersData);
                } catch (error) {
                    console.error("Failed to fetch data", error);
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchData();
    }, [userData]);

    const handleCreateCollege = async () => {
        if (!newName.trim()) {
            setCreateError("College name is required.");
            return;
        }
        if (!userData?.uid) {
            setCreateError("You must be logged in as an admin.");
            return;
        }

        setCreating(true);
        setCreateError(null);
        try {
            const id = await createCollege({
                name: newName.trim(),
                adminId: userData.uid,
                location: newLocation.trim() || undefined,
                type: newType,
            });
            // Add the new college to local state immediately
            setColleges(prev => [
                ...prev,
                {
                    id,
                    name: newName.trim(),
                    adminId: userData.uid,
                    location: newLocation.trim() || undefined,
                    type: newType,
                },
            ]);
            // Reset & close
            setNewName("");
            setNewLocation("");
            setDialogOpen(false);
        } catch (err: any) {
            console.error("Failed to create college", err);
            setCreateError(err.message || "Failed to create college. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const collegeStats = useMemo(() => {
        const map: Record<string, { students: number; teachers: number }> = {};
        colleges.forEach(c => { map[c.id] = { students: 0, teachers: 0 }; });
        allUsers.forEach(u => {
            if (u.collegeId && map[u.collegeId]) {
                if (u.role === "student") map[u.collegeId].students++;
                if (u.role === "teacher") map[u.collegeId].teachers++;
            }
        });
        return map;
    }, [colleges, allUsers]);

    const totalStudents = useMemo(() => allUsers.filter(u => u.role === "student").length, [allUsers]);
    const totalTeachers = useMemo(() => allUsers.filter(u => u.role === "teacher").length, [allUsers]);

    const filteredColleges = useMemo(() => {
        if (!search) return colleges;
        return colleges.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.location || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [colleges, search]);

    // Shared dialog content
    const registerDialog = (
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Register New College</DialogTitle>
                <DialogDescription>
                    Add a new college or institution to the platform.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="college-name">College Name <span className="text-red-400">*</span></Label>
                    <Input
                        id="college-name"
                        placeholder="e.g. MIT World Peace University"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); setCreateError(null); }}
                        className="bg-white/5 border-white/10"
                        disabled={creating}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="college-location">Location</Label>
                    <Input
                        id="college-location"
                        placeholder="e.g. Pune, Maharashtra"
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                        className="bg-white/5 border-white/10"
                        disabled={creating}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="college-type">Institution Type</Label>
                    <Select value={newType} onValueChange={(val: any) => setNewType(val)} disabled={creating}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="college">College / University</SelectItem>
                            <SelectItem value="organization">Organization / Company</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {createError && (
                    <p className="text-sm text-red-400">{createError}</p>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                    Cancel
                </Button>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    onClick={handleCreateCollege}
                    disabled={creating || !newName.trim()}
                >
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {creating ? "Creating..." : "Register College"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">College Management</h1>
                    <p className="text-muted-foreground">Oversee partner institutions and their configurations.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Plus className="h-4 w-4" /> Register College
                        </Button>
                    </DialogTrigger>
                    {registerDialog}
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Colleges", value: loading ? "—" : colleges.length, icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "Total Students", value: loading ? "—" : totalStudents, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Total Teachers", value: loading ? "—" : totalTeachers, icon: Briefcase, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={`${stat.bg} backdrop-blur-xl`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search colleges by name or location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10"
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredColleges.length === 0 && search ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Search className="h-10 w-10 mb-3 opacity-30" />
                    <p className="font-medium">No colleges match &quot;{search}&quot;</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredColleges.map((college, i) => {
                        const stats = collegeStats[college.id] || { students: 0, teachers: 0 };
                        return (
                            <motion.div
                                key={college.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <Card className="bg-black/20 border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all group h-full flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                                <Building2 className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                                                Active
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4">{college.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> {college.location || "Online"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">Type</span>
                                                <span className="font-medium capitalize">{college.type || "College"}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">Admin</span>
                                                <span className="font-medium">1 Main</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3 text-emerald-400" />
                                                <span className="text-foreground font-semibold">{stats.students}</span> Students
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3 text-cyan-400" />
                                                <span className="text-foreground font-semibold">{stats.teachers}</span> Teachers
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button variant="ghost" className="flex-1 text-xs gap-2 group-hover:bg-white/5">
                                            Manage Details <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        );
                    })}

                    {/* Add New Card — opens the same dialog */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="w-full h-full min-h-[280px] rounded-xl border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-indigo-400 group"
                        >
                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-medium">Register New Institution</span>
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
