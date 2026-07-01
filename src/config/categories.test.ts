import { CATEGORIES, categoryColor, categoryLabel } from './categories';

test('defines exactly the five v1 categories', () => {
  expect(CATEGORIES.map((c) => c.id)).toEqual([
    'food',
    'sights',
    'lodging',
    'transport',
    'other',
  ]);
});

test('categoryColor returns a hex color for a known category', () => {
  expect(categoryColor('food')).toMatch(/^#[0-9a-f]{6}$/i);
});

test('categoryLabel returns the human label', () => {
  expect(categoryLabel('sights')).toBe('Sights');
});
