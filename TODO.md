# TrekBoard TODO

Planned and upcoming work, roughly in priority order. Each item goes through its own
brainstorm → spec → plan → build cycle.

The long-term direction is two halves of one loop: plan the trip at home, then live it
on your phone. Deeper planning features and travel-companion features both matter; on
the companion side, recording the trip (visited, notes, photos) leads, and consulting
the plan (today view, GPS) follows.

## Up next

- [ ] **Hiking trailheads** — trailheads are usually mapped as POIs, so add a trailhead
  discovery type using the Outdoors category. The easy first step, before full trail
  support.

## Trip recording arc

Photos are core to this vision, which makes the storage migration a prerequisite.

- [ ] **Storage foundation (IndexedDB)** — migrate `TripStore` from localStorage to
  IndexedDB so trips can hold binary data. Rework export/backup to handle photos
  (JSON alone won't cut it — likely a zip or a separate media export). Also smooths
  the path for any future sync/cloud story.
- [ ] **Trip journal** — mark places visited, jot on-the-go notes, attach photos from
  camera or gallery with client-side resize/compression.

## Trip consulting arc

- [ ] **Today view** — a glanceable view of the current day's plan: sorted by time,
  distance to the next stop.
- [ ] **Locate me** — GPS you-are-here dot on the map; the app currently has no
  geolocation at all.
- [ ] **Navigation hand-off** — "open in Google Maps / OSM" deep links from a place.

## Planning depth (interleave as it makes sense)

- [ ] **Richer place info** — when a place is selected, fetch details if available (opening
  hours, website, description). Needs a data-source choice: OSM tags via Overpass by id,
  and/or Wikidata/Wikipedia. Opening hours also serve the day-of companion use.
- [ ] **Better searching** — improve place search: autocomplete, biasing results to the
  current map view, and/or categorized results. Needs scoping.
- [ ] **Distances and routes on the map** — road-routed lines between consecutive stops and
  between days, with real distances. Needs a keyless routing source (public OSRM is free
  but rate-limited).
- [ ] **Full hiking trail support** — trail geometry from OSM ways/relations, rendered as
  route lines. The bigger follow-up to trailheads.

## Larger / later

- [ ] **Offline maps (PMTiles)** — parked as low priority. If revisited: import your own
  regional `.pmtiles` (a Protomaps extract), rendered offline with MapLibre. Note the app,
  your data, and previously viewed map areas already work offline today.

## Done

- Map-first planning, categories, days, multiple trips, automatic local saving
- Reorder within a day, per-place times, sort-by-time, distance/walk-time between stops
- Export / import backup
- Place search (Nominatim) with distinct loading / empty / error states
- Nearby suggestions ("Search this area") via Overpass, with endpoint fallback and caching
- Vector maps (MapLibre GL + OpenFreeMap) and click-to-identify
- Nine categories (added Nightlife, Entertainment, Outdoors, Shopping)
- "What's nearby" from any saved place: fixed walking-radius search with distance-tagged
  results
- PWA: installable, offline app + data, cached map tiles for viewed areas
