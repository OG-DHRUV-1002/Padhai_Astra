"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
const INITIAL_WEEKS = Array.from({ length: 13 }, (_, i) => ({
  id: `week_${i + 1}`,
  number: i + 1,
  unit: i < 3 ? 1 : i < 6 ? 2 : i < 10 ? 3 : 4,
  topic: `Topic ${i + 1}`,
  isScheduled: true,
  isCompleted: i < 4,
}));

const INITIAL_ASSIGNMENTS = [
  { id: "ass_1", title: "Unit 1 Quiz", type: "Theory", deadline: "2026-10-15", status: "Published" },
  { id: "ass_2", title: "Lab Experiment 3", type: "Practical", deadline: "2026-10-22", status: "Draft" },
];

export default function CurriculumProgressPage() {
  const [weeks, setWeeks] = useState(INITIAL_WEEKS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);

  const toggleWeekCompletion = (id: string) => {
    setWeeks(weeks.map(w => w.id === id ? { ...w, isCompleted: !w.isCompleted } : w));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      { id: `ass_${Date.now()}`, title: "New Assignment", type: "Theory", deadline: "", status: "Draft" }
    ]);
  };

  const completedWeeks = weeks.filter(w => w.isCompleted).length;
  const progressPercent = Math.round((completedWeeks / weeks.length) * 100);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Curriculum Progress & Planner
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your 13-week course schedule, track unit completion, and schedule assignments.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white/[0.02] border-white/10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Total Units</h3>
            </div>
            <p className="text-3xl font-bold">4</p>
          </Card>
          
          <Card className="p-4 bg-white/[0.02] border-white/10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CalendarDays className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Weeks Completed</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{completedWeeks} <span className="text-lg text-slate-500">/ 13</span></p>
          </Card>

          <Card className="p-4 bg-white/[0.02] border-white/10 md:col-span-2">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              Syllabus Completion
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-bold text-cyan-400 w-12 text-right">{progressPercent}%</span>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="planner" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
              Weekly Planner
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Assignments & Practicals
            </TabsTrigger>
          </TabsList>

          {/* WEEKLY PLANNER TAB */}
          <TabsContent value="planner" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">13-Week Schedule</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {weeks.map((week) => (
                <Card 
                  key={week.id} 
                  className={`p-4 flex items-center gap-4 border transition-all ${
                    week.isCompleted 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="cursor-grab hover:text-indigo-400 transition-colors text-slate-600">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="w-20 text-center shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Week</div>
                    <div className={`text-2xl font-black ${week.isCompleted ? "text-emerald-500" : "text-slate-300"}`}>
                      {week.number}
                    </div>
                  </div>
                  
                  <div className="flex-1 border-l border-white/10 pl-6 space-y-2">
                    <div className="flex items-center gap-3">
                      <Select 
                        value={week.unit.toString()} 
                        onValueChange={(val) => {
                          const newWeeks = [...weeks];
                          const wIndex = newWeeks.findIndex(w => w.id === week.id);
                          newWeeks[wIndex].unit = parseInt(val);
                          setWeeks(newWeeks);
                        }}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Unit 1</SelectItem>
                          <SelectItem value="2">Unit 2</SelectItem>
                          <SelectItem value="3">Unit 3</SelectItem>
                          <SelectItem value="4">Unit 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        value={week.topic}
                        onChange={(e) => {
                          const newWeeks = [...weeks];
                          const wIndex = newWeeks.findIndex(w => w.id === week.id);
                          newWeeks[wIndex].topic = e.target.value;
                          setWeeks(newWeeks);
                        }}
                        className="h-8 bg-transparent border-transparent hover:border-white/10 focus-visible:ring-0 px-2 font-semibold text-slate-200"
                      />
                    </div>
                    <div className="text-sm text-slate-400 pl-1">
                      {week.isScheduled ? "Scheduled classes available." : "No classes scheduled yet."}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <Button 
                      variant={week.isCompleted ? "secondary" : "outline"}
                      className={`gap-2 ${week.isCompleted ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none" : "border-white/10 hover:bg-white/5"}`}
                      onClick={() => toggleWeekCompletion(week.id)}
                    >
                      {week.isCompleted ? (
                        <><CheckCircle2 className="h-4 w-4" /> Completed</>
                      ) : (
                        "Mark Complete"
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">To-Do & Deadlines</h2>
                <p className="text-sm text-slate-400">Track and publish assignments or practicals.</p>
              </div>
              <Button onClick={addAssignment} className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold gap-2">
                <Plus className="h-4 w-4" /> Create Assignment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {assignments.map((assignment) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="p-5 bg-white/[0.02] border-white/10 hover:border-white/20 transition-all flex flex-col gap-4 h-full">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5 flex-1 pr-4">
                          <Input 
                            value={assignment.title} 
                            onChange={(e) => {
                              const newAssigns = [...assignments];
                              const idx = newAssigns.findIndex(a => a.id === assignment.id);
                              newAssigns[idx].title = e.target.value;
                              setAssignments(newAssigns);
                            }}
                            className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-600"
                            placeholder="Assignment Title"
                          />
                          <div className="flex gap-2">
                            <Badge className={assignment.type === 'Theory' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-pink-500/20 text-pink-300'}>
                              {assignment.type}
                            </Badge>
                            <Badge className={assignment.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteAssignment(assignment.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                        <div className="grid gap-2">
                          <Label className="text-xs text-slate-400 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Deadline
                          </Label>
                          <Input 
                            type="date" 
                            value={assignment.deadline}
                            onChange={(e) => {
                              const newAssigns = [...assignments];
                              const idx = newAssigns.findIndex(a => a.id === assignment.id);
                              newAssigns[idx].deadline = e.target.value;
                              setAssignments(newAssigns);
                            }}
                            className="bg-white/5 border-white/10 text-slate-300"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10"
                            onClick={() => {
                              const newAssigns = [...assignments];
                              const idx = newAssigns.findIndex(a => a.id === assignment.id);
                              newAssigns[idx].type = newAssigns[idx].type === 'Theory' ? 'Practical' : 'Theory';
                              setAssignments(newAssigns);
                            }}
                          >
                            Toggle Type
                          </Button>
                          <Button 
                            className={`flex-1 ${assignment.status === 'Published' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            onClick={() => {
                              const newAssigns = [...assignments];
                              const idx = newAssigns.findIndex(a => a.id === assignment.id);
                              newAssigns[idx].status = newAssigns[idx].status === 'Draft' ? 'Published' : 'Draft';
                              setAssignments(newAssigns);
                            }}
                          >
                            {assignment.status === 'Draft' ? 'Publish' : 'Unpublish'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {assignments.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p>No assignments or practicals scheduled.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
