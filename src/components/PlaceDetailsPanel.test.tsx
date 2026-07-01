import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceDetailsPanel from './PlaceDetailsPanel';
import type { Place } from '../types';

const place: Place = {
  id: 'p1',
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

type Props = Partial<ComponentProps<typeof PlaceDetailsPanel>>;

function renderPanel(overrides: Props = {}) {
  return render(
    <PlaceDetailsPanel
      place={place}
      days={[]}
      onChange={() => {}}
      onDelete={() => {}}
      onClose={() => {}}
      {...overrides}
    />,
  );
}

test('editing the name calls onChange with the new value', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderPanel({ onChange });
  const input = screen.getByLabelText(/name/i);
  await user.type(input, '!');
  expect(onChange).toHaveBeenCalledWith({ name: 'Louvre!' });
});

test('delete button fires onDelete', async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();
  renderPanel({ onDelete });
  await user.click(screen.getByRole('button', { name: /delete/i }));
  expect(onDelete).toHaveBeenCalled();
});

test('search nearby calls onSearchNearby with the selected type id', async () => {
  const user = userEvent.setup();
  const onSearchNearby = vi.fn();
  renderPanel({ onSearchNearby });
  await user.selectOptions(screen.getByLabelText(/nearby type/i), 'museum');
  await user.click(screen.getByRole('button', { name: /search nearby/i }));
  expect(onSearchNearby).toHaveBeenCalledWith('museum');
});

test('nearby status renders the nearby empty wording', () => {
  renderPanel({ discoveryStatus: { kind: 'empty', typeLabel: 'Cafés' } });
  expect(screen.getByText(/no cafés found nearby/i)).toBeInTheDocument();
});

test('nearby status renders the result count', () => {
  renderPanel({ discoveryStatus: { kind: 'results', count: 12 } });
  expect(screen.getByText(/12 found/i)).toBeInTheDocument();
});

test('nearby status renders error messages', () => {
  renderPanel({
    discoveryStatus: { kind: 'error', message: 'Too busy right now — try again in a moment.' },
  });
  expect(screen.getByText(/too busy right now/i)).toBeInTheDocument();
});

test('search nearby button is disabled while loading', () => {
  renderPanel({ discoveryStatus: { kind: 'loading' } });
  expect(screen.getByRole('button', { name: /search nearby/i })).toBeDisabled();
});
