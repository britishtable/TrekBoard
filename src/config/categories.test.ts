import { CATEGORIES, categoryColor, categoryLabel } from './categories';

test('defines the nine categories in display order', () => {
  expect(CATEGORIES.map((c) => c.id)).toEqual([
    'food',
    'nightlife',
    'sights',
    'entertainment',
    'outdoors',
    'shopping',
    'lodging',
    'transport',
    'other',
  ]);
});

test('every category has a hex color and a non-empty label', () => {
  for (const c of CATEGORIES) {
    expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c.label.length).toBeGreaterThan(0);
  }
});

test('categoryColor and categoryLabel resolve a new category', () => {
  expect(categoryColor('nightlife')).toBe('#ae3ec9');
  expect(categoryLabel('nightlife')).toBe('Nightlife');
});

test('categoryLabel returns the human label', () => {
  expect(categoryLabel('sights')).toBe('Sights');
});
