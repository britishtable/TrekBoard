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

  // Network failures and AbortError propagate to the caller by design.
  const res = await fetch(url, {
    signal,
    referrerPolicy: 'origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const rows = (await res.json()) as NominatimRow[];
  return rows.map((r) => ({
    name: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}
