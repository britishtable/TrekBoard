import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Place } from '../types';
import type { Suggestion } from '../services/overpass';
import type { Bounds } from '../lib/bbox';
import { categoryColor } from '../config/categories';

interface MapViewProps {
  places: Place[];
  suggestions: Suggestion[];
  selectedId: string | null;
  center: [number, number];
  onAddPlace(lat: number, lng: number): void;
  onSelectPlace(id: string): void;
  onAddSuggestion(s: Suggestion): void;
  onBoundsChange(b: Bounds): void;
}

function toBounds(map: L.Map): Bounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

export default function MapView({
  places,
  suggestions,
  selectedId,
  center,
  onAddPlace,
  onSelectPlace,
  onAddSuggestion,
  onBoundsChange,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const suggestionsRef = useRef<L.LayerGroup | null>(null);

  // Latest callbacks without re-binding map events.
  const addRef = useRef(onAddPlace);
  const selectRef = useRef(onSelectPlace);
  const addSuggestionRef = useRef(onAddSuggestion);
  const boundsRef = useRef(onBoundsChange);
  addRef.current = onAddPlace;
  selectRef.current = onSelectPlace;
  addSuggestionRef.current = onAddSuggestion;
  boundsRef.current = onBoundsChange;

  // Initialize the map once.
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      addRef.current(e.latlng.lat, e.latlng.lng);
    });
    map.on('moveend', () => boundsRef.current(toBounds(map)));
    map.whenReady(() => boundsRef.current(toBounds(map)));
    markersRef.current = L.layerGroup().addTo(map);
    suggestionsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when the center prop changes.
  useEffect(() => {
    mapRef.current?.setView(center, mapRef.current.getZoom());
  }, [center]);

  // Saved place markers.
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    group.clearLayers();
    for (const p of places) {
      const selected = p.id === selectedId;
      L.circleMarker([p.lat, p.lng], {
        radius: selected ? 10 : 7,
        color: selected ? '#111827' : categoryColor(p.category),
        weight: selected ? 3 : 1,
        fillColor: categoryColor(p.category),
        fillOpacity: 0.9,
      })
        .bindTooltip(p.name)
        .on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          selectRef.current(p.id);
        })
        .addTo(group);
    }
  }, [places, selectedId]);

  // Suggestion markers (distinct teal, dashed, semi-transparent) with an Add popup.
  useEffect(() => {
    const group = suggestionsRef.current;
    if (!group) return;
    group.clearLayers();
    for (const s of suggestions) {
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 8,
        color: '#0ca678',
        weight: 2,
        dashArray: '3',
        fillColor: '#0ca678',
        fillOpacity: 0.25,
      }).bindTooltip(s.name);

      const container = document.createElement('div');
      container.className = 'text-sm';
      const title = document.createElement('div');
      title.className = 'mb-1 font-medium';
      title.textContent = s.name;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Add to trip';
      btn.className = 'rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white';
      btn.addEventListener('click', () => addSuggestionRef.current(s));
      container.append(title, btn);
      marker.bindPopup(container);

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        marker.openPopup();
      });
      marker.addTo(group);
    }
  }, [suggestions]);

  return <div ref={hostRef} className="leaflet-container-host h-full w-full" />;
}
