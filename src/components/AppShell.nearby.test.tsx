import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Trip } from '../types';

const mocks = vi.hoisted(() => ({
  searchArea: vi.fn(),
  mapProps: { current: null as Record<string, unknown> | null },
}));

vi.mock('../services/overpass', () => ({
  searchArea: mocks.searchArea,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapViewStub(props: any) {
  mocks.mapProps.current = props;
  useEffect(() => {
    props.onBoundsChange({ south: 48.84, west: 2.33, north: 48.88, east: 2.38 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div data-testid="map-stub" />;
}
vi.mock('./MapView', () => ({ default: MapViewStub }));

import AppShell from './AppShell';

const trip: Trip = {
  id: 't1',
  name: 'Paris',
  createdAt: 1,
  days: [],
  places: [
    { id: 'p1', name: 'Hotel Zed', lat: 48.8566, lng: 2.3522, category: 'lodging', dayId: null },
  ],
};

const cafe = { id: 'node/1', name: 'Café Bleu', lat: 48.8571, lng: 2.353, category: 'food' };

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('trekboard.trips.v1', JSON.stringify([trip]));
  mocks.searchArea.mockReset();
  mocks.searchArea.mockResolvedValue([cafe]);
  mocks.mapProps.current = null;
});

function mapProps(): Record<string, unknown> {
  if (!mocks.mapProps.current) throw new Error('MapView was not rendered');
  return mocks.mapProps.current;
}

async function searchNearbyFromHotel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /^hotel zed$/i }));
  await user.click(screen.getByRole('button', { name: /search nearby/i }));
}

test('nearby search populates suggestions, sets the anchor, and frames the box', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  await searchNearbyFromHotel(user);

  // status shows in both the details panel and the sidebar panel
  expect((await screen.findAllByText(/1 found/i)).length).toBeGreaterThan(0);
  expect(mapProps().suggestions).toHaveLength(1);
  expect(mapProps().anchor).toEqual({ lat: 48.8566, lng: 2.3522 });
  expect(mapProps().frameBounds).not.toBeNull();

  // the box passed to searchArea is centered on the place
  const [bounds, typeId] = mocks.searchArea.mock.calls[0];
  expect(typeId).toBe('cafe');
  expect(bounds.south).toBeLessThan(48.8566);
  expect(bounds.north).toBeGreaterThan(48.8566);
  expect(bounds.west).toBeLessThan(2.3522);
  expect(bounds.east).toBeGreaterThan(2.3522);
});

test('a viewport search clears the anchor and frame', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  await searchNearbyFromHotel(user);
  await screen.findAllByText(/1 found/i);

  mocks.searchArea.mockResolvedValue([
    cafe,
    { id: 'node/2', name: 'Café Vert', lat: 48.858, lng: 2.354, category: 'food' },
  ]);
  await user.click(screen.getByRole('button', { name: /search this area/i }));
  await screen.findAllByText(/2 found/i);

  expect(mapProps().anchor).toBeNull();
  expect(mapProps().frameBounds).toBeNull();
  expect(mapProps().suggestions).toHaveLength(2);
});

test('clear resets suggestions, anchor, and frame', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  await searchNearbyFromHotel(user);
  await screen.findAllByText(/1 found/i);

  await user.click(screen.getByRole('button', { name: /^clear$/i }));

  expect(mapProps().suggestions).toHaveLength(0);
  expect(mapProps().anchor).toBeNull();
  expect(mapProps().frameBounds).toBeNull();
});

test('Near me searches around the reported location', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  const nearMe = await screen.findByRole('button', { name: /near me/i });

  act(() => {
    (mapProps().onLocate as (lat: number, lng: number) => void)(48.86, 2.35);
  });
  await user.click(nearMe);
  await screen.findAllByText(/found/i);

  expect(mocks.searchArea).toHaveBeenCalled();
  const [bounds] = mocks.searchArea.mock.calls[0];
  expect(bounds.south).toBeLessThan(48.86);
  expect(bounds.north).toBeGreaterThan(48.86);
  expect(bounds.west).toBeLessThan(2.35);
  expect(bounds.east).toBeGreaterThan(2.35);
  expect(mapProps().anchor).toEqual({ lat: 48.86, lng: 2.35 });
  expect(mapProps().frameBounds).not.toBeNull();
});

test('Near me without a fix triggers locate, then searches on the fix', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  const nearMe = await screen.findByRole('button', { name: /near me/i });
  const before = mapProps().locateRequestId as number;

  await user.click(nearMe); // no location yet
  expect(mapProps().locateRequestId as number).toBe(before + 1);
  expect(mocks.searchArea).not.toHaveBeenCalled();

  act(() => {
    (mapProps().onLocate as (lat: number, lng: number) => void)(48.86, 2.35);
  });
  await screen.findAllByText(/found/i);
  expect(mocks.searchArea).toHaveBeenCalled();
  expect(mapProps().anchor).toEqual({ lat: 48.86, lng: 2.35 });
});
