"use client";

import { useState, useCallback, useEffect } from "react";

export type LostFoundItemStatus = "lost" | "found" | "claimed" | "returned";
export type LostFoundCategory = "Electronics" | "Clothing" | "IDs/Wallets" | "Books/Stationery" | "Keys" | "Other";

export interface LostFoundItem {
    id: string;
    title: string;
    description: string;
    category: LostFoundCategory;
    status: LostFoundItemStatus;
    location: string;
    date: string; // ISO string
    imageUrl?: string;
    reporterId: string;
    contactInfo?: string;
    createdAt: string; // ISO string
}

const INITIAL_MOCK_ITEMS: LostFoundItem[] = [
    {
        id: "lf_1",
        title: "Apple Pencil (2nd Gen)",
        description: "Found an Apple Pencil near the charging stations in the main library.",
        category: "Electronics",
        status: "found",
        location: "Main Library - 2nd Floor",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1590422749870-8588828cd59a?q=80&w=2070",
        reporterId: "user_001",
        contactInfo: "Leave a message at the library front desk",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: "lf_2",
        title: "Lost Blue Water Bottle",
        description: "Milton blue thermo steel water bottle. Left it in Classroom A during the morning lecture.",
        category: "Other",
        status: "lost",
        location: "Classroom A - Science Block",
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1974",
        reporterId: "user_002",
        contactInfo: "stu_123@college.edu",
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
        id: "lf_3",
        title: "Student ID Card",
        description: "Found a student ID card belonging to John Doe near the cafeteria entrance.",
        category: "IDs/Wallets",
        status: "found",
        location: "Cafeteria Entrance",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?q=80&w=2072",
        reporterId: "user_003",
        contactInfo: "Handed over to Campus Security",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
        id: "lf_4",
        title: "Lost MacBook Charger",
        description: "Left my 61W USB-C charger in the tech lab. Very urgent as I have assignments due!",
        category: "Electronics",
        status: "lost",
        location: "Tech Lab 3",
        date: new Date().toISOString(),
        reporterId: "user_004",
        contactInfo: "+1 234-567-8900",
        createdAt: new Date().toISOString(),
    }
];

export function useLostFound() {
    const [items, setItems] = useState<LostFoundItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage or initialize with mock data
        const saved = localStorage.getItem("lost_found_items");
        if (saved) {
            setItems(JSON.parse(saved));
        } else {
            setItems(INITIAL_MOCK_ITEMS);
            localStorage.setItem("lost_found_items", JSON.stringify(INITIAL_MOCK_ITEMS));
        }
        setLoading(false);
    }, []);

    const reportItem = useCallback((newItem: Omit<LostFoundItem, "id" | "createdAt">) => {
        const item: LostFoundItem = {
            ...newItem,
            id: `lf_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        
        setItems(prev => {
            const updated = [item, ...prev];
            localStorage.setItem("lost_found_items", JSON.stringify(updated));
            return updated;
        });
        
        return item;
    }, []);

    const claimItem = useCallback((id: string) => {
        setItems(prev => {
            const updated = prev.map(item => {
                if (item.id === id) {
                    return { ...item, status: item.status === "lost" ? "returned" : "claimed" as LostFoundItemStatus };
                }
                return item;
            });
            localStorage.setItem("lost_found_items", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const lostItems = items.filter(i => i.status === "lost");
    const foundItems = items.filter(i => i.status === "found");
    const resolvedItems = items.filter(i => i.status === "claimed" || i.status === "returned");

    return {
        items,
        lostItems,
        foundItems,
        resolvedItems,
        loading,
        reportItem,
        claimItem
    };
}
