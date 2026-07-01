import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useDebouncedValue } from './debounce';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('returns the initial value immediately', () => {
  const { result } = renderHook(() => useDebouncedValue('a', 500));
  expect(result.current).toBe('a');
});

test('updates only after the delay elapses', () => {
  const { result, rerender } = renderHook(
    ({ v }) => useDebouncedValue(v, 500),
    { initialProps: { v: 'a' } },
  );
  rerender({ v: 'b' });
  expect(result.current).toBe('a');
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('b');
});
