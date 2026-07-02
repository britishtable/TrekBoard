import { pickPoi, type QueriedFeature } from './pickPoi';

test('returns null when no poi-layer feature has a name', () => {
  const features: QueriedFeature[] = [
    { sourceLayer: 'water', properties: { name: 'River' } },
    { sourceLayer: 'poi', properties: { class: 'cafe' } }, // no name
  ];
  expect(pickPoi(features, 10, 20)).toBeNull();
});

test('picks the first named poi feature and maps its category', () => {
  const features: QueriedFeature[] = [
    { sourceLayer: 'poi', properties: { name: 'Le Cafe', class: 'cafe' }, geometry: { type: 'Point', coordinates: [2.35, 48.86] } },
  ];
  expect(pickPoi(features, 0, 0)).toEqual({
    name: 'Le Cafe',
    category: 'food',
    lat: 48.86,
    lng: 2.35,
  });
});

test('falls back to the click coordinates when the feature has no point geometry', () => {
  const features: QueriedFeature[] = [
    { sourceLayer: 'poi', properties: { name: 'Museum', class: 'museum' } },
  ];
  expect(pickPoi(features, 41.9, 12.5)).toEqual({
    name: 'Museum',
    category: 'sights',
    lat: 41.9,
    lng: 12.5,
  });
});

test('ignores non-poi layers even if named', () => {
  const features: QueriedFeature[] = [
    { sourceLayer: 'transportation_name', properties: { name: 'Main St' } },
  ];
  expect(pickPoi(features, 0, 0)).toBeNull();
});

test('picks a named mountain_peak feature as outdoors', () => {
  const features: QueriedFeature[] = [
    {
      sourceLayer: 'mountain_peak',
      properties: { name: "Lion's Head", class: 'peak' },
      geometry: { type: 'Point', coordinates: [18.389, -33.935] },
    },
  ];
  expect(pickPoi(features, 0, 0)).toEqual({
    name: "Lion's Head",
    category: 'outdoors',
    lat: -33.935,
    lng: 18.389,
  });
});

test('skips an unnamed mountain_peak feature', () => {
  const features: QueriedFeature[] = [
    { sourceLayer: 'mountain_peak', properties: { class: 'peak' } },
  ];
  expect(pickPoi(features, 0, 0)).toBeNull();
});
