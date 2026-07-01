import type { Category } from '../types';
import type { Bounds } from '../lib/bbox';
import { getDiscoveryType } from '../config/discoveryTypes';

export interface Suggestion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Public Overpass instances, tried in order. The primary is busiest/most
// rate-limited, so we fall through to community mirrors on 429/504/timeout/
// network errors before surfacing an error to the user.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  at: number;
  suggestions: Suggestion[];
}

const cache = new Map<string, CacheEntry>();

/** Clears the in-memory suggestion cache (used in tests). */
export function clearSuggestionCache(): void {
  cache.clear();
}

function cacheKey(bounds: Bounds, typeId: string): string {
  const r = (n: number) => n.toFixed(3); // ~100m granularity
  return `${typeId}:${r(bounds.south)},${r(bounds.west)},${r(bounds.north)},${r(bounds.east)}`;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function fetchWithFallback(
  query: string,
  signal?: AbortSignal,
): Promise<{ elements?: OverpassElement[] }> {
  let lastError: unknown = new Error('No Overpass endpoints available');
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: query,
        signal,
        headers: { 'Content-Type': 'text/plain' },
      });
      if (res.ok) return (await res.json()) as { elements?: OverpassElement[] };
      lastError = new Error(`Overpass request failed: ${res.status}`);
    } catch (err) {
      if (isAbortError(err)) throw err; // user cancelled — do not try mirrors
      lastError = err;
    }
  }
  throw lastError;
}

export function buildQuery(bounds: Bounds, typeId: string): string {
  const type = getDiscoveryType(typeId);
  if (!type) throw new Error(`Unknown discovery type: ${typeId}`);
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const lines = type.filters
    .flatMap((f) => [
      `  node["${f.k}"="${f.v}"](${bbox});`,
      `  way["${f.k}"="${f.v}"](${bbox});`,
    ])
    .join('\n');
  return `[out:json][timeout:25];\n(\n${lines}\n);\nout center 60;`;
}

export function parseElements(
  elements: OverpassElement[],
  category: Category,
): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name, lat, lng, category });
  }
  return out;
}

export async function searchArea(
  bounds: Bounds,
  typeId: string,
  signal?: AbortSignal,
): Promise<Suggestion[]> {
  const type = getDiscoveryType(typeId);
  if (!type) throw new Error(`Unknown discovery type: ${typeId}`);

  const key = cacheKey(bounds, typeId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.suggestions.slice();
  }

  const data = await fetchWithFallback(buildQuery(bounds, typeId), signal);
  const suggestions = parseElements(data.elements ?? [], type.category);
  cache.set(key, { at: Date.now(), suggestions });
  return suggestions.slice();
}
