
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-activity.ts';
import '@/ai/flows/suggest-activities-flow.ts';
import '@/ai/flows/generate-activity-image-flow.ts'; // Added import for the new image generation flow

