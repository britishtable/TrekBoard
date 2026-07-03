import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Place, PhotoRecord, Trip } from '../types';
import type { TripStore } from '../storage/TripStore';
import type { PhotoStore } from '../storage/PhotoStore';
import * as ops from './tripOps';
import { parseBackup, exportBackupZip, importBackupZip } from './backup';

export function useTrips(store: TripStore, photoStore: PhotoStore) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // The last trips value known to be persisted. Null until the initial load
  // finishes; set to the loaded value so we never write the just-loaded data
  // straight back to the store (a redundant write that, for an empty [], would
  // block the localStorage-to-IndexedDB migration on the next load).
  const lastSaved = useRef<Trip[] | null>(null);

  // Initial async load from the store.
  useEffect(() => {
    let cancelled = false;
    void store.getTrips().then((loadedTrips) => {
      if (cancelled) return;
      lastSaved.current = loadedTrips; // already in the store — do not re-save it
      setTrips(loadedTrips);
      setCurrentTripId(loadedTrips[0]?.id ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Persist whenever trips change, but never before the initial load finished
  // and never for the just-loaded value itself.
  useEffect(() => {
    if (lastSaved.current === null) return; // initial load not finished
    if (trips === lastSaved.current) return; // unchanged since load
    lastSaved.current = trips;
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
    const trip = trips.find((t) => t.id === currentTripId);
    trip?.places.forEach((p) =>
      p.photoIds?.forEach((pid) => void photoStore.deletePhoto(pid)),
    );
    const next = trips.filter((t) => t.id !== currentTripId);
    setTrips(next);
    setCurrentTripId(next[0]?.id ?? null);
  }, [trips, currentTripId, photoStore]);

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
    (id: string) => {
      const target = trips
        .find((t) => t.id === currentTripId)
        ?.places.find((p) => p.id === id);
      target?.photoIds?.forEach((pid) => void photoStore.deletePhoto(pid));
      mutateCurrent((t) => ops.removePlace(t, id));
    },
    [mutateCurrent, trips, currentTripId, photoStore],
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

  const exportBackup = useCallback(async (): Promise<Blob> => {
    const photos = await photoStore.getAllPhotos();
    return exportBackupZip(trips, photos);
  }, [trips, photoStore]);

  const importBackup = useCallback(
    async (file: File): Promise<void> => {
      let added: Trip[];
      let photos: PhotoRecord[] = [];
      if (file.name.toLowerCase().endsWith('.zip')) {
        const res = await importBackupZip(file);
        added = res.trips;
        photos = res.photos;
      } else {
        added = parseBackup(await file.text());
      }
      for (const p of photos) await photoStore.putPhoto(p);
      setTrips((prev) => [...prev, ...added]);
      if (added[0]) setCurrentTripId(added[0].id);
    },
    [photoStore],
  );

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
    exportBackup,
    importBackup,
  };
}
