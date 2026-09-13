"use client";

import { useState, useCallback, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Plus, Clock, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTimetable } from "@/hooks/use-timetable";
import { useCourses } from "@/hooks/use-courses";
import { useAuth } from "@/context/student-context";
import { useToast } from "@/hooks/use-toast";

export type EventType = "lecture" | "study" | "personal" | "exam";

export interface PlannerEvent {
    id: string;
    title: string;
    dayIndex: number; // 0 = Mon, 6 = Sun
    startTime: string; // "09:00"
    duration: number; // minutes
    type: EventType;
    location?: string;
    notes?: string;
    color?: string;
    isLocal?: boolean; // Student local overlay
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getTypeColor = (type: EventType, isLocal?: boolean) => {
    if (isLocal) {
        // Personal events are opaque with solid borders so they stand out and cover underlying grids/events
        return "bg-teal-900 border-teal-400 text-teal-100 shadow-md backdrop-blur-md opacity-100";
    }
    switch (type) {
        case "lecture": return "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300";
        case "exam": return "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300";
        case "study": return "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
        case "personal": return "bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300";
        default: return "bg-gray-500/20 border-gray-500/40";
    }
};

export function WeeklyPlanner() {
    const { timetable, studentTimetable, loading: timetableLoading, updateSchedule, updateStudentSchedule } = useTimetable();
    const { courses, loading: coursesLoading } = useCourses();
    const { userData, role } = useAuth();
    const { toast } = useToast();

    const isTeacher = role === "teacher";

    // Build a professor lookup from live courses data
    const courseProfessorMap: Record<string, string> = {};
    courses.forEach(c => {
        if (c.name && c.instructor) courseProfessorMap[c.name] = c.instructor;
    });

    // Convert timetable slots to PlannerEvent format
    const timetableEvents: PlannerEvent[] = [];
    if (timetable?.schedule) {
        if (Array.isArray(timetable.schedule)) {
            // handle legacy array format if any
            timetable.schedule.forEach((slot: any, idx: number) => {
                timetableEvents.push({
                    id: slot.id || `tt-${idx}`,
                    title: slot.title || slot.subject || "Untitled",
                    dayIndex: typeof slot.dayIndex === 'number' ? slot.dayIndex : DAYS.indexOf(slot.day || "Mon"),
                    startTime: slot.startTime || "09:00",
                    duration: slot.duration || 60,
                    type: (slot.type as EventType) || "lecture",
                    location: slot.location || "",
                    isLocal: false,
                });
            });
        } else {
            // handle standard record format (day -> slots map)
            Object.entries(timetable.schedule).forEach(([day, slots]) => {
                slots.forEach((slot: any, idx: number) => {
                    timetableEvents.push({
                        id: slot.id || `tt-${day}-${idx}`,
                        title: slot.title || slot.subject || "Untitled",
                        dayIndex: typeof slot.dayIndex === 'number' ? slot.dayIndex : DAYS.indexOf(day),
                        startTime: slot.startTime || "09:00",
                        duration: slot.duration || 60,
                        type: (slot.type as EventType) || "lecture",
                        location: slot.location || "",
                        isLocal: false,
                    });
                });
            });
        }
    }

    // Teacher-managed events (persisted to DB global)
    const [teacherEvents, setTeacherEvents] = useState<PlannerEvent[]>([]);
    // Student local overlay events (persisted to DB student profile)
    const [localEvents, setLocalEvents] = useState<PlannerEvent[]>([]);

    // Initialize student's personal events from DB
    useEffect(() => {
        if (!isTeacher && studentTimetable?.schedule) {
            const mappedEvents: PlannerEvent[] = [];
            Object.entries(studentTimetable.schedule).forEach(([day, slots]) => {
                slots.forEach((slot: any, idx: number) => {
                    mappedEvents.push({
                        id: slot.id || `local-${day}-${idx}`,
                        title: slot.title || slot.subject || "Untitled",
                        dayIndex: typeof slot.dayIndex === 'number' ? slot.dayIndex : DAYS.indexOf(day),
                        startTime: slot.startTime || "09:00",
                        duration: slot.duration || 60,
                        type: (slot.type as EventType) || "study",
                        location: slot.location || "",
                        isLocal: true,
                    });
                });
            });
            setLocalEvents(mappedEvents);
        }
    }, [studentTimetable, isTeacher]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
    const [formData, setFormData] = useState<Partial<PlannerEvent>>({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
    const [savingTimetable, setSavingTimetable] = useState(false);

    // Combine events: teacher sees timetable + teacher-local edits; student sees timetable + student overlays
    const allEvents = isTeacher
        ? [...timetableEvents, ...teacherEvents]
        : [...timetableEvents, ...localEvents];

    const getProfessor = (title: string) => {
        if (courseProfessorMap[title]) return courseProfessorMap[title];
        const key = Object.keys(courseProfessorMap).find(k => k.toLowerCase() === title.toLowerCase());
        return key ? courseProfessorMap[key] : "";
    };

    const handleAddEvent = (dayIndex?: number, hour?: number) => {
        setSelectedEvent(null);
        setFormData({
            dayIndex: dayIndex ?? 0,
            startTime: hour ? `${hour.toString().padStart(2, '0')}:00` : "09:00",
            duration: 60,
            type: isTeacher ? "lecture" : "study"
        });
        setIsDialogOpen(true);
    };

    const handleEditEvent = (event: PlannerEvent) => {
        // Teachers can edit all events; students can only edit their local overlays
        if (!isTeacher && !event.isLocal) return;
        setSelectedEvent(event);
        setFormData(event);
        setIsDialogOpen(true);
    };

    const handleDeleteEvent = (id: string) => {
        if (isTeacher) {
            setTeacherEvents(prev => prev.filter(e => e.id !== id));
        } else {
            setLocalEvents(prev => prev.filter(e => e.id !== id));
        }
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!formData.title || formData.dayIndex === undefined) return;

        const newEvent: PlannerEvent = {
            id: selectedEvent ? selectedEvent.id : `${isTeacher ? "t" : "local"}-${Date.now()}`,
            title: formData.title,
            dayIndex: formData.dayIndex,
            startTime: formData.startTime || "09:00",
            duration: formData.duration || 60,
            type: formData.type || "study",
            location: formData.location || "",
            isLocal: !isTeacher,
        };

        if (isTeacher) {
            if (selectedEvent) {
                setTeacherEvents(prev => prev.map(e => e.id === selectedEvent.id ? newEvent : e));
            } else {
                setTeacherEvents(prev => [...prev, newEvent]);
            }
        } else {
            if (selectedEvent) {
                setLocalEvents(prev => prev.map(e => e.id === selectedEvent.id ? newEvent : e));
            } else {
                setLocalEvents(prev => [...prev, newEvent]);
            }
        }
        setIsDialogOpen(false);
    };

    // Teacher saves timetable to DB
    const handleSaveTimetable = useCallback(async () => {
        if (!isTeacher) return;
        setSavingTimetable(true);
        try {
            const allTeacherEvents = [...timetableEvents, ...teacherEvents];
            // Convert to Record<string, TimetableSlot[]> format
            const schedule: Record<string, { subject: string; professor: string; startTime: string; endTime: string; room?: string; id?: string; dayIndex?: number; duration?: number; type?: string }[]> = {};
            const DAYS_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            allTeacherEvents.forEach(e => {
                const day = DAYS_MAP[e.dayIndex] || "Mon";
                if (!schedule[day]) schedule[day] = [];
                const [h, m] = e.startTime.split(":").map(Number);
                const endMinutes = h * 60 + m + e.duration;
                const endH = Math.floor(endMinutes / 60);
                const endM = endMinutes % 60;
                schedule[day].push({
                    subject: e.title,
                    professor: getProfessor(e.title) || "",
                    startTime: e.startTime,
                    endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                    room: e.location || "",
                    id: e.id,
                    dayIndex: e.dayIndex,
                    duration: e.duration,
                    type: e.type,
                });
            });
            await updateSchedule(schedule);
            setTeacherEvents([]); // Clear local teacher edits since they're now persisted
            toast({ title: "Timetable Saved!", description: "Your timetable has been saved and is now visible to students." });
        } catch (e) {
            console.error("Failed to save timetable:", e);
            toast({ variant: "destructive", title: "Error", description: "Failed to save timetable." });
        } finally {
            setSavingTimetable(false);
        }
    }, [isTeacher, timetableEvents, teacherEvents, updateSchedule, toast]);

    // Student saves personal timetable to DB
    const handleSavePersonalTimetable = useCallback(async () => {
        if (isTeacher) return;
        setSavingTimetable(true);
        try {
            const schedule: Record<string, { subject: string; professor: string; startTime: string; endTime: string; room?: string; id?: string; dayIndex?: number; duration?: number; type?: string }[]> = {};
            const DAYS_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            localEvents.forEach(e => {
                const day = DAYS_MAP[e.dayIndex] || "Mon";
                if (!schedule[day]) schedule[day] = [];
                const [h, m] = e.startTime.split(":").map(Number);
                const endMinutes = h * 60 + m + e.duration;
                const endH = Math.floor(endMinutes / 60);
                const endM = endMinutes % 60;
                schedule[day].push({
                    subject: e.title,
                    professor: getProfessor(e.title) || "",
                    startTime: e.startTime,
                    endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                    room: e.location || "",
                    id: e.id,
                    dayIndex: e.dayIndex,
                    duration: e.duration,
                    type: e.type,
                });
            });
            await updateStudentSchedule(schedule);
            toast({ title: "Personal Events Saved!", description: "Your study schedule has been updated." });
        } catch (e) {
            console.error("Failed to save personal timetable:", e);
            toast({ variant: "destructive", title: "Error", description: "Failed to save personal events." });
        } finally {
            setSavingTimetable(false);
        }
    }, [isTeacher, localEvents, updateStudentSchedule, toast]);

    const getEventStyle = (event: PlannerEvent) => {
        const [h, m] = event.startTime.split(":").map(Number);
        const startMinutesFrom7AM = (h - 7) * 60 + m;
        // Global events (teacher): take 85% width, left aligned
        // Local events (student): take 85% width, right aligned, higher z-index
        const isGlobal = !event.isLocal;
        return {
            top: `${(startMinutesFrom7AM / 60) * 4}rem`,
            height: `${(event.duration / 60) * 4}rem`,
            zIndex: event.isLocal ? 20 : 10,
            width: "85%",
            left: isGlobal ? "2%" : "auto",
            right: event.isLocal ? "2%" : "auto",
        };
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        const event = allEvents.find(ev => ev.id === id);
        // Students can only drag local events
        if (!isTeacher && event && !event.isLocal) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = "move";
        setDraggedEventId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dayIndex: number) => {
        e.preventDefault();
        if (!draggedEventId) return;

        const container = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - container.top;
        const pixelsPerHour = 64;
        const hoursFrom7AM = offsetY / pixelsPerHour;
        let totalMinutes = hoursFrom7AM * 60;
        const snappedMinutes = Math.round(totalMinutes / 15) * 15;
        const newHour = 7 + Math.floor(snappedMinutes / 60);
        const newMinute = snappedMinutes % 60;

        if (newHour < 7 || newHour > 21) return;

        const newStartTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;

        const updater = (prev: PlannerEvent[]) => prev.map(ev => {
            if (ev.id === draggedEventId) return { ...ev, dayIndex, startTime: newStartTime };
            return ev;
        });

        if (isTeacher) {
            setTeacherEvents(updater);
        } else {
            setLocalEvents(updater);
        }
        setDraggedEventId(null);
    };

    if (timetableLoading || coursesLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">Loading timetable...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 font-headline font-semibold text-lg">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <span>Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    {!isTeacher && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg border border-dashed border-teal-500/30">
                            <Lock className="h-3 w-3" /> Timetable events are read-only • You can add personal events
                        </span>
                    )}
                    <Button onClick={() => handleAddEvent()} className="bg-primary text-white shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> {isTeacher ? "Add Slot" : "Add Personal Event"}
                    </Button>
                    {isTeacher ? (
                        <Button
                            onClick={handleSaveTimetable}
                            disabled={savingTimetable}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            {savingTimetable ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Timetable
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSavePersonalTimetable}
                            disabled={savingTimetable}
                            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                        >
                            {savingTimetable ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Personal Plan
                        </Button>
                    )}
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="flex-1 overflow-auto border rounded-xl glass dark:glass-dark shadow-sm relative custom-scrollbar">
                <div className="min-w-[800px] relative">
                    {/* Header Row */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
                        <div className="p-4 text-xs font-medium text-muted-foreground text-center border-r">Time</div>
                        {DAYS.map((day, i) => (
                            <div key={day} className={cn(
                                "p-4 text-center border-r last:border-r-0 font-medium text-sm flex flex-col items-center",
                                i === (new Date().getDay() - 1 + 7) % 7 ? "bg-primary/5 text-primary" : ""
                            )}>
                                <span className="opacity-70 text-xs uppercase tracking-wider">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                        {/* Time Column */}
                        <div className="border-r bg-background/50">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-16 border-b text-xs text-muted-foreground p-2 text-right relative">
                                    <span className="-top-2 relative">{hour}:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {DAYS.map((_, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="relative border-r last:border-r-0 border-b-0 min-h-[calc(15*4rem)] group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, dayIndex)}
                            >
                                {HOURS.map(hour => (
                                    <div key={hour}
                                        className="h-16 border-b border-dashed border-muted/50 w-full absolute pointer-events-none"
                                        style={{ top: `${(hour - 7) * 4}rem` }}
                                    />
                                ))}

                                <div className="absolute inset-0 z-0" onClick={() => handleAddEvent(dayIndex, 9)}></div>

                                {allEvents.filter(e => e.dayIndex === dayIndex).map(event => {
                                    const style = getEventStyle(event);
                                    const prof = getProfessor(event.title);
                                    const isReadOnly = !isTeacher && !event.isLocal;

                                    return (
                                        <motion.div
                                            key={event.id}
                                            layoutId={event.id}
                                            draggable={!isReadOnly}
                                            onDragStart={(e) => {
                                                if (isReadOnly) return;
                                                handleDragStart(e as any, event.id);
                                            }}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "absolute rounded-lg p-2 text-xs overflow-hidden flex flex-col gap-1 shadow-sm border",
                                                isReadOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing hover:brightness-95",
                                                getTypeColor(event.type, event.isLocal)
                                            )}
                                            style={style}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isReadOnly) handleEditEvent(event);
                                            }}
                                        >
                                            <div className="font-bold line-clamp-1 leading-tight flex items-center gap-1">
                                                {isReadOnly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-50" />}
                                                {event.isLocal && <span className="text-[9px] opacity-60">(Personal)</span>}
                                                {event.title}
                                            </div>
                                            {prof && <div className="text-[10px] opacity-90 font-medium truncate">{prof}</div>}
                                            <div className="flex items-center gap-1 opacity-80 text-[10px] mt-auto">
                                                <Clock className="h-3 w-3 inline" />
                                                <span className="truncate">{event.startTime} ({event.duration}m)</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] glass dark:glass-dark border-white/20">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent ? "Edit Event" : isTeacher ? "Add Timetable Slot" : "Add Personal Event"}</DialogTitle>
                        <DialogDescription>
                            {isTeacher
                                ? "Add a class/event to the timetable. Click 'Save Timetable' to persist changes."
                                : "Add a personal event. This won't affect the official timetable."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                list="course-suggestions"
                                value={formData.title || ""}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Select or type..."
                                className="glass"
                            />
                            <datalist id="course-suggestions">
                                {courses.map(course => (
                                    <option key={course.id} value={course.name} />
                                ))}
                            </datalist>
                        </div>
                        {formData.title && getProfessor(formData.title) && (
                            <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                                <span className="font-bold">Professor:</span> {getProfessor(formData.title)}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Day</Label>
                                <Select
                                    value={formData.dayIndex?.toString()}
                                    onValueChange={(val) => setFormData({ ...formData, dayIndex: parseInt(val) })}
                                >
                                    <SelectTrigger className="glass">
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val as EventType })}
                                >
                                    <SelectTrigger className="glass">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lecture">Lecture</SelectItem>
                                        <SelectItem value="study">Study Session</SelectItem>
                                        <SelectItem value="exam">Exam/Quiz</SelectItem>
                                        <SelectItem value="personal">Personal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Start Time</Label>
                                <Input
                                    id="start"
                                    type="time"
                                    value={formData.startTime || "09:00"}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="glass"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duration (min)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration || 60}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="glass"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input
                                id="location"
                                value={formData.location || ""}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Room 301 or Online"
                                className="glass"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedEvent && (
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-primary text-white">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
