"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { ALL_SUBJECTS } from "@/lib/subjects";
import { Course } from "@/lib/types";
export function useCourses() {
    const { userData, role } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mock data hardcoded from Arcpedia's ALL_SUBJECTS
        const mockCourses: Course[] = ALL_SUBJECTS.map(sub => ({
            id: sub.id,
            name: sub.name,
            instructor: sub.professor,
            collegeId: "default",
            description: "Mock course description",
            credits: 3,
            department: "Computer Science",
            createdAt: new Date().toISOString()
        }));
        
        setCourses(mockCourses);
        setLoading(false);
    }, [userData?.uid, userData?.collegeId, role]);

    const refresh = async () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
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
