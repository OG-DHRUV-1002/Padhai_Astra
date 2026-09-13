"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { getCourses, getTeacherCourses, getCoursesByCollege } from "@/lib/db-service";
import { Course } from "@/lib/types";

/**
 * Hook to fetch courses based on the current user's role.
 * - Student: courses they are enrolled in
 * - Teacher: courses they teach
 * - Admin: all courses in their college
 */
export function useCourses() {
    const { userData, role } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userData?.uid) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let data: Course[] = [];
                if (role === "teacher") {
                    data = await getTeacherCourses(userData.uid);
                } else if (role === "admin" && userData.collegeId) {
                    data = await getCoursesByCollege(userData.collegeId);
                } else {
                    // Student — show courses they're enrolled in
                    data = await getCourses(userData.uid);
                }
                if (!cancelled) setCourses(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load courses");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userData?.uid, userData?.collegeId, role]);

    const refresh = async () => {
        if (!userData?.uid) return;
        setLoading(true);
        try {
            let data: Course[] = [];
            if (role === "teacher") {
                data = await getTeacherCourses(userData.uid);
            } else if (role === "admin" && userData.collegeId) {
                data = await getCoursesByCollege(userData.collegeId);
            } else {
                data = await getCourses(userData.uid);
            }
            setCourses(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { courses, loading, error, refresh };
}
