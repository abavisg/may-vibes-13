
import type { LucideIcon } from 'lucide-react';

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string; // AI-generated, user-facing description/summary
  photoUrl: string;
  dataAiHint: string;
  location?: UserLocation; // User's detected location, for context or general directions
  locationHint?: string; // Textual location hint from AI for the activity
  category: string; // Category string from AI
  categoryIcon: LucideIcon;
  estimatedDuration?: string; // Estimated duration from AI
}
