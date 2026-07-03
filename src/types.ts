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
  visited?: boolean;
  photoIds?: string[];
}

export interface PhotoRecord {
  id: string;
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
  days: Day[];
  places: Place[];
}

export type { GeocodeResult } from './services/geocode';
