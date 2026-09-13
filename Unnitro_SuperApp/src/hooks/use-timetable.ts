"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/student-context";
import { getTimetable, updateTimetable as updateTimetableDb, getStudentTimetable, updateStudentTimetable as updateStudentTimetableDb } from "@/lib/db-service";
import { Timetable, TimetableSlot } from "@/lib/types";

/**
 * Hook to fetch timetable by collegeId.
 * Replaces hardcoded SUBJECT_PROFESSOR_MAP in weekly-planner.
 */
export function useTimetable() {
    const { userData, role } = useAuth();
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [studentTimetable, setStudentTimetable] = useState<Timetable | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userData?.collegeId) {
            setLoading(false);
            return;
        }
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getTimetable(userData.collegeId!);
                if (!cancelled) setTimetable(data);
                
                if (role !== "teacher" && userData.uid) {
                    const studentData = await getStudentTimetable(userData.uid);
                    if (!cancelled) setStudentTimetable(studentData);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to load timetable");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [userData?.collegeId, userData?.uid, role]);

    const updateSchedule = async (schedule: Timetable["schedule"]) => {
        if (!userData?.collegeId) return;
        await updateTimetableDb(userData.collegeId, schedule);
        setTimetable(prev => prev ? { ...prev, schedule } : { collegeId: userData.collegeId!, schedule });
    };

    const updateStudentSchedule = async (schedule: Timetable["schedule"]) => {
        if (!userData?.uid) return;
        await updateStudentTimetableDb(userData.uid, schedule);
        setStudentTimetable(prev => prev ? { ...prev, schedule } : { studentId: userData.uid, schedule });
    };

    const refresh = async () => {
        if (!userData?.collegeId) return;
        setLoading(true);
        try {
            const data = await getTimetable(userData.collegeId);
            setTimetable(data);
            
            if (role !== "teacher" && userData.uid) {
                const studentData = await getStudentTimetable(userData.uid);
                setStudentTimetable(studentData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { timetable, studentTimetable, loading, error, updateSchedule, updateStudentSchedule, refresh };
}
