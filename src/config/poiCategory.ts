import type { Category } from '../types';

const FOOD = new Set([
  'restaurant', 'fast_food', 'cafe', 'food_court', 'bakery', 'ice_cream', 'deli',
]);
const NIGHTLIFE = new Set(['bar', 'pub', 'nightclub', 'biergarten', 'wine']);
const ENTERTAINMENT = new Set(['cinema', 'theatre', 'arts_centre', 'gallery', 'casino']);
const OUTDOORS = new Set([
  'park', 'garden', 'viewpoint', 'beach', 'nature_reserve', 'picnic_site',
]);
const SHOPPING = new Set([
  'mall', 'department_store', 'supermarket', 'convenience', 'marketplace',
  'grocery', 'clothes', 'gift', 'books', 'shop',
]);
const SIGHTS = new Set([
  'museum', 'attraction', 'artwork', 'monument', 'memorial',
  'castle', 'ruins', 'zoo', 'aquarium',
]);
const LODGING = new Set([
  'hotel', 'motel', 'hostel', 'guest_house', 'chalet', 'camp_site', 'caravan_site',
]);
const TRANSPORT = new Set([
  'bus', 'bus_stop', 'bus_station', 'railway', 'train_station', 'subway', 'station',
  'airport', 'aerodrome', 'ferry_terminal', 'tram_stop',
]);

export function poiCategory(cls: string): Category {
  if (FOOD.has(cls)) return 'food';
  if (NIGHTLIFE.has(cls)) return 'nightlife';
  if (ENTERTAINMENT.has(cls)) return 'entertainment';
  if (OUTDOORS.has(cls)) return 'outdoors';
  if (SHOPPING.has(cls)) return 'shopping';
  if (SIGHTS.has(cls)) return 'sights';
  if (LODGING.has(cls)) return 'lodging';
  if (TRANSPORT.has(cls)) return 'transport';
  return 'other';
}
