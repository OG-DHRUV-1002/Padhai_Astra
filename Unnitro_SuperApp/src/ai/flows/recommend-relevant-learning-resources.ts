// src/ai/flows/recommend-relevant-learning-resources.ts
'use server';
/**
 * @fileOverview Recommends relevant learning resources, study materials, and external websites.
 *
 * - recommendResources - A function that recommends learning resources based on student data.
 * - RecommendResourcesInput - The input type for the recommendResources function.
 * - RecommendResourcesOutput - The return type for the recommendResources function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecommendResourcesInputSchema = z.object({
  courses: z
    .array(z.string())
    .describe('List of courses the student is currently taking.'),
  academicPerformance: z
    .string()
    .describe("A summary of the student's academic performance, including grades and attendance."),
  learningStyle: z.string().describe('The student learning style.'),
});
export type RecommendResourcesInput = z.infer<typeof RecommendResourcesInputSchema>;

const RecommendResourcesOutputSchema = z.object({
  resources: z
    .array(z.string())
    .describe('A list of recommended learning resources, study materials, and external websites.'),
});
export type RecommendResourcesOutput = z.infer<typeof RecommendResourcesOutputSchema>;

export async function recommendResources(input: RecommendResourcesInput): Promise<RecommendResourcesOutput> {
  return recommendResourcesFlow(input);
}

const recommendResourcesPrompt = ai.definePrompt({
  name: 'recommendResourcesPrompt',
  input: { schema: RecommendResourcesInputSchema },
  output: { schema: RecommendResourcesOutputSchema },
  config: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
  prompt: `You are a high-speed education assistant.
  
  GOAL: Provide exactly 20 diverse, free learning resources for:
  Courses: {{courses}}
  Performance: {{academicPerformance}}
  Style: {{learningStyle}}
  
  REQUIREMENTS:
  - Mix of: YouTube (Direct Links), PDFs/Articles (Use Google Search Links: "https://www.google.com/search?q=..."), Official Docs.
  - SPEED IS CRITICAL. Do not generate descriptions.
  - Output format: "Resource Title (URL)"
  
  RESOURCES:
  {{#each resources}}- {{this}}\n{{/each}}`,
});

const recommendResourcesFlow = ai.defineFlow(
  {
    name: 'recommendResourcesFlow',
    inputSchema: RecommendResourcesInputSchema,
    outputSchema: RecommendResourcesOutputSchema,
  },
  async input => {
    const { output } = await recommendResourcesPrompt(input);
    return output!;
  }
);
