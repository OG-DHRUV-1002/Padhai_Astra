"use client";

import React, { useState, useMemo } from 'react';
import PageHeader from "@/components/arcpedia/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Search, Filter, Heart, Trophy, BookOpen, Laptop, Music, Dumbbell, ImageOff, CalendarCheck, CalendarX2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";
import { EventCategory } from "@/lib/types";

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

export default function EventsPulsePage() {
    const { events, loading } = useEvents();
    const [filter, setFilter] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [eventTab, setEventTab] = useState<"all" | "upcoming" | "past">("all");

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
            // eslint-disable-next-line @next/next/no-img-element
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
        <div className="space-y-8 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <PageHeader
                    title="Events Pulse"
                    description="The heartbeat of campus life. Don't miss out on what's happening."
                />
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events, locations..."
                        className="pl-10 bg-white/60 dark:bg-background/50 backdrop-blur-sm border-slate-200 dark:border-white/10 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                                : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-white/10"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", eventTab === tab.key ? "bg-white/20" : "bg-slate-200 dark:bg-white/10")}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mask-grad-right">
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
                                    : "bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/20 text-slate-600 dark:text-muted-foreground hover:text-foreground"
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
                                <Card className="flex flex-col h-full overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md group">
                                    {/* Image & Tag */}
                                    <div className="relative h-48 w-full overflow-hidden bg-black/40">
                                        <ImageWithFallback
                                            src={event.image || ""}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                        <Badge className={cn("absolute top-3 right-3 backdrop-blur-md border-0 text-white font-bold tracking-wide shadow-lg", meta.bgColor)}>
                                            {event.category}
                                        </Badge>
                                    </div>

                                    <CardHeader className="p-5 pb-2">
                                        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                            {event.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="p-5 pt-2 flex-grow space-y-4">
                                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                                            {event.description}
                                        </p>

                                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                                </div>
                                                <span>{event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <MapPin className="h-3.5 w-3.5 text-red-400" />
                                                </div>
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                                                <div className="p-1.5 rounded-md bg-white/5">
                                                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                                                </div>
                                                <span className="flex items-center gap-2">
                                                    <motion.span
                                                        key={event.attendees}
                                                        initial={{ scale: 1.3, color: '#6366f1' }}
                                                        animate={{ scale: 1, color: 'inherit' }}
                                                        transition={{ duration: 0.3 }}
                                                        className="font-bold"
                                                    >
                                                        {event.attendees}
                                                    </motion.span>
                                                    going
                                                    {event.date >= today && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-5 pt-0 mt-auto">
                                        <Button className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary transition-all shadow-none hover:shadow-lg hover:shadow-primary/25 font-bold tracking-wide rounded-xl">
                                            RSVP Now
                                        </Button>
                                    </CardFooter>

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
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-4">
                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                        <Calendar className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg">{events.length === 0 ? "No events have been created yet." : "No events found matching your criteria."}</p>
                    {events.length > 0 && (
                        <Button variant="link" onClick={() => { setFilter("All"); setSearchQuery(""); }}>
                            Clear Filters
                        </Button>
                    )}
                    {events.length === 0 && (
                        <p className="text-sm text-muted-foreground/60">Events will appear here once teachers or admins create them.</p>
                    )}
                </div>
            )}
        </div>
    );
}
