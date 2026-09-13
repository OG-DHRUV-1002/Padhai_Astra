"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, CheckCircle2, Save, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "descriptive";
  options?: string[];
  correctOptionIndex?: number;
  marks: number;
}

interface Paper {
  id: string;
  title: string;
  type: "Quiz" | "Question Paper" | "Assignment";
  courseId: string;
  durationMins: number;
  totalMarks: number;
  questions: Question[];
  status: "Draft" | "Published";
}

export default function PaperManagerPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activePaper, setActivePaper] = useState<Paper | null>(null);

  // Form for creating a new paper shell
  const [newTitle, setNewTitle] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newType, setNewType] = useState<"Quiz" | "Question Paper" | "Assignment">("Quiz");

  const createNewPaper = () => {
    if (!newTitle) return;
    const paper: Paper = {
      id: `paper_${Date.now()}`,
      title: newTitle,
      type: newType,
      courseId: newCourseId || "CS-101",
      durationMins: 60,
      totalMarks: 0,
      questions: [],
      status: "Draft",
    };
    setPapers([paper, ...papers]);
    setActivePaper(paper);
    setNewTitle("");
  };

  const addQuestion = () => {
    if (!activePaper) return;
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      marks: 1,
    };
    
    const updatedPaper = { 
      ...activePaper, 
      questions: [...activePaper.questions, newQuestion],
      totalMarks: activePaper.totalMarks + newQuestion.marks
    };
    
    setActivePaper(updatedPaper);
    setPapers(papers.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    if (!activePaper) return;
    const updatedQuestions = activePaper.questions.map(q => {
      if (q.id === qId) {
        const updatedQ = { ...q, ...updates };
        return updatedQ;
      }
      return q;
    });

    const newTotalMarks = updatedQuestions.reduce((acc, q) => acc + q.marks, 0);

    const updatedPaper = { ...activePaper, questions: updatedQuestions, totalMarks: newTotalMarks };
    setActivePaper(updatedPaper);
    setPapers(papers.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };

  const removeQuestion = (qId: string) => {
    if (!activePaper) return;
    const updatedQuestions = activePaper.questions.filter(q => q.id !== qId);
    const newTotalMarks = updatedQuestions.reduce((acc, q) => acc + q.marks, 0);

    const updatedPaper = { ...activePaper, questions: updatedQuestions, totalMarks: newTotalMarks };
    setActivePaper(updatedPaper);
    setPapers(papers.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };

  const togglePublish = () => {
    if (!activePaper) return;
    const updatedPaper = { ...activePaper, status: activePaper.status === "Draft" ? "Published" : "Draft" } as Paper;
    setActivePaper(updatedPaper);
    setPapers(papers.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 flex flex-col md:flex-row gap-6">
      
      {/* Sidebar: List of Papers */}
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
            Paper Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Design quizzes and exam papers.</p>
        </div>

        <Card className="p-4 bg-white/[0.02] border-white/10">
          <h3 className="text-sm font-semibold mb-3">Create New Paper</h3>
          <div className="space-y-3">
            <Input 
              placeholder="Paper Title (e.g. Mid-term CS401)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="bg-white/5 border-white/10 h-9 text-sm"
            />
            <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
              <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quiz">Quiz</SelectItem>
                <SelectItem value="Question Paper">Question Paper</SelectItem>
                <SelectItem value="Assignment">Assignment</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createNewPaper} className="w-full h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs">
              <Plus className="h-4 w-4 mr-2" /> Start Designing
            </Button>
          </div>
        </Card>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Papers</h3>
          {papers.length === 0 ? (
            <p className="text-sm text-slate-600 italic">No papers created yet.</p>
          ) : (
            papers.map(paper => (
              <button 
                key={paper.id}
                onClick={() => setActivePaper(paper)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activePaper?.id === paper.id 
                    ? "bg-orange-500/10 border-orange-500/30" 
                    : "bg-white/[0.01] border-white/5 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col pr-2">
                    <span className="font-semibold text-sm truncate text-slate-200">{paper.title}</span>
                    <span className="text-[10px] text-slate-400">{paper.type}</span>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] h-4 px-1 rounded-sm ${paper.status === "Published" ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"}`}>
                    {paper.status}
                  </Badge>
                </div>
                <div className="flex items-center text-[11px] text-slate-400 gap-2">
                  <span>{paper.questions.length} Qs</span>
                  <span>•</span>
                  <span>{paper.totalMarks} Marks</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Paper Designer */}
      <div className="flex-1">
        {!activePaper ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-10 text-center">
            <FileText className="h-16 w-16 text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-300">No Paper Selected</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              Select an existing paper from the sidebar or create a new one to start designing your questions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Paper Header Settings */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-slate-100">{activePaper.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span>Total Marks: <strong className="text-orange-400">{activePaper.totalMarks}</strong></span>
                      <span>Total Questions: <strong className="text-slate-200">{activePaper.questions.length}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                      <Save className="h-4 w-4 mr-2" /> Save Draft
                    </Button>
                    <Button 
                      onClick={togglePublish}
                      className={activePaper.status === "Published" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                    >
                      {activePaper.status === "Published" ? "Unpublish" : <><Send className="h-4 w-4 mr-2" /> Publish to Students</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Questions List */}
            <div className="space-y-6">
              <AnimatePresence>
                {activePaper.questions.map((q, index) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card className="p-5 bg-white/[0.02] border-white/10 relative group">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start gap-4 pr-10">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs text-slate-500 uppercase tracking-wider">Question Text</Label>
                              <Textarea 
                                value={q.text} 
                                onChange={e => updateQuestion(q.id, { text: e.target.value })}
                                placeholder="Enter your question here..."
                                className="bg-white/5 border-white/10 min-h-[80px]"
                              />
                            </div>
                            <div className="w-32 space-y-2 shrink-0">
                              <Label className="text-xs text-slate-500 uppercase tracking-wider">Marks</Label>
                              <Input 
                                type="number" min={1} 
                                value={q.marks} 
                                onChange={e => updateQuestion(q.id, { marks: Number(e.target.value) })}
                                className="bg-white/5 border-white/10 h-10"
                              />
                            </div>
                          </div>

                          <div className="w-48 space-y-2">
                            <Label className="text-xs text-slate-500 uppercase tracking-wider">Question Type</Label>
                            <Select 
                              value={q.type} 
                              onValueChange={(v: "multiple-choice" | "descriptive") => updateQuestion(q.id, { type: v })}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="descriptive">Descriptive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {q.type === "multiple-choice" && q.options && (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                              <Label className="text-xs text-slate-500 uppercase tracking-wider">Options & Correct Answer</Label>
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <button 
                                    onClick={() => updateQuestion(q.id, { correctOptionIndex: optIndex })}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                      q.correctOptionIndex === optIndex 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : "bg-transparent border-slate-600 hover:border-slate-400 text-transparent"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <Input 
                                    value={opt}
                                    onChange={e => {
                                      const newOpts = [...(q.options || [])];
                                      newOpts[optIndex] = e.target.value;
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className={`h-9 bg-white/5 border-white/10 ${q.correctOptionIndex === optIndex ? "border-emerald-500/30" : ""}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button 
              onClick={addQuestion} 
              variant="outline" 
              className="w-full h-12 border-dashed border-white/20 bg-transparent hover:bg-white/5 text-slate-300"
            >
              <Plus className="h-5 w-5 mr-2" /> Add New Question
            </Button>
            
            {activePaper.questions.length > 0 && (
              <div className="flex justify-center pt-8 pb-4">
                <Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 h-12 rounded-full shadow-lg shadow-orange-500/20 gap-2">
                  <Sparkles className="h-5 w-5" /> Generate AI Hints for this Paper
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
