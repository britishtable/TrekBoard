import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppShell from './AppShell';

test('shows empty state and can create the first trip', async () => {
  const user = userEvent.setup();
  // isolate storage per test
  window.localStorage.clear();
  render(<AppShell />);

  expect(screen.getByText(/create your first trip/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /new trip/i }));
  // a prompt-based flow is avoided; the button creates a default-named trip
  expect(screen.getByText(/my trip/i)).toBeInTheDocument();
});
