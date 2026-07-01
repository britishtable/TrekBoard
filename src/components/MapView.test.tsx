import { render } from '@testing-library/react';
import MapView from './MapView';

test('renders a map container', () => {
  const { container } = render(
    <MapView
      places={[]}
      selectedId={null}
      center={[48.8566, 2.3522]}
      onAddPlace={() => {}}
      onSelectPlace={() => {}}
    />,
  );
  expect(container.querySelector('.leaflet-container-host')).toBeInTheDocument();
});
