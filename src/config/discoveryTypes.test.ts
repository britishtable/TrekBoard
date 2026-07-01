import { DISCOVERY_TYPES, getDiscoveryType } from './discoveryTypes';

const VALID_CATEGORIES = ['food', 'sights', 'lodging', 'transport', 'other'];

test('every discovery type has an id, at least one filter, and a valid category', () => {
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

test('getDiscoveryType finds a known type and returns undefined otherwise', () => {
  expect(getDiscoveryType('cafe')?.category).toBe('food');
  expect(getDiscoveryType('nope')).toBeUndefined();
});
