import { useMemo, useRef, useState } from 'react';
import type { Category, GeocodeResult } from '../types';
import type { Suggestion } from '../services/overpass';
import { searchArea } from '../services/overpass';
import type { IdentifiedPoi } from '../lib/pickPoi';
import type { Bounds } from '../lib/bbox';
import { boundsAroundPoint, isBboxSearchable } from '../lib/bbox';
import { getDiscoveryType } from '../config/discoveryTypes';
import { createIdbTripStore } from '../storage/idbTripStore';
import { createIdbPhotoStore } from '../storage/idbPhotoStore';
import { useTrips } from '../state/useTrips';
import MapView from './MapView';
import SearchBox from './SearchBox';
import Sidebar from './Sidebar';
import PlaceDetailsPanel from './PlaceDetailsPanel';
import DiscoveryPanel, { type DiscoveryStatus } from './DiscoveryPanel';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris
const NEARBY_RADIUS_M = 800; // roughly a 10-minute walk

export default function AppShell() {
  const store = useMemo(() => createIdbTripStore(), []);
  const photoStore = useMemo(() => createIdbPhotoStore(), []);
  const trips = useTrips(store, photoStore);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<Category>>(new Set());
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [view, setView] = useState<'map' | 'list'>('map');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>({ kind: 'idle' });
  const discoveryAbort = useRef<AbortController | null>(null);
  const [nearbyAnchor, setNearbyAnchor] = useState<{ lat: number; lng: number } | null>(null);
  const [frameBounds, setFrameBounds] = useState<Bounds | null>(null);

  const current = trips.currentTrip;
  const selectedPlace =
    current?.places.find((p) => p.id === selectedId) ?? null;

  if (trips.loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading your trips…
      </div>
    );
  }

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

  function discoveryErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : '';
    if (/\b(429|504)\b|timeout/i.test(msg)) {
      return 'Too busy right now — try again in a moment.';
    }
    return 'Couldn’t load suggestions — check your connection.';
  }

  function runDiscoverySearch(searchBounds: Bounds, typeId: string) {
    discoveryAbort.current?.abort();
    const controller = new AbortController();
    discoveryAbort.current = controller;
    setDiscoveryStatus({ kind: 'loading' });
    searchArea(searchBounds, typeId, controller.signal)
      .then((results) => {
        setSuggestions(results);
        if (results.length === 0) {
          const label = getDiscoveryType(typeId)?.label ?? 'places';
          setDiscoveryStatus({ kind: 'empty', typeLabel: label });
        } else {
          setDiscoveryStatus({ kind: 'results', count: results.length });
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSuggestions([]);
        setDiscoveryStatus({ kind: 'error', message: discoveryErrorMessage(err) });
      });
  }

  function handleDiscoverySearch(typeId: string) {
    if (!bounds) return;
    if (!isBboxSearchable(bounds)) {
      setSuggestions([]);
      setDiscoveryStatus({ kind: 'too-large' });
      return;
    }
    setNearbyAnchor(null);
    setFrameBounds(null);
    runDiscoverySearch(bounds, typeId);
  }

  function handleNearbySearch(typeId: string) {
    if (!selectedPlace) return;
    const box = boundsAroundPoint(selectedPlace.lat, selectedPlace.lng, NEARBY_RADIUS_M);
    setNearbyAnchor({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    setFrameBounds(box);
    runDiscoverySearch(box, typeId);
  }

  function handleAddSuggestion(s: Suggestion) {
    const id = trips.addPlace({
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      category: s.category,
      dayId: null,
    });
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    setSelectedId(id);
  }

  function handleIdentifyAdd(poi: IdentifiedPoi) {
    const id = trips.addPlace({
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      category: poi.category,
      dayId: null,
    });
    setSelectedId(id);
  }

  function clearDiscovery() {
    setSuggestions([]);
    setDiscoveryStatus({ kind: 'idle' });
    setNearbyAnchor(null);
    setFrameBounds(null);
  }

  async function handleExport() {
    const blob = await trips.exportBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trekboard-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file later
    if (!file) return;
    try {
      await trips.importBackup(file);
      setSelectedId(null);
    } catch {
      window.alert("Couldn't import: that file isn't a valid TrekBoard backup.");
    }
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">TrekBoard</h1>
        <p className="text-gray-500">Create your first trip to start planning.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => trips.newTrip('My Trip')}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New trip
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Import backup
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".zip,application/zip,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
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
            clearDiscovery();
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
        <button
          type="button"
          onClick={handleExport}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          Import
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".zip,application/zip,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
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
            view === 'list' ? 'flex' : 'hidden'
          } w-full flex-col border-r border-gray-200 sm:flex sm:w-80 sm:shrink-0`}
        >
          <div className="space-y-2 border-b border-gray-200 p-2">
            <SearchBox onPick={handlePick} />
            <DiscoveryPanel
              status={discoveryStatus}
              hasSuggestions={suggestions.length > 0}
              onSearch={handleDiscoverySearch}
              onClear={clearDiscovery}
            />
          </div>
          <div className="min-h-0 flex-1">
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
              onMovePlace={trips.movePlace}
              onSortDay={trips.sortDay}
            />
          </div>
        </aside>

        {/* Map */}
        <main className={`${view === 'map' ? 'block' : 'hidden'} flex-1 sm:block`}>
          <MapView
            places={current.places}
            suggestions={suggestions}
            selectedId={selectedId}
            center={center}
            anchor={nearbyAnchor}
            frameBounds={frameBounds}
            onAddPlace={handleAddPlace}
            onSelectPlace={setSelectedId}
            onAddSuggestion={handleAddSuggestion}
            onIdentifyAdd={handleIdentifyAdd}
            onBoundsChange={setBounds}
          />
        </main>

        {/* Details panel */}
        {selectedPlace && (
          <aside className="absolute right-0 top-0 z-[1000] h-full w-72 border-l border-gray-200 bg-white shadow-lg">
            <PlaceDetailsPanel
              place={selectedPlace}
              days={current.days}
              discoveryStatus={discoveryStatus}
              photoStore={photoStore}
              onChange={(patch) => trips.updatePlace(selectedPlace.id, patch)}
              onDelete={() => {
                trips.removePlace(selectedPlace.id);
                setSelectedId(null);
              }}
              onClose={() => setSelectedId(null)}
              onSearchNearby={handleNearbySearch}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
