import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Sidebar from './Sidebar';
import { addDay, addPlace, createPlace, createTrip } from '../state/tripOps';
import type { Category } from '../types';

function tripWithPlaces() {
  let t = addDay(createTrip('Paris')); // Day 1
  const dayId = t.days[0].id;
  t = addPlace(t, createPlace({ name: 'Louvre', lat: 1, lng: 1, category: 'sights', dayId }));
  t = addPlace(t, createPlace({ name: 'Cafe', lat: 2, lng: 2, category: 'food', dayId: null }));
  return t;
}

test('lists places grouped with an Unassigned group', () => {
  render(
    <Sidebar
      trip={tripWithPlaces()}
      selectedId={null}
      categoryFilter={new Set<Category>()}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
      onMovePlace={() => {}}
      onSortDay={() => {}}
      onSetDayDate={() => {}}
    />,
  );
  expect(screen.getByText('Louvre')).toBeInTheDocument();
  expect(screen.getByText('Cafe')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Unassigned' })).toBeInTheDocument();
});

test('category filter hides non-matching places', () => {
  render(
    <Sidebar
      trip={tripWithPlaces()}
      selectedId={null}
      categoryFilter={new Set<Category>(['sights'])}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
      onMovePlace={() => {}}
      onSortDay={() => {}}
      onSetDayDate={() => {}}
    />,
  );
  expect(screen.getByText('Louvre')).toBeInTheDocument();
  expect(screen.queryByText('Cafe')).not.toBeInTheDocument();
});

test('up/down buttons call onMovePlace, disabled at group boundaries', async () => {
  const user = userEvent.setup();
  const onMovePlace = vi.fn();
  let t = addDay(createTrip('Paris'));
  const dayId = t.days[0].id;
  t = addPlace(t, createPlace({ name: 'First', lat: 0, lng: 0, category: 'other', dayId }));
  t = addPlace(t, createPlace({ name: 'Second', lat: 0, lng: 0, category: 'other', dayId }));

  render(
    <Sidebar
      trip={t}
      selectedId={null}
      categoryFilter={new Set()}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
      onMovePlace={onMovePlace}
      onSortDay={() => {}}
      onSetDayDate={() => {}}
    />,
  );

  // 'First' can move down but not up; click its down button.
  await user.click(screen.getByRole('button', { name: /move First down/i }));
  expect(onMovePlace).toHaveBeenCalledWith(t.places[0].id, 'down');
  expect(screen.getByRole('button', { name: /move First up/i })).toBeDisabled();
});

test('shows a day date input and reports changes', async () => {
  const onSetDayDate = vi.fn();
  const t = tripWithPlaces();
  const dayId = t.days[0].id;
  render(
    <Sidebar
      trip={t}
      selectedId={null}
      categoryFilter={new Set()}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
      onMovePlace={() => {}}
      onSortDay={() => {}}
      onSetDayDate={onSetDayDate}
    />,
  );
  const input = screen.getByLabelText('Date for Day 1');
  await userEvent.clear(input);
  await userEvent.type(input, '2026-07-06');
  expect(onSetDayDate).toHaveBeenLastCalledWith(dayId, '2026-07-06');
});
