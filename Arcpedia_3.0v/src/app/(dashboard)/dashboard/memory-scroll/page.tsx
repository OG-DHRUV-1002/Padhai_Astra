"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/dashboard/page-header";
import { logActivity } from "@/lib/activity-store";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  Lightbulb,
  Star,
  Briefcase,
  Users,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Calendar as CalendarIcon,
  Search,
  ArrowUpDown,
  Trophy,
  Sparkles,
  GraduationCap,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMemories, MemoryItem, MemoryType } from "@/hooks/use-memories";

// --- Category Config ---
const CATEGORIES: { label: MemoryType | "All"; icon: React.ElementType; emoji: string; color: string; bg: string; borderColor: string; dotColor: string }[] = [
  { label: "All", icon: Filter, emoji: "🔍", color: "text-gray-500", bg: "bg-gray-500/10", borderColor: "border-gray-400/30", dotColor: "bg-gray-400" },
  { label: "Achievement", icon: CheckCircle, emoji: "🏆", color: "text-emerald-500", bg: "bg-emerald-500/10", borderColor: "border-emerald-400/30", dotColor: "bg-emerald-500" },
  { label: "Goal", icon: Star, emoji: "⭐", color: "text-amber-500", bg: "bg-amber-500/10", borderColor: "border-amber-400/30", dotColor: "bg-amber-500" },
  { label: "Reflection", icon: Lightbulb, emoji: "💡", color: "text-sky-500", bg: "bg-sky-500/10", borderColor: "border-sky-400/30", dotColor: "bg-sky-500" },
  { label: "Internship", icon: Briefcase, emoji: "💼", color: "text-violet-500", bg: "bg-violet-500/10", borderColor: "border-violet-400/30", dotColor: "bg-violet-500" },
  { label: "Workshop", icon: Users, emoji: "🎓", color: "text-orange-500", bg: "bg-orange-500/10", borderColor: "border-orange-400/30", dotColor: "bg-orange-500" },
];

