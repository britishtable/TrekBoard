# TrekBoard

A **map-first travel planner** — drop pins for the places you want to go, organize
them by category and by day, and see your whole trip laid out on a map.

TrekBoard is a Progressive Web App (PWA): it runs in any modern browser on desktop and
mobile, installs to your home screen, and works offline. Built with a free,
no-API-key stack, so you can clone and run it in minutes.

Inspired by apps like Wanderlog, scoped down to a focused, buildable core.

## Features (v1)

- 🗺️ **Map-first planning** — drop pins by clicking the map or searching by name
- 🔖 **Categories** — tag places (food, sights, lodging, transport…) with colored markers
- 📅 **Days** — group places into Day 1 / Day 2 and filter your map by day
- 🧳 **Multiple trips** — plan several trips, each with its own map
- 💾 **Local & offline** — your data is stored locally and the app works without signal
- 📱 **Installable PWA** — add it to your phone or desktop

## Tech Stack

- React + TypeScript + Vite
- Leaflet + OpenStreetMap (free, no API key)
- Nominatim for place search (free geocoding)
- Tailwind CSS
- `vite-plugin-pwa` for offline + installability
- Local storage now, with a clean path to a cloud backend later

## Status

🚧 Early development. See [the design spec](docs/superpowers/specs/2026-07-01-trekboard-design.md)
for the full plan.

## License

MIT
