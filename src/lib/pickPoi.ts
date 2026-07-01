import type { Category } from '../types';
import { poiCategory } from '../config/poiCategory';

export interface IdentifiedPoi {
  name: string;
  category: Category;
  lat: number;
  lng: number;
}

export interface QueriedFeature {
  sourceLayer?: string;
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

export function pickPoi(
  features: QueriedFeature[],
  fallbackLat: number,
  fallbackLng: number,
): IdentifiedPoi | null {
  for (const f of features) {
    if (f.sourceLayer !== 'poi') continue;
    const name = f.properties?.name;
    if (typeof name !== 'string' || name === '') continue;

    const cls =
      (typeof f.properties?.class === 'string' && f.properties.class) ||
      (typeof f.properties?.subclass === 'string' && f.properties.subclass) ||
      '';

    let lat = fallbackLat;
    let lng = fallbackLng;
    if (f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
      const [lo, la] = f.geometry.coordinates as unknown[];
      if (typeof lo === 'number' && typeof la === 'number') {
        lng = lo;
        lat = la;
      }
    }

    return { name, category: poiCategory(cls), lat, lng };
  }
  return null;
}
