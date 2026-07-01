import { haversineKm, formatDistance, estWalkMinutes } from './distance';

test('haversineKm approximates Paris to London (~344 km)', () => {
  const paris = { lat: 48.8566, lng: 2.3522 };
  const london = { lat: 51.5074, lng: -0.1278 };
  const km = haversineKm(paris, london);
  expect(Math.abs(km - 344)).toBeLessThan(6);
});

test('haversineKm is zero for identical points', () => {
  const p = { lat: 10, lng: 20 };
  expect(haversineKm(p, p)).toBeCloseTo(0, 5);
});

test('formatDistance shows metres under 1 km and km otherwise', () => {
  expect(formatDistance(0.8)).toBe('800 m');
  expect(formatDistance(1.25)).toBe('1.3 km');
});

test('estWalkMinutes assumes 5 km/h', () => {
  expect(estWalkMinutes(5)).toBe(60);
  expect(estWalkMinutes(1)).toBe(12);
});
