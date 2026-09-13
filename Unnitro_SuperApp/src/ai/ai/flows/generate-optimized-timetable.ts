// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating an optimized timetable for students.
 *
 * The flow takes into account the student's course schedule, personal commitments, and study preferences
 * to create a personalized and effective timetable.
 *
 * @interface GenerateOptimizedTimetableInput - Defines the input schema for the generateOptimizedTimetable flow.
 * @interface GenerateOptimizedTimetableOutput - Defines the output schema for the generateOptimizedTimetable flow.
 * @function generateOptimizedTimetable - The main function to trigger the flow and generate the timetable.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimizedTimetableInputSchema = z.object({
  courseSchedule: z.string().describe('The student\'s course schedule, including course names, times, and locations.'),
  personalCommitments: z.string().describe('The student\'s personal commitments, such as work, family, or extracurricular activities, including times and durations.'),
  studyPreferences: z.string().describe('The student\'s study preferences, such as preferred study times, locations, and subjects.'),
});

export type GenerateOptimizedTimetableInput = z.infer<typeof GenerateOptimizedTimetableInputSchema>;

const GenerateOptimizedTimetableOutputSchema = z.object({
  optimizedTimetable: z.string().describe('The optimized timetable, including specific study times for each course, taking into account personal commitments and study preferences.'),
});

export type GenerateOptimizedTimetableOutput = z.infer<typeof GenerateOptimizedTimetableOutputSchema>;

export async function generateOptimizedTimetable(input: GenerateOptimizedTimetableInput): Promise<GenerateOptimizedTimetableOutput> {
  return generateOptimizedTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedTimetablePrompt',
  input: {schema: GenerateOptimizedTimetableInputSchema},
  output: {schema: GenerateOptimizedTimetableOutputSchema},
  prompt: `You are an expert timetable generator for university students. Optimize the timetable based on the student's course schedule, personal commitments, and study preferences.

Course Schedule: {{{courseSchedule}}}
Personal Commitments: {{{personalCommitments}}}
Study Preferences: {{{studyPreferences}}}

Generate an optimized timetable:
`, // Add a more detailed prompt here
});

const generateOptimizedTimetableFlow = ai.defineFlow(
  {
    name: 'generateOptimizedTimetableFlow',
    inputSchema: GenerateOptimizedTimetableInputSchema,
    outputSchema: GenerateOptimizedTimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
