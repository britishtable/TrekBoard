import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Place } from '../types';
import { categoryColor } from '../config/categories';

interface MapViewProps {
  places: Place[];
  selectedId: string | null;
  center: [number, number];
  onAddPlace(lat: number, lng: number): void;
  onSelectPlace(id: string): void;
}

export default function MapView({
  places,
  selectedId,
  center,
  onAddPlace,
  onSelectPlace,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Keep the latest callbacks without re-binding map events.
  const addRef = useRef(onAddPlace);
  const selectRef = useRef(onSelectPlace);
  addRef.current = onAddPlace;
  selectRef.current = onSelectPlace;

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
    markersRef.current = L.layerGroup().addTo(map);
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

  // Reconcile markers whenever places or selection change.
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

  return <div ref={hostRef} className="leaflet-container-host h-full w-full" />;
}
