
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
  locationContext: z.string().describe("The user's current general location or area name (e.g., 'downtown San Francisco', 'near the beach', 'my current area'). This should be specific enough for the AI to find real places."),
  mood: z.string().describe("The user's current mood (e.g., 'Adventurous', 'Relaxed', 'Curious')."),
  timeAvailable: z.string().describe("The time the user has available (e.g., '30 minutes', '1 hour', 'half-day')."),
  preferences: z.string().optional().describe("Any specific user preferences (e.g., 'prefers quiet places', 'loves history')."),
  aiProvider: z.enum(['googleai', 'ollama']).describe("The AI provider to use for generating suggestions."),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const ActivitySuggestionSchema = z.object({
  name: z.string().describe('The name of a specific, real-world place or a very specific type of activity if a place name isn\'t feasible (e.g., "The Grand Art Museum", "Riverside Cycling Path", "Hidden Gem Bookstore").'),
  description: z.string().describe("An engaging, user-facing description (2-3 sentences) of why this specific place or activity is a good suggestion, tailored to the user's mood and time."),
  category: z.string().describe('A category for the activity. Choose from: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.'),
  estimatedDuration: z.string().describe("An estimated duration for the activity (e.g., 'approx. 45 minutes', '1-2 hours'), ensuring it fits within the user's 'timeAvailable'."),
  locationHint: z.string().describe('A brief hint about where this specific place or activity is located or its general area (e.g., "downtown arts district", "near the old harbor", "in the university quarter", "Elm Street, near the park").'),
  imageKeywords: z.string().describe('One or two keywords for an image search, relevant to the specific place or activity (e.g., "grand museum facade", "riverside path autumn"). Max 2 words.').refine(val => val.split(' ').length <= 2, { message: "Image keywords must be one or two words."}).optional(),
});
export type ActivitySuggestion = z.infer<typeof ActivitySuggestionSchema>;

