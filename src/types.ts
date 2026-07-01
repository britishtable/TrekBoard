export type Category =
  | 'food'
  | 'nightlife'
  | 'sights'
  | 'entertainment'
  | 'outdoors'
  | 'shopping'
  | 'lodging'
  | 'transport'
  | 'other';

export interface Day {
  id: string;
  label: string;
  date?: string; // ISO yyyy-mm-dd
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  dayId: string | null; // null = unassigned
  note?: string;
  startTime?: string; // 24h "HH:MM"
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
  days: Day[];
  places: Place[];
}

export type { GeocodeResult } from './services/geocode';
