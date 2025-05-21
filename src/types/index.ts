import type { LucideIcon } from 'lucide-react';

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string; // Raw description for AI
  aiSummary?: string;
  photoUrl: string;
  dataAiHint: string;
  location: UserLocation;
  categoryIcon: LucideIcon;
}
