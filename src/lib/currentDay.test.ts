import { pickCurrentDay, todayIso } from './currentDay';
import type { Day } from '../types';

const days: Day[] = [
  { id: 'd1', label: 'Day 1', date: '2026-07-04' },
  { id: 'd2', label: 'Day 2', date: '2026-07-05' },
];

test('pickCurrentDay returns the day matching today', () => {
  expect(pickCurrentDay(days, '2026-07-05')).toBe('d2');
});

test('pickCurrentDay falls back to the first day when none match', () => {
  expect(pickCurrentDay(days, '2026-01-01')).toBe('d1');
});

test('pickCurrentDay returns null when there are no days', () => {
  expect(pickCurrentDay([], '2026-07-04')).toBeNull();
});

test('todayIso formats a date as yyyy-mm-dd', () => {
  expect(todayIso(new Date(2026, 6, 4))).toBe('2026-07-04'); // month is 0-based
});
