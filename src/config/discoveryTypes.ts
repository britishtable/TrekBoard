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
  { id: 'bakery', label: 'Bakeries', filters: [{ k: 'shop', v: 'bakery' }], category: 'food' },
  { id: 'bar', label: 'Bars & pubs', filters: [{ k: 'amenity', v: 'bar' }, { k: 'amenity', v: 'pub' }], category: 'nightlife' },
  { id: 'nightclub', label: 'Nightclubs', filters: [{ k: 'amenity', v: 'nightclub' }], category: 'nightlife' },
  { id: 'museum', label: 'Museums', filters: [{ k: 'tourism', v: 'museum' }], category: 'sights' },
  { id: 'attraction', label: 'Attractions', filters: [{ k: 'tourism', v: 'attraction' }], category: 'sights' },
  { id: 'cinema_theatre', label: 'Cinemas & theatres', filters: [{ k: 'amenity', v: 'cinema' }, { k: 'amenity', v: 'theatre' }], category: 'entertainment' },
  { id: 'viewpoint', label: 'Viewpoints', filters: [{ k: 'tourism', v: 'viewpoint' }], category: 'outdoors' },
  { id: 'park', label: 'Parks', filters: [{ k: 'leisure', v: 'park' }], category: 'outdoors' },
  { id: 'garden', label: 'Gardens', filters: [{ k: 'leisure', v: 'garden' }], category: 'outdoors' },
  { id: 'beach', label: 'Beaches', filters: [{ k: 'natural', v: 'beach' }], category: 'outdoors' },
  { id: 'shops', label: 'Shops & markets', filters: [{ k: 'shop', v: 'mall' }, { k: 'shop', v: 'supermarket' }, { k: 'shop', v: 'department_store' }, { k: 'amenity', v: 'marketplace' }], category: 'shopping' },
  { id: 'hotel', label: 'Hotels', filters: [{ k: 'tourism', v: 'hotel' }, { k: 'tourism', v: 'guest_house' }], category: 'lodging' },
];

export function getDiscoveryType(id: string): DiscoveryType | undefined {
  return DISCOVERY_TYPES.find((t) => t.id === id);
}
