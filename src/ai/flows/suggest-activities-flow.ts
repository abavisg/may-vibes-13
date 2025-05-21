
'use server';
/**
 * @fileOverview Generates tailored activity suggestions based on user's location, mood, and time.
 *
 * - suggestActivities - A function that calls an AI model to get activity suggestions.
 * - SuggestActivitiesInput - The input type for the suggestActivities function.
 * - SuggestActivitiesOutput - The return type for the suggestActivities function.
 * - ActivitySuggestion - The type for a single activity suggestion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActivitiesInputSchema = z.object({
  locationContext: z.string().describe("The user's current general location or area name (e.g., 'downtown San Francisco', 'near the beach', 'my current area')."),
  mood: z.string().describe("The user's current mood (e.g., 'Adventurous', 'Relaxed', 'Curious')."),
  timeAvailable: z.string().describe("The time the user has available (e.g., '30 minutes', '1 hour', 'half-day')."),
  preferences: z.string().optional().describe("Any specific user preferences (e.g., 'prefers quiet places', 'loves history')."),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const ActivitySuggestionSchema = z.object({
  name: z.string().describe('The concise and catchy name of the suggested activity.'),
  description: z.string().describe("An engaging, user-facing description of the activity (2-3 sentences), tailored to the user's mood and time. Highlight what makes it suitable."),
  category: z.string().describe('A category for the activity. Choose from: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness.'),
  estimatedDuration: z.string().describe("An estimated duration for the activity (e.g., 'approx. 45 minutes', '1-2 hours'), ensuring it fits within the user's 'timeAvailable'."),
  locationHint: z.string().describe('A brief, general hint about where this type of activity might be found or its setting (e.g., "a local park", "a cozy cafe in the main street", "the museum district", "anywhere with a good view").'),
});
export type ActivitySuggestion = z.infer<typeof ActivitySuggestionSchema>;

const SuggestActivitiesOutputSchema = z.object({
  suggestions: z.array(ActivitySuggestionSchema).min(1).max(5).describe('A list of 1 to 5 tailored activity suggestions.'),
});
export type SuggestActivitiesOutput = z.infer<typeof SuggestActivitiesOutputSchema>;


export async function suggestActivities(input: SuggestActivitiesInput): Promise<SuggestActivitiesOutput> {
  return suggestActivitiesFlow(input);
}

const suggestActivitiesPrompt = ai.definePrompt({
  name: 'suggestActivitiesPrompt',
  input: {schema: SuggestActivitiesInputSchema},
  output: {schema: SuggestActivitiesOutputSchema},
  prompt: `You are WanderSnap, a friendly and creative AI assistant helping users discover activities.
Based on the user's location context, mood, available time, and preferences, generate 3 to 5 diverse and engaging activity suggestions.

User's Location Context: {{{locationContext}}}
User's Mood: {{{mood}}}
Time Available: {{{timeAvailable}}}
{{#if preferences}}User's Preferences: {{{preferences}}}{{/if}}

For each suggestion, provide:
- A catchy 'name'.
- A 'description' (2-3 sentences) that's engaging and tailored to their mood and time.
- A 'category' from the following list: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness.
- An 'estimatedDuration' that fits within their 'timeAvailable'.
- A general 'locationHint' (e.g., "a bustling market area", "a quiet riverside path").

Return your suggestions as a JSON object with a single key "suggestions", where "suggestions" is an array of objects, each matching the ActivitySuggestion schema. Ensure the JSON is valid.
Example of a single suggestion object structure:
{
  "name": "Explore the Secret Garden",
  "description": "Unwind and find tranquility in this hidden gem. Perfect for a {{{mood}}} moment, you can easily spend {{{timeAvailable}}} discovering its beauty.",
  "category": "Outdoors",
  "estimatedDuration": "approx. 1 hour",
  "locationHint": "a secluded spot in the city park"
}
Provide between 1 and 5 suggestions.
`,
});

const suggestActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestActivitiesFlow',
    inputSchema: SuggestActivitiesInputSchema,
    outputSchema: SuggestActivitiesOutputSchema,
  },
  async (input) => {
    // Using Ollama, so ensure the model can handle JSON output well.
    // The prompt strongly guides it towards JSON.
    const {output} = await suggestActivitiesPrompt(input);
    if (!output || !output.suggestions) {
      // Fallback or error handling if AI doesn't return expected structure
      // This basic fallback ensures the app doesn't crash.
      // In a real app, you might want more sophisticated error handling or retries.
      console.warn('AI did not return valid suggestions, returning empty array.');
      return { suggestions: [] };
    }
    return output;
  }
);
