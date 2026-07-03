import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TodayView from './TodayView';
import type { Trip } from '../types';

function trip(): Trip {
  return {
    id: 't1',
    name: 'Trip',
    createdAt: 0,
    days: [{ id: 'd1', label: 'Day 1', date: '2026-07-04' }],
    places: [
      { id: 'a', name: 'Late', lat: 0, lng: 0, category: 'food', dayId: 'd1', startTime: '12:00' },
      { id: 'b', name: 'Early', lat: 1, lng: 1, category: 'sights', dayId: 'd1', startTime: '09:00' },
    ],
  };
}
const noop = () => {};

test('renders the selected day stops in time order', () => {
  render(
    <TodayView trip={trip()} selectedDayId="d1" onSelectDay={noop} onToggleVisited={noop} onSelectPlace={noop} />,
  );
  const items = screen.getAllByRole('listitem');
  expect(within(items[0]).getByText('Early')).toBeInTheDocument();
  expect(within(items[1]).getByText('Late')).toBeInTheDocument();
});

test('visited checkbox reports the toggle', async () => {
  const onToggleVisited = vi.fn();
  render(
    <TodayView trip={trip()} selectedDayId="d1" onSelectDay={noop} onToggleVisited={onToggleVisited} onSelectPlace={noop} />,
  );
  await userEvent.click(screen.getByLabelText('Visited Early'));
  expect(onToggleVisited).toHaveBeenCalledWith('b', true);
});

test('shows distance to next between stops but not after the last', () => {
  render(
    <TodayView trip={trip()} selectedDayId="d1" onSelectDay={noop} onToggleVisited={noop} onSelectPlace={noop} />,
  );
  expect(screen.getAllByText(/to next/).length).toBe(1);
});

test('selecting a day reports it', async () => {
  const onSelectDay = vi.fn();
  render(
    <TodayView trip={trip()} selectedDayId="d1" onSelectDay={onSelectDay} onToggleVisited={noop} onSelectPlace={noop} />,
  );
  await userEvent.selectOptions(screen.getByLabelText('Day'), 'unassigned');
  expect(onSelectDay).toHaveBeenCalledWith(null);
});

test('empty day shows a message', () => {
  render(
    <TodayView trip={trip()} selectedDayId={null} onSelectDay={noop} onToggleVisited={noop} onSelectPlace={noop} />,
  );
  expect(screen.getByText(/no stops planned/i)).toBeInTheDocument();
});
