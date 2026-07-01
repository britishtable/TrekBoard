# TrekBoard — Design Spec

**Date:** 2026-07-01
**Status:** Approved (v1 scope)

## Summary

TrekBoard is a **map-first travel planner** — a Progressive Web App where you drop
pins for places you want to go, organize them by category and by day, and see the
whole trip laid out geographically. It works cross-platform (desktop + mobile
browsers), is installable to the home screen, and works offline for the app and your
data. Built with a free, no-API-key stack so the public repo can be cloned and run
instantly.

Inspired by Wanderlog, scoped down to a focused, buildable v1.

## Goals

- Plan a real upcoming trip: collect places on a map, categorize them, group by day.
- Cross-platform from one codebase (web, desktop, mobile) via a responsive PWA.
- Offline-capable app shell and data.
- No secrets / API keys — anyone can clone and run.
- Local storage now, with a clean path to add a cloud backend later.

## Non-Goals (v1)

Cloud sync, accounts, and trip sharing; offline map-tile caching; routing/directions
and route optimization; drag-to-reorder; photos; budget tracking; place links /
booking / status; export/import. All captured in the Backlog below.

## Platform: PWA

A single responsive React web app:

- **Responsive layout** adapts to laptop and phone screens.
- **Installable** to phone home screen and desktop via the browser (no app store,
  no Apple fee).
- **Offline** via a service worker that precaches the app shell; trip data lives
  locally so it is available with no signal.
- Deployed free (GitHub Pages / Netlify / Vercel).

Native mobile (React Native/Expo) was rejected for v1: much more friction (app store
distribution, two build targets, harder to make public/runnable) for marginal gain.
A native shell could reuse the same core logic later.

## Tech Stack

- **React + TypeScript + Vite** — fast dev, type safety, trivial deploy.
- **Leaflet + OpenStreetMap tiles** — free, no API key, no billing, no repo secrets.
- **Nominatim (OSM)** — free, no-key geocoding for "search place by name" (called via
  `fetch`, debounced, respecting usage policy: one request per search, proper
  `User-Agent`/`Referer`).
- **Tailwind CSS** — quick, consistent styling.
- **`vite-plugin-pwa`** — service worker + installability with minimal config.
- **localStorage/IndexedDB** behind a storage interface — the "cloud later" swap point.

## Architecture

```
UI (React components)
  ↓ calls
State/hooks (trip + places state, current selection/filters)
  ↓ reads/writes
Storage interface  ←— the "cloud later" swap point
  ↓ (v1 implementation)
localStorage / IndexedDB
```

The **Storage interface** is the central design bet. All data access goes through a
`TripStore` abstraction (e.g. `getTrips()`, `saveTrip()`, `addPlace()`, …). v1 backs
it with `localStorage`. Adding a cloud backend (e.g. Supabase) later means writing one
new implementation of that interface — no UI changes.

The **map** is Leaflet wrapped in a thin React component; keeping map interactions thin
means most logic stays testable without a real map.

## Data Model

```
Trip {
  id: string
  name: string
  createdAt: number
  days: Day[]           // e.g. [{ id, label: "Day 1", date? }]
  places: Place[]
}

Day {
  id: string
  label: string         // "Day 1", "Day 2", ...
  date?: string         // optional ISO date
}

Place {
  id: string
  name: string
  lat: number
  lng: number
  category: Category     // food | sights | lodging | transport | other
  dayId: string | null   // assigned day, or null = unassigned
  note?: string          // small optional free text
}
```

`Category` is a fixed enum in v1, each with a color + icon for map markers.

## Components / Layout

- **AppShell** — top bar (trip switcher, add-trip). Responsive split: map + sidebar
  on desktop; on mobile, a toggle between Map view and List view.
- **MapView** — Leaflet map with colored category markers; click-to-add a place;
  click-marker-to-select. Applies category and day filters.
- **Sidebar / ListView** — places grouped by day (plus an "Unassigned" group); each
  row focuses its pin on click. Hosts the category and day filter controls.
- **PlaceDetailsPanel** — view/edit the selected place: name, category, day
  assignment, note; delete.
- **SearchBox** — Nominatim search; selecting a result drops a pin the user can then
  categorize and assign to a day.

## Data Flow

On startup, load trips from the store → select the current trip. All mutations
(add/edit/move/delete place, add day, create/rename/delete trip) go through the store,
which persists immediately and updates React state. Map and list both render from the
same trip state, so they stay in sync automatically.

## v1 Feature List

Core:
- Multiple trips: create / rename / delete.
- Drop a pin by clicking the map to add a place.
- Place details panel + sidebar list of all places.
- Everything persisted locally (survives refresh / offline).

Selected additions:
- **Search place by name** via Nominatim geocoding.
- **Categories for pins** — fixed enum, colored markers, filter by category.
- **Group places into days** — assign to Day 1 / Day 2 / etc. (or Unassigned),
  filter map/list by day.

## Offline / PWA Behavior

`vite-plugin-pwa` precaches the app shell so the app loads with no signal; trip data
is already local. Deferred: caching map tiles for offline use and offline geocoding
(Nominatim needs network). Offline, the user still sees pins and the list; map tiles
may be blank and search is unavailable.

## Error Handling

- Geocoding failures show a friendly "couldn't search, check connection" message.
- Storage read failures fall back to an empty trip list rather than crashing.
- Storage writes are wrapped so a full/blocked localStorage surfaces a warning.

## Testing

- **Vitest** for store logic and pure helpers (highest-value, easiest layer).
- A few component tests for critical flows (add place, assign place to day).
- Map interactions kept thin so most logic is testable without a real map.

## Backlog (Deferred)

Cloud sync + accounts; trip sharing; offline map-tile caching; routing/directions
between places; route optimization; drag-to-reorder; photos; budget tracking;
links/booking/status on places; export/import.