const SuggestActivitiesOutputSchema = z.object({
  suggestions: z.array(ActivitySuggestionSchema).max(10).describe('A list of 0 to 10 tailored activity suggestions, ideally naming specific places.'),
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
  prompt: `You are WanderSnap, a friendly and creative AI assistant helping users discover specific activities and places.
Based on the user's location context, mood, available time, and preferences, generate 5 to 10 diverse and engaging activity suggestions.
Crucially, try to suggest **specific, real-world places** (e.g., "The Local Grind Coffee Shop", "City Central Park", "Museum of Modern Art") rather than generic activities. If a specific place name isn't possible for a suggestion, provide a very specific type of activity (e.g., "Scenic Riverwalk Photography Session").

If no suitable specific places or activities can be found, it is acceptable to return an empty list of suggestions.

User's Location Context: {{{locationContext}}} (Use this to find real places if possible)
User's Mood: {{{mood}}}
Time Available: {{{timeAvailable}}}
{{#if preferences}}User's Preferences: {{{preferences}}}{{/if}}

For each suggestion, provide:
- A 'name': The name of the specific place or highly specific activity.
- A 'description' (2-3 sentences): Explain why this specific place/activity is a good suggestion, tailored to their mood and time.
- A 'category' from the following list: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.
- An 'estimatedDuration' that fits within their 'timeAvailable'.
- A 'locationHint': A hint about where this specific place/activity is located (e.g., "123 Main St, Downtown", "Elmwood District, near the library", "waterfront area").
- 'imageKeywords': One or two keywords for a representative image of the specific place/activity (e.g., "local grind coffee", "city park fountain", "modern art sculpture").

Return your suggestions as a JSON object with a single key "suggestions", where "suggestions" is an array of objects, each matching the ActivitySuggestion schema. Ensure the JSON is valid.
Example of a single suggestion object structure:
{
  "name": "Explore the Whispering Pines Trail",
  "description": "Perfect for your {{{mood}}} mood, this trail offers beautiful views and a refreshing atmosphere. You can complete a good section in {{{timeAvailable}}}.",
  "category": "Outdoors",
  "estimatedDuration": "approx. 1.5 hours",
  "locationHint": "North end of Redwood Park, entrance on Pine St.",
  "imageKeywords": "pine trail"
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
      const ollamaModel = 'mistral'; // Or make this configurable, e.g. 'llama3', 'tinyllama:latest' etc.
      const ollamaPrompt = `You are WanderSnap, a friendly and creative AI assistant.
Generate between 5 and 10 diverse activity suggestions based on the following user inputs.
Crucially, try to suggest **specific, real-world places** (e.g., "The Local Grind Coffee Shop", "City Central Park", "Museum of Modern Art") rather than generic activities. If a specific place name isn't possible for a suggestion, provide a very specific type of activity (e.g., "Scenic Riverwalk Photography Session").
If no suitable specific places or activities can be found, return an empty array for "suggestions".

User's Location Context: ${input.locationContext} (Use this to find real places if possible)
User's Mood: ${input.mood}
Time Available: ${input.timeAvailable}
${input.preferences ? `User's Preferences: ${input.preferences}` : ''}

For each suggestion, you MUST provide:
- 'name': The name of the specific place or highly specific activity.
- 'description': A 2-3 sentence engaging description of why this specific place/activity is a good suggestion, tailored to the mood and time.
- 'category': Choose one: Food, Outdoors, Arts, Relaxation, Adventure, Shopping, Sightseeing, Entertainment, Sports, Wellness, Educational.
- 'estimatedDuration': An estimated duration fitting 'timeAvailable'.
- 'locationHint': A hint about where this specific place/activity is located (e.g., "123 Main St, Downtown", "Elmwood District, near the library", "waterfront area").
- 'imageKeywords': One or two keywords for a representative image of the specific place/activity (e.g., "local coffee shop", "park fountain", "modern art piece").

Your entire response MUST be a single, valid JSON object. The JSON object must have a single key "suggestions", and its value must be an array of suggestion objects (or an empty array if no suggestions are found), where each suggestion object has the keys: "name", "description", "category", "estimatedDuration", "locationHint", and "imageKeywords".
Do NOT include any text outside of this JSON object.

Example of a single suggestion object structure:
{
  "name": "Example Specific Cafe",
  "description": "An example description for a specific cafe.",
  "category": "Food",
  "estimatedDuration": "approx. 1 hour",
  "locationHint": "Example Street, Town Center",
  "imageKeywords": "cafe interior"
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
        } catch (e: any) {
          console.error('Failed to parse JSON from Ollama response string:', suggestionsJsonString, e);
          // Attempt to clean the string if it's a common issue like being wrapped in markdown
          let cleanedString = suggestionsJsonString.trim();
          if (cleanedString.startsWith('```json')) {
            cleanedString = cleanedString.substring(7);
          }
          if (cleanedString.endsWith('```')) {
            cleanedString = cleanedString.substring(0, cleanedString.length - 3);
          }
          try {
            parsedOutput = JSON.parse(cleanedString);
          } catch (e2: any) {
            console.error('Failed to parse JSON even after cleaning:', cleanedString, e2);
            throw new Error(`Ollama returned data that is not valid JSON. Details: ${e.message}`);
          }
        }
        
        // Validate the parsed output against our Zod schema
        const validationResult = SuggestActivitiesOutputSchema.safeParse(parsedOutput);
        if (!validationResult.success) {
          console.error('Ollama output failed Zod validation:', validationResult.error.flatten());
          // Log the problematic data
          console.error('Problematic Ollama output (parsed):', parsedOutput);
          throw new Error(`Ollama output did not match the expected schema. Issues: ${validationResult.error.message}`);
        }
        return validationResult.data;

      } catch (error) {
        console.error('Error making direct call to Ollama or processing its response:', error);
        // Re-throw the error so it can be caught by the calling component
        throw error;
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

      if (!output) { 
        console.warn(`AI (${input.aiProvider} using ${modelToUse}) did not return a valid output structure, returning empty array.`);
        return { suggestions: [] };
      }
      return output;
    }
  }
);

