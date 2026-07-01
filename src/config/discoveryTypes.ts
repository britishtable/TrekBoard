import type { Category } from '../types';

export interface DiscoveryFilter {
  k: string;
  v: string;
}

export interface DiscoveryType {
  id: string;
  label: string;
  filters: DiscoveryFilter[]; // OR-combined
  category: Category;
}

export const DISCOVERY_TYPES: DiscoveryType[] = [
  { id: 'cafe', label: 'Cafés', filters: [{ k: 'amenity', v: 'cafe' }], category: 'food' },
  { id: 'restaurant', label: 'Restaurants', filters: [{ k: 'amenity', v: 'restaurant' }], category: 'food' },
  { id: 'bar', label: 'Bars & pubs', filters: [{ k: 'amenity', v: 'bar' }, { k: 'amenity', v: 'pub' }], category: 'food' },
  { id: 'bakery', label: 'Bakeries', filters: [{ k: 'shop', v: 'bakery' }], category: 'food' },
  { id: 'museum', label: 'Museums', filters: [{ k: 'tourism', v: 'museum' }], category: 'sights' },
  { id: 'attraction', label: 'Attractions', filters: [{ k: 'tourism', v: 'attraction' }], category: 'sights' },
  { id: 'viewpoint', label: 'Viewpoints', filters: [{ k: 'tourism', v: 'viewpoint' }], category: 'sights' },
  { id: 'park', label: 'Parks', filters: [{ k: 'leisure', v: 'park' }], category: 'sights' },
  { id: 'hotel', label: 'Hotels', filters: [{ k: 'tourism', v: 'hotel' }, { k: 'tourism', v: 'guest_house' }], category: 'lodging' },
];

export function getDiscoveryType(id: string): DiscoveryType | undefined {
  return DISCOVERY_TYPES.find((t) => t.id === id);
}
