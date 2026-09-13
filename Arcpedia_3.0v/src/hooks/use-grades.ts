"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { getGrades, getGradesByCourse, getTeacherCourses, addGrade as addGradeDb, updateGrade as updateGradeDb, deleteGrade as deleteGradeDb } from "@/lib/db-service";
import { Grade } from "@/lib/types";

/**
 * Hook to fetch grades by studentId, courseId, or all teacher courses.
 */
export function useGrades(courseId?: string) {
    const { userData, role } = useAuth();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userData?.uid) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let data: Grade[] = [];
                if (courseId) {
                    data = await getGradesByCourse(courseId);
                } else if (role === "teacher") {
                    // Load grades from all courses this teacher teaches
                    const courses = await getTeacherCourses(userData.uid);
                    const allGrades = await Promise.all(courses.map(c => getGradesByCourse(c.id)));
                    data = allGrades.flat();
                } else if (role === "student") {
                    data = await getGrades(userData.uid);
                }
                if (!cancelled) setGrades(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load grades");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userData?.uid, courseId, role]);

    const addGrade = async (grade: Omit<Grade, "id">) => {
        const id = await addGradeDb(grade);
        setGrades(prev => [{ ...grade, id }, ...prev]);
        return id;
    };

    const updateGrade = async (id: string, data: Partial<Grade>) => {
        await updateGradeDb(id, data);
        setGrades(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    };

    const removeGrade = async (id: string) => {
        await deleteGradeDb(id);
        setGrades(prev => prev.filter(g => g.id !== id));
    };

    const refresh = async () => {
        if (!userData?.uid) return;
        setLoading(true);
        try {
            let data: Grade[] = [];
            if (courseId) {
                data = await getGradesByCourse(courseId);
            } else if (role === "teacher") {
                const courses = await getTeacherCourses(userData.uid);
                const allGrades = await Promise.all(courses.map(c => getGradesByCourse(c.id)));
                data = allGrades.flat();
            } else if (role === "student") {
                data = await getGrades(userData.uid);
            }
            setGrades(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { grades, loading, error, addGrade, updateGrade, removeGrade, refresh };
}