export default function MemoryScrollPage() {
  const { memories, loading, addMemory, updateMemory, deleteMemory } = useMemories();
  const [filter, setFilter] = useState<MemoryType | "All">("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<MemoryItem>>({
    type: "Goal", title: "", content: "", date: new Date().toISOString().split('T')[0]
  });

  // --- Derived Data ---
  const filteredMemories = useMemo(() => {
    let result = memories.filter(m => filter === "All" || m.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
    return result;
  }, [memories, filter, searchQuery, sortOrder]);

  // --- Group by month/year ---
  const groupedMemories = useMemo(() => {
    const groups: { label: string; items: MemoryItem[] }[] = [];
    let currentLabel = "";
    filteredMemories.forEach(m => {
      const label = format(new Date(m.date), "MMMM yyyy");
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [m] });
      } else {
        groups[groups.length - 1].items.push(m);
      }
    });
    return groups;
  }, [filteredMemories]);

  // --- Stats ---
  const stats = useMemo(() => {
    const breakdown: Record<string, number> = {};
    memories.forEach(m => {
      const type = m.type as string;
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    const topCategory = Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0];
    return {
      total: memories.length,
      breakdown,
      topCategory: topCategory ? topCategory[0] : "None",
    };
  }, [memories]);

  // --- Handlers ---
  const handleOpenDialog = (item?: MemoryItem) => {
    if (item) {
      setFormData(item);
      setEditingId(item.id);
    } else {
      setFormData({ type: "Goal", title: "", content: "", date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.date || !formData.type) return;
    if (editingId) {
      await updateMemory(editingId, formData);
    } else {
      await addMemory(formData as Omit<MemoryItem, "id">);
      logActivity({
        type: "memory_added",
        title: formData.title || "Untitled",
        detail: `${formData.type}: ${formData.title}`,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
  };

  const getCategoryConfig = (type: string) => CATEGORIES.find(c => c.label === type) || CATEGORIES[0];

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl -mx-4 sm:-mx-8 px-4 sm:px-8 pb-4 pt-6 -mt-6 mb-6">
        <PageHeader
          title="Memory Scroll"
          description="Your academic journey — visualized as a living timeline."
        />

        {/* Stat Ribbon */}
        <div className="flex flex-wrap gap-3 mt-4 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-muted-foreground">Total</span>
            <span className="text-sm font-black text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-muted-foreground">Top</span>
            <span className="text-sm font-black text-foreground">{stats.topCategory}</span>
          </div>
          {Object.entries(stats.breakdown).slice(0, 3).map(([cat, count]) => {
            const cfg = getCategoryConfig(cat);
            return (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
                <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                <span className="text-xs font-bold text-foreground">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              className="pl-10 bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-foreground hover:bg-white dark:hover:bg-white/10 gap-2 self-start"
            onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar mt-3 mask-grad-right">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setFilter(cat.label as MemoryType | "All")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                filter === cat.label
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20"
                  : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10"
              )}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.label}
              {filter !== cat.label && cat.label !== "All" && stats.breakdown[cat.label] && (
                <span className="text-[10px] opacity-60">({stats.breakdown[cat.label]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- TIMELINE BODY --- */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredMemories.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <Search className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Memories Found</h3>
          <p className="text-muted-foreground text-sm">Try a different filter or add a new memory to start your timeline.</p>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Central timeline line */}
          <div className="absolute left-5 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/40 via-violet-500/30 to-indigo-500/10" />

          {groupedMemories.map((group, gi) => (
            <div key={group.label}>
              {/* Month/Year Divider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: gi * 0.05 }}
                className="relative flex items-center justify-center my-8 first:mt-0"
              >
                <div className="absolute left-5 md:left-1/2 md:-translate-x-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 border-4 border-background shadow-lg shadow-indigo-500/30 flex items-center justify-center z-10">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="ml-16 md:ml-0 px-5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 backdrop-blur-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">{group.label}</span>
                </div>
              </motion.div>

              {/* Entries */}
              {group.items.map((item, index) => {
                const config = getCategoryConfig(item.type);
                const isExpanded = expandedId === item.id;
                // Global index for alternating: count items before this group + index
                const globalIdx = filteredMemories.indexOf(item);
                const isLeft = globalIdx % 2 === 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: index * 0.06, type: "spring", stiffness: 80, damping: 16 }}
                    className={cn(
                      "relative flex items-start mb-6 group",
                      // Mobile: always right of line
                      "pl-14 md:pl-0",
                      // Desktop: alternate
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-5 md:left-1/2 -translate-x-1/2 top-5 z-10 flex items-center justify-center",
                    )}>
                      <div className={cn(
                        "h-4 w-4 rounded-full border-[3px] border-background shadow-md transition-all duration-300",
                        config.dotColor,
                        "group-hover:scale-125 group-hover:shadow-lg",
                      )} />
                      {/* Pulse ring on hover */}
                      <div className={cn(
                        "absolute h-7 w-7 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300",
                        config.dotColor
                      )} />
                    </div>

                    {/* Connector arm (desktop only) */}
                    <div className={cn(
                      "hidden md:block absolute top-[1.35rem] h-px w-8 bg-gradient-to-r",
                      isLeft
                        ? "right-1/2 mr-[7px] from-transparent to-white/20"
                        : "left-1/2 ml-[7px] from-white/20 to-transparent"
                    )} />

                    {/* Spacer for desktop layout */}
                    <div className="hidden md:block md:w-1/2" />

                    {/* Card */}
                    <div className={cn(
                      "w-full md:w-[calc(50%-2rem)]",
                      isLeft ? "md:pr-4" : "md:pl-4"
                    )}>
                      <Card
                        className={cn(
                          "relative overflow-hidden cursor-pointer transition-all duration-300",
                          "border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm",
                          "hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/20",
                          isExpanded && "ring-2 ring-indigo-500/30 shadow-2xl"
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        {/* Colored left border */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                          config.color.replace("text-", "from-"),
                          config.color.replace("text-", "to-").replace("500", "300")
                        )} />

                        <CardContent className="p-5 pl-6">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110",
                                config.bg
                              )}>
                                {config.emoji}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-foreground leading-tight line-clamp-1 text-sm">{item.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] font-semibold text-muted-foreground">
                                    {format(new Date(item.date), "MMM d, yyyy")}
                                  </span>
                                  <Badge variant="outline" className={cn(
                                    "text-[8px] font-black uppercase tracking-widest border-0 px-1.5 py-0",
                                    config.bg, config.color
                                  )}>
                                    {item.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={(e) => { e.stopPropagation(); handleOpenDialog(item); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500"
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Content */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={isExpanded ? "expanded" : "collapsed"}
                              initial={{ height: isExpanded ? 0 : "auto" }}
                              animate={{ height: "auto" }}
                              transition={{ duration: 0.2 }}
                            >
                              <p className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                !isExpanded && "line-clamp-2"
                              )}>
                                {item.content}
                              </p>
                            </motion.div>
                          </AnimatePresence>

                          {/* Expand indicator */}
                          {item.content.length > 80 && (
                            <button
                              className="flex items-center gap-1 mt-2 text-[10px] text-indigo-500 dark:text-indigo-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : item.id); }}
                            >
                              {isExpanded ? (
                                <><ChevronUp className="h-3 w-3" /> Show less</>
                              ) : (
                                <><ChevronDown className="h-3 w-3" /> Read more</>
                              )}
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Timeline end cap */}
          <div className="relative flex items-center justify-center mt-4">
            <div className="absolute left-5 md:left-1/2 md:-translate-x-1/2 h-3 w-3 rounded-full bg-indigo-500/30 border-2 border-background" />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white z-40 hover:shadow-2xl hover:shadow-indigo-500/40"
        onClick={() => handleOpenDialog()}
      >
        <Plus className="h-7 w-7" />
      </motion.button>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? "Edit Memory" : "✨ New Memory"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Capture a moment in your academic journey.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Category</label>
              <Select value={formData.type as string} onValueChange={(val) => setFormData({ ...formData, type: val as MemoryType })}>
                <SelectTrigger className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-foreground rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-foreground rounded-xl">
                  {CATEGORIES.filter(c => c.label !== "All").map(cat => (
                    <SelectItem key={cat.label} value={cat.label} className="focus:bg-indigo-50 dark:focus:bg-white/10 focus:text-foreground rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <span>{cat.emoji}</span>
                        <span className="font-semibold">{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Title</label>
              <Input
                placeholder="e.g., Completed Python Course"
                className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground rounded-xl"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Date</label>
              <Input
                type="date"
                className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-foreground rounded-xl"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Description</label>
              <Textarea
                placeholder="Details about this memory..."
                className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground resize-none rounded-xl min-h-[100px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-slate-100 dark:hover:bg-white/10 text-foreground rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              {editingId ? "Save Changes" : "Add Memory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
