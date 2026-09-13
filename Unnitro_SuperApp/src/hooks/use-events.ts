"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/student-context";
import { getEvents, createEvent, deleteEvent } from "@/lib/db-service";
import { AppEvent } from "@/lib/types";

/**
 * Hook to fetch events for the Events Pulse page.
 * Fetches ALL events regardless of college — Events Pulse is campus-wide.
 * Admin users always see all events. Teachers/students see all events too
 * since events are meant to be visible across the platform.
 */
export function useEvents() {
    const { loading: authLoading } = useAuth();
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Mock data for Events Pulse based on Arcpedia
            const mockEvents: AppEvent[] = [
                {
                    id: "evt_1",
                    title: "Tech Symposium 2026",
                    description: "Annual technology gathering showcasing student projects and guest speakers from industry leading tech companies.",
                    category: "Tech" as EventCategory,
                    date: new Date(Date.now() + 86400000 * 2).toISOString(),
                    time: "10:00 AM",
                    location: "Main Auditorium",
                    organizerId: "org_1",
                    attendees: ["stu_1", "stu_2", "stu_3"],
                    maxAttendees: 500,
                    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                    collegeId: "default"
                },
                {
                    id: "evt_2",
                    title: "Cultural Fest: Resonance",
                    description: "A week-long celebration of arts, music, dance, and culture. Join us for the biggest event of the semester!",
                    category: "Cultural" as EventCategory,
                    date: new Date(Date.now() + 86400000 * 5).toISOString(),
                    time: "05:00 PM",
                    location: "Campus Grounds",
                    organizerId: "org_2",
                    attendees: [],
                    maxAttendees: 2000,
                    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                    collegeId: "default"
                },
                {
                    id: "evt_3",
                    title: "AI Ethics Workshop",
                    description: "Interactive session discussing the moral implications and responsibilities when developing modern AI systems.",
                    category: "Workshop" as EventCategory,
                    date: new Date(Date.now() + 86400000 * 1).toISOString(),
                    time: "02:00 PM",
                    location: "Seminar Hall B",
                    organizerId: "org_3",
                    attendees: ["stu_1"],
                    maxAttendees: 50,
                    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                    collegeId: "default"
                },
                {
                    id: "evt_4",
                    title: "Inter-College Sports Meet",
                    description: "Compete against rival colleges in Basketball, Football, and Athletics.",
                    category: "Sports" as EventCategory,
                    date: new Date(Date.now() + 86400000 * 10).toISOString(),
                    time: "08:00 AM",
                    location: "Sports Complex",
                    organizerId: "org_4",
                    attendees: [],
                    maxAttendees: 1000,
                    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                    collegeId: "default"
                },
                {
                    id: "evt_5",
                    title: "Career Fair 2026",
                    description: "Connect with recruiters from top companies. Bring your resume and dress professionally.",
                    category: "Career" as EventCategory,
                    date: new Date(Date.now() + 86400000 * 15).toISOString(),
                    time: "09:00 AM",
                    location: "Exhibition Hall",
                    organizerId: "org_5",
                    attendees: [],
                    maxAttendees: 800,
                    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                    collegeId: "default"
                }
            ];
            
            setEvents(mockEvents);
        } catch (err: any) {
            setError(err.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Don't fetch until auth is ready
        if (authLoading) return;
        fetchEvents();
    }, [authLoading, fetchEvents]);

    const addEvent = async (event: Omit<AppEvent, "id">) => {
        const id = await createEvent(event);
        setEvents(prev => [{ ...event, id }, ...prev]);
        return id;
    };

    const removeEvent = async (id: string) => {
        await deleteEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    return { events, loading: loading || authLoading, error, addEvent, removeEvent, refresh: fetchEvents };
}
