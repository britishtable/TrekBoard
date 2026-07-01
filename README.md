# TrekBoard

A **map-first travel planner** — drop pins for the places you want to go, organize
them by category and by day, and see your whole trip laid out on a map.

TrekBoard is a Progressive Web App (PWA): it runs in any modern browser on desktop and
mobile, installs like a native app, and keeps working offline. It's built on a free,
no-API-key stack, so there's nothing to sign up for and nothing to configure.

Inspired by apps like Wanderlog, scoped down to a focused, buildable core.

## Open it in your browser

👉 **[britishtable.github.io/TrekBoard](https://britishtable.github.io/TrekBoard/)**

That's the whole app — no account, no install required. Open the link on your laptop or
phone and start planning. Everything you create is saved automatically on your device
(see [How your data is stored](#how-your-data-is-stored)).

## What you can do

- 🗺️ **Plan on the map** — click anywhere on the map to drop a pin, or **search a place
  by name** (e.g. "Eiffel Tower") and drop a located pin.
- 🔖 **Categorize places** — tag each place as Food, Sights, Lodging, Transport, or Other.
  Each category has its own colored marker, and you can filter the map/list by category.
- 📅 **Organize by day** — create days (Day 1, Day 2…), assign places to them, and filter
  your map and list by day.
- ↕️ **Order your day** — reorder the stops within a day with up/down controls, or hit
  **Sort by time** to arrange them by their start times automatically.
- ⏰ **Add times** — give a place an optional start time; a day then reads like a schedule.
- 📏 **See distances** — TrekBoard shows the straight-line distance and a rough walking
  time between consecutive stops in a day.
- 📝 **Add notes** — jot a note on any place.
- 🧳 **Juggle multiple trips** — create, rename, switch between, and delete separate trips,
  each with its own map and days.
- 💾 **Back up & transfer** — export all your trips to a file and import them back later or
  on another device (see [Backup & moving devices](#backup--moving-devices)).
- 📴 **Work offline** — once installed, the app and your data open with no internet, and
  map tiles you've already viewed stay available offline too.

## Install it as an offline app

Installing TrekBoard gives you a real app — its own window, a desktop/home-screen icon,
and **the ability to open it with no internet connection**. Do this once while online;
after that it works offline.

> **Why installing enables offline:** the first time you visit, the app's service worker
> saves the whole app to your device. From then on it loads from your disk instead of the
> network, and your trips live in local storage — so it opens and works with no signal.

### On a laptop / desktop (Chrome or Edge)

1. Open **[britishtable.github.io/TrekBoard](https://britishtable.github.io/TrekBoard/)**.
2. Look for the **install icon** in the address bar (a small monitor/⊕ symbol), or open
   the browser menu and choose **"Install TrekBoard…"**.
3. Click **Install.** TrekBoard now has a desktop shortcut and Start-menu / Launchpad entry
   and opens in its own window.

### On a phone

- **Android (Chrome):** menu (⋮) → **Install app** / **Add to Home screen**.
- **iPhone/iPad (Safari):** Share button → **Add to Home Screen**.

### Using it offline

After installing (and visiting at least once online), launch TrekBoard from your
shortcut/home screen with **no internet** and you can browse and edit everything — pins,
days, times, notes, the full list. **Map imagery** works offline for any area you've
already looked at while online (tiles are cached as you browse); areas you've never viewed
will show blank until you're back online. So before a trip, pan around your destination
while you still have Wi-Fi to pre-cache its map.

## How your data is stored

Your trips are saved **automatically** in your browser's local storage on every change —
no save button, no sign-in. Close the tab, restart your device, come back tomorrow: it's
all still there.

Because the data lives in one browser on one device, TrekBoard has no cloud sync (yet).
Use **Export / Import** as a manual backup and to move trips between devices.

### Backup & moving devices

- **Export:** click **Export** in the top bar to download a `trekboard-backup-YYYY-MM-DD.json`
  file containing all your trips.
- **Import:** click **Import** (available in the top bar, and on the empty "first trip"
  screen) and choose a backup file. Imported trips are **added** to what you already have —
  importing never overwrites your existing trips.

## Run it locally (for development)

Requires **Node 18+**.

```bash
git clone https://github.com/britishtable/TrekBoard.git
cd TrekBoard
npm install
npm run dev       # start the dev server (prints a local URL)
```

Other scripts:

```bash
npm test          # run the test suite (Vitest)
npm run build     # type-check and build for production (outputs dist/)
npm run preview   # serve the production build locally
```

## Tech stack

- **React + TypeScript + Vite**
- **Leaflet + OpenStreetMap** for the map (free, no API key)
- **Nominatim** for place search (free geocoding, no key)
- **Tailwind CSS** for styling
- **`vite-plugin-pwa`** (Workbox) for offline support and installability
- **Local storage** for persistence today, with a clean storage interface for adding a
  cloud backend later
- **Vitest + Testing Library** for tests

## License

MIT
