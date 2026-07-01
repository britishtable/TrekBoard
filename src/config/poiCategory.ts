import type { Category } from '../types';

const FOOD = new Set([
  'restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'food_court', 'bakery', 'ice_cream',
]);
const LODGING = new Set(['hotel', 'motel', 'hostel', 'guest_house', 'chalet']);
const SIGHTS = new Set([
  'museum', 'attraction', 'artwork', 'monument', 'memorial', 'viewpoint',
  'gallery', 'zoo', 'theme_park', 'castle', 'ruins', 'park', 'garden',
]);
const TRANSPORT = new Set([
  'bus', 'bus_stop', 'bus_station', 'railway', 'train_station', 'subway',
  'airport', 'aerodrome', 'ferry_terminal', 'tram_stop',
]);

export function poiCategory(cls: string): Category {
  if (FOOD.has(cls)) return 'food';
  if (LODGING.has(cls)) return 'lodging';
  if (SIGHTS.has(cls)) return 'sights';
  if (TRANSPORT.has(cls)) return 'transport';
  return 'other';
}
