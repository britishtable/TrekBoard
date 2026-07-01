import { act, renderHook } from '@testing-library/react';
import { useTrips } from './useTrips';
import { createLocalTripStore } from '../storage/localTripStore';
import type { Place } from '../types';

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

const place: Omit<Place, 'id'> = {
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

test('newTrip creates and selects a trip', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});

test('addPlace adds to the current trip', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.addPlace(place));
  expect(result.current.currentTrip?.places).toHaveLength(1);
});

test('persists across hook remounts via the same store', () => {
  const store = memoryStore();
  const first = renderHook(() => useTrips(store));
  act(() => first.result.current.newTrip('Paris'));
  act(() => first.result.current.addPlace(place));

  const second = renderHook(() => useTrips(store));
  expect(second.result.current.trips).toHaveLength(1);
  expect(second.result.current.trips[0].places).toHaveLength(1);
});

test('deleteCurrent removes the trip and reselects another', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.newTrip('Rome'));
  act(() => result.current.deleteCurrent()); // deletes Rome
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});
