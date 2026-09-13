"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, Download, Filter, Plus, Loader2, FileText,
    Trash2, Pencil, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCourses } from "@/hooks/use-courses";
import { useGrades } from "@/hooks/use-grades";
import { useAuth } from "@/context/student-context";
import { getAllCollegeStudents } from "@/lib/db-service";
import { UserData, Grade } from "@/lib/types";
import { useEffect } from "react";

interface GradeForm {
    studentId: string;
    studentName: string;
    courseId: string;
    courseName: string;
    type: Grade["type"];
    score: number;
    maxScore: number;
    feedback: string;
    date: string;
}

const emptyGradeForm: GradeForm = {
    studentId: "", studentName: "", courseId: "", courseName: "",
    type: "assignment", score: 0, maxScore: 100, feedback: "",
    date: new Date().toISOString().split("T")[0],
};

export default function GradebookPage() {
    const { courses, loading: coursesLoading } = useCourses();
    const { grades, loading: gradesLoading, addGrade, updateGrade, removeGrade } = useGrades();
    const { userData } = useAuth();

    const [students, setStudents] = useState<UserData[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
    const [form, setForm] = useState<GradeForm>(emptyGradeForm);
    const [saving, setSaving] = useState(false);

    const loading = coursesLoading || gradesLoading;

    // Fetch students for dropdown
    useEffect(() => {
        if (userData?.collegeId) {
            getAllCollegeStudents(userData.collegeId).then(setStudents).catch(console.error);
        }
    }, [userData?.collegeId]);

    const classAverage = useMemo(() => {
        if (courses.length === 0) return 0;
        const total = courses.reduce((sum, c) => sum + (c.grade || 0), 0);
        return Math.round((total / courses.length) * 10) / 10;
    }, [courses]);

    const gradeItems = useMemo(() => {
        return grades.map(g => ({
            ...g,
            title: g.feedback || `${g.type} — ${g.courseName || g.courseId}`,
            course: g.courseName || g.courseId,
        }));
    }, [grades]);

    const openAddDialog = () => {
        setEditingGrade(null);
        setForm(emptyGradeForm);
        setDialogOpen(true);
    };

    const openEditDialog = (grade: Grade) => {
        setEditingGrade(grade);
        setForm({
            studentId: grade.studentId,
            studentName: grade.studentName || "",
            courseId: grade.courseId,
            courseName: grade.courseName || "",
            type: grade.type,
            score: grade.score,
            maxScore: grade.maxScore,
            feedback: grade.feedback || "",
            date: grade.date,
        });
        setDialogOpen(true);
    };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find(s => s.uid === studentId);
        setForm(f => ({ ...f, studentId, studentName: student?.name || "" }));
    };

    const handleCourseSelect = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        setForm(f => ({ ...f, courseId, courseName: course?.name || "" }));
    };

    const handleSave = async () => {
        if (!form.studentId || !form.courseId) return;
        setSaving(true);
        try {
            if (editingGrade) {
                await updateGrade(editingGrade.id, {
                    studentId: form.studentId,
                    studentName: form.studentName,
                    courseId: form.courseId,
                    courseName: form.courseName,
                    type: form.type,
                    score: form.score,
                    maxScore: form.maxScore,
                    feedback: form.feedback,
                    date: form.date,
                });
            } else {
                await addGrade({
                    studentId: form.studentId,
                    studentName: form.studentName,
                    courseId: form.courseId,
                    courseName: form.courseName,
                    teacherId: userData?.uid || "",
                    type: form.type,
                    score: form.score,
                    maxScore: form.maxScore,
                    feedback: form.feedback,
                    date: form.date,
                });
            }
            setDialogOpen(false);
            setForm(emptyGradeForm);
        } catch (err) {
            console.error("Failed to save grade:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gradebook</h1>
                    <p className="text-muted-foreground">Track assignment submissions and grades.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-white/10"><Download className="h-4 w-4 mr-2" /> Export</Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={openAddDialog}>
                        <Plus className="h-4 w-4 mr-2" /> New Assignment
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Grade Distribution Chart */}
                <Card className="md:col-span-2 bg-black/20 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Grade Distribution</CardTitle>
                        <CardDescription>
                            {courses.length > 0 ? "Average scores across active courses" : "No courses loaded yet"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[220px] flex flex-col justify-end">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm">No courses to display.</p>
                            </div>
                        ) : (
                            <div className="flex items-end gap-4 h-40 w-full px-6">
                                {courses.map((course, i) => (
                                    <div key={course.id || i} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(course.grade || 0) * 1.5}px` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-md relative group cursor-pointer hover:from-indigo-500 hover:to-violet-400 transition-colors"
                                        >
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {course.grade}%
                                            </div>
                                        </motion.div>
                                        <span className="text-[9px] text-muted-foreground text-center font-medium max-w-[60px] truncate">{course.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                    <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-muted-foreground">Class Average</span>
                            <span className="font-bold text-xl">{loading ? "—" : classAverage > 0 ? `${classAverage}%` : "—"}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-muted-foreground">Total Courses</span>
                            <span className="font-bold text-xl">{loading ? "—" : courses.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-muted-foreground">Total Grades</span>
                            <span className="font-bold text-xl">{loading ? "—" : grades.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="courses" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="courses">Active Courses</TabsTrigger>
                    <TabsTrigger value="grades">Grades</TabsTrigger>
                </TabsList>

                <TabsContent value="courses">
                    <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                        <CardHeader><CardTitle>Active Courses & Grades</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                            ) : courses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <FileText className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="font-medium">No courses yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead>Course Name</TableHead>
                                            <TableHead>Instructor</TableHead>
                                            <TableHead>Class Average</TableHead>
                                            <TableHead>Attendance</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courses.map((course, i) => (
                                            <motion.tr key={course.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 border-white/5">
                                                <TableCell className="font-medium">{course.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{course.instructor}</TableCell>
                                                <TableCell>{course.grade}%</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={(course.attendance || 0) > 85 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-amber-400 border-amber-500/30 bg-amber-500/10"}>{course.attendance}%</Badge>
                                                </TableCell>
                                                <TableCell><Badge variant="secondary" className="bg-white/10">Active</Badge></TableCell>
                                            </motion.tr>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="grades">
                    <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-indigo-400" /> All Grades
                                    </CardTitle>
                                    <CardDescription>{gradeItems.length} total entries</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {gradesLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                            ) : gradeItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <FileText className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="font-medium">No grades recorded yet</p>
                                    <p className="text-sm">Click "New Assignment" to add grades.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead>Student</TableHead>
                                            <TableHead>Course</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gradeItems.map((item, i) => (
                                            <motion.tr key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="hover:bg-white/5 border-white/5 group">
                                                <TableCell className="font-medium">{item.studentName || item.studentId}</TableCell>
                                                <TableCell className="text-muted-foreground">{item.course}</TableCell>
                                                <TableCell>
                                                    <span className={item.score / item.maxScore >= 0.7 ? "text-emerald-400" : "text-amber-400"}>{item.score}</span>
                                                    <span className="text-muted-foreground">/{item.maxScore}</span>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge></TableCell>
                                                <TableCell className="text-muted-foreground">{item.date}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(item)}>
                                                                <Pencil className="h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-400 gap-2" onClick={() => removeGrade(item.id)}>
                                                                <Trash2 className="h-4 w-4" /> Delete
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
                </TabsContent>
            </Tabs>

            {/* Add/Edit Grade Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[550px] glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>{editingGrade ? "Edit Grade" : "New Assignment / Grade"}</DialogTitle>
                        <DialogDescription>
                            {editingGrade ? "Update the grade entry." : "Record a new grade for a student."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Student *</Label>
                                <Select value={form.studentId} onValueChange={handleStudentSelect}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select student" /></SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Course *</Label>
                                <Select value={form.courseId} onValueChange={handleCourseSelect}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select course" /></SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Grade["type"] }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="assignment">Assignment</SelectItem>
                                        <SelectItem value="exam">Exam</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="grade-score">Score *</Label>
                                <Input id="grade-score" type="number" value={form.score} onChange={e => setForm(f => ({ ...f, score: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="grade-max">Max Score</Label>
                                <Input id="grade-max" type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: parseInt(e.target.value) || 100 }))} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="grade-feedback">Feedback</Label>
                            <Input id="grade-feedback" value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} placeholder="e.g. Great work on Q3!" className="bg-white/5 border-white/10" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="grade-date">Date</Label>
                            <Input id="grade-date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-white/5 border-white/10" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.studentId || !form.courseId} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editingGrade ? "Update" : "Add Grade"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
