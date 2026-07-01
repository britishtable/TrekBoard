# TrekBoard TODO

Planned and upcoming work, roughly in priority order. Each item goes through its own
brainstorm → spec → plan → build cycle.

## Up next

- [ ] **Lodging "things nearby"** — select a lodging place and discover what's around it.
  Small; builds on the existing discovery feature.
- [ ] **Hiking trailheads** — trailheads are usually mapped as POIs, so add a trailhead
  discovery type using the Outdoors category. The easy first step, before full trail
  support.
- [ ] **Richer place info** — when a place is selected, fetch details if available (opening
  hours, website, description). Needs a data-source choice: OSM tags via Overpass by id,
  and/or Wikidata/Wikipedia.
- [ ] **Better searching** — improve place search: autocomplete, biasing results to the
  current map view, and/or categorized results. Needs scoping.

## Larger / later

- [ ] **Distances and routes on the map** — road-routed lines between consecutive stops and
  between days, with real distances. Needs a keyless routing source (public OSRM is free
  but rate-limited).
- [ ] **Full hiking trail support** — trail geometry from OSM ways/relations, rendered as
  route lines. The bigger follow-up to trailheads.
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
- PWA: installable, offline app + data, cached map tiles for viewed areas
