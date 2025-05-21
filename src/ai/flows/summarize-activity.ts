'use server';

/**
 * @fileOverview Summarizes activity descriptions based on mood and time constraints.
 *
 * - summarizeActivity - A function that summarizes activity descriptions.
 * - SummarizeActivityInput - The input type for the summarizeActivity function.
 * - SummarizeActivityOutput - The return type for the summarizeActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeActivityInputSchema = z.object({
  activityDescription: z.string().describe('The detailed description of the activity.'),
  mood: z.string().describe('The user\'s current mood.'),
  timeAvailable: z.string().describe('The time the user has available (e.g., \'30 minutes\', \'2 hours\').'),
  preferences: z.string().optional().describe('The user\'s known preferences.'),
});
export type SummarizeActivityInput = z.infer<typeof SummarizeActivityInputSchema>;

const SummarizeActivityOutputSchema = z.object({
  summary: z.string().describe('A concise and engaging summary of the activity tailored to the user\'s mood, time constraints, and preferences.'),
});
export type SummarizeActivityOutput = z.infer<typeof SummarizeActivityOutputSchema>;

export async function summarizeActivity(input: SummarizeActivityInput): Promise<SummarizeActivityOutput> {
  return summarizeActivityFlow(input);
}

const summarizeActivityPrompt = ai.definePrompt({
  name: 'summarizeActivityPrompt',
  input: {schema: SummarizeActivityInputSchema},
  output: {schema: SummarizeActivityOutputSchema},
  prompt: `You are an AI assistant designed to provide concise and engaging summaries of activities, tailored to the user\'s current mood, available time, and known preferences.

  Given the following activity description, mood, time constraints, and preferences, generate a summary that helps the user quickly decide if the activity is suitable for them.

  Activity Description: {{{activityDescription}}}
  Mood: {{{mood}}}
  Time Available: {{{timeAvailable}}}
  Preferences: {{#if preferences}}{{{preferences}}}{{else}}None{{/if}}

  Summary:`,
});

const summarizeActivityFlow = ai.defineFlow(
  {
    name: 'summarizeActivityFlow',
    inputSchema: SummarizeActivityInputSchema,
    outputSchema: SummarizeActivityOutputSchema,
  },
  async input => {
    const {output} = await summarizeActivityPrompt(input);
    return output!;
  }
);
