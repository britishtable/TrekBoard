import { boundsAroundPoint, isBboxSearchable, type Bounds } from './bbox';

const city: Bounds = { south: 48.84, west: 2.33, north: 48.88, east: 2.38 };
const country: Bounds = { south: 45, west: 0, north: 51, east: 8 };

test('a city-scale box is searchable', () => {
  expect(isBboxSearchable(city)).toBe(true);
});

test('a country-scale box is not searchable', () => {
  expect(isBboxSearchable(country)).toBe(false);
});

test('a box exactly at the 0.35 degree limit is searchable', () => {
  expect(isBboxSearchable({ south: 0, west: 0, north: 0.35, east: 0.35 })).toBe(true);
});

test('boundsAroundPoint contains the center point', () => {
  const b = boundsAroundPoint(48.8566, 2.3522, 800);
  expect(b.south).toBeLessThan(48.8566);
  expect(b.north).toBeGreaterThan(48.8566);
  expect(b.west).toBeLessThan(2.3522);
  expect(b.east).toBeGreaterThan(2.3522);
});

test('boundsAroundPoint lat span is 2 * radius / 111320 degrees at any latitude', () => {
  const expected = (2 * 800) / 111_320;
  const paris = boundsAroundPoint(48.8566, 2.3522, 800);
  const tromso = boundsAroundPoint(69.6492, 18.9553, 800);
  expect(paris.north - paris.south).toBeCloseTo(expected, 6);
  expect(tromso.north - tromso.south).toBeCloseTo(expected, 6);
});

test('boundsAroundPoint lng span widens at high latitude', () => {
  const equator = boundsAroundPoint(0, 10, 800);
  const tromso = boundsAroundPoint(69.6492, 18.9553, 800);
  expect(tromso.east - tromso.west).toBeGreaterThan(equator.east - equator.west);
});

test('an 800 m nearby box passes the searchable guard', () => {
  expect(isBboxSearchable(boundsAroundPoint(48.8566, 2.3522, 800))).toBe(true);
});
