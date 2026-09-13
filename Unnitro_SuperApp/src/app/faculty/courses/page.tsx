"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog-shadcn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Layers, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  examMode: "Theory" | "Practical" | "Both";
  assessmentMode: "Mid-term Only" | "Mid-term & End-term";
  status: "Active" | "Draft";
}

const INITIAL_COURSES: Course[] = [
  { id: "c1", code: "CS-401", name: "Advanced Machine Learning", credits: 4, examMode: "Theory", assessmentMode: "Mid-term & End-term", status: "Active" },
  { id: "c2", code: "CS-405", name: "AI Lab", credits: 2, examMode: "Practical", assessmentMode: "Mid-term Only", status: "Active" },
];

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    code: "", name: "", credits: 3, examMode: "Theory", assessmentMode: "Mid-term & End-term", status: "Draft"
  });

  const handleCreateCourse = () => {
    if (!newCourse.code || !newCourse.name) return;
    
    setCourses([...courses, { ...newCourse, id: `c_${Date.now()}` } as Course]);
    setNewCourse({ code: "", name: "", credits: 3, examMode: "Theory", assessmentMode: "Mid-term & End-term", status: "Draft" });
    setIsDialogOpen(false);
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Course Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage curriculum subjects, credits, and assessment structures.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-[#12121e] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl">Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input 
                      placeholder="e.g. CS-101" 
                      value={newCourse.code}
                      onChange={e => setNewCourse({...newCourse, code: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input 
                      type="number" 
                      min={1} max={6}
                      value={newCourse.credits}
                      onChange={e => setNewCourse({...newCourse, credits: Number(e.target.value)})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input 
                    placeholder="e.g. Introduction to Programming" 
                    value={newCourse.name}
                    onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Examination Mode</Label>
                  <Select value={newCourse.examMode} onValueChange={(v: any) => setNewCourse({...newCourse, examMode: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Theory">Theory Only</SelectItem>
                      <SelectItem value="Practical">Practical Only</SelectItem>
                      <SelectItem value="Both">Theory + Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assessment Structure</Label>
                  <Select value={newCourse.assessmentMode} onValueChange={(v: any) => setNewCourse({...newCourse, assessmentMode: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid-term Only">Mid-term Only (Internal)</SelectItem>
                      <SelectItem value="Mid-term & End-term">Mid-term & End-term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCreateCourse} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                  disabled={!newCourse.code || !newCourse.name}
                >
                  Create Course
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 bg-white/[0.02] p-2 rounded-xl border border-white/5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search courses..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-sm h-10"
            />
          </div>
          <Button variant="secondary" size="icon" className="border-white/10 bg-white/5 h-10 w-10">
            <Settings2 className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredCourses.map(course => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-5 bg-white/[0.02] border-white/10 hover:border-white/20 transition-all flex flex-col h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => deleteCourse(course.id)} className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                      <BookOpen className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 text-lg leading-tight pr-8">{course.name}</h3>
                      <p className="text-sm font-mono text-emerald-400/80">{course.code}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Credits</span>
                      <span className="font-medium bg-white/5 px-2 py-0.5 rounded">{course.credits}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Exam Mode</span>
                      <span className="font-medium">{course.examMode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Assessment</span>
                      <span className="font-medium text-right max-w-[140px] truncate">{course.assessmentMode}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <Badge variant="secondary" className={course.status === 'Active' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-slate-500/30'}>
                      {course.status}
                    </Badge>
                    <Button variant="link" className="h-auto p-0 text-emerald-400 text-sm">Edit Details</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
