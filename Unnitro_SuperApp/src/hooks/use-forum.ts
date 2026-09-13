"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { getForumPosts, createForumPost, deleteForumPost, getForumReplies, addForumReply } from "@/lib/db-service";
import { ForumPost, ForumReply } from "@/lib/types";

/**
 * Hook to fetch forum posts + replies from Firestore.
 * Replaces mockForumPosts in Peer Oracle.
 */
export function useForum() {
    const { userData } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getForumPosts(userData?.collegeId);
                if (!cancelled) setPosts(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load forum posts");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [userData?.collegeId]);

    const addPost = async (post: Omit<ForumPost, "id">) => {
        const id = await createForumPost(post);
        setPosts(prev => [{ ...post, id }, ...prev]);
        return id;
    };

    const removePost = async (id: string) => {
        await deleteForumPost(id);
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const getReplies = async (postId: string): Promise<ForumReply[]> => {
        return getForumReplies(postId);
    };

    const addReply = async (postId: string, reply: Omit<ForumReply, "id">) => {
        const id = await addForumReply(postId, reply);
        // Update local reply count
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, replies: (p.replies || 0) + 1 } : p
        ));
        return id;
    };

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getForumPosts(userData?.collegeId);
            setPosts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { posts, loading, error, addPost, removePost, getReplies, addReply, refresh };
}
