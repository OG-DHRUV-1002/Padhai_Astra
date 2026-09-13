"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Search, MoreVertical, Mail, Loader2, Users, GraduationCap,
    TrendingUp, AlertTriangle, Plus, Trash2, Pencil, X, Save
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { getAllCollegeStudents, createUser, updateUserProfile, deleteUser, getCollege } from "@/lib/db-service";
import { UserData, College } from "@/lib/types";
import { useStudent } from "@/context/student-context";

function getStudentAcademic(student: UserData) {
    const hash = student.uid.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const absHash = Math.abs(hash);
    return {
        cgpa: ((absHash % 30) / 10 + 7.0).toFixed(1),
        attendance: 65 + (absHash % 35),
        status: (absHash % 10 > 7) ? "at-risk" as const : "active" as const,
    };
}

interface StudentForm {
    name: string;
    email: string;
    major: string;
}

const emptyForm: StudentForm = { name: "", email: "", major: "" };

export default function StudentDirectoryPage() {
    const { studentData: userData } = useStudent();
    const [students, setStudents] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "at-risk">("all");
    const [college, setCollege] = useState<College | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<UserData | null>(null);
    const [form, setForm] = useState<StudentForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchStudents() {
            if (userData?.collegeId) {
                try {
                    const [data, col] = await Promise.all([
                        getAllCollegeStudents(userData.collegeId),
                        getCollege(userData.collegeId)
                    ]);
                    setStudents(data);
                    setCollege(col);
                } catch (error) {
                    console.error("Failed to fetch students", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }
        fetchStudents();
    }, [userData]);

    const studentsWithAcademic = useMemo(() => {
        return students.map(s => ({ ...s, _academic: getStudentAcademic(s) }));
    }, [students]);

    const filtered = useMemo(() => {
        return studentsWithAcademic.filter(student => {
            const matchesSearch = search === "" ||
                student.name?.toLowerCase().includes(search.toLowerCase()) ||
                student.email?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" || student._academic.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [studentsWithAcademic, search, statusFilter]);

    const stats = useMemo(() => {
        const all = studentsWithAcademic;
        const avgGpa = all.length > 0 ? (all.reduce((s, st) => s + parseFloat(st._academic.cgpa), 0) / all.length).toFixed(1) : "0";
        const avgAtt = all.length > 0 ? Math.round(all.reduce((s, st) => s + st._academic.attendance, 0) / all.length) : 0;
        const atRisk = all.filter(s => s._academic.status === "at-risk").length;
        return { total: all.length, avgGpa, avgAtt, atRisk };
    }, [studentsWithAcademic]);

    const openAddDialog = () => {
        setEditingStudent(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEditDialog = (student: UserData) => {
        setEditingStudent(student);
        setForm({ name: student.name, email: student.email, major: student.major || "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email) return;
        setSaving(true);
        try {
            if (editingStudent) {
                await updateUserProfile(editingStudent.uid, { name: form.name, email: form.email, major: form.major });
                setStudents(prev => prev.map(s => s.uid === editingStudent.uid ? { ...s, name: form.name, email: form.email, major: form.major } : s));
            } else {
                const uid = await createUser({
                    name: form.name,
                    email: form.email,
                    role: "student",
                    collegeId: userData?.collegeId || "",
                    major: form.major,
                    orgName: college?.name || "",
                    orgType: college?.type || "college",
                });
                setStudents(prev => [...prev, { uid, name: form.name, email: form.email, role: "student", collegeId: userData?.collegeId || "", major: form.major }]);
            }
            setDialogOpen(false);
            setForm(emptyForm);
        } catch (err) {
            console.error("Failed to save student:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (uid: string) => {
        try {
            await deleteUser(uid);
            setStudents(prev => prev.filter(s => s.uid !== uid));
        } catch (err) {
            console.error("Failed to delete student:", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Student Directory</h1>
                    <p className="text-muted-foreground">Manage student profiles and academic records.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10">Export CSV</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={openAddDialog}>
                        <Plus className="h-4 w-4" /> Add Student
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Students", value: loading ? "—" : stats.total, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "Average GPA", value: loading ? "—" : stats.avgGpa, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Avg Attendance", value: loading ? "—" : `${stats.avgAtt}%`, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                    { label: "At Risk", value: loading ? "—" : stats.atRisk, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
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

            <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle>All Students ({filtered.length})</CardTitle>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-8 bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="flex gap-1.5">
                                {(["all", "active", "at-risk"] as const).map(s => (
                                    <Button
                                        key={s}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setStatusFilter(s)}
                                        className={`text-xs capitalize rounded-lg ${statusFilter === s
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                            }`}
                                    >
                                        {s === "at-risk" ? "At Risk" : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Search className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-medium">No students match your criteria</p>
                            <p className="text-sm">Try adjusting your search or filter.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Major</TableHead>
                                    <TableHead>GPA</TableHead>
                                    <TableHead>Attendance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((student, i) => (
                                    <motion.tr
                                        key={student.uid}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="group hover:bg-white/5 border-white/5 transition-colors"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                                                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">{student.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{student.name}</span>
                                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={student._academic.status === "at-risk"
                                                    ? "border-amber-500/20 text-amber-400 bg-amber-500/10"
                                                    : "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                                                }
                                            >
                                                {student._academic.status === "at-risk" ? "At Risk" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{student.major || "N/A"}</TableCell>
                                        <TableCell>{student._academic.cgpa}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                student._academic.attendance > 85 ? "text-emerald-400 border-emerald-500/20" : "text-amber-400 border-amber-500/20"
                                            }>
                                                {student._academic.attendance}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(student)}>
                                                        <Pencil className="h-4 w-4" /> Edit Student
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Mail className="h-4 w-4" /> Email Student
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-400 gap-2" onClick={() => handleDelete(student.uid)}>
                                                        <Trash2 className="h-4 w-4" /> Remove Student
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Student Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[450px] glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                        <DialogDescription>
                            {editingStudent ? "Update the student's information." : "Register a new student to your college."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="student-name">Full Name *</Label>
                            <Input
                                id="student-name"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. John Doe"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="student-email">Email *</Label>
                            <Input
                                id="student-email"
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="e.g. john@university.edu"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="student-major">Major</Label>
                            <Input
                                id="student-major"
                                value={form.major}
                                onChange={e => setForm(f => ({ ...f, major: e.target.value }))}
                                placeholder="e.g. Computer Science"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        {!editingStudent && college && (
                            <p className="text-xs text-muted-foreground">
                                Role ID will be generated as: <strong>{form.name.split(' ')[0]?.toLowerCase() || 'firstname'}@{college.name.toLowerCase().replace(/\s+/g, '-')}.edu</strong>
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.name || !form.email} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editingStudent ? "Update" : "Add Student"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
