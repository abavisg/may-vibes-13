
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-activity.ts';
import '@/ai/flows/suggest-activities-flow.ts';
// Removed import for generate-activity-image-flow.ts as it's no longer used
