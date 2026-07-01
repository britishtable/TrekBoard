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
