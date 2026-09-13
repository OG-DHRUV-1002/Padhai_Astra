"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Search, Plus, BookOpen, Clock, CheckCircle, FileEdit,
    MoreVertical, Copy, Trash2, Eye, Loader2, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuizzes } from "@/hooks/use-quizzes";
import { useCourses } from "@/hooks/use-courses";
import { useAuth } from "@/context/student-context";
import { Question, Quiz } from "@/lib/types";

type QuizStatus = "published" | "draft";

const STATUS_STYLES: Record<QuizStatus, { label: string; className: string; icon: React.ReactNode }> = {
    published: { label: "Published", className: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: <CheckCircle className="h-3 w-3" /> },
    draft: { label: "Draft", className: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: <FileEdit className="h-3 w-3" /> },
};

interface QuestionForm {
    text: string;
    options: string[];
    correctAnswer: string;
}

const emptyQuestion: QuestionForm = { text: "", options: ["", "", "", ""], correctAnswer: "" };

export default function TeacherQuizzesPage() {
    const { quizzes, loading, addQuiz, removeQuiz } = useQuizzes();
    const { courses } = useCourses();
    const { userData } = useAuth();
    const [search, setSearch] = useState("");
    const [tabFilter, setTabFilter] = useState<"all" | QuizStatus>("all");

    // Create/Edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [quizTitle, setQuizTitle] = useState("");
    const [quizCourse, setQuizCourse] = useState("");
    const [quizCourseName, setQuizCourseName] = useState("");
    const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
    const [saving, setSaving] = useState(false);

    // Preview dialog
    const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

    const quizItems = useMemo(() => {
        return quizzes.map(q => ({
            id: q.id,
            title: q.title,
            course: q.course,
            questions: q.questions?.length || 0,
            status: (q.questions?.length > 0 ? "published" : "draft") as QuizStatus,
            createdDate: "—",
            attempts: 0,
            avgScore: 0,
            _quiz: q,
        }));
    }, [quizzes]);

    const filtered = useMemo(() => {
        return quizItems.filter(q => {
            const matchesSearch = search === "" ||
                q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.course.toLowerCase().includes(search.toLowerCase());
            const matchesTab = tabFilter === "all" || q.status === tabFilter;
            return matchesSearch && matchesTab;
        });
    }, [quizItems, search, tabFilter]);

    const publishedCount = quizItems.filter(q => q.status === "published").length;
    const draftCount = quizItems.filter(q => q.status === "draft").length;
    const totalQuestions = quizItems.reduce((s, q) => s + q.questions, 0);

    const openCreateDialog = () => {
        setEditingQuiz(null);
        setQuizTitle("");
        setQuizCourse("");
        setQuizCourseName("");
        setQuestions([{ ...emptyQuestion }]);
        setDialogOpen(true);
    };

    const openEditDialog = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        setQuizTitle(quiz.title);
        setQuizCourse(quiz.courseId || "");
        setQuizCourseName(quiz.course);
        setQuestions(
            quiz.questions.length > 0
                ? quiz.questions.map(q => ({
                    text: q.text,
                    options: [...q.options],
                    correctAnswer: q.correctAnswer,
                }))
                : [{ ...emptyQuestion }]
        );
        setDialogOpen(true);
    };

    const handleDuplicate = async (quiz: Quiz) => {
        try {
            await addQuiz({
                title: `${quiz.title} (Copy)`,
                course: quiz.course,
                courseId: quiz.courseId,
                teacherId: userData?.uid || "",
                collegeId: userData?.collegeId || "",
                questions: quiz.questions,
                coverImageId: quiz.coverImageId,
            });
        } catch (err) {
            console.error("Failed to duplicate quiz:", err);
        }
    };

    const handleCourseSelect = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        setQuizCourse(courseId);
        setQuizCourseName(course?.name || "");
    };

    const updateQuestion = (idx: number, field: keyof QuestionForm, value: string) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const newOpts = [...q.options];
            newOpts[optIdx] = value;
            return { ...q, options: newOpts };
        }));
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, { ...emptyQuestion }]);
    };

    const removeQuestion = (idx: number) => {
        if (questions.length <= 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!quizTitle || !quizCourse) return;
        setSaving(true);
        try {
            const builtQuestions: Question[] = questions
                .filter(q => q.text.trim())
                .map((q, i) => ({
                    id: `q-${i}`,
                    text: q.text,
                    options: q.options.filter(o => o.trim()),
                    correctAnswer: q.correctAnswer,
                }));

            const quizData = {
                title: quizTitle,
                course: quizCourseName,
                courseId: quizCourse,
                teacherId: userData?.uid || "",
                collegeId: userData?.collegeId || "",
                questions: builtQuestions,
                coverImageId: "1",
            };

            if (editingQuiz) {
                // For simplicity, delete and re-create since updateQuiz is available
                await removeQuiz(editingQuiz.id);
                await addQuiz(quizData);
            } else {
                await addQuiz(quizData);
            }
            setDialogOpen(false);
        } catch (err) {
            console.error("Failed to save quiz:", err);
        } finally {
            setSaving(false);
        }
    };

    function QuizTable({ quizzes: tableQuizzes }: { quizzes: typeof quizItems }) {
        return tableQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No quizzes match your criteria</p>
            </div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead>Quiz Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableQuizzes.map((quiz, i) => (
                        <motion.tr
                            key={quiz.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="group hover:bg-white/5 border-white/5 transition-colors"
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
                                    <span className="truncate max-w-[220px]">{quiz.title}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{quiz.course}</TableCell>
                            <TableCell>{quiz.questions}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`text-[10px] gap-1 ${STATUS_STYLES[quiz.status].className}`}>
                                    {STATUS_STYLES[quiz.status].icon}
                                    {STATUS_STYLES[quiz.status].label}
                                </Badge>
                            </TableCell>
                            <TableCell>{quiz.attempts > 0 ? quiz.attempts : "—"}</TableCell>
                            <TableCell>
                                {quiz.avgScore > 0 ? (
                                    <span className={quiz.avgScore >= 80 ? "text-emerald-400" : quiz.avgScore >= 60 ? "text-amber-400" : "text-red-400"}>
                                        {quiz.avgScore}%
                                    </span>
                                ) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="gap-2" onClick={() => setPreviewQuiz(quiz._quiz)}>
                                            <Eye className="h-4 w-4" /> Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(quiz._quiz)}>
                                            <FileEdit className="h-4 w-4" /> Edit Quiz
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(quiz._quiz)}>
                                            <Copy className="h-4 w-4" /> Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-400 gap-2" onClick={() => removeQuiz(quiz.id)}>
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </motion.tr>
                    ))}
                </TableBody>
            </Table>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading quizzes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Quiz Manager</h1>
                    <p className="text-muted-foreground">Create, manage, and track quiz performance.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" /> Create Quiz
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Quizzes", value: quizItems.length, icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "Published", value: publishedCount, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Drafts", value: draftCount, icon: FileEdit, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Total Questions", value: totalQuestions, icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
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
                <Input placeholder="Search by title or course..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10" />
            </div>

            {/* Tabbed List */}
            <Tabs defaultValue="all" className="space-y-4" onValueChange={v => setTabFilter(v as "all" | QuizStatus)}>
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="all">All ({quizItems.length})</TabsTrigger>
                    <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
                    <TabsTrigger value="draft">Drafts ({draftCount})</TabsTrigger>
                </TabsList>

                {["all", "published", "draft"].map(tab => (
                    <TabsContent key={tab} value={tab}>
                        <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>{tab === "all" ? "All Quizzes" : tab === "published" ? "Published Quizzes" : "Draft Quizzes"}</CardTitle>
                                <CardDescription>Showing {filtered.length} quizzes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <QuizTable quizzes={filtered} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Create/Edit Quiz Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
                        <DialogDescription>Build a question paper with multiple-choice questions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quiz-title">Quiz Title *</Label>
                                <Input id="quiz-title" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g. Mid-term Review" className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Course *</Label>
                                <Select value={quizCourse} onValueChange={handleCourseSelect}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select course" /></SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Questions ({questions.length})</h3>
                                <Button variant="outline" size="sm" onClick={addQuestion} className="text-xs border-white/10">
                                    <Plus className="h-3 w-3 mr-1" /> Add Question
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-400">Question {qIdx + 1}</span>
                                            {questions.length > 1 && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeQuestion(qIdx)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <Input
                                            value={q.text}
                                            onChange={e => updateQuestion(qIdx, "text", e.target.value)}
                                            placeholder="Enter question text..."
                                            className="bg-white/5 border-white/10"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-4">{String.fromCharCode(65 + optIdx)}.</span>
                                                    <Input
                                                        value={opt}
                                                        onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                        className="bg-white/5 border-white/10 text-sm h-9"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Correct Answer</Label>
                                            <Select value={q.correctAnswer} onValueChange={v => updateQuestion(qIdx, "correctAnswer", v)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
                                                    <SelectValue placeholder="Select correct answer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {q.options.filter(o => o.trim()).map((opt, i) => (
                                                        <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !quizTitle || !quizCourse} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editingQuiz ? "Update Quiz" : "Create Quiz"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewQuiz} onOpenChange={() => setPreviewQuiz(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>Quiz Preview: {previewQuiz?.title}</DialogTitle>
                        <DialogDescription>Course: {previewQuiz?.course}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {previewQuiz?.questions.map((q, i) => (
                            <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="font-medium mb-2">Q{i + 1}. {q.text}</p>
                                <div className="grid gap-1.5 ml-4">
                                    {q.options.map((opt, j) => (
                                        <div key={j} className={`text-sm px-3 py-1.5 rounded-lg ${opt === q.correctAnswer ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-muted-foreground"}`}>
                                            {String.fromCharCode(65 + j)}. {opt}
                                            {opt === q.correctAnswer && <CheckCircle className="h-3 w-3 inline ml-2" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!previewQuiz?.questions || previewQuiz.questions.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">No questions in this quiz yet.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
