import {
  createTrip,
  createPlace,
  addPlace,
  updatePlace,
  removePlace,
  addDay,
  renameTrip,
  movePlaceWithinDay,
  sortDayByTime,
  compareByStartTime,
  setDayDate,
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

function tripWithThreeInDay() {
  let t = addDay(createTrip('Paris'));
  const dayId = t.days[0].id;
  for (const name of ['A', 'B', 'C']) {
    t = addPlace(t, createPlace({ name, lat: 0, lng: 0, category: 'other', dayId }));
  }
  return { t, dayId };
}

test('movePlaceWithinDay moves a place up within its day', () => {
  const { t } = tripWithThreeInDay();
  const b = t.places[1]; // 'B'
  const moved = movePlaceWithinDay(t, b.id, 'up');
  expect(moved.places.map((p) => p.name)).toEqual(['B', 'A', 'C']);
});

test('movePlaceWithinDay moving the first place up is a no-op', () => {
  const { t } = tripWithThreeInDay();
  const a = t.places[0];
  const moved = movePlaceWithinDay(t, a.id, 'up');
  expect(moved.places.map((p) => p.name)).toEqual(['A', 'B', 'C']);
});

test('movePlaceWithinDay only reorders within the same day', () => {
  let { t, dayId } = tripWithThreeInDay();
  // add a second day with one place between reorders
  t = addDay(t);
  const day2 = t.days[1].id;
  t = addPlace(t, createPlace({ name: 'Z', lat: 0, lng: 0, category: 'other', dayId: day2 }));
  const c = t.places.find((p) => p.name === 'C')!;
  const moved = movePlaceWithinDay(t, c.id, 'up');
  // C swaps with B inside day 1; Z (day 2) is untouched
  expect(moved.places.filter((p) => p.dayId === dayId).map((p) => p.name)).toEqual(['A', 'C', 'B']);
  expect(moved.places.filter((p) => p.dayId === day2).map((p) => p.name)).toEqual(['Z']);
});

test('sortDayByTime orders timed places ascending, untimed last (stable)', () => {
  let t = addDay(createTrip('Paris'));
  const dayId = t.days[0].id;
  t = addPlace(t, createPlace({ name: 'Late', lat: 0, lng: 0, category: 'other', dayId, startTime: '15:00' }));
  t = addPlace(t, createPlace({ name: 'NoTimeA', lat: 0, lng: 0, category: 'other', dayId }));
  t = addPlace(t, createPlace({ name: 'Early', lat: 0, lng: 0, category: 'other', dayId, startTime: '09:00' }));
  t = addPlace(t, createPlace({ name: 'NoTimeB', lat: 0, lng: 0, category: 'other', dayId }));

  const sorted = sortDayByTime(t, dayId);
  expect(sorted.places.map((p) => p.name)).toEqual(['Early', 'Late', 'NoTimeA', 'NoTimeB']);
});

test('sortDayByTime leaves other days untouched', () => {
  let t = addDay(createTrip('Paris'));
  const d1 = t.days[0].id;
  t = addDay(t);
  const d2 = t.days[1].id;
  t = addPlace(t, createPlace({ name: 'D2', lat: 0, lng: 0, category: 'other', dayId: d2 }));
  t = addPlace(t, createPlace({ name: 'B', lat: 0, lng: 0, category: 'other', dayId: d1, startTime: '10:00' }));
  t = addPlace(t, createPlace({ name: 'A', lat: 0, lng: 0, category: 'other', dayId: d1, startTime: '08:00' }));

  const sorted = sortDayByTime(t, d1);
  expect(sorted.places.filter((p) => p.dayId === d1).map((p) => p.name)).toEqual(['A', 'B']);
  expect(sorted.places.filter((p) => p.dayId === d2).map((p) => p.name)).toEqual(['D2']);
});

test('compareByStartTime orders timed before untimed and by time', () => {
  const base = { id: 'x', name: 'n', lat: 0, lng: 0, category: 'food' as const, dayId: null };
  const nine = { ...base, startTime: '09:00' };
  const ten = { ...base, startTime: '10:00' };
  const none = { ...base };
  expect(compareByStartTime(nine, ten)).toBeLessThan(0);
  expect(compareByStartTime(ten, nine)).toBeGreaterThan(0);
  expect(compareByStartTime(nine, none)).toBeLessThan(0); // timed before untimed
  expect(compareByStartTime(none, nine)).toBeGreaterThan(0);
  expect(compareByStartTime(none, none)).toBe(0);
});

test('setDayDate sets and clears a day date', () => {
  let t = addDay(createTrip('Trip'));
  const dayId = t.days[0].id;
  t = setDayDate(t, dayId, '2026-07-04');
  expect(t.days[0].date).toBe('2026-07-04');
  t = setDayDate(t, dayId, undefined);
  expect(t.days[0].date).toBeUndefined();
});
