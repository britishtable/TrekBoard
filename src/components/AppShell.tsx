import { useMemo, useState } from 'react';
import type { Category, GeocodeResult } from '../types';
import { createLocalTripStore } from '../storage/localTripStore';
import { useTrips } from '../state/useTrips';
import MapView from './MapView';
import SearchBox from './SearchBox';
import Sidebar from './Sidebar';
import PlaceDetailsPanel from './PlaceDetailsPanel';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris

export default function AppShell() {
  const store = useMemo(() => createLocalTripStore(), []);
  const trips = useTrips(store);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<Category>>(new Set());
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [view, setView] = useState<'map' | 'list'>('map');

  const current = trips.currentTrip;
  const selectedPlace =
    current?.places.find((p) => p.id === selectedId) ?? null;

  function toggleCategory(cat: Category) {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function handleAddPlace(lat: number, lng: number) {
    if (!current) return;
    const id = trips.addPlace({
      name: 'New place',
      lat,
      lng,
      category: 'other',
      dayId: null,
    });
    setSelectedId(id);
  }

  function handlePick(result: GeocodeResult) {
    if (!current) return;
    const id = trips.addPlace({
      name: result.name,
      lat: result.lat,
      lng: result.lng,
      category: 'other',
      dayId: null,
    });
    setCenter([result.lat, result.lng]);
    setSelectedId(id);
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">TrekBoard</h1>
        <p className="text-gray-500">Create your first trip to start planning.</p>
        <button
          type="button"
          onClick={() => trips.newTrip('My Trip')}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New trip
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-2 border-b border-gray-200 p-2">
        <span className="px-1 text-lg font-bold text-gray-800">TrekBoard</span>
        <select
          aria-label="Current trip"
          value={current.id}
          onChange={(e) => {
            trips.selectTrip(e.target.value);
            setSelectedId(null);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {trips.trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => trips.newTrip('My Trip')}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          New trip
        </button>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt('Rename trip', current.name);
            if (name) trips.renameCurrent(name);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete "${current.name}"?`)) {
              trips.deleteCurrent();
              setSelectedId(null);
            }
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
        <div className="ml-auto sm:hidden">
          <button
            type="button"
            onClick={() => setView(view === 'map' ? 'list' : 'map')}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {view === 'map' ? 'List' : 'Map'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            view === 'list' ? 'block' : 'hidden'
          } w-full sm:block sm:w-80 sm:shrink-0 border-r border-gray-200`}
        >
          <div className="border-b border-gray-200 p-2">
            <SearchBox onPick={handlePick} />
          </div>
          <div className="h-[calc(100%-3.25rem)]">
            <Sidebar
              trip={current}
              selectedId={selectedId}
              categoryFilter={categoryFilter}
              dayFilter={dayFilter}
              onSelectPlace={(id) => {
                setSelectedId(id);
                const p = current.places.find((x) => x.id === id);
                if (p) setCenter([p.lat, p.lng]);
                setView('map');
              }}
              onToggleCategory={toggleCategory}
              onSetDayFilter={setDayFilter}
              onAddDay={trips.addDay}
            />
          </div>
        </aside>

        {/* Map */}
        <main className={`${view === 'map' ? 'block' : 'hidden'} flex-1 sm:block`}>
          <MapView
            places={current.places}
            selectedId={selectedId}
            center={center}
            onAddPlace={handleAddPlace}
            onSelectPlace={setSelectedId}
          />
        </main>

        {/* Details panel */}
        {selectedPlace && (
          <aside className="absolute right-0 top-0 z-[1000] h-full w-72 border-l border-gray-200 bg-white shadow-lg">
            <PlaceDetailsPanel
              place={selectedPlace}
              days={current.days}
              onChange={(patch) => trips.updatePlace(selectedPlace.id, patch)}
              onDelete={() => {
                trips.removePlace(selectedPlace.id);
                setSelectedId(null);
              }}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
