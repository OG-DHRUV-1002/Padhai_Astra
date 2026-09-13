"use client";

import { useState, useEffect } from "react";
import { getRtdb } from "@/lib/firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";

export type MemoryType = "All" | "Achievement" | "Goal" | "Reflection" | "Internship" | "Workshop";

export interface MemoryItem {
    id: string;
    type: MemoryType;
    content: string;
    date: string;
    title: string;
}

const MEMORIES_PATH = "memories";

export function useMemories() {
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getRtdb();
        const memoriesRef = ref(db, MEMORIES_PATH);

        const unsubscribe = onValue(memoriesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const loadedMemories: MemoryItem[] = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                // Sort by date descending
                loadedMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setMemories(loadedMemories);
            } else {
                setMemories([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addMemory = async (memory: Omit<MemoryItem, "id">) => {
        const db = getRtdb();
        const memoriesRef = ref(db, MEMORIES_PATH);
        const newRef = push(memoriesRef);
        await set(newRef, memory);
        return newRef.key;
    };

    const updateMemory = async (id: string, memory: Partial<MemoryItem>) => {
        const db = getRtdb();
        const memoryRef = ref(db, `${MEMORIES_PATH}/${id}`);
        await update(memoryRef, memory);
    };

    const deleteMemory = async (id: string) => {
        const db = getRtdb();
        const memoryRef = ref(db, `${MEMORIES_PATH}/${id}`);
        await remove(memoryRef);
    };

    return {
        memories,
        loading,
        addMemory,
        updateMemory,
        deleteMemory
    };
}
