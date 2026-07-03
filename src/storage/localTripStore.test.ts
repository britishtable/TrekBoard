import { createLocalTripStore } from './localTripStore';
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

test('returns empty array when nothing stored', async () => {
  const store = createLocalTripStore(memoryStorage());
  expect(await store.getTrips()).toEqual([]);
});

test('round-trips saved trips', async () => {
  const store = createLocalTripStore(memoryStorage());
  const trips = [createTrip('Paris')];
  await store.saveTrips(trips);
  expect(await store.getTrips()).toEqual(trips);
});

test('returns empty array on corrupt data instead of throwing', async () => {
  const backing = memoryStorage();
  backing.setItem('trekboard.trips.v1', '{not json');
  const store = createLocalTripStore(backing);
  expect(await store.getTrips()).toEqual([]);
});

test('saveTrips does not reject when storage write fails', async () => {
  const failing = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  } as unknown as Storage;
  const store = createLocalTripStore(failing);
  await expect(store.saveTrips([createTrip('Paris')])).resolves.toBeUndefined();
});
