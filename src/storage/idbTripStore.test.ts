import { createIdbTripStore } from './idbTripStore';
import { createTrip } from '../state/tripOps';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

const LS_KEY = 'trekboard.trips.v1';
const LS_BACKUP_KEY = 'trekboard.trips.v1.premigration-backup';

test('returns empty array on a fresh install', async () => {
  const store = createIdbTripStore(memoryStorage());
  expect(await store.getTrips()).toEqual([]);
});

test('round-trips saved trips through IndexedDB', async () => {
  const store = createIdbTripStore(memoryStorage());
  const trips = [createTrip('Plett')];
  await store.saveTrips(trips);
  expect(await store.getTrips()).toEqual(trips);
});

test('migrates existing localStorage trips into IndexedDB', async () => {
  const ls = memoryStorage();
  const trips = [createTrip('Hogsback')];
  ls.setItem(LS_KEY, JSON.stringify(trips));

  const store = createIdbTripStore(ls);
  expect(await store.getTrips()).toEqual(trips);
});

test('preserves the pre-migration localStorage value under a backup key', async () => {
  const ls = memoryStorage();
  const trips = [createTrip('Addo')];
  const raw = JSON.stringify(trips);
  ls.setItem(LS_KEY, raw);

  const store = createIdbTripStore(ls);
  await store.getTrips();

  expect(ls.getItem(LS_KEY)).toBeNull();
  expect(ls.getItem(LS_BACKUP_KEY)).toBe(raw);
});

test('migration is idempotent and does not clobber later edits', async () => {
  const ls = memoryStorage();
  ls.setItem(LS_KEY, JSON.stringify([createTrip('St Francis')]));

  const store = createIdbTripStore(ls);
  await store.getTrips(); // triggers migration
  const edited = [createTrip('St Francis'), createTrip('Zebra Park')];
  await store.saveTrips(edited);

  // A second store instance (as on a page reload) must read the edited data,
  // not re-run migration from the stale backup.
  const reopened = createIdbTripStore(ls);
  expect(await reopened.getTrips()).toHaveLength(2);
});

test('returns empty array on corrupt localStorage instead of throwing', async () => {
  const ls = memoryStorage();
  ls.setItem(LS_KEY, '{not json');
  const store = createIdbTripStore(ls);
  expect(await store.getTrips()).toEqual([]);
});
