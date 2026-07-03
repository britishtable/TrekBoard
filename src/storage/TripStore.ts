import type { Trip } from '../types';

export interface TripStore {
  getTrips(): Promise<Trip[]>;
  saveTrips(trips: Trip[]): Promise<void>;
}
