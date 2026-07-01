import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Place, Trip } from '../types';
import type { TripStore } from '../storage/TripStore';
import * as ops from './tripOps';

export function useTrips(store: TripStore) {
  const [trips, setTrips] = useState<Trip[]>(() => store.getTrips());
  const [currentTripId, setCurrentTripId] = useState<string | null>(
    () => store.getTrips()[0]?.id ?? null,
  );
  const loaded = useRef(false);

  // Persist whenever trips change (skip the very first render).
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    store.saveTrips(trips);
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
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== currentTripId);
      setCurrentTripId(next[0]?.id ?? null);
      return next;
    });
  }, [currentTripId]);

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

  return {
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
  };
}
