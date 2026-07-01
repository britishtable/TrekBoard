import { render } from '@testing-library/react';
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

import MapView from './MapView';

test('renders the map host container', () => {
  const { container } = render(
    <MapView
      places={[]}
      suggestions={[]}
      selectedId={null}
      center={[48.8566, 2.3522]}
      onAddPlace={() => {}}
      onSelectPlace={() => {}}
      onAddSuggestion={() => {}}
      onIdentifyAdd={() => {}}
      onBoundsChange={() => {}}
    />,
  );
  expect(container.querySelector('.maplibre-host')).toBeInTheDocument();
});
