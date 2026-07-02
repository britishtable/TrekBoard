import { poiCategory } from './poiCategory';

test('food classes map to food', () => {
  for (const c of ['restaurant', 'cafe', 'fast_food', 'bakery']) {
    expect(poiCategory(c)).toBe('food');
  }
});

test('nightlife classes map to nightlife', () => {
  for (const c of ['bar', 'pub', 'nightclub']) {
    expect(poiCategory(c)).toBe('nightlife');
  }
});

test('entertainment classes map to entertainment', () => {
  for (const c of ['cinema', 'theatre', 'gallery']) {
    expect(poiCategory(c)).toBe('entertainment');
  }
});

test('outdoors classes map to outdoors', () => {
  for (const c of ['park', 'garden', 'viewpoint', 'beach']) {
    expect(poiCategory(c)).toBe('outdoors');
  }
});

test('shopping classes map to shopping', () => {
  for (const c of ['mall', 'supermarket', 'marketplace']) {
    expect(poiCategory(c)).toBe('shopping');
  }
});

test('sights, lodging, and transport still map correctly', () => {
  expect(poiCategory('museum')).toBe('sights');
  expect(poiCategory('hotel')).toBe('lodging');
  expect(poiCategory('railway')).toBe('transport');
});

test('unknown or empty classes map to other', () => {
  expect(poiCategory('bank')).toBe('other');
  expect(poiCategory('')).toBe('other');
});

test('mountain peak classes map to outdoors', () => {
  for (const c of ['peak', 'volcano', 'saddle']) {
    expect(poiCategory(c)).toBe('outdoors');
  }
});
