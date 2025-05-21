
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {ollama} from '@genkit-ai/ollama'; // Ensure this is commented out if its package is not installed or if using direct fetch

export const ai = genkit({
  plugins: [
    googleAI({
      // Genkit will automatically look for GOOGLE_API_KEY in process.env
    }),
    // ollama({ // Keep this commented out if @genkit-ai/ollama package fails to install
    //   // Ensure your Ollama server is running, typically at http://localhost:11434
    //   // You can specify serverAddress and defaultModel if needed, e.g.:
    //   serverAddress: 'http://127.0.0.1:11434', // Default if not specified by Genkit's Ollama plugin
    //   defaultModel: 'mistral', // Default model for Ollama, can be overridden in flows
    // }),
  ],
  // Set a default model for top-level ai.generate() calls.
  // This will be overridden by specific model selections in flows if that flow uses aiProvider.
  // For flows not specifying a model, this googleai model will be used.
  model: 'googleai/gemini-1.5-flash-latest',
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
