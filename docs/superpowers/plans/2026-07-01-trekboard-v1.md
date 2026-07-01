# TrekBoard v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a map-first travel planner PWA where you drop pins, categorize them, group them by day, and plan multiple trips — all stored locally and working offline.

**Architecture:** A single-page React app. All data access flows through a `TripStore` persistence interface (localStorage in v1, cloud later). Mutations are pure functions (`tripOps`) that produce new immutable `Trip` objects; a `useTrips` hook owns state and persistence; components (map, list, details, search) render from that state. Leaflet is wrapped in a thin component using `circleMarker` so no image assets are needed.

**Tech Stack:** React 18 + TypeScript (strict) + Vite 5, Tailwind CSS 3, Leaflet 1.9 (raw, not react-leaflet), Nominatim geocoding, `vite-plugin-pwa`, Vitest + Testing Library + jsdom.

## Global Constraints

- Package manager: **npm**. Node **>= 18** (needs `crypto.randomUUID` and global `fetch`).
- TypeScript **strict mode** on. No `any` in committed code.
- **No API keys / secrets anywhere.** Map tiles from OpenStreetMap, geocoding from Nominatim.
- **All persistence goes through the `TripStore` interface** — components and hooks never touch `localStorage` directly.
- **Nominatim usage policy:** at most one request per user action, debounced ≥ 500ms; send an identifying `Referer`/app context; never bulk-query. Limit results to 5.
- Category set is the fixed enum: `food | sights | lodging | transport | other`.
- Every task ends green: `npm test` passes and (from Task 1 on) `npm run build` succeeds.

---

## File Structure

```
index.html
package.json
tsconfig.json
tsconfig.node.json
vite.config.ts
postcss.config.js
tailwind.config.js
src/
  main.tsx                 # React entry
  App.tsx                  # renders <AppShell/>
  index.css                # Tailwind directives + base styles
  types.ts                 # Trip, Day, Place, Category
  config/
    categories.ts          # category metadata (label, color) + helpers
  lib/
    debounce.ts            # useDebouncedValue hook
  services/
    geocode.ts             # Nominatim search
  storage/
    TripStore.ts           # persistence interface
    localTripStore.ts      # localStorage implementation
  state/
    tripOps.ts             # pure trip mutation functions
    useTrips.ts            # state + persistence hook
  components/
    AppShell.tsx           # top bar, layout, view toggle, wiring
    MapView.tsx            # Leaflet map
    SearchBox.tsx          # Nominatim search box
    Sidebar.tsx            # place list grouped by day + filters
    PlaceDetailsPanel.tsx  # edit selected place
  test/
    setup.ts               # jest-dom setup
```

