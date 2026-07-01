import { serializeBackup, parseBackup } from './backup';
import { addDay, addPlace, createPlace, createTrip } from './tripOps';

function sampleTrips() {
  let t = addDay(createTrip('Paris'));
  const dayId = t.days[0].id;
  t = addPlace(t, createPlace({ name: 'Louvre', lat: 48.86, lng: 2.33, category: 'sights', dayId }));
  return [t];
}

test('round-trips trips but regenerates the top-level trip id', () => {
  const trips = sampleTrips();
  const restored = parseBackup(serializeBackup(trips));
  expect(restored).toHaveLength(1);
  expect(restored[0].id).not.toBe(trips[0].id); // fresh id
  expect(restored[0].name).toBe('Paris');
  expect(restored[0].days).toEqual(trips[0].days);
  expect(restored[0].places).toEqual(trips[0].places);
});

test('throws on invalid JSON', () => {
  expect(() => parseBackup('{not json')).toThrow();
});

test('throws on unsupported version', () => {
  expect(() => parseBackup(JSON.stringify({ version: 2, trips: [] }))).toThrow();
});

test('throws when trips is not an array', () => {
  expect(() => parseBackup(JSON.stringify({ version: 1, trips: {} }))).toThrow();
});

test('throws when a trip is not trip-shaped', () => {
  expect(() =>
    parseBackup(JSON.stringify({ version: 1, trips: [{ name: 'x' }] })),
  ).toThrow();
});
