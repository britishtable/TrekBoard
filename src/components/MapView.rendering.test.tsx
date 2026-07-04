import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import maplibregl from 'maplibre-gl';

// Richer maplibre mock than MapView.test.tsx: it records event handlers so
// tests can drive `error`/`data` events, and spies on the reload/resize/repaint
// calls the rendering fixes are expected to make.
vi.mock('maplibre-gl', () => {
  const instances: any[] = [];
  class Map {
    handlers: Record<string, ((ev: unknown) => void)[]> = {};
    triggerRepaint = vi.fn();
    resize = vi.fn();
    reloadTile = vi.fn();
    style = { sourceCaches: { openmaptiles: { _reloadTile: this.reloadTile } } as Record<string, unknown> };
    constructor() {
      instances.push(this);
    }
    on(type: string, handler: (ev: unknown) => void) {
      (this.handlers[type] ||= []).push(handler);
      return this;
    }
    emit(type: string, ev?: unknown) {
      (this.handlers[type] || []).forEach((h) => h(ev));
    }
    remove() {}
    setCenter() {
      return this;
    }
    getBounds() {
      return { getSouth: () => 0, getWest: () => 0, getNorth: () => 0, getEast: () => 0 };
    }
    queryRenderedFeatures() {
      return [];
    }
    addControl() {
      return this;
    }
    addLayer() {
      return this;
    }
    getLayer() {
      return undefined;
    }
    fitBounds() {
      return this;
    }
  }
  (Map as unknown as { instances: unknown[] }).instances = instances;
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
  class GeolocateControl {
    on() {
      return this;
    }
    trigger() {
      return true;
    }
  }
  return { default: { Map, Marker, Popup, GeolocateControl } };
});

import MapView from './MapView';

let resizeCallback: ResizeObserverCallback | null = null;

beforeEach(() => {
  resizeCallback = null;
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  vi.useRealTimers();
});

function latestMap(): any {
  const instances = (maplibregl.Map as unknown as { instances: any[] }).instances;
  return instances[instances.length - 1];
}

function renderMap() {
  return render(
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
}

test('resizes the map when its container resizes', () => {
  renderMap();
  const map = latestMap();
  expect(map.resize).not.toHaveBeenCalled();

  resizeCallback?.([], {} as ResizeObserver);

  expect(map.resize).toHaveBeenCalled();
});

test('reloads an errored tile after a backoff delay', () => {
  renderMap();
  const map = latestMap();
  vi.useFakeTimers();

  map.emit('error', { sourceId: 'openmaptiles', tile: { tileID: { key: 'abc' } } });
  expect(map.reloadTile).not.toHaveBeenCalled(); // debounced, not immediate

  vi.advanceTimersByTime(2000);
  expect(map.reloadTile).toHaveBeenCalledWith('abc', 'reloading');
  expect(map.triggerRepaint).toHaveBeenCalled();
});

test('stops retrying a tile after the cap', () => {
  renderMap();
  const map = latestMap();
  vi.useFakeTimers();

  const ev = { sourceId: 'openmaptiles', tile: { tileID: { key: 'k1' } } };
  for (let i = 0; i < 6; i++) {
    map.emit('error', ev);
    vi.advanceTimersByTime(5000);
  }

  expect(map.reloadTile).toHaveBeenCalledTimes(3);
});

test('retries a tile again after it later loads successfully', () => {
  renderMap();
  const map = latestMap();
  vi.useFakeTimers();

  const ev = { sourceId: 'openmaptiles', tile: { tileID: { key: 'k2' } } };
  // Exhaust the retry cap.
  for (let i = 0; i < 4; i++) {
    map.emit('error', ev);
    vi.advanceTimersByTime(5000);
  }
  expect(map.reloadTile).toHaveBeenCalledTimes(3);

  // The tile eventually loads, which should reset its retry budget.
  map.emit('data', { dataType: 'source', tile: { state: 'loaded', tileID: { key: 'k2' } } });
  map.emit('error', ev);
  vi.advanceTimersByTime(5000);
  expect(map.reloadTile).toHaveBeenCalledTimes(4);
});

test('ignores non-tile errors and a missing source cache without throwing', () => {
  renderMap();
  const map = latestMap();
  vi.useFakeTimers();
  map.style.sourceCaches = {}; // source no longer present

  expect(() => {
    map.emit('error', { error: new Error('generic') }); // no sourceId/tile
    map.emit('error', { sourceId: 'gone', tile: { tileID: { key: 'z' } } });
    vi.advanceTimersByTime(2000);
  }).not.toThrow();
});
