import { afterEach, vi } from 'vitest';
import { buildQuery, parseElements, searchArea } from './overpass';

afterEach(() => vi.restoreAllMocks());

const bounds = { south: 48.84, west: 2.33, north: 48.88, east: 2.38 };

test('buildQuery includes the bbox and each filter tag for both node and way', () => {
  const q = buildQuery(bounds, 'bar'); // bar has amenity=bar and amenity=pub
  expect(q).toContain('[out:json][timeout:25]');
  expect(q).toContain('48.84,2.33,48.88,2.38');
  expect(q).toContain('node["amenity"="bar"]');
  expect(q).toContain('way["amenity"="bar"]');
  expect(q).toContain('node["amenity"="pub"]');
  expect(q).toContain('out center 60;');
});

test('buildQuery throws for an unknown type', () => {
  expect(() => buildQuery(bounds, 'nope')).toThrow();
});

test('parseElements maps nodes and way-centers, drops unnamed and coord-less, dedupes', () => {
  const elements = [
    { type: 'node', id: 1, lat: 48.85, lon: 2.35, tags: { name: 'Cafe A' } },
    { type: 'way', id: 2, center: { lat: 48.86, lon: 2.36 }, tags: { name: 'Cafe B' } },
    { type: 'node', id: 3, lat: 48.87, lon: 2.37 }, // no name -> dropped
    { type: 'way', id: 4, tags: { name: 'No Coords' } }, // no center -> dropped
    { type: 'node', id: 1, lat: 48.85, lon: 2.35, tags: { name: 'Cafe A dup' } }, // dup id -> dropped
  ];
  const result = parseElements(elements, 'food');
  expect(result).toEqual([
    { id: 'node/1', name: 'Cafe A', lat: 48.85, lng: 2.35, category: 'food' },
    { id: 'way/2', name: 'Cafe B', lat: 48.86, lng: 2.36, category: 'food' },
  ]);
});

test('searchArea returns parsed suggestions on success', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ elements: [{ type: 'node', id: 9, lat: 1, lon: 2, tags: { name: 'X' } }] }),
  } as Response);
  const result = await searchArea(bounds, 'cafe');
  expect(result).toEqual([{ id: 'node/9', name: 'X', lat: 1, lng: 2, category: 'food' }]);
});

test('searchArea throws on a non-ok response', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 504 } as Response);
  await expect(searchArea(bounds, 'cafe')).rejects.toThrow(/504/);
});

test('searchArea propagates network errors', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  await expect(searchArea(bounds, 'cafe')).rejects.toThrow('offline');
});
