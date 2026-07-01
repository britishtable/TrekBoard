import { DISCOVERY_TYPES, getDiscoveryType } from './discoveryTypes';

const VALID_CATEGORIES = [
  'food', 'nightlife', 'sights', 'entertainment', 'outdoors',
  'shopping', 'lodging', 'transport', 'other',
];

test('every discovery type has an id, a filter, and a valid category', () => {
  expect(DISCOVERY_TYPES.length).toBeGreaterThan(0);
  for (const t of DISCOVERY_TYPES) {
    expect(t.id).toBeTruthy();
    expect(t.label).toBeTruthy();
    expect(t.filters.length).toBeGreaterThan(0);
    expect(VALID_CATEGORIES).toContain(t.category);
  }
});

test('discovery type ids are unique', () => {
  const ids = DISCOVERY_TYPES.map((t) => t.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('remaps and adds types for the new categories', () => {
  expect(getDiscoveryType('bar')?.category).toBe('nightlife');
  expect(getDiscoveryType('viewpoint')?.category).toBe('outdoors');
  expect(getDiscoveryType('park')?.category).toBe('outdoors');
  expect(getDiscoveryType('nightclub')?.category).toBe('nightlife');
  expect(getDiscoveryType('garden')?.category).toBe('outdoors');
  expect(getDiscoveryType('beach')?.category).toBe('outdoors');
  expect(getDiscoveryType('shops')?.category).toBe('shopping');
  expect(getDiscoveryType('cinema_theatre')?.category).toBe('entertainment');
});

test('getDiscoveryType returns undefined for unknown ids', () => {
  expect(getDiscoveryType('nope')).toBeUndefined();
});
