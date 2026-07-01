import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DiscoveryPanel from './DiscoveryPanel';

test('selecting a type and searching calls onSearch with that type id', async () => {
  const user = userEvent.setup();
  const onSearch = vi.fn();
  render(
    <DiscoveryPanel status={{ kind: 'idle' }} hasSuggestions={false} onSearch={onSearch} onClear={() => {}} />,
  );
  await user.selectOptions(screen.getByLabelText(/discover type/i), 'museum');
  await user.click(screen.getByRole('button', { name: /search this area/i }));
  expect(onSearch).toHaveBeenCalledWith('museum');
});

test('loading disables the button and shows a searching message', () => {
  render(
    <DiscoveryPanel status={{ kind: 'loading' }} hasSuggestions={false} onSearch={() => {}} onClear={() => {}} />,
  );
  expect(screen.getByRole('button', { name: /search this area/i })).toBeDisabled();
  expect(screen.getByText(/searching/i)).toBeInTheDocument();
});

test('shows an error message', () => {
  render(
    <DiscoveryPanel
      status={{ kind: 'error', message: 'Too busy right now — try again in a moment.' }}
      hasSuggestions={false}
      onSearch={() => {}}
      onClear={() => {}}
    />,
  );
  expect(screen.getByText(/too busy right now/i)).toBeInTheDocument();
});

test('shows an empty message with the type label', () => {
  render(
    <DiscoveryPanel status={{ kind: 'empty', typeLabel: 'Cafés' }} hasSuggestions={false} onSearch={() => {}} onClear={() => {}} />,
  );
  expect(screen.getByText(/no cafés found in this area/i)).toBeInTheDocument();
});

test('shows a zoom-in message when the area is too large', () => {
  render(
    <DiscoveryPanel status={{ kind: 'too-large' }} hasSuggestions={false} onSearch={() => {}} onClear={() => {}} />,
  );
  expect(screen.getByText(/zoom in to search a smaller area/i)).toBeInTheDocument();
});

test('Clear appears only when there are suggestions and fires onClear', async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  const { rerender } = render(
    <DiscoveryPanel status={{ kind: 'results', count: 3 }} hasSuggestions={false} onSearch={() => {}} onClear={onClear} />,
  );
  expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  rerender(
    <DiscoveryPanel status={{ kind: 'results', count: 3 }} hasSuggestions onSearch={() => {}} onClear={onClear} />,
  );
  await user.click(screen.getByRole('button', { name: /clear/i }));
  expect(onClear).toHaveBeenCalled();
});
