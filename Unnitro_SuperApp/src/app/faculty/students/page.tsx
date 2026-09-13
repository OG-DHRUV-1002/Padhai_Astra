"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, MoreVertical, Mail, Users, GraduationCap,
    TrendingUp, AlertTriangle, Plus, Trash2, Pencil, Save
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
} from "@/components/ui/dialog-shadcn";

interface StudentData {
  uid: string;
  name: string;
  email: string;
  major: string;
  cgpa: string;
  attendance: number;
  status: "active" | "at-risk";
}

const MOCK_STUDENTS: StudentData[] = [
  { uid: "s1", name: "Alex Johnson", email: "alex.j@university.edu", major: "Computer Science", cgpa: "8.5", attendance: 92, status: "active" },
  { uid: "s2", name: "Maria Garcia", email: "maria.g@university.edu", major: "Data Science", cgpa: "9.1", attendance: 95, status: "active" },
  { uid: "s3", name: "James Smith", email: "james.s@university.edu", major: "Information Tech", cgpa: "6.8", attendance: 71, status: "at-risk" },
  { uid: "s4", name: "Linda Brown", email: "linda.b@university.edu", major: "Computer Science", cgpa: "7.9", attendance: 84, status: "active" },
  { uid: "s5", name: "David Wilson", email: "david.w@university.edu", major: "Software Eng", cgpa: "5.5", attendance: 60, status: "at-risk" },
];

interface StudentForm {
    name: string;
    email: string;
    major: string;
}

const emptyForm: StudentForm = { name: "", email: "", major: "" };

export default function StudentDirectoryPage() {
    const [students, setStudents] = useState<StudentData[]>(MOCK_STUDENTS);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "at-risk">("all");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
    const [form, setForm] = useState<StudentForm>(emptyForm);

    const filtered = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = search === "" ||
                student.name.toLowerCase().includes(search.toLowerCase()) ||
                student.email.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" || student.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [students, search, statusFilter]);

    const stats = useMemo(() => {
        const all = students;
        const avgGpa = all.length > 0 ? (all.reduce((s, st) => s + parseFloat(st.cgpa), 0) / all.length).toFixed(1) : "0";
        const avgAtt = all.length > 0 ? Math.round(all.reduce((s, st) => s + st.attendance, 0) / all.length) : 0;
        const atRisk = all.filter(s => s.status === "at-risk").length;
        return { total: all.length, avgGpa, avgAtt, atRisk };
    }, [students]);

    const openAddDialog = () => {
        setEditingStudent(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEditDialog = (student: StudentData) => {
        setEditingStudent(student);
        setForm({ name: student.name, email: student.email, major: student.major });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name || !form.email) return;
        
        if (editingStudent) {
            setStudents(prev => prev.map(s => s.uid === editingStudent.uid ? { ...s, name: form.name, email: form.email, major: form.major } : s));
        } else {
            const newStudent: StudentData = {
                uid: `s_${Date.now()}`,
                name: form.name,
                email: form.email,
                major: form.major,
                cgpa: "0.0",
                attendance: 100,
                status: "active"
            };
            setStudents(prev => [...prev, newStudent]);
        }
        setDialogOpen(false);
        setForm(emptyForm);
    };

    const handleDelete = (uid: string) => {
        setStudents(prev => prev.filter(s => s.uid !== uid));
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Student Directory
                        </h1>
                        <p className="text-muted-foreground mt-2">Manage student profiles, performance, and academic records.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" className="border-white/10 bg-white/5 hover:bg-white/10">Export CSV</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={openAddDialog}>
                            <Plus className="h-4 w-4" /> Add Student
                        </Button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Students", value: stats.total, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                        { label: "Average GPA", value: stats.avgGpa, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                        { label: "Avg Attendance", value: `${stats.avgAtt}%`, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                        { label: "At Risk", value: stats.atRisk, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className={`${stat.bg} border`}>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-2xl font-bold mt-1 text-slate-200">{stat.value}</p>
                                        </div>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className="bg-white/[0.02] border-white/10">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle>All Enrolled Students</CardTitle>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                                    {(["all", "active", "at-risk"] as const).map(s => (
                                        <Button
                                            key={s}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStatusFilter(s)}
                                            className={`text-xs capitalize rounded-md px-3 h-8 ${statusFilter === s
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-900/20"
                                                : "text-slate-400 hover:text-white hover:bg-white/10"
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
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <Search className="h-10 w-10 mb-3 opacity-30" />
                                <p className="font-medium">No students match your criteria</p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/[0.02]">
                                        <TableRow className="hover:bg-transparent border-white/10">
                                            <TableHead>Student</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Major</TableHead>
                                            <TableHead>GPA</TableHead>
                                            <TableHead>Attendance</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence>
                                            {filtered.map((student, i) => (
                                                <motion.tr
                                                    key={student.uid}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="group hover:bg-white/5 border-white/5 transition-colors"
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border border-white/10">
                                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                                                                <AvatarFallback className="bg-indigo-500/20 text-indigo-400">{student.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-200">{student.name}</span>
                                                                <span className="text-xs text-slate-500">{student.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className={student.status === "at-risk"
                                                                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                                                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                                            }
                                                        >
                                                            {student.status === "at-risk" ? "At Risk" : "Active"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-400">{student.major}</TableCell>
                                                    <TableCell className="font-medium text-slate-300">{student.cgpa}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={
                                                            student.attendance > 85 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" : 
                                                            student.attendance > 75 ? "text-blue-400 border-blue-500/30 bg-blue-500/5" :
                                                            "text-amber-400 border-amber-500/30 bg-amber-500/5"
                                                        }>
                                                            {student.attendance}%
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                                                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-[#181825] border-white/10 text-slate-200">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem className="gap-2 hover:bg-white/10 focus:bg-white/10 cursor-pointer" onClick={() => openEditDialog(student)}>
                                                                    <Pencil className="h-4 w-4" /> Edit Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="gap-2 hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                                                    <Mail className="h-4 w-4" /> Message
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-white/10" />
                                                                <DropdownMenuItem className="text-red-400 gap-2 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer" onClick={() => handleDelete(student.uid)}>
                                                                    <Trash2 className="h-4 w-4" /> Remove
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add/Edit Student Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-[450px] bg-[#12121e] border-white/20 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl">{editingStudent ? "Edit Student Details" : "Add New Student"}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                {editingStudent ? "Update the student's information in the directory." : "Register a new student to your class."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="student-name">Full Name</Label>
                                <Input
                                    id="student-name"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. John Doe"
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="student-email">Email Address</Label>
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
                                <Label htmlFor="student-major">Major / Program</Label>
                                <Input
                                    id="student-major"
                                    value={form.major}
                                    onChange={e => setForm(f => ({ ...f, major: e.target.value }))}
                                    placeholder="e.g. Computer Science"
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={!form.name || !form.email} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Save className="h-4 w-4" />
                                {editingStudent ? "Save Changes" : "Create Student"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
