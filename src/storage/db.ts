import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'trekboard';
const DB_VERSION = 2;
export const STATE_STORE = 'state';
export const PHOTOS_STORE = 'photos';

export function openTrekboardDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Additive across versions: v1 created `state`, v2 adds `photos`.
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE);
      }
    },
  });
}
