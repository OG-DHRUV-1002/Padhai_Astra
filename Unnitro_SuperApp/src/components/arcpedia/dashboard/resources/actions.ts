"use server";

import { recommendResources, type RecommendResourcesInput } from "@/ai/flows/recommend-relevant-learning-resources";

export async function getRecommendedResources(input: RecommendResourcesInput) {
    try {
        const result = await recommendResources(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error recommending resources:", error);
        return { success: false, error: "Failed to recommend resources. Please try again." };
    }
}
