import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceDetailsPanel from './PlaceDetailsPanel';
import type { Place } from '../types';

const place: Place = {
  id: 'p1',
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  category: 'sights',
  dayId: null,
};

test('editing the name calls onChange with the new value', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <PlaceDetailsPanel
      place={place}
      days={[]}
      onChange={onChange}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  const input = screen.getByLabelText(/name/i);
  await user.type(input, '!');
  expect(onChange).toHaveBeenCalledWith({ name: 'Louvre!' });
});

test('delete button fires onDelete', async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();
  render(
    <PlaceDetailsPanel
      place={place}
      days={[]}
      onChange={() => {}}
      onDelete={onDelete}
      onClose={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /delete/i }));
  expect(onDelete).toHaveBeenCalled();
});
