"use client";

import { getRtdb } from "@/lib/firebase";
import { ref, push, query, orderByChild, limitToLast, get, set } from "firebase/database";

// --- Types ---
export type ActivityType =
    | "quiz_complete"
    | "memory_added"
    | "forum_post"
    | "resource_search"
    | "joke_generated";

export interface ActivityEvent {
    id?: string;
    type: ActivityType;
    title: string;
    detail: string;
    timestamp: number;
    score?: number;
    total?: number;
}

export interface ActivityStats {
    totalQuizzes: number;
    totalMemories: number;
    totalForumPosts: number;
    totalResources: number;
    totalJokes: number;
    averageQuizScore: number;
    lastActive: number;
}

const DB_PATH = "activity";
const STATS_PATH = "stats";

const defaultStats: ActivityStats = {
    totalQuizzes: 0,
    totalMemories: 0,
    totalForumPosts: 0,
    totalResources: 0,
    totalJokes: 0,
    averageQuizScore: 0,
    lastActive: Date.now(),
};

// --- Public API (Firebase RTDB only, no localStorage) ---

/** Log an activity event — writes directly to Firebase Realtime Database */
export async function logActivity(event: Omit<ActivityEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: ActivityEvent = {
        ...event,
        timestamp: Date.now(),
    };

    // Update stats
    const stats = await getStats();
    stats.lastActive = fullEvent.timestamp;

    switch (event.type) {
        case "quiz_complete":
            stats.totalQuizzes++;
            if (event.score !== undefined && event.total) {
                const prevTotal = (stats.totalQuizzes - 1) * stats.averageQuizScore;
                stats.averageQuizScore = Math.round((prevTotal + (event.score / event.total) * 100) / stats.totalQuizzes);
            }
            break;
        case "memory_added":
            stats.totalMemories++;
            break;
        case "forum_post":
            stats.totalForumPosts++;
            break;
        case "resource_search":
            stats.totalResources++;
            break;
        case "joke_generated":
            stats.totalJokes++;
            break;
    }

    try {
        const db = getRtdb();
        const actRef = ref(db, DB_PATH);
        await push(actRef, fullEvent);
        const statsRef = ref(db, STATS_PATH);
        await set(statsRef, stats);
        console.log("✅ Activity logged to Firebase RTDB:", event.type, event.title);
    } catch (e) {
        console.error("❌ Firebase RTDB write failed:", e);
    }
}

/** Get the most recent N activity events from Firebase RTDB */
export async function getRecentActivity(count: number = 10): Promise<ActivityEvent[]> {
    try {
        const db = getRtdb();
        const actRef = query(ref(db, DB_PATH), limitToLast(count));
        const snapshot = await get(actRef);
        if (snapshot.exists()) {
            const events: ActivityEvent[] = [];
            snapshot.forEach((child) => {
                events.push({ id: child.key!, ...child.val() });
            });
            return events.reverse(); // newest first
        }
        return [];
    } catch (e) {
        console.error("❌ Firebase RTDB read failed:", e);
        return [];
    }
}

/** Get aggregate stats across all modules from Firebase RTDB */
export async function getStats(): Promise<ActivityStats> {
    try {
        const db = getRtdb();
        const statsRef = ref(db, STATS_PATH);
        const snapshot = await get(statsRef);
        if (snapshot.exists()) {
            return { ...defaultStats, ...snapshot.val() };
        }
    } catch (e) {
        console.error("❌ Firebase RTDB stats read failed:", e);
    }
    return { ...defaultStats };
}
