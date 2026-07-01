import type { Day, Place, Trip } from '../types';

function uid(): string {
  return crypto.randomUUID();
}

export function createTrip(name: string): Trip {
  return { id: uid(), name, createdAt: Date.now(), days: [], places: [] };
}

export function createDay(label: string, date?: string): Day {
  return { id: uid(), label, ...(date ? { date } : {}) };
}

export function createPlace(place: Omit<Place, 'id'>): Place {
  return { ...place, id: uid() };
}

export function addPlace(trip: Trip, place: Place): Trip {
  return { ...trip, places: [...trip.places, place] };
}

export function updatePlace(
  trip: Trip,
  placeId: string,
  patch: Partial<Omit<Place, 'id'>>,
): Trip {
  return {
    ...trip,
    places: trip.places.map((p) => (p.id === placeId ? { ...p, ...patch } : p)),
  };
}

export function removePlace(trip: Trip, placeId: string): Trip {
  return { ...trip, places: trip.places.filter((p) => p.id !== placeId) };
}

export function addDay(trip: Trip): Trip {
  const label = `Day ${trip.days.length + 1}`;
  return { ...trip, days: [...trip.days, createDay(label)] };
}

export function renameTrip(trip: Trip, name: string): Trip {
  return { ...trip, name };
}

export function movePlaceWithinDay(
  trip: Trip,
  placeId: string,
  dir: 'up' | 'down',
): Trip {
  const place = trip.places.find((p) => p.id === placeId);
  if (!place) return trip;

  // Absolute indices (in trip.places) of every place sharing this dayId, in order.
  const groupIdx = trip.places
    .map((p, i) => (p.dayId === place.dayId ? i : -1))
    .filter((i) => i !== -1);

  const pos = groupIdx.findIndex((i) => trip.places[i].id === placeId);
  const target = dir === 'up' ? pos - 1 : pos + 1;
  if (target < 0 || target >= groupIdx.length) return trip; // boundary no-op

  const a = groupIdx[pos];
  const b = groupIdx[target];
  const places = [...trip.places];
  [places[a], places[b]] = [places[b], places[a]];
  return { ...trip, places };
}

export function sortDayByTime(trip: Trip, dayId: string | null): Trip {
  const groupIdx = trip.places
    .map((p, i) => (p.dayId === dayId ? i : -1))
    .filter((i) => i !== -1);

  const sorted = groupIdx
    .map((i, order) => ({ p: trip.places[i], order }))
    .sort((a, b) => {
      const ta = a.p.startTime ?? '';
      const tb = b.p.startTime ?? '';
      if (ta === '' && tb === '') return a.order - b.order; // stable
      if (ta === '') return 1; // untimed to end
      if (tb === '') return -1;
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return a.order - b.order; // stable tie-break
    })
    .map((x) => x.p);

  const places = [...trip.places];
  groupIdx.forEach((idx, k) => {
    places[idx] = sorted[k];
  });
  return { ...trip, places };
}
