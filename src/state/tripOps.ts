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
