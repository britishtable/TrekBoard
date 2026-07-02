# TrekBoard

A map-first travel planner. Drop pins for the places you want to go, organize them by
category and by day, and see your whole trip laid out on a map.

TrekBoard runs entirely in your browser as a Progressive Web App, so you can use it on a
laptop or a phone, install it like a normal app, and keep using it offline. It's built on
a free, no-API-key stack, which means there's nothing to sign up for and nothing to
configure.

It started as a personal tool for planning an upcoming trip, inspired by apps like
Wanderlog but pared down to the parts that actually matter day to day.

## Open it in your browser

The app lives here: **[britishtable.github.io/TrekBoard](https://britishtable.github.io/TrekBoard/)**

There's no account and no install step required. Open the link on your laptop or your
phone and start planning. Everything you create is saved automatically on your device —
more on that under [How your data is stored](#how-your-data-is-stored).

## What you can do

Plan on the map by clicking anywhere to drop a pin, or search for a place by name (say,
"Eiffel Tower") and drop a located pin without hunting for it.

The map knows what's on it, too. Click a labeled place — a cafe, a museum, a hotel — and
TrekBoard adds it with its name and category already filled in. Or explore an area: pick a
type, like cafes, museums, viewpoints, hotels, or hiking spots (trailheads, peaks, and
nature reserves), and hit "Search this area" to see everything of that kind nearby, then
add the ones you want with a tap. Mountain peaks are drawn right on the map, too — tap
one to add it to your trip.

Saved places can anchor a search too. Open any place you've added — your hotel, say —
and hit "Search nearby" in its details panel to see what's within about a ten-minute
walk. The map frames that pocket of the city, and each result's popup shows how far it
is from your starting point.

Give each place a category — Food, Nightlife, Sights, Entertainment, Outdoors,
Shopping, Lodging, Transport, or Other. Every category
has its own colored marker, and you can filter the map and list down to just the ones you
care about.

Break the trip into days. Create Day 1, Day 2, and so on, assign places to them, and
filter the map by day when a single view gets busy. Within a day you can reorder stops
with up/down controls, or let TrekBoard arrange them for you with "Sort by time" once
you've given places a start time. It'll also show you the straight-line distance and a
rough walking time between consecutive stops, so a day reads like a real itinerary.

You can keep notes on any place, run several separate trips at once (each with its own map
and days), and export everything to a file for safekeeping or to move it to another
device.

And because it's a Progressive Web App, once it's installed the whole thing works offline
— including the map imagery for anywhere you've already looked at.

## Install it as an offline app

Installing TrekBoard turns it into a proper app, with its own window, a desktop or
home-screen icon, and the ability to open with no internet connection. You only need to do
this once, while you're online; after that it works offline.

The reason installing matters is how a Progressive Web App works: the first time you
visit, it quietly saves the whole app onto your device. From then on it loads from your
disk instead of the network, and your trips live in local storage — so it opens and runs
even with no signal.

**On a laptop or desktop (Chrome or Edge):** open
[britishtable.github.io/TrekBoard](https://britishtable.github.io/TrekBoard/), look for the
install icon in the address bar (a small monitor or ⊕ symbol) or the "Install TrekBoard…"
option in the browser menu, and click Install. You'll get a desktop shortcut and a
Start-menu or Launchpad entry, and the app opens in its own window.

**On a phone:** in Chrome on Android, use the menu and choose "Install app" (or "Add to
Home screen"). In Safari on iPhone or iPad, tap the Share button and choose "Add to Home
Screen".

**Using it offline:** after installing and visiting at least once online, you can launch
TrekBoard from your shortcut with no internet and browse and edit everything — pins, days,
times, notes, the whole list. The map imagery works offline for any area you've already
viewed, since those tiles are cached as you browse; areas you've never opened will be
blank until you're back online. So before you travel, it's worth panning around your
destination while you still have Wi-Fi to cache its map ahead of time.

## How your data is stored

Your trips are saved automatically in your browser's local storage every time you change
something — there's no save button and no sign-in. Close the tab, restart your computer,
come back next week, and it's all still there.

Because that data lives in one browser on one device, there's no cloud sync yet. Export
and Import are how you keep a backup and move trips between devices:

- **Export** downloads a `trekboard-backup-YYYY-MM-DD.json` file with all of your trips.
- **Import** (in the top bar, and on the empty first-run screen) reads a backup file back
  in. Imported trips are added to whatever you already have, so importing never overwrites
  your existing trips.

## Run it locally

You'll need Node 18 or newer.

```bash
git clone https://github.com/britishtable/TrekBoard.git
cd TrekBoard
npm install
npm run dev       # start the dev server (prints a local URL)
```

Other useful scripts:

```bash
npm test          # run the test suite (Vitest)
npm run build     # type-check and build for production (outputs dist/)
npm run preview   # serve the production build locally
```

## Tech stack

- React, TypeScript, and Vite
- MapLibre GL with OpenFreeMap for the map (free, no API key)
- Nominatim for place search (free geocoding, no key)
- Tailwind CSS for styling
- vite-plugin-pwa (Workbox) for offline support and installability
- Local storage for persistence today, behind a storage interface that leaves room for a
  cloud backend later
- Vitest and Testing Library for tests

## License

MIT
