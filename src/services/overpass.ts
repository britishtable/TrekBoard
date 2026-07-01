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

const ENDPOINT = 'https://overpass-api.de/api/interpreter';

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
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    body: buildQuery(bounds, typeId),
    signal,
    headers: { 'Content-Type': 'text/plain' },
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status}`);
  const data = (await res.json()) as { elements?: OverpassElement[] };
  return parseElements(data.elements ?? [], type.category);
}
