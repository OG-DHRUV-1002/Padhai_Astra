"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Search, FileText, Video, Image, Download,
    MoreVertical, BookOpen, Loader2, Upload, FolderOpen,
    Link as LinkIcon, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useResources } from "@/hooks/use-resources";
import { useCourses } from "@/hooks/use-courses";
import { useAuth } from "@/context/student-context";
import { Resource } from "@/lib/types";

type ResourceType = "pdf" | "video" | "document" | "link";

const TYPE_ICON: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-4 w-4 text-red-400" />,
    video: <Video className="h-4 w-4 text-purple-400" />,
    image: <Image className="h-4 w-4 text-cyan-400" />,
    document: <FileText className="h-4 w-4 text-blue-400" />,
    link: <BookOpen className="h-4 w-4 text-amber-400" />,
};

const TYPE_BADGE: Record<string, string> = {
    pdf: "text-red-400 border-red-500/20 bg-red-500/10",
    video: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    image: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    document: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    link: "text-amber-400 border-amber-500/20 bg-amber-500/10",
};

interface ResourceFormData {
    title: string;
    type: ResourceType;
    url: string;
    courseId: string;
    courseName: string;
    size: string;
}

const emptyForm: ResourceFormData = { title: "", type: "pdf", url: "", courseId: "", courseName: "", size: "" };

export default function TeacherResourcesPage() {
    const { resources, loading, addResource, updateResource, removeResource } = useResources();
    const { courses } = useCourses();
    const { userData } = useAuth();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [form, setForm] = useState<ResourceFormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        return resources.filter(res => {
            const matchesSearch = search === "" ||
                res.title.toLowerCase().includes(search.toLowerCase()) ||
                (res.courseName || "").toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === "all" || res.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [resources, search, typeFilter]);

    const typeButtons: { key: ResourceType | "all"; label: string }[] = [
        { key: "all", label: "All" },
        { key: "pdf", label: "PDFs" },
        { key: "video", label: "Videos" },
        { key: "link", label: "Links" },
        { key: "document", label: "Docs" },
    ];

    const openAddDialog = () => {
        setEditingResource(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEditDialog = (res: Resource) => {
        setEditingResource(res);
        setForm({
            title: res.title,
            type: res.type as ResourceType,
            url: res.url || "",
            courseId: res.courseId,
            courseName: res.courseName || "",
            size: res.size || "",
        });
        setDialogOpen(true);
    };

    const handleCourseSelect = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        setForm(f => ({ ...f, courseId, courseName: course?.name || "" }));
    };

    const handleSave = async () => {
        if (!form.title || !form.courseId) return;
        setSaving(true);
        try {
            if (editingResource) {
                await updateResource(editingResource.id, {
                    title: form.title,
                    type: form.type,
                    url: form.url,
                    courseId: form.courseId,
                    courseName: form.courseName,
                    size: form.size,
                });
            } else {
                await addResource({
                    title: form.title,
                    type: form.type,
                    url: form.url,
                    courseId: form.courseId,
                    courseName: form.courseName,
                    teacherId: userData?.uid || "",
                    collegeId: userData?.collegeId || "",
                    uploadedAt: new Date().toISOString().split("T")[0],
                    size: form.size,
                });
            }
            setDialogOpen(false);
            setForm(emptyForm);
        } catch (e) {
            console.error("Failed to save resource:", e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading resources...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Resource Library</h1>
                    <p className="text-muted-foreground">Manage and distribute learning materials to your students.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={openAddDialog}>
                    <Upload className="h-4 w-4" /> Upload Resource
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Resources", value: resources.length, icon: FolderOpen, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                    { label: "PDFs", value: resources.filter(r => r.type === "pdf").length, icon: FileText, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Videos", value: resources.filter(r => r.type === "video").length, icon: Video, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    { label: "Documents", value: resources.filter(r => r.type === "document").length, icon: Download, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
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

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or course..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {typeButtons.map(f => (
                        <Button
                            key={f.key}
                            variant="ghost"
                            size="sm"
                            onClick={() => setTypeFilter(f.key)}
                            className={`text-xs rounded-lg transition-all ${typeFilter === f.key
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                }`}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Resource Table */}
            <Card className="bg-black/20 border-white/5 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Resources</CardTitle>
                            <CardDescription>Showing {filtered.length} of {resources.length} resources</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FolderOpen className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-medium">{resources.length === 0 ? "No resources uploaded yet" : "No resources match your criteria"}</p>
                            {resources.length === 0 && <p className="text-sm">Upload learning materials to build your resource library.</p>}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead>Resource Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((res, i) => (
                                    <motion.tr
                                        key={res.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="group hover:bg-white/5 border-white/5 transition-colors"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {TYPE_ICON[res.type] || <FileText className="h-4 w-4 text-gray-400" />}
                                                <span className="truncate max-w-[250px]">{res.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[10px] uppercase ${TYPE_BADGE[res.type] || ""}`}>
                                                {res.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{res.courseName || "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">{res.uploadedAt}</TableCell>
                                        <TableCell className="text-muted-foreground">{res.size || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {res.url && (
                                                        <DropdownMenuItem className="gap-2" onClick={() => window.open(res.url, "_blank")}>
                                                            <LinkIcon className="h-4 w-4" /> Open Link
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(res)}>
                                                        <FileText className="h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-400 gap-2" onClick={() => removeResource(res.id)}>Delete</DropdownMenuItem>
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

            {/* Upload / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px] glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>{editingResource ? "Edit Resource" : "Upload Resource"}</DialogTitle>
                        <DialogDescription>
                            {editingResource ? "Update the resource details." : "Add a new learning material to your library."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="res-title">Title *</Label>
                            <Input
                                id="res-title"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Data Structures Notes Ch. 5"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Type *</Label>
                                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ResourceType }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="link">Link</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Course *</Label>
                                <Select value={form.courseId} onValueChange={handleCourseSelect}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="res-url">URL / Link</Label>
                            <Input
                                id="res-url"
                                value={form.url}
                                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                placeholder="https://drive.google.com/..."
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="res-size">Size (optional)</Label>
                            <Input
                                id="res-size"
                                value={form.size}
                                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                                placeholder="e.g. 2.4 MB"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.title || !form.courseId} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editingResource ? "Update" : "Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
