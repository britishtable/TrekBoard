import { afterEach, vi } from 'vitest';
import { searchPlaces } from './geocode';

afterEach(() => vi.restoreAllMocks());

test('returns [] for a blank query without calling fetch', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  expect(await searchPlaces('   ')).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
});

test('maps Nominatim results to GeocodeResult', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [
      { display_name: 'Louvre, Paris', lat: '48.8606', lon: '2.3376' },
    ],
  } as Response);

  const results = await searchPlaces('louvre');
  expect(results).toEqual([{ name: 'Louvre, Paris', lat: 48.8606, lng: 2.3376 }]);
});

test('returns [] on non-ok response', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);
  expect(await searchPlaces('louvre')).toEqual([]);
});

test('returns [] on network error', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  expect(await searchPlaces('louvre')).toEqual([]);
});

test('rethrows AbortError instead of swallowing it', async () => {
  const abortError = new DOMException('The operation was aborted.', 'AbortError');
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
  await expect(searchPlaces('louvre')).rejects.toBe(abortError);
});
