
'use server';
/**
 * @fileOverview Generates tailored activity suggestions based on user's location, mood, time, and chosen AI provider.
 *
 * - suggestActivities - A function that calls an AI model to get activity suggestions.
 * - SuggestActivitiesInput - The input type for the suggestActivities function.
 * - SuggestActivitiesOutput - The return type for the suggestActivities function.
 * - ActivitySuggestion - The type for a single activity suggestion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AiProvider } from '@/types';

const SuggestActivitiesInputSchema = z.object({
  locationContext: z.string().describe("The user's current general location or area name (e.g., 'downtown San Francisco', 'near the beach', 'my current area')."),
  mood: z.string().describe("The user's current mood (e.g., 'Adventurous', 'Relaxed', 'Curious')."),
  timeAvailable: z.string().describe("The time the user has available (e.g., '30 minutes', '1 hour', 'half-day')."),
  preferences: z.string().optional().describe("Any specific user preferences (e.g., 'prefers quiet places', 'loves history')."),
  aiProvider: z.enum(['googleai', 'ollama']).describe("The AI provider to use for generating suggestions."),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const ActivitySuggestionSchema = z.object({
  name: z.string().describe('The concise and catchy name of the suggested activity.'),
  description: z.string().describe("An engaging, user-facing description of the activity (2-3 sentences), tailored to the user's mood and time. Highlight what makes it suitable."),
  category: z.string().describe('A category for the activity. Choose from: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.'),
  estimatedDuration: z.string().describe("An estimated duration for the activity (e.g., 'approx. 45 minutes', '1-2 hours'), ensuring it fits within the user's 'timeAvailable'."),
  locationHint: z.string().describe('A brief, general hint about where this type of activity might be found or its setting (e.g., "a local park", "a cozy cafe in the main street", "the museum district", "anywhere with a good view").'),
});
export type ActivitySuggestion = z.infer<typeof ActivitySuggestionSchema>;

const SuggestActivitiesOutputSchema = z.object({
  suggestions: z.array(ActivitySuggestionSchema).max(10).describe('A list of 0 to 10 tailored activity suggestions.'),
});
export type SuggestActivitiesOutput = z.infer<typeof SuggestActivitiesOutputSchema>;


export async function suggestActivities(input: SuggestActivitiesInput): Promise<SuggestActivitiesOutput> {
  return suggestActivitiesFlow(input);
}

// This is the schema for the data that the Genkit prompt template itself expects.
// It omits aiProvider as that's used for model selection, not directly in the template.
const PromptDirectInputSchema = SuggestActivitiesInputSchema.omit({ aiProvider: true });

const suggestActivitiesPrompt = ai.definePrompt({
  name: 'suggestActivitiesPrompt',
  input: {schema: PromptDirectInputSchema},
  output: {schema: SuggestActivitiesOutputSchema},
  prompt: `You are WanderSnap, a friendly and creative AI assistant helping users discover activities.
Based on the user's location context, mood, available time, and preferences, generate 5 to 10 diverse and engaging activity suggestions. If no suitable activities can be found, it is acceptable to return an empty list of suggestions.

User's Location Context: {{{locationContext}}}
User's Mood: {{{mood}}}
Time Available: {{{timeAvailable}}}
{{#if preferences}}User's Preferences: {{{preferences}}}{{/if}}

For each suggestion, provide:
- A catchy 'name'.
- A 'description' (2-3 sentences) that's engaging and tailored to their mood and time.
- A 'category' from the following list: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.
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
Provide between 5 and 10 suggestions. If no relevant suggestions are found, return an empty array for "suggestions". Ensure your entire response is a single, valid JSON object.
`,
});

const suggestActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestActivitiesFlow',
    inputSchema: SuggestActivitiesInputSchema,
    outputSchema: SuggestActivitiesOutputSchema,
  },
  async (input) => {
    if (input.aiProvider === 'ollama') {
      console.log("Attempting to use Ollama directly.");
      const ollamaModel = 'tinyllama:latest'; // Or make this configurable
      const ollamaPrompt = `You are WanderSnap, a friendly and creative AI assistant.
Generate between 5 and 10 diverse activity suggestions based on the following user inputs. If no suitable activities can be found, return an empty array for "suggestions".
User's Location Context: ${input.locationContext}
User's Mood: ${input.mood}
Time Available: ${input.timeAvailable}
${input.preferences ? `User's Preferences: ${input.preferences}` : ''}

For each suggestion, you MUST provide:
- 'name': A catchy name for the activity.
- 'description': A 2-3 sentence engaging description, tailored to the mood and time.
- 'category': Choose one: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.
- 'estimatedDuration': An estimated duration fitting 'timeAvailable'.
- 'locationHint': A general hint about where this activity might be found.

Your entire response MUST be a single, valid JSON object. The JSON object must have a single key "suggestions", and its value must be an array of suggestion objects (or an empty array if no suggestions are found), where each suggestion object has the keys: "name", "description", "category", "estimatedDuration", and "locationHint".
Do NOT include any text outside of this JSON object.

Example of a single suggestion object structure:
{
  "name": "Example Activity",
  "description": "An example description.",
  "category": "Example Category",
  "estimatedDuration": "approx. 1 hour",
  "locationHint": "An example location hint."
}
`;

      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: ollamaPrompt,
            format: 'json', // Request JSON output
            stream: false,   // Get the full response at once
          }),
        });

        if (!ollamaResponse.ok) {
          const errorBody = await ollamaResponse.text();
          console.error(`Ollama API error! Status: ${ollamaResponse.status}`, errorBody);
          throw new Error(`Ollama API request failed with status ${ollamaResponse.status}: ${errorBody}`);
        }

        const ollamaData = await ollamaResponse.json();
        
        if (!ollamaData.response) {
          console.error('Ollama response did not contain a "response" field:', ollamaData);
          throw new Error('Invalid response structure from Ollama: missing "response" field.');
        }

        // The 'response' field from Ollama contains the stringified JSON content
        const suggestionsJsonString = ollamaData.response;
        
        let parsedOutput;
        try {
          parsedOutput = JSON.parse(suggestionsJsonString);
        } catch (e) {
          console.error('Failed to parse JSON from Ollama response string:', suggestionsJsonString, e);
          throw new Error('Ollama returned a string that is not valid JSON.');
        }
        
        // Validate the parsed output against our Zod schema
        const validationResult = SuggestActivitiesOutputSchema.safeParse(parsedOutput);
        if (!validationResult.success) {
          console.error('Ollama output failed Zod validation:', validationResult.error.flatten());
          // Optionally, you could try to salvage partial data or return a more specific error
          throw new Error('Ollama output did not match the expected schema.');
        }

        // No need to check validationResult.data.suggestions.length === 0 here,
        // as the schema now allows an empty array.
        // The UI will handle the "no suggestions" case.
        return validationResult.data;

      } catch (error) {
        console.error('Error making direct call to Ollama or processing its response:', error);
        // Fallback or rethrow, depending on desired behavior
        toast({ title: 'Ollama Connection Error', description: `Could not get suggestions from local Ollama. Is it running? Error: ${error.message}`, variant: 'destructive' });
        return { suggestions: [] }; // Return empty suggestions on error
      }

    } else { // 'googleai' provider (or any other Genkit-managed provider)
      const modelToUse = 'googleai/gemini-1.5-flash-latest';

      const promptInputData: z.infer<typeof PromptDirectInputSchema> = {
        locationContext: input.locationContext,
        mood: input.mood,
        timeAvailable: input.timeAvailable,
        preferences: input.preferences,
      };
      
      console.log(`Requesting suggestions from ${input.aiProvider} using model ${modelToUse} via Genkit.`);

      const {output} = await suggestActivitiesPrompt(promptInputData, { model: modelToUse });

      if (!output) { // Schema now allows empty suggestions array, so output can be {suggestions: []}
        console.warn(`AI (${input.aiProvider} using ${modelToUse}) did not return a valid output structure, returning empty array.`);
        return { suggestions: [] };
      }
      return output;
    }
  }
);

// Helper for direct Ollama call toast, not used in Genkit path.
// This is a bit of a hack as flows shouldn't directly cause UI toasts.
// Consider moving UI feedback to the calling component.
const toast = (options: { title: string; description: string; variant?: 'destructive' | 'default' }) => {
  // This is a placeholder. In a real app, you'd use your actual toast mechanism.
  // For server-side code, you can't directly call client-side hooks like useToast.
  // This would typically be handled by returning an error/status that the client interprets.
  console.warn(`SERVER TOAST: ${options.title} - ${options.description}`);
};

