import type { Trip } from '../types';
import type { TripStore } from './TripStore';

const KEY = 'trekboard.trips.v1';

export function createLocalTripStore(
  storage: Storage = window.localStorage,
): TripStore {
  return {
    async getTrips(): Promise<Trip[]> {
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Trip[]) : [];
      } catch (err) {
        console.warn('TrekBoard: failed to read trips, starting empty.', err);
        return [];
      }
    },
    async saveTrips(trips: Trip[]): Promise<void> {
      try {
        storage.setItem(KEY, JSON.stringify(trips));
      } catch (err) {
        console.warn('TrekBoard: failed to save trips.', err);
      }
    },
  };
}
