import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('maplibre-gl', () => {
  class Map {
    on() {
      return this;
    }
    remove() {}
    setCenter() {
      return this;
    }
    getBounds() {
      return {
        getSouth: () => 0,
        getWest: () => 0,
        getNorth: () => 0,
        getEast: () => 0,
      };
    }
    queryRenderedFeatures() {
      return [];
    }
  }
  class Marker {
    setLngLat() {
      return this;
    }
    setPopup() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  class Popup {
    setLngLat() {
      return this;
    }
    setDOMContent() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  return { default: { Map, Marker, Popup } };
});

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
