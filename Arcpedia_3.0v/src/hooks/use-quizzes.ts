"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { getQuizzes, getQuizzesByTeacher, getQuizzesByCollege, createQuiz, deleteQuiz } from "@/lib/db-service";
import { Quiz } from "@/lib/types";

/**
 * Hook to fetch quizzes based on the current user's role.
 * - Student: quizzes for their college
 * - Teacher: quizzes they created
 * - Admin: all quizzes in their college
 */
export function useQuizzes() {
    const { userData, role } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userData?.uid) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let data: Quiz[] = [];
                if (role === "teacher") {
                    data = await getQuizzesByTeacher(userData.uid);
                } else if (userData.collegeId) {
                    data = await getQuizzesByCollege(userData.collegeId);
                } else {
                    data = await getQuizzes();
                }
                if (!cancelled) setQuizzes(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load quizzes");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userData?.uid, userData?.collegeId, role]);

    const addQuiz = async (quiz: Omit<Quiz, "id">) => {
        const id = await createQuiz(quiz);
        setQuizzes(prev => [{ ...quiz, id }, ...prev]);
        return id;
    };

    const removeQuiz = async (id: string) => {
        await deleteQuiz(id);
        setQuizzes(prev => prev.filter(q => q.id !== id));
    };

    const refresh = async () => {
        if (!userData?.uid) return;
        setLoading(true);
        try {
            let data: Quiz[] = [];
            if (role === "teacher") {
                data = await getQuizzesByTeacher(userData.uid);
            } else if (userData.collegeId) {
                data = await getQuizzesByCollege(userData.collegeId);
            } else {
                data = await getQuizzes();
            }
            setQuizzes(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { quizzes, loading, error, addQuiz, removeQuiz, refresh };
}
