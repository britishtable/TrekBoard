import { serializeBackup, parseBackup, exportBackupZip, importBackupZip } from './backup';
import { addDay, addPlace, createPlace, createTrip } from './tripOps';
import type { PhotoRecord } from '../types';

function photoRecord(id: string, bytes: number[]): PhotoRecord {
  return {
    id,
    blob: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }),
    mime: 'image/jpeg',
    width: 2,
    height: 2,
    createdAt: 7,
  };
}

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

test('zip export then import round-trips trips and photo bytes', async () => {
  const trip = addPlace(
    createTrip('St Francis'),
    createPlace({
      name: 'Beach', lat: -34, lng: 24, category: 'outdoors', dayId: null,
    }),
  );
  const photos = [photoRecord('ph1', [9, 8, 7])];

  const blob = await exportBackupZip([trip], photos);
  const file = new File([blob], 'backup.zip', { type: 'application/zip' });
  const result = await importBackupZip(file);

  expect(result.trips).toHaveLength(1);
  expect(result.trips[0].name).toBe('St Francis');
  expect(result.photos).toHaveLength(1);
  expect(new Uint8Array(await result.photos[0].blob.arrayBuffer())).toEqual(
    new Uint8Array([9, 8, 7]),
  );
});
