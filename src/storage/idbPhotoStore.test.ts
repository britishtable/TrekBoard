import { createIdbPhotoStore } from './idbPhotoStore';
import { createIdbTripStore } from './idbTripStore';
import { createTrip } from '../state/tripOps';
import type { PhotoRecord } from '../types';

function photo(id: string, bytes = [1, 2, 3]): PhotoRecord {
  return {
    id,
    blob: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }),
    mime: 'image/jpeg',
    width: 4,
    height: 3,
    createdAt: 123,
  };
}

test('round-trips a photo through IndexedDB', async () => {
  const store = createIdbPhotoStore();
  await store.putPhoto(photo('a'));
  const got = await store.getPhoto('a');
  expect(got?.id).toBe('a');
  expect(new Uint8Array(await got!.blob.arrayBuffer())).toEqual(
    new Uint8Array([1, 2, 3]),
  );
});

test('deletePhoto removes the record', async () => {
  const store = createIdbPhotoStore();
  await store.putPhoto(photo('a'));
  await store.deletePhoto('a');
  expect(await store.getPhoto('a')).toBeUndefined();
});

test('getAllPhotos returns every stored photo', async () => {
  const store = createIdbPhotoStore();
  await store.putPhoto(photo('a'));
  await store.putPhoto(photo('b'));
  const all = await store.getAllPhotos();
  expect(all.map((p) => p.id).sort()).toEqual(['a', 'b']);
});

test('photos and trips coexist in the same v2 database', async () => {
  const photos = createIdbPhotoStore();
  const trips = createIdbTripStore();
  await photos.putPhoto(photo('a'));
  await trips.saveTrips([createTrip('Addo')]);
  expect((await trips.getTrips())[0].name).toBe('Addo');
  expect(await photos.getPhoto('a')).toBeDefined();
});
