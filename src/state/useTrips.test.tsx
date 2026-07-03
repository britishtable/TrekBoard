import { act, renderHook, waitFor } from '@testing-library/react';
import { useTrips } from './useTrips';
import { createLocalTripStore } from '../storage/localTripStore';
import type { TripStore } from '../storage/TripStore';
import type { PhotoStore } from '../storage/PhotoStore';
import type { Place, Trip } from '../types';
import { serializeBackup } from './backup';
import { addPlace, createPlace, createTrip } from './tripOps';

function memoryStore() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
  return createLocalTripStore(storage);
}

function stubPhotoStore(deleted: string[] = []): PhotoStore {
  return {
    getPhoto: async () => undefined,
    putPhoto: async () => {},
    deletePhoto: async (id) => void deleted.push(id),
    getAllPhotos: async () => [],
  };
}

const place: Omit<Place, 'id'> = {
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

test('newTrip creates and selects a trip', async () => {
  const { result } = renderHook(() => useTrips(memoryStore(), stubPhotoStore()));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.newTrip('Paris'));
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});

test('importBackup adds trips from a json file and selects the first', async () => {
  const store = memoryStore();
  const photoStore = stubPhotoStore();
  const { result } = renderHook(() => useTrips(store, photoStore));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const imported = addPlace(
    createTrip('Rome'),
    createPlace({ name: 'Colosseum', lat: 41.89, lng: 12.49, category: 'sights', dayId: null }),
  );
  const file = new File([serializeBackup([imported])], 'backup.json', {
    type: 'application/json',
  });

  await act(async () => {
    await result.current.importBackup(file);
  });

  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Rome');
});

test('addPlace adds to the current trip', async () => {
  const { result } = renderHook(() => useTrips(memoryStore(), stubPhotoStore()));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.addPlace(place));
  expect(result.current.currentTrip?.places).toHaveLength(1);
});

test('persists across hook remounts via the same store', async () => {
  const store = memoryStore();
  const first = renderHook(() => useTrips(store, stubPhotoStore()));
  await waitFor(() => expect(first.result.current.loading).toBe(false));
  act(() => first.result.current.newTrip('Paris'));
  act(() => first.result.current.addPlace(place));
  // saveTrips is async fire-and-forget; wait for the write to reach the store.
  await waitFor(async () => expect(await store.getTrips()).toHaveLength(1));

  const second = renderHook(() => useTrips(store, stubPhotoStore()));
  await waitFor(() => expect(second.result.current.trips).toHaveLength(1));
  expect(second.result.current.trips[0].places).toHaveLength(1);
});

test('does not persist the initially loaded trips back to the store', async () => {
  // Regression: writing the just-loaded value back (an empty []) used to land
  // in IndexedDB and block the localStorage-to-IndexedDB migration on reload.
  const saved: Trip[][] = [];
  const seeded = [createTrip('Loaded')];
  const store: TripStore = {
    getTrips: async () => seeded,
    saveTrips: async (t) => {
      saved.push(t);
    },
  };

  const { result } = renderHook(() => useTrips(store, stubPhotoStore()));
  await waitFor(() => expect(result.current.loading).toBe(false));

  // The initial load must not trigger any write-back.
  expect(saved).toHaveLength(0);

  // A real mutation still persists.
  act(() => result.current.newTrip('Second'));
  await waitFor(() => expect(saved.length).toBeGreaterThan(0));
});

test('deleteCurrent removes the trip and reselects another', async () => {
  const { result } = renderHook(() => useTrips(memoryStore(), stubPhotoStore()));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.newTrip('Rome'));
  act(() => result.current.deleteCurrent()); // deletes Rome
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});

test('removePlace deletes that place\'s photos', async () => {
  const deleted: string[] = [];
  const { result } = renderHook(() =>
    useTrips(memoryStore(), stubPhotoStore(deleted)),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.newTrip('Trip'));
  let id = '';
  act(() => {
    id = result.current.addPlace(place);
  });
  act(() => result.current.updatePlace(id, { photoIds: ['ph1', 'ph2'] }));
  act(() => result.current.removePlace(id));
  await waitFor(() => expect(deleted.sort()).toEqual(['ph1', 'ph2']));
});

test('deleteCurrent deletes photos across the trip', async () => {
  const deleted: string[] = [];
  const { result } = renderHook(() =>
    useTrips(memoryStore(), stubPhotoStore(deleted)),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.newTrip('Trip'));
  let id = '';
  act(() => {
    id = result.current.addPlace(place);
  });
  act(() => result.current.updatePlace(id, { photoIds: ['ph9'] }));
  act(() => result.current.deleteCurrent());
  await waitFor(() => expect(deleted).toContain('ph9'));
});
