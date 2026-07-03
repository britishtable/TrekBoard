import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Place, Trip } from '../types';
import type { TripStore } from '../storage/TripStore';
import * as ops from './tripOps';
import { serializeBackup, parseBackup } from './backup';

export function useTrips(store: TripStore) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  // Initial async load from the store.
  useEffect(() => {
    let cancelled = false;
    void store.getTrips().then((loadedTrips) => {
      if (cancelled) return;
      setTrips(loadedTrips);
      setCurrentTripId(loadedTrips[0]?.id ?? null);
      setLoading(false);
      loaded.current = true; // enable saving only after the load completes
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Persist whenever trips change, but never before the initial load finished.
  useEffect(() => {
    if (!loaded.current) return;
    void store.saveTrips(trips);
  }, [trips, store]);

  const currentTrip = useMemo(
    () => trips.find((t) => t.id === currentTripId) ?? null,
    [trips, currentTripId],
  );

  const mutateCurrent = useCallback(
    (fn: (t: Trip) => Trip) => {
      setTrips((prev) =>
        prev.map((t) => (t.id === currentTripId ? fn(t) : t)),
      );
    },
    [currentTripId],
  );

  const selectTrip = useCallback((id: string) => setCurrentTripId(id), []);

  const newTrip = useCallback((name: string) => {
    const trip = ops.createTrip(name);
    setTrips((prev) => [...prev, trip]);
    setCurrentTripId(trip.id);
  }, []);

  const renameCurrent = useCallback(
    (name: string) => mutateCurrent((t) => ops.renameTrip(t, name)),
    [mutateCurrent],
  );

  const deleteCurrent = useCallback(() => {
    const next = trips.filter((t) => t.id !== currentTripId);
    setTrips(next);
    setCurrentTripId(next[0]?.id ?? null);
  }, [trips, currentTripId]);

  const addPlace = useCallback(
    (place: Omit<Place, 'id'>): string => {
      const built = ops.createPlace(place);
      mutateCurrent((t) => ops.addPlace(t, built));
      return built.id;
    },
    [mutateCurrent],
  );

  const updatePlace = useCallback(
    (id: string, patch: Partial<Omit<Place, 'id'>>) =>
      mutateCurrent((t) => ops.updatePlace(t, id, patch)),
    [mutateCurrent],
  );

  const removePlace = useCallback(
    (id: string) => mutateCurrent((t) => ops.removePlace(t, id)),
    [mutateCurrent],
  );

  const addDay = useCallback(
    () => mutateCurrent((t) => ops.addDay(t)),
    [mutateCurrent],
  );

  const movePlace = useCallback(
    (id: string, dir: 'up' | 'down') =>
      mutateCurrent((t) => ops.movePlaceWithinDay(t, id, dir)),
    [mutateCurrent],
  );

  const sortDay = useCallback(
    (dayId: string | null) => mutateCurrent((t) => ops.sortDayByTime(t, dayId)),
    [mutateCurrent],
  );

  const exportTrips = useCallback((): string => serializeBackup(trips), [trips]);

  const importTrips = useCallback((json: string): void => {
    const added = parseBackup(json);
    setTrips((prev) => [...prev, ...added]);
    if (added[0]) setCurrentTripId(added[0].id);
  }, []);

  return {
    loading,
    trips,
    currentTrip,
    currentTripId,
    selectTrip,
    newTrip,
    renameCurrent,
    deleteCurrent,
    addPlace,
    updatePlace,
    removePlace,
    addDay,
    movePlace,
    sortDay,
    exportTrips,
    importTrips,
  };
}
