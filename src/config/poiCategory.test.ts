import { poiCategory } from './poiCategory';

test('maps food-like classes to food', () => {
  for (const c of ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'bakery']) {
    expect(poiCategory(c)).toBe('food');
  }
});

test('maps lodging classes to lodging', () => {
  expect(poiCategory('hotel')).toBe('lodging');
  expect(poiCategory('hostel')).toBe('lodging');
});

test('maps sight classes to sights', () => {
  for (const c of ['museum', 'attraction', 'viewpoint', 'artwork', 'park']) {
    expect(poiCategory(c)).toBe('sights');
  }
});

test('maps transport classes to transport', () => {
  expect(poiCategory('railway')).toBe('transport');
  expect(poiCategory('bus')).toBe('transport');
  expect(poiCategory('airport')).toBe('transport');
});

test('defaults unknown or empty classes to other', () => {
  expect(poiCategory('bank')).toBe('other');
  expect(poiCategory('')).toBe('other');
});
