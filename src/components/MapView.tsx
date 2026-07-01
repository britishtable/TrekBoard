import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Place } from '../types';
import type { Suggestion } from '../services/overpass';
import type { Bounds } from '../lib/bbox';
import { categoryColor, categoryLabel } from '../config/categories';
import { pickPoi, type IdentifiedPoi, type QueriedFeature } from '../lib/pickPoi';

// 'liberty' renders POI icons and exposes the `poi` source-layer, which
// click-to-identify (pickPoi) queries. 'positron' has no POI layers.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

interface MapViewProps {
  places: Place[];
  suggestions: Suggestion[];
  selectedId: string | null;
  center: [number, number]; // [lat, lng]
  onAddPlace(lat: number, lng: number): void;
  onSelectPlace(id: string): void;
  onAddSuggestion(s: Suggestion): void;
  onIdentifyAdd(poi: IdentifiedPoi): void;
  onBoundsChange(b: Bounds): void;
}

function toBounds(map: maplibregl.Map): Bounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

function placeElement(color: string, selected: boolean): HTMLDivElement {
  const el = document.createElement('div');
  const size = selected ? 20 : 16;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '9999px';
  el.style.background = color;
  el.style.cursor = 'pointer';
  el.style.boxSizing = 'border-box';
  el.style.border = selected ? '3px solid #111827' : '1px solid rgba(255,255,255,0.9)';
  return el;
}

function suggestionElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '16px';
  el.style.height = '16px';
  el.style.borderRadius = '9999px';
  el.style.background = 'rgba(12,166,120,0.35)';
  el.style.border = '2px dashed #0ca678';
  el.style.cursor = 'pointer';
  el.style.boxSizing = 'border-box';
  return el;
}

function addButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.className = 'rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white';
  return btn;
}

export default function MapView({
  places,
  suggestions,
  selectedId,
  center,
  onAddPlace,
  onSelectPlace,
  onAddSuggestion,
  onIdentifyAdd,
  onBoundsChange,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const suggestionMarkersRef = useRef<maplibregl.Marker[]>([]);

  const addRef = useRef(onAddPlace);
  const selectRef = useRef(onSelectPlace);
  const addSuggestionRef = useRef(onAddSuggestion);
  const identifyAddRef = useRef(onIdentifyAdd);
  const boundsRef = useRef(onBoundsChange);
  addRef.current = onAddPlace;
  selectRef.current = onSelectPlace;
  addSuggestionRef.current = onAddSuggestion;
  identifyAddRef.current = onIdentifyAdd;
  boundsRef.current = onBoundsChange;

  // Initialize the map once.
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: STYLE_URL,
      center: [center[1], center[0]], // MapLibre uses [lng, lat]
      zoom: 13,
    });

    map.on('load', () => boundsRef.current(toBounds(map)));
    map.on('moveend', () => boundsRef.current(toBounds(map)));

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point) as unknown as QueriedFeature[];
      const poi = pickPoi(features, e.lngLat.lat, e.lngLat.lng);
      if (!poi) {
        addRef.current(e.lngLat.lat, e.lngLat.lng);
        return;
      }
      const container = document.createElement('div');
      container.className = 'text-sm';
      const title = document.createElement('div');
      title.className = 'font-medium';
      title.textContent = poi.name;
      const sub = document.createElement('div');
      sub.className = 'mb-1 text-xs text-gray-500';
      sub.textContent = categoryLabel(poi.category);
      const btn = addButton('Add to trip');
      container.append(title, sub, btn);
      const popup = new maplibregl.Popup({ offset: 12 })
        .setLngLat([poi.lng, poi.lat])
        .setDOMContent(container)
        .addTo(map);
      btn.addEventListener('click', () => {
        identifyAddRef.current(poi);
        popup.remove();
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when the center prop changes.
  useEffect(() => {
    mapRef.current?.setCenter([center[1], center[0]]);
  }, [center]);

  // Saved place markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = places.map((p) => {
      const el = placeElement(categoryColor(p.category), p.id === selectedId);
      el.title = p.name;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        selectRef.current(p.id);
      });
      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
    });
  }, [places, selectedId]);

  // Suggestion markers with an Add popup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    suggestionMarkersRef.current.forEach((m) => m.remove());
    suggestionMarkersRef.current = suggestions.map((s) => {
      const el = suggestionElement();
      el.title = s.name;
      const container = document.createElement('div');
      container.className = 'text-sm';
      const title = document.createElement('div');
      title.className = 'mb-1 font-medium';
      title.textContent = s.name;
      const btn = addButton('Add to trip');
      btn.addEventListener('click', () => addSuggestionRef.current(s));
      container.append(title, btn);
      const popup = new maplibregl.Popup({ offset: 12 }).setDOMContent(container);
      return new maplibregl.Marker({ element: el })
        .setLngLat([s.lng, s.lat])
        .setPopup(popup)
        .addTo(map);
    });
  }, [suggestions]);

  return <div ref={hostRef} className="maplibre-host h-full w-full" />;
}
