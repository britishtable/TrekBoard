import { isBboxSearchable, type Bounds } from './bbox';

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
