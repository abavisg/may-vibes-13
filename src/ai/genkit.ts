import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Genkit will automatically look for GOOGLE_API_KEY in process.env
      // You can explicitly set it here:
      // apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  // Set a default model for top-level ai.generate() calls.
  // The format is '<plugin_name>/<model_name>'.
  model: 'googleai/gemini-1.5-flash-latest',
});
