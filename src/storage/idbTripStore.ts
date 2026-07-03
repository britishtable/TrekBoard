import { openDB, type IDBPDatabase } from 'idb';
import type { Trip } from '../types';
import type { TripStore } from './TripStore';

const DB_NAME = 'trekboard';
const DB_VERSION = 1;
const STORE = 'state';
const TRIPS_KEY = 'trips';
const LS_KEY = 'trekboard.trips.v1';
const LS_BACKUP_KEY = 'trekboard.trips.v1.premigration-backup';

function openTrekboardDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
}

export function createIdbTripStore(
  storage: Storage = window.localStorage,
): TripStore {
  let migrationAttempted = false;

  async function getTrips(): Promise<Trip[]> {
    const db = await openTrekboardDb();
    const existing = (await db.get(STORE, TRIPS_KEY)) as Trip[] | undefined;
    // IDB already holds data (even an empty array) — steady state, no migration.
    if (existing !== undefined) {
      return Array.isArray(existing) ? existing : [];
    }

    // IDB is empty. Attempt a one-time, non-destructive migration.
    if (!migrationAttempted) {
      migrationAttempted = true;
      const raw = storage.getItem(LS_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const trips = Array.isArray(parsed) ? (parsed as Trip[]) : [];
          await db.put(STORE, trips, TRIPS_KEY);
          const verify = (await db.get(STORE, TRIPS_KEY)) as Trip[] | undefined;
          if (verify !== undefined) {
            // Verified: retire the localStorage copy as a frozen backup.
            storage.setItem(LS_BACKUP_KEY, raw);
            storage.removeItem(LS_KEY);
            return trips;
          }
        } catch (err) {
          console.warn('TrekBoard: migration from localStorage failed.', err);
        }
      }
    }
    return [];
  }

  async function saveTrips(trips: Trip[]): Promise<void> {
    try {
      const db = await openTrekboardDb();
      await db.put(STORE, trips, TRIPS_KEY);
    } catch (err) {
      console.warn('TrekBoard: failed to save trips.', err);
    }
  }

  return { getTrips, saveTrips };
}
