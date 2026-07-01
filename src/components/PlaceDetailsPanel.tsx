import type { Category, Day, Place } from '../types';
import { CATEGORIES } from '../config/categories';

interface PlaceDetailsPanelProps {
  place: Place;
  days: Day[];
  onChange(patch: Partial<Omit<Place, 'id'>>): void;
  onDelete(): void;
  onClose(): void;
}

export default function PlaceDetailsPanel({
  place,
  days,
  onChange,
  onDelete,
  onClose,
}: PlaceDetailsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Place details</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Close details"
        >
          ✕
        </button>
      </div>

      <label className="text-xs font-medium text-gray-600">
        Name
        <input
          type="text"
          value={place.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <label className="text-xs font-medium text-gray-600">
        Category
        <select
          value={place.category}
          onChange={(e) => onChange({ category: e.target.value as Category })}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-gray-600">
        Day
        <select
          value={place.dayId ?? 'unassigned'}
          onChange={(e) =>
            onChange({
              dayId: e.target.value === 'unassigned' ? null : e.target.value,
            })
          }
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="unassigned">Unassigned</option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-gray-600">
        Note
        <textarea
          value={place.note ?? ''}
          onChange={(e) => onChange({ note: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <button
        type="button"
        onClick={onDelete}
        className="mt-auto rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        Delete place
      </button>
    </div>
  );
}
