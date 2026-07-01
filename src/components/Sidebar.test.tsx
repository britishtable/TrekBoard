import { render, screen } from '@testing-library/react';
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
    />,
  );
  expect(screen.getByText('Louvre')).toBeInTheDocument();
  expect(screen.queryByText('Cafe')).not.toBeInTheDocument();
});
