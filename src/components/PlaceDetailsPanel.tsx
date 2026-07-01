import { useState } from 'react';
import type { Category, Day, Place } from '../types';
import { CATEGORIES } from '../config/categories';
import { DISCOVERY_TYPES } from '../config/discoveryTypes';
import type { DiscoveryStatus } from './DiscoveryPanel';

interface PlaceDetailsPanelProps {
  place: Place;
  days: Day[];
  discoveryStatus?: DiscoveryStatus;
  onChange(patch: Partial<Omit<Place, 'id'>>): void;
  onDelete(): void;
  onClose(): void;
  onSearchNearby?(typeId: string): void;
}

function NearbyStatusText({ status }: { status: DiscoveryStatus }) {
  switch (status.kind) {
    case 'loading':
      return <p className="text-xs text-gray-500">Searching…</p>;
    case 'error':
      return <p className="text-xs text-red-600">{status.message}</p>;
    case 'empty':
      return <p className="text-xs text-gray-500">No {status.typeLabel} found nearby.</p>;
    case 'results':
      return <p className="text-xs text-gray-500">{status.count} found — tap a marker to add.</p>;
    default:
      return <span />;
  }
}

export default function PlaceDetailsPanel({
  place,
  days,
  discoveryStatus = { kind: 'idle' },
  onChange,
  onDelete,
  onClose,
  onSearchNearby = () => {},
}: PlaceDetailsPanelProps) {
  const [nearbyTypeId, setNearbyTypeId] = useState(DISCOVERY_TYPES[0].id);
  const nearbyLoading = discoveryStatus.kind === 'loading';
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
        Start time
        <input
          type="time"
          value={place.startTime ?? ''}
          onChange={(e) => onChange({ startTime: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
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

      <div className="space-y-1 border-t border-gray-200 pt-3">
        <h3 className="text-xs font-semibold text-gray-700">What's nearby</h3>
        <div className="flex items-center gap-2">
          <select
            aria-label="Nearby type"
            value={nearbyTypeId}
            onChange={(e) => setNearbyTypeId(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {DISCOVERY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onSearchNearby(nearbyTypeId)}
            disabled={nearbyLoading}
            className="whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Search nearby
          </button>
        </div>
        <NearbyStatusText status={discoveryStatus} />
      </div>

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
