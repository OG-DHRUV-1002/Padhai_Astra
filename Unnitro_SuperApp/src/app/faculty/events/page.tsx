"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/arcpedia/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Search, Filter, Heart, Trophy, BookOpen, Laptop, Music, Dumbbell, ImageOff, CalendarCheck, CalendarX2, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog-shadcn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";
import { EventCategory, AppEvent } from "@/lib/types";

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    "All": { icon: Filter, color: "text-gray-500", bgColor: "bg-gray-500" },
    "Academic": { icon: BookOpen, color: "text-blue-500", bgColor: "bg-blue-500" },
    "Tech": { icon: Laptop, color: "text-pink-500", bgColor: "bg-pink-500" },
    "Cultural": { icon: Music, color: "text-yellow-500", bgColor: "bg-yellow-500" },
    "Sports": { icon: Dumbbell, color: "text-red-500", bgColor: "bg-red-500" },
    "Workshop": { icon: Users, color: "text-orange-500", bgColor: "bg-orange-500" },
    "Social": { icon: Heart, color: "text-emerald-500", bgColor: "bg-emerald-500" },
    "Career": { icon: Trophy, color: "text-purple-500", bgColor: "bg-purple-500" },
};

const ALL_CATEGORIES = ["All", "Academic", "Tech", "Cultural", "Sports", "Workshop", "Social", "Career"];

export default function FacultyEventsPulsePage() {
    const { events, loading, addEvent, removeEvent } = useEvents();
    const [filter, setFilter] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [eventTab, setEventTab] = useState<"all" | "upcoming" | "past">("all");
    
    // Add Event State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<AppEvent>>({
        title: "", description: "", category: "Academic", date: "", time: "", location: "", maxAttendees: 100
    });

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesCategory = filter === "All" || event.category === filter;
            const matchesSearch = (event.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.location || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = eventTab === "all" || (eventTab === "upcoming" ? event.date >= today : event.date < today);
            return matchesCategory && matchesSearch && matchesTab;
        });
    }, [events, filter, searchQuery, eventTab, today]);

    const upcomingCount = useMemo(() => events.filter(e => e.date >= today).length, [events, today]);
    const pastCount = useMemo(() => events.filter(e => e.date < today).length, [events, today]);

    const handleCreateEvent = async () => {
        if (!formData.title || !formData.date || !formData.category) return;
        setIsSaving(true);
        try {
            await addEvent({
                title: formData.title,
                description: formData.description || "",
                category: formData.category as EventCategory,
                date: formData.date,
                time: formData.time || "10:00 AM",
                location: formData.location || "TBA",
                organizerId: "faculty_user",
                attendees: [],
                maxAttendees: formData.maxAttendees || 100,
                imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070", // Default placeholder
                status: "upcoming",
                createdAt: new Date().toISOString(),
                collegeId: "default"
            });
            setIsAddOpen(false);
            setFormData({ title: "", description: "", category: "Academic", date: "", time: "", location: "", maxAttendees: 100 });
        } catch (error) {
            console.error("Failed to add event", error);
        } finally {
            setIsSaving(false);
        }
    };

    const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
        const [error, setError] = useState(false);
        if (!src || error) {
            return (
                <div className={cn("flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20", className)}>
                    <Calendar className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <span className="text-xs text-muted-foreground/50">Event</span>
                </div>
            )
        }
        return (
            <img src={src} alt={alt} className={className} onError={() => setError(true)} />
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading events...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    <PageHeader
                        title="Events Pulse"
                        description="Manage and track campus-wide events. Create new ones for students to attend."
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events, locations..."
                            className="pl-10 bg-white/5 border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                                <Plus className="h-4 w-4 mr-2" /> Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-[#12121e] border-white/20 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Create New Campus Event</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Event Title</Label>
                                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. AI Research Symposium" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" placeholder="Details about the event..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Capacity</Label>
                                        <Input type="number" min={1} value={formData.maxAttendees} onChange={e => setFormData({...formData, maxAttendees: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={formData.category as string} onValueChange={(v) => setFormData({...formData, category: v as any})}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#181825] border-white/10 text-white">
                                            {ALL_CATEGORIES.filter(c => c !== "All").map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => setIsAddOpen(false)} className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</Button>
                                <Button onClick={handleCreateEvent} disabled={!formData.title || !formData.date || isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Time Tabs */}
            <div className="flex gap-2 mb-2">
                {[
                    { key: "all" as const, label: "All Events", icon: Calendar, count: events.length },
                    { key: "upcoming" as const, label: "Upcoming", icon: CalendarCheck, count: upcomingCount },
                    { key: "past" as const, label: "Past", icon: CalendarX2, count: pastCount },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setEventTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            eventTab === tab.key
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", eventTab === tab.key ? "bg-white/20" : "bg-white/10")}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                {ALL_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META["All"];
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                                filter === cat
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-105"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            <meta.icon className={cn("h-4 w-4", filter === cat ? "text-white" : meta.color)} />
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Events Grid */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                    {filteredEvents.map((event) => {
                        const meta = CATEGORY_META[event.category] || CATEGORY_META["All"];
                        return (
                            <motion.div
                                layout
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="flex flex-col h-full overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-white/10 bg-white/[0.02] group relative">
                                    
                                    {/* Faculty Delete Button */}
                                    <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="h-8 w-8 bg-red-600 hover:bg-red-700 shadow-lg"
                                            onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Image & Tag */}
                                    <div className="relative h-48 w-full overflow-hidden bg-black/40">
                                        <ImageWithFallback
                                            src={event.imageUrl || event.image || ""}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                        <Badge className={cn("absolute top-3 right-3 backdrop-blur-md border-0 text-white font-bold tracking-wide shadow-lg", meta.bgColor)}>
                                            {event.category}
                                        </Badge>
                                    </div>

                                    <CardHeader className="p-5 pb-2">
                                        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight group-hover:text-indigo-400 transition-colors text-slate-100">
                                            {event.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="p-5 pt-2 flex-grow space-y-4">
                                        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                                            {event.description}
                                        </p>

                                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2.5 text-sm text-slate-300">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                                </div>
                                                <span>{event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm text-slate-300">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <MapPin className="h-3.5 w-3.5 text-red-400" />
                                                </div>
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm text-slate-300">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                                                </div>
                                                <span className="flex items-center gap-2">
                                                    <motion.span
                                                        key={event.attendees?.length || 0}
                                                        initial={{ scale: 1.3, color: '#6366f1' }}
                                                        animate={{ scale: 1, color: 'inherit' }}
                                                        transition={{ duration: 0.3 }}
                                                        className="font-bold text-slate-200"
                                                    >
                                                        {event.attendees?.length || 0}
                                                    </motion.span>
                                                    <span className="text-slate-400">going</span>
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Bottom Color Line */}
                                    <div className={cn("h-1 w-full", meta.bgColor)}></div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredEvents.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-4">
                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                        <Calendar className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg">{events.length === 0 ? "No events have been created yet." : "No events found matching your criteria."}</p>
                </div>
            )}
        </div>
    );
}
