export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const MAX_SPAN_DEG = 0.35; // ~30-40 km; keeps Overpass queries small and fast

export function isBboxSearchable(b: Bounds): boolean {
  const latSpan = Math.abs(b.north - b.south);
  const lngSpan = Math.abs(b.east - b.west);
  return latSpan <= MAX_SPAN_DEG && lngSpan <= MAX_SPAN_DEG;
}

const METERS_PER_DEG_LAT = 111_320;

/** A box extending radiusM meters from (lat, lng) in each cardinal direction. */
export function boundsAroundPoint(lat: number, lng: number, radiusM: number): Bounds {
  const dLat = radiusM / METERS_PER_DEG_LAT;
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  return { south: lat - dLat, west: lng - dLng, north: lat + dLat, east: lng + dLng };
}
