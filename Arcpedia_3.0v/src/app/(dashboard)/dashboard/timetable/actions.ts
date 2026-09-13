"use server";

import { generateOptimizedTimetable, type GenerateOptimizedTimetableInput } from "@/ai/flows/generate-optimized-timetable";

export async function getOptimizedTimetable(input: GenerateOptimizedTimetableInput) {
    try {
        const result = await generateOptimizedTimetable(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error generating timetable:", error);
        return { success: false, error: "Failed to generate timetable. Please try again." };
    }
}
