import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SearchBox from './SearchBox';
import type { GeocodeResult } from '../services/geocode';

test('shows results and calls onPick when a result is clicked', async () => {
  const user = userEvent.setup();
  const results: GeocodeResult[] = [
    { name: 'Louvre, Paris', lat: 48.86, lng: 2.33 },
  ];
  const onPick = vi.fn();

  render(<SearchBox onPick={onPick} search={async () => results} />);

  await user.type(screen.getByPlaceholderText(/search/i), 'louvre');
  const row = await screen.findByText('Louvre, Paris');
  await user.click(row);

  expect(onPick).toHaveBeenCalledWith(results[0]);
});

test('shows an error message when search fails', async () => {
  const user = userEvent.setup();
  render(
    <SearchBox
      onPick={vi.fn()}
      search={async () => {
        throw new Error('offline');
      }}
    />,
  );
  await user.type(screen.getByPlaceholderText(/search/i), 'louvre');
  expect(await screen.findByText(/couldn.t search/i)).toBeInTheDocument();
});

test('shows "No results found" for an empty result set', async () => {
  const user = userEvent.setup();
  render(<SearchBox onPick={vi.fn()} search={async () => []} />);
  await user.type(screen.getByPlaceholderText(/search/i), 'zzzzz');
  expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
});