Test files live next to their source as `*.test.ts(x)`.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: a runnable Vite app (`npm run dev`), a passing test runner (`npm test`), and a production build (`npm run build`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "trekboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/leaflet": "^1.9.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vite": "^5.3.5",
    "vite-plugin-pwa": "^0.20.1",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

`postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 3: Create entry files**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>TrekBoard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
}
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>TrekBoard</h1>;
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Write the smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText('TrekBoard')).toBeInTheDocument();
});
```

- [ ] **Step 5: Install and verify**

Run: `npm install`
Then: `npm test`
Expected: 1 passing test.
Then: `npm run build`
Expected: build succeeds, `dist/` created.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

## Task 2: Domain types and category config

**Files:**
- Create: `src/types.ts`, `src/config/categories.ts`
- Test: `src/config/categories.test.ts`

**Interfaces:**
- Produces:
  - `Category = 'food' | 'sights' | 'lodging' | 'transport' | 'other'`
  - `interface Day { id: string; label: string; date?: string }`
  - `interface Place { id: string; name: string; lat: number; lng: number; category: Category; dayId: string | null; note?: string }`
  - `interface Trip { id: string; name: string; createdAt: number; days: Day[]; places: Place[] }`
  - `CATEGORIES: CategoryMeta[]`, `CATEGORY_MAP: Record<Category, CategoryMeta>`, `categoryColor(id: Category): string`, `categoryLabel(id: Category): string`
  - `interface CategoryMeta { id: Category; label: string; color: string }`

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type Category = 'food' | 'sights' | 'lodging' | 'transport' | 'other';

export interface Day {
  id: string;
  label: string;
  date?: string; // ISO yyyy-mm-dd
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  dayId: string | null; // null = unassigned
  note?: string;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
  days: Day[];
  places: Place[];
}
```

- [ ] **Step 2: Write the failing test**

`src/config/categories.test.ts`:
```ts
import { CATEGORIES, categoryColor, categoryLabel } from './categories';

test('defines exactly the five v1 categories', () => {
  expect(CATEGORIES.map((c) => c.id)).toEqual([
    'food',
    'sights',
    'lodging',
    'transport',
    'other',
  ]);
});

test('categoryColor returns a hex color for a known category', () => {
  expect(categoryColor('food')).toMatch(/^#[0-9a-f]{6}$/i);
});

test('categoryLabel returns the human label', () => {
  expect(categoryLabel('sights')).toBe('Sights');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/config/categories.test.ts`
Expected: FAIL — cannot find module `./categories`.

- [ ] **Step 4: Create `src/config/categories.ts`**

```ts
import type { Category } from '../types';

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'food', label: 'Food & Drink', color: '#e8590c' },
  { id: 'sights', label: 'Sights', color: '#1971c2' },
  { id: 'lodging', label: 'Lodging', color: '#6741d9' },
  { id: 'transport', label: 'Transport', color: '#2f9e44' },
  { id: 'other', label: 'Other', color: '#868e96' },
];

export const CATEGORY_MAP: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>;

export function categoryColor(id: Category): string {
  return CATEGORY_MAP[id]?.color ?? '#868e96';
}

export function categoryLabel(id: Category): string {
  return CATEGORY_MAP[id]?.label ?? 'Other';
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/config/categories.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/config/categories.ts src/config/categories.test.ts
git commit -m "feat: add domain types and category config"
```

---

## Task 3: Pure trip operations

**Files:**
- Create: `src/state/tripOps.ts`
- Test: `src/state/tripOps.test.ts`

**Interfaces:**
- Consumes: `Trip`, `Place`, `Day` from `../types`.
- Produces (all pure; never mutate inputs):
  - `createTrip(name: string): Trip`
  - `createDay(label: string, date?: string): Day`
  - `createPlace(place: Omit<Place, 'id'>): Place` (generates the id)
  - `addPlace(trip: Trip, place: Place): Trip` (appends an already-built place)
  - `updatePlace(trip: Trip, placeId: string, patch: Partial<Omit<Place, 'id'>>): Trip`
  - `removePlace(trip: Trip, placeId: string): Trip`
  - `addDay(trip: Trip): Trip` (auto-labels "Day N")
  - `renameTrip(trip: Trip, name: string): Trip`

- [ ] **Step 1: Write the failing tests**

`src/state/tripOps.test.ts`:
```ts
import {
  createTrip,
  createPlace,
  addPlace,
  updatePlace,
  removePlace,
  addDay,
  renameTrip,
} from './tripOps';
import type { Place } from '../types';

const samplePlace: Omit<Place, 'id'> = {
  name: 'Louvre',
  lat: 48.8606,
  lng: 2.3376,
  category: 'sights',
  dayId: null,
};

test('createTrip returns a trip with an id, name, timestamp, empty days/places', () => {
  const t = createTrip('Paris');
  expect(t.name).toBe('Paris');
  expect(t.id).toBeTruthy();
  expect(t.createdAt).toBeGreaterThan(0);
  expect(t.days).toEqual([]);
  expect(t.places).toEqual([]);
});

test('createPlace assigns an id without mutating input', () => {
  const p = createPlace(samplePlace);
  expect(p.id).toBeTruthy();
  expect(p.name).toBe('Louvre');
  expect(samplePlace).not.toHaveProperty('id');
});

test('addPlace appends a built place without mutating input', () => {
  const t = createTrip('Paris');
  const t2 = addPlace(t, createPlace(samplePlace));
  expect(t.places).toHaveLength(0); // original untouched
  expect(t2.places).toHaveLength(1);
  expect(t2.places[0].name).toBe('Louvre');
});

test('updatePlace patches only the target place', () => {
  let t = addPlace(createTrip('Paris'), createPlace(samplePlace));
  const id = t.places[0].id;
  t = updatePlace(t, id, { note: 'go early', category: 'food' });
  expect(t.places[0].note).toBe('go early');
  expect(t.places[0].category).toBe('food');
  expect(t.places[0].name).toBe('Louvre');
});

test('removePlace deletes the target place', () => {
  let t = addPlace(createTrip('Paris'), createPlace(samplePlace));
  const id = t.places[0].id;
  t = removePlace(t, id);
  expect(t.places).toHaveLength(0);
});

test('addDay appends an auto-labeled day', () => {
  let t = addDay(createTrip('Paris'));
  t = addDay(t);
  expect(t.days.map((d) => d.label)).toEqual(['Day 1', 'Day 2']);
});

test('renameTrip changes the name immutably', () => {
  const t = createTrip('Paris');
  const t2 = renameTrip(t, 'Paris 2026');
  expect(t.name).toBe('Paris');
  expect(t2.name).toBe('Paris 2026');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/state/tripOps.test.ts`
Expected: FAIL — cannot find module `./tripOps`.

- [ ] **Step 3: Create `src/state/tripOps.ts`**

```ts
import type { Day, Place, Trip } from '../types';

function uid(): string {
  return crypto.randomUUID();
}

export function createTrip(name: string): Trip {
  return { id: uid(), name, createdAt: Date.now(), days: [], places: [] };
}

export function createDay(label: string, date?: string): Day {
  return { id: uid(), label, ...(date ? { date } : {}) };
}

export function createPlace(place: Omit<Place, 'id'>): Place {
  return { ...place, id: uid() };
}

export function addPlace(trip: Trip, place: Place): Trip {
  return { ...trip, places: [...trip.places, place] };
}

export function updatePlace(
  trip: Trip,
  placeId: string,
  patch: Partial<Omit<Place, 'id'>>,
): Trip {
  return {
    ...trip,
    places: trip.places.map((p) => (p.id === placeId ? { ...p, ...patch } : p)),
  };
}

export function removePlace(trip: Trip, placeId: string): Trip {
  return { ...trip, places: trip.places.filter((p) => p.id !== placeId) };
}

export function addDay(trip: Trip): Trip {
  const label = `Day ${trip.days.length + 1}`;
  return { ...trip, days: [...trip.days, createDay(label)] };
}

export function renameTrip(trip: Trip, name: string): Trip {
  return { ...trip, name };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/state/tripOps.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/tripOps.ts src/state/tripOps.test.ts
git commit -m "feat: add pure trip operations"
```

---

## Task 4: TripStore interface + localStorage implementation

**Files:**
- Create: `src/storage/TripStore.ts`, `src/storage/localTripStore.ts`
- Test: `src/storage/localTripStore.test.ts`

**Interfaces:**
- Consumes: `Trip` from `../types`.
- Produces:
  - `interface TripStore { getTrips(): Trip[]; saveTrips(trips: Trip[]): void }`
  - `createLocalTripStore(storage?: Storage): TripStore` — defaults to `window.localStorage`; on read error returns `[]`; on write error logs a warning and does not throw. Uses key `trekboard.trips.v1`.

- [ ] **Step 1: Write the failing tests**

`src/storage/localTripStore.test.ts`:
```ts
import { createLocalTripStore } from './localTripStore';
import { createTrip } from '../state/tripOps';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

test('returns empty array when nothing stored', () => {
  const store = createLocalTripStore(memoryStorage());
  expect(store.getTrips()).toEqual([]);
});

test('round-trips saved trips', () => {
  const store = createLocalTripStore(memoryStorage());
  const trips = [createTrip('Paris')];
  store.saveTrips(trips);
  expect(store.getTrips()).toEqual(trips);
});

test('returns empty array on corrupt data instead of throwing', () => {
  const backing = memoryStorage();
  backing.setItem('trekboard.trips.v1', '{not json');
  const store = createLocalTripStore(backing);
  expect(store.getTrips()).toEqual([]);
});

test('saveTrips does not throw when storage write fails', () => {
  const failing = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  } as unknown as Storage;
  const store = createLocalTripStore(failing);
  expect(() => store.saveTrips([createTrip('Paris')])).not.toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/storage/localTripStore.test.ts`
Expected: FAIL — cannot find module `./localTripStore`.

- [ ] **Step 3: Create `src/storage/TripStore.ts`**

```ts
import type { Trip } from '../types';

export interface TripStore {
  getTrips(): Trip[];
  saveTrips(trips: Trip[]): void;
}
```

- [ ] **Step 4: Create `src/storage/localTripStore.ts`**

```ts
import type { Trip } from '../types';
import type { TripStore } from './TripStore';

const KEY = 'trekboard.trips.v1';

export function createLocalTripStore(
  storage: Storage = window.localStorage,
): TripStore {
  return {
    getTrips(): Trip[] {
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Trip[]) : [];
      } catch (err) {
        console.warn('TrekBoard: failed to read trips, starting empty.', err);
        return [];
      }
    },
    saveTrips(trips: Trip[]): void {
      try {
        storage.setItem(KEY, JSON.stringify(trips));
      } catch (err) {
        console.warn('TrekBoard: failed to save trips.', err);
      }
    },
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/storage/localTripStore.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/storage/
git commit -m "feat: add TripStore interface and localStorage implementation"
```

---

## Task 5: useTrips hook

**Files:**
- Create: `src/state/useTrips.ts`
- Test: `src/state/useTrips.test.tsx`

**Interfaces:**
- Consumes: `TripStore`, `tripOps`, types.
- Produces `useTrips(store: TripStore)` returning:
  ```ts
  {
    trips: Trip[];
    currentTrip: Trip | null;
    currentTripId: string | null;
    selectTrip(id: string): void;
    newTrip(name: string): void;            // creates, selects it
    renameCurrent(name: string): void;
    deleteCurrent(): void;
    addPlace(place: Omit<Place, 'id'>): string;   // returns the new place id
    updatePlace(id: string, patch: Partial<Omit<Place, 'id'>>): void;
    removePlace(id: string): void;
    addDay(): void;
  }
  ```
- Behavior: loads trips from `store` on mount; persists to `store` whenever trips change; all mutations act on `currentTrip`.

- [ ] **Step 1: Write the failing tests**

`src/state/useTrips.test.tsx`:
```tsx
import { act, renderHook } from '@testing-library/react';
import { useTrips } from './useTrips';
import { createLocalTripStore } from '../storage/localTripStore';
import type { Place } from '../types';

function memoryStore() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
  return createLocalTripStore(storage);
}

const place: Omit<Place, 'id'> = {
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

test('newTrip creates and selects a trip', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});

test('addPlace adds to the current trip', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.addPlace(place));
  expect(result.current.currentTrip?.places).toHaveLength(1);
});

test('persists across hook remounts via the same store', () => {
  const store = memoryStore();
  const first = renderHook(() => useTrips(store));
  act(() => first.result.current.newTrip('Paris'));
  act(() => first.result.current.addPlace(place));

  const second = renderHook(() => useTrips(store));
  expect(second.result.current.trips).toHaveLength(1);
  expect(second.result.current.trips[0].places).toHaveLength(1);
});

test('deleteCurrent removes the trip and reselects another', () => {
  const { result } = renderHook(() => useTrips(memoryStore()));
  act(() => result.current.newTrip('Paris'));
  act(() => result.current.newTrip('Rome'));
  act(() => result.current.deleteCurrent()); // deletes Rome
  expect(result.current.trips).toHaveLength(1);
  expect(result.current.currentTrip?.name).toBe('Paris');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/state/useTrips.test.tsx`
Expected: FAIL — cannot find module `./useTrips`.

- [ ] **Step 3: Create `src/state/useTrips.ts`**

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Place, Trip } from '../types';
import type { TripStore } from '../storage/TripStore';
import * as ops from './tripOps';

export function useTrips(store: TripStore) {
  const [trips, setTrips] = useState<Trip[]>(() => store.getTrips());
  const [currentTripId, setCurrentTripId] = useState<string | null>(
    () => store.getTrips()[0]?.id ?? null,
  );
  const loaded = useRef(false);

  // Persist whenever trips change (skip the very first render).
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    store.saveTrips(trips);
  }, [trips, store]);

  const currentTrip = useMemo(
    () => trips.find((t) => t.id === currentTripId) ?? null,
    [trips, currentTripId],
  );

  const mutateCurrent = useCallback(
    (fn: (t: Trip) => Trip) => {
      setTrips((prev) =>
        prev.map((t) => (t.id === currentTripId ? fn(t) : t)),
      );
    },
    [currentTripId],
  );

  const selectTrip = useCallback((id: string) => setCurrentTripId(id), []);

  const newTrip = useCallback((name: string) => {
    const trip = ops.createTrip(name);
    setTrips((prev) => [...prev, trip]);
    setCurrentTripId(trip.id);
  }, []);

  const renameCurrent = useCallback(
    (name: string) => mutateCurrent((t) => ops.renameTrip(t, name)),
    [mutateCurrent],
  );

  const deleteCurrent = useCallback(() => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== currentTripId);
      setCurrentTripId(next[0]?.id ?? null);
      return next;
    });
  }, [currentTripId]);

  const addPlace = useCallback(
    (place: Omit<Place, 'id'>): string => {
      const built = ops.createPlace(place);
      mutateCurrent((t) => ops.addPlace(t, built));
      return built.id;
    },
    [mutateCurrent],
  );

  const updatePlace = useCallback(
    (id: string, patch: Partial<Omit<Place, 'id'>>) =>
      mutateCurrent((t) => ops.updatePlace(t, id, patch)),
    [mutateCurrent],
  );

  const removePlace = useCallback(
    (id: string) => mutateCurrent((t) => ops.removePlace(t, id)),
    [mutateCurrent],
  );

  const addDay = useCallback(
    () => mutateCurrent((t) => ops.addDay(t)),
    [mutateCurrent],
  );

  return {
    trips,
    currentTrip,
    currentTripId,
    selectTrip,
    newTrip,
    renameCurrent,
    deleteCurrent,
    addPlace,
    updatePlace,
    removePlace,
    addDay,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/state/useTrips.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/useTrips.ts src/state/useTrips.test.tsx
git commit -m "feat: add useTrips state hook with persistence"
```

---

## Task 6: Geocoding service + debounce hook

**Files:**
- Create: `src/services/geocode.ts`, `src/lib/debounce.ts`
- Test: `src/services/geocode.test.ts`, `src/lib/debounce.test.ts`

**Interfaces:**
- Produces:
  - `interface GeocodeResult { name: string; lat: number; lng: number }`
  - `searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]>` — returns `[]` for blank/whitespace query; on HTTP or network error returns `[]` (never throws for the caller to crash on — throwing only for `AbortError` which callers ignore).
  - `useDebouncedValue<T>(value: T, delayMs: number): T`

- [ ] **Step 1: Write the failing geocode test**

`src/services/geocode.test.ts`:
```ts
import { afterEach, vi } from 'vitest';
import { searchPlaces } from './geocode';

afterEach(() => vi.restoreAllMocks());

test('returns [] for a blank query without calling fetch', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  expect(await searchPlaces('   ')).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
});

test('maps Nominatim results to GeocodeResult', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [
      { display_name: 'Louvre, Paris', lat: '48.8606', lon: '2.3376' },
    ],
  } as Response);

  const results = await searchPlaces('louvre');
  expect(results).toEqual([{ name: 'Louvre, Paris', lat: 48.8606, lng: 2.3376 }]);
});

test('returns [] on non-ok response', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);
  expect(await searchPlaces('louvre')).toEqual([]);
});

test('returns [] on network error', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  expect(await searchPlaces('louvre')).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/services/geocode.test.ts`
Expected: FAIL — cannot find module `./geocode`.

- [ ] **Step 3: Create `src/services/geocode.ts`**

```ts
export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
}

interface NominatimRow {
  display_name: string;
  lat: string;
  lon: string;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${ENDPOINT}?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as NominatimRow[];
    return rows.map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return [];
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/services/geocode.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing debounce test**

`src/lib/debounce.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useDebouncedValue } from './debounce';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('returns the initial value immediately', () => {
  const { result } = renderHook(() => useDebouncedValue('a', 500));
  expect(result.current).toBe('a');
});

test('updates only after the delay elapses', () => {
  const { result, rerender } = renderHook(
    ({ v }) => useDebouncedValue(v, 500),
    { initialProps: { v: 'a' } },
  );
  rerender({ v: 'b' });
  expect(result.current).toBe('a');
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('b');
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/lib/debounce.test.ts`
Expected: FAIL — cannot find module `./debounce`.

- [ ] **Step 7: Create `src/lib/debounce.ts`**

```ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/lib/debounce.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/services/geocode.ts src/services/geocode.test.ts src/lib/debounce.ts src/lib/debounce.test.ts
git commit -m "feat: add Nominatim geocoding service and debounce hook"
```

---

## Task 7: MapView component

**Files:**
- Create: `src/components/MapView.tsx`
- Test: `src/components/MapView.test.tsx`

**Interfaces:**
- Consumes: `Place` type, `categoryColor`.
- Produces:
  ```ts
  interface MapViewProps {
    places: Place[];
    selectedId: string | null;
    center: [number, number];
    onAddPlace(lat: number, lng: number): void;
    onSelectPlace(id: string): void;
  }
  ```
  Renders a full-height Leaflet map with OSM tiles; each place is a colored `circleMarker` (color from category); clicking the map calls `onAddPlace`; clicking a marker calls `onSelectPlace`. Because Leaflet needs real layout it is not deeply unit-tested — the test asserts the container renders.

- [ ] **Step 1: Write the render test**

`src/components/MapView.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import MapView from './MapView';

test('renders a map container', () => {
  const { container } = render(
    <MapView
      places={[]}
      selectedId={null}
      center={[48.8566, 2.3522]}
      onAddPlace={() => {}}
      onSelectPlace={() => {}}
    />,
  );
  expect(container.querySelector('.leaflet-container-host')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/MapView.test.tsx`
Expected: FAIL — cannot find module `./MapView`.

- [ ] **Step 3: Create `src/components/MapView.tsx`**

```tsx
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
        .on('click', () => selectRef.current(p.id))
        .addTo(group);
    }
  }, [places, selectedId]);

  return <div ref={hostRef} className="leaflet-container-host h-full w-full" />;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/MapView.test.tsx`
Expected: PASS (1 test). (jsdom lacks real layout; the test only asserts the host div renders.)

- [ ] **Step 5: Commit**

```bash
git add src/components/MapView.tsx src/components/MapView.test.tsx
git commit -m "feat: add Leaflet MapView component"
```

---

## Task 8: SearchBox component

**Files:**
- Create: `src/components/SearchBox.tsx`
- Test: `src/components/SearchBox.test.tsx`

**Interfaces:**
- Consumes: `searchPlaces`, `GeocodeResult`, `useDebouncedValue`.
- Produces:
  ```ts
  interface SearchBoxProps {
    onPick(result: GeocodeResult): void;
    // injectable for testing; defaults to the real service
    search?: (q: string, signal?: AbortSignal) => Promise<GeocodeResult[]>;
  }
  ```
  Debounced text input; renders up to 5 result rows; clicking a row calls `onPick` and clears the query.

- [ ] **Step 1: Write the failing test**

`src/components/SearchBox.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBox from './SearchBox';
import type { GeocodeResult } from '../services/geocode';

test('shows results and calls onPick when a result is clicked', async () => {
  const user = userEvent.setup();
  const results: GeocodeResult[] = [
    { name: 'Louvre, Paris', lat: 48.86, lng: 2.33 },
  ];
  const onPick = vi.fn();

  render(<SearchBox onPick={onPick} search={async () => results} />);

  await user.type(screen.getByPlaceholderText(/search/i), 'louvre');
  const row = await screen.findByText('Louvre, Paris');
  await user.click(row);

  expect(onPick).toHaveBeenCalledWith(results[0]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/SearchBox.test.tsx`
Expected: FAIL — cannot find module `./SearchBox`.

- [ ] **Step 3: Create `src/components/SearchBox.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { searchPlaces, type GeocodeResult } from '../services/geocode';
import { useDebouncedValue } from '../lib/debounce';

interface SearchBoxProps {
  onPick(result: GeocodeResult): void;
  search?: (q: string, signal?: AbortSignal) => Promise<GeocodeResult[]>;
}

export default function SearchBox({
  onPick,
  search = searchPlaces,
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState(false);
  const debounced = useDebouncedValue(query, 500);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setError(false);
    search(debounced, controller.signal)
      .then((rows) => setResults(rows))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [debounced, search]);

  function pick(result: GeocodeResult) {
    onPick(result);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place…"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">
          Couldn’t search — check your connection.
        </p>
      )}
      {results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-white shadow">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/SearchBox.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBox.tsx src/components/SearchBox.test.tsx
git commit -m "feat: add SearchBox with debounced geocoding"
```

---

## Task 9: Sidebar (list + filters)

**Files:**
- Create: `src/components/Sidebar.tsx`
- Test: `src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `Trip`, `Place`, `Category`, `Day`, `CATEGORIES`, `categoryColor`, `categoryLabel`.
- Produces:
  ```ts
  interface SidebarProps {
    trip: Trip;
    selectedId: string | null;
    categoryFilter: Set<Category>;   // empty = show all
    dayFilter: string | null;        // null = all days; 'unassigned' = no day
    onSelectPlace(id: string): void;
    onToggleCategory(cat: Category): void;
    onSetDayFilter(dayId: string | null): void;
    onAddDay(): void;
  }
  ```
  Groups the *filtered* places by day (each `trip.days` in order, then an "Unassigned" group). Renders category filter toggles and a day filter `<select>`.

- [ ] **Step 1: Write the failing test**

`src/components/Sidebar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';
import { addDay, addPlace, createTrip } from '../state/tripOps';
import type { Category } from '../types';

function tripWithPlaces() {
  let t = addDay(createTrip('Paris')); // Day 1
  const dayId = t.days[0].id;
  t = addPlace(t, { name: 'Louvre', lat: 1, lng: 1, category: 'sights', dayId });
  t = addPlace(t, { name: 'Cafe', lat: 2, lng: 2, category: 'food', dayId: null });
  return t;
}

test('lists places grouped with an Unassigned group', () => {
  render(
    <Sidebar
      trip={tripWithPlaces()}
      selectedId={null}
      categoryFilter={new Set<Category>()}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
    />,
  );
  expect(screen.getByText('Louvre')).toBeInTheDocument();
  expect(screen.getByText('Cafe')).toBeInTheDocument();
  expect(screen.getByText('Unassigned')).toBeInTheDocument();
});

test('category filter hides non-matching places', () => {
  render(
    <Sidebar
      trip={tripWithPlaces()}
      selectedId={null}
      categoryFilter={new Set<Category>(['sights'])}
      dayFilter={null}
      onSelectPlace={() => {}}
      onToggleCategory={() => {}}
      onSetDayFilter={() => {}}
      onAddDay={() => {}}
    />,
  );
  expect(screen.getByText('Louvre')).toBeInTheDocument();
  expect(screen.queryByText('Cafe')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: FAIL — cannot find module `./Sidebar`.

- [ ] **Step 3: Create `src/components/Sidebar.tsx`**

```tsx
import type { Category, Place, Trip } from '../types';
import { CATEGORIES, categoryColor, categoryLabel } from '../config/categories';

interface SidebarProps {
  trip: Trip;
  selectedId: string | null;
  categoryFilter: Set<Category>;
  dayFilter: string | null;
  onSelectPlace(id: string): void;
  onToggleCategory(cat: Category): void;
  onSetDayFilter(dayId: string | null): void;
  onAddDay(): void;
}

export default function Sidebar({
  trip,
  selectedId,
  categoryFilter,
  dayFilter,
  onSelectPlace,
  onToggleCategory,
  onSetDayFilter,
  onAddDay,
}: SidebarProps) {
  const visible = trip.places.filter((p) => {
    const catOk = categoryFilter.size === 0 || categoryFilter.has(p.category);
    const dayOk =
      dayFilter === null ||
      (dayFilter === 'unassigned' ? p.dayId === null : p.dayId === dayFilter);
    return catOk && dayOk;
  });

  const groups: { label: string; places: Place[] }[] = [
    ...trip.days.map((d) => ({
      label: d.label,
      places: visible.filter((p) => p.dayId === d.id),
    })),
    { label: 'Unassigned', places: visible.filter((p) => p.dayId === null) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => {
            const active = categoryFilter.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggleCategory(c.id)}
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  active ? 'text-white' : 'text-gray-700'
                }`}
                style={active ? { background: c.color, borderColor: c.color } : undefined}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by day"
            value={dayFilter ?? 'all'}
            onChange={(e) =>
              onSetDayFilter(e.target.value === 'all' ? null : e.target.value)
            }
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">All days</option>
            {trip.days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
          <button
            type="button"
            onClick={onAddDay}
            className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
          >
            + Day
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {g.label}
            </h3>
            {g.places.length === 0 ? (
              <p className="text-xs text-gray-400">No places</p>
            ) : (
              <ul className="space-y-1">
                {g.places.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPlace(p.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                        p.id === selectedId ? 'bg-gray-100 font-medium' : ''
                      }`}
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ background: categoryColor(p.category) }}
                        title={categoryLabel(p.category)}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Sidebar.test.tsx
git commit -m "feat: add Sidebar with day grouping and filters"
```

---

## Task 10: PlaceDetailsPanel component

**Files:**
- Create: `src/components/PlaceDetailsPanel.tsx`
- Test: `src/components/PlaceDetailsPanel.test.tsx`

**Interfaces:**
- Consumes: `Place`, `Category`, `Day`, `CATEGORIES`.
- Produces:
  ```ts
  interface PlaceDetailsPanelProps {
    place: Place;
    days: Day[];
    onChange(patch: Partial<Omit<Place, 'id'>>): void;
    onDelete(): void;
    onClose(): void;
  }
  ```
  Editable fields: name (text), category (`<select>`), day (`<select>`, "Unassigned" → `null`), note (`<textarea>`). Each edit calls `onChange` with the patched field. Delete and Close buttons.

- [ ] **Step 1: Write the failing test**

`src/components/PlaceDetailsPanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceDetailsPanel from './PlaceDetailsPanel';
import type { Place } from '../types';

const place: Place = {
  id: 'p1',
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

test('editing the name calls onChange with the new value', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <PlaceDetailsPanel
      place={place}
      days={[]}
      onChange={onChange}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  const input = screen.getByLabelText(/name/i);
  await user.type(input, '!');
  expect(onChange).toHaveBeenCalledWith({ name: 'Louvre!' });
});

test('delete button fires onDelete', async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();
  render(
    <PlaceDetailsPanel
      place={place}
      days={[]}
      onChange={() => {}}
      onDelete={onDelete}
      onClose={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /delete/i }));
  expect(onDelete).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/PlaceDetailsPanel.test.tsx`
Expected: FAIL — cannot find module `./PlaceDetailsPanel`.

- [ ] **Step 3: Create `src/components/PlaceDetailsPanel.tsx`**

```tsx
import type { Category, Day, Place } from '../types';
import { CATEGORIES } from '../config/categories';

interface PlaceDetailsPanelProps {
  place: Place;
  days: Day[];
  onChange(patch: Partial<Omit<Place, 'id'>>): void;
  onDelete(): void;
  onClose(): void;
}

export default function PlaceDetailsPanel({
  place,
  days,
  onChange,
  onDelete,
  onClose,
}: PlaceDetailsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Place details</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Close details"
        >
          ✕
        </button>
      </div>

      <label className="text-xs font-medium text-gray-600">
        Name
        <input
          type="text"
          value={place.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <label className="text-xs font-medium text-gray-600">
        Category
        <select
          value={place.category}
          onChange={(e) => onChange({ category: e.target.value as Category })}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-gray-600">
        Day
        <select
          value={place.dayId ?? 'unassigned'}
          onChange={(e) =>
            onChange({
              dayId: e.target.value === 'unassigned' ? null : e.target.value,
            })
          }
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="unassigned">Unassigned</option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-gray-600">
        Note
        <textarea
          value={place.note ?? ''}
          onChange={(e) => onChange({ note: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <button
        type="button"
        onClick={onDelete}
        className="mt-auto rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        Delete place
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/PlaceDetailsPanel.test.tsx`
Expected: PASS (2 tests). (Typing `!` into a controlled input whose value is `Louvre` fires `onChange` with `Louvre!`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/PlaceDetailsPanel.tsx src/components/PlaceDetailsPanel.test.tsx
git commit -m "feat: add PlaceDetailsPanel editor"
```

---

## Task 11: AppShell — wire everything together

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/AppShell.tsx`
- Test: `src/components/AppShell.test.tsx`

**Interfaces:**
- Consumes: `useTrips`, `createLocalTripStore`, `MapView`, `SearchBox`, `Sidebar`, `PlaceDetailsPanel`, types, `GeocodeResult`.
- Produces: the full app. Owns UI-only state: `selectedId`, `categoryFilter: Set<Category>`, `dayFilter: string | null`, `mapCenter: [number, number]`, and mobile `view: 'map' | 'list'`. New places from map-click or search default to `category: 'other'`, `dayId: null`, and become selected. Empty state (no trips) shows a "Create your first trip" prompt.

- [ ] **Step 1: Write the failing test**

`src/components/AppShell.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/AppShell.test.tsx`
Expected: FAIL — cannot find module `./AppShell`.

- [ ] **Step 3: Create `src/components/AppShell.tsx`**

```tsx
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
```

- [ ] **Step 4: Add the `GeocodeResult` re-export used above**

Add to `src/types.ts` (so `AppShell` can import the result type from a stable place):
```ts
export type { GeocodeResult } from './services/geocode';
```

- [ ] **Step 5: Update `src/App.tsx`**

```tsx
import AppShell from './components/AppShell';

export default function App() {
  return <AppShell />;
}
```

Also delete `src/App.test.tsx` (its "TrekBoard title" assertion no longer matches the app):
```bash
git rm src/App.test.tsx
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/components/AppShell.test.tsx`
Expected: PASS (1 test).
Then full suite: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Manual smoke test**

Run: `npm run dev`, open the URL. Verify: create a trip → click map to add a place → it's selected, edit its name/category/day → add a Day → assign the place → filter by category and day → search "Eiffel Tower" and pick a result → refresh the page and confirm everything persisted.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: wire AppShell with map, search, list, details, and trips"
```

---

## Task 12: PWA — offline + installable

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (any simple square PNGs), `public/favicon.svg`
- Test: manual (build + preview)

**Interfaces:**
- Produces: an installable, offline-capable app-shell via `vite-plugin-pwa` with `registerType: 'autoUpdate'`.

- [ ] **Step 1: Add the two icon files**

Create simple placeholder icons (solid color squares are fine for v1). From the repo root:
```bash
mkdir -p public/icons
```
Add `public/icons/icon-192.png` (192×192) and `public/icons/icon-512.png` (512×512). If you have ImageMagick: `magick -size 512x512 xc:#1971c2 public/icons/icon-512.png` and `magick -size 192x192 xc:#1971c2 public/icons/icon-192.png`. Otherwise export any square PNGs of those sizes.

- [ ] **Step 2: Configure `vite-plugin-pwa` in `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'TrekBoard',
        short_name: 'TrekBoard',
        description: 'Map-first travel planner',
        theme_color: '#1971c2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3: Reference the manifest/theme in `index.html`**

Add inside `<head>`:
```html
<meta name="theme-color" content="#1971c2" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```
Create `public/favicon.svg` (a simple square):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1971c2"/><circle cx="16" cy="13" r="5" fill="#fff"/><path d="M16 20l5 8H11z" fill="#fff"/></svg>
```

- [ ] **Step 4: Build and verify the service worker + manifest**

Run: `npm run build`
Expected: build succeeds; `dist/sw.js` and `dist/manifest.webmanifest` exist.
Run: `npm run preview`
Open the URL, then in DevTools → Application: confirm the manifest loads and a service worker is registered. Toggle "Offline" and reload — the app shell still loads.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest, icons, and offline service worker"
```

---

## Task 13: Deploy to GitHub Pages

**Files:**
- Modify: `vite.config.ts` (set `base`)
- Create: `.github/workflows/deploy.yml`
- Test: manual (CI run + live URL)

**Interfaces:**
- Produces: an automatic deploy of `dist/` to GitHub Pages on push to `main`.

- [ ] **Step 1: Set the Pages base path in `vite.config.ts`**

The repo is served at `https://britishtable.github.io/TrekBoard/`, so set:
```ts
export default defineConfig({
  base: '/TrekBoard/',
  // ...the rest unchanged
```
Also update the manifest `start_url` and PWA `scope` implications: set `start_url: '/TrekBoard/'` in the manifest block.

- [ ] **Step 2: Create the workflow `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Enable Pages**

In the GitHub repo: Settings → Pages → Build and deployment → Source = **GitHub Actions**. (One-time manual step by the repo owner.)

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "ci: deploy to GitHub Pages via Actions"
git push
```
Then confirm the workflow succeeds and the site loads at `https://britishtable.github.io/TrekBoard/`.

---

## Self-Review Notes

- **Spec coverage:** multiple trips (Task 5/11), drop pins by map click (Task 7/11), search by name via Nominatim (Task 6/8/11), categories with colored markers + filter (Task 2/7/9), group into days + day filter (Task 3/9/11), details panel + note (Task 10), sidebar list (Task 9), local persistence behind `TripStore` (Task 4/5), PWA/offline (Task 12), error handling for geocode + storage (Task 4/6/8), testing with Vitest (all tasks), deploy (Task 13). All spec sections mapped.
- **Storage boundary:** only `localTripStore` touches `localStorage`; components/hooks go through the `TripStore` interface — cloud-later swap is one file.
- **Type consistency:** `addPlace`/`updatePlace`/`removePlace`/`addDay` names match across `tripOps`, `useTrips`, and `AppShell`; `categoryColor`/`categoryLabel`/`CATEGORIES` consistent; `GeocodeResult` shared and re-exported from `types.ts`.
