import {
  createTrip,
  createPlace,
  addPlace,
  updatePlace,
  removePlace,
  addDay,
  renameTrip,
} from './tripOps';
import type { Place } from '../types';

const samplePlace: Omit<Place, 'id'> = {
  name: 'Louvre',
  lat: 48.8606,
  lng: 2.3376,
  category: 'sights',
  dayId: null,
};

test('createTrip returns a trip with an id, name, timestamp, empty days/places', () => {
  const t = createTrip('Paris');
  expect(t.name).toBe('Paris');
  expect(t.id).toBeTruthy();
  expect(t.createdAt).toBeGreaterThan(0);
  expect(t.days).toEqual([]);
  expect(t.places).toEqual([]);
});

test('createPlace assigns an id without mutating input', () => {
  const p = createPlace(samplePlace);
  expect(p.id).toBeTruthy();
  expect(p.name).toBe('Louvre');
  expect(samplePlace).not.toHaveProperty('id');
});

test('addPlace appends a built place without mutating input', () => {
  const t = createTrip('Paris');
  const t2 = addPlace(t, createPlace(samplePlace));
  expect(t.places).toHaveLength(0); // original untouched
  expect(t2.places).toHaveLength(1);
  expect(t2.places[0].name).toBe('Louvre');
});

test('updatePlace patches only the target place', () => {
  let t = addPlace(createTrip('Paris'), createPlace(samplePlace));
  const id = t.places[0].id;
  t = updatePlace(t, id, { note: 'go early', category: 'food' });
  expect(t.places[0].note).toBe('go early');
  expect(t.places[0].category).toBe('food');
  expect(t.places[0].name).toBe('Louvre');
});

test('removePlace deletes the target place', () => {
  let t = addPlace(createTrip('Paris'), createPlace(samplePlace));
  const id = t.places[0].id;
  t = removePlace(t, id);
  expect(t.places).toHaveLength(0);
});

test('addDay appends an auto-labeled day', () => {
  let t = addDay(createTrip('Paris'));
  t = addDay(t);
  expect(t.days.map((d) => d.label)).toEqual(['Day 1', 'Day 2']);
});

test('renameTrip changes the name immutably', () => {
  const t = createTrip('Paris');
  const t2 = renameTrip(t, 'Paris 2026');
  expect(t.name).toBe('Paris');
  expect(t2.name).toBe('Paris 2026');
});
