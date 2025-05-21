'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // Initialize the Google AI plugin
  ],
  // Set a default model for ai.generate() calls.
  // You can change this to other Gemini models like 'gemini-pro'.
  model: 'googleai/gemini-1.5-flash-latest',
});
