
'use server';
/**
 * @fileOverview Generates an image based on keywords using an AI model.
 *
 * - generateActivityImage - A function that calls an AI model to generate an image.
 * - GenerateActivityImageInput - The input type for the generateActivityImage function.
 * - GenerateActivityImageOutput - The return type for the generateActivityImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActivityImageInputSchema = z.object({
  keywords: z.string().describe('One or two keywords to guide image generation (e.g., "mountain hike", "city cafe").'),
});
export type GenerateActivityImageInput = z.infer<typeof GenerateActivityImageInputSchema>;

const GenerateActivityImageOutputSchema = z.object({
  imageDataUri: z.string().optional().describe('The generated image as a Base64 encoded data URI, or undefined if generation failed.'),
});
export type GenerateActivityImageOutput = z.infer<typeof GenerateActivityImageOutputSchema>;

export async function generateActivityImage(input: GenerateActivityImageInput): Promise<GenerateActivityImageOutput> {
  if (!input.keywords || input.keywords.trim() === "") {
    console.warn('Image generation skipped due to empty keywords.');
    return { imageDataUri: undefined };
  }
  try {
    console.log(`Attempting to generate image for keywords: ${input.keywords}`);
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Must use this model for images
      prompt: `Generate a vibrant and appealing photorealistic image suitable for a travel app suggestion, representing: "${input.keywords}". Focus on a clear subject, with a slightly artistic touch. Avoid text in the image.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (media?.url) {
      console.log(`Image generated successfully for: ${input.keywords}`);
      return { imageDataUri: media.url };
    } else {
      console.warn(`Image generation did not return a media URL for keywords: ${input.keywords}`);
      return { imageDataUri: undefined };
    }
  } catch (error) {
    console.error(`Error generating image for keywords "${input.keywords}":`, error);
    return { imageDataUri: undefined }; // Return undefined on error
  }
}
