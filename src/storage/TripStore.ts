import type { Trip } from '../types';

export interface TripStore {
  getTrips(): Trip[];
  saveTrips(trips: Trip[]): void;
}
