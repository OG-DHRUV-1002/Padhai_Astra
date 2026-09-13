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
            // Fetch ALL events — no collegeId filter
            // Events Pulse is a campus-wide view
            const data = await getEvents();
            setEvents(data);
        } catch (err: any) {
            console.error("[useEvents] Failed to fetch events:", err);
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
