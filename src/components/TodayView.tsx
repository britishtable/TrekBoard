import type { Trip } from '../types';
import { categoryColor } from '../config/categories';
import { haversineKm, formatDistance } from '../lib/distance';
import { compareByStartTime } from '../state/tripOps';

interface TodayViewProps {
  trip: Trip;
  selectedDayId: string | null;
  onSelectDay(dayId: string | null): void;
  onToggleVisited(placeId: string, visited: boolean): void;
  onSelectPlace(placeId: string): void;
}

export default function TodayView({
  trip,
  selectedDayId,
  onSelectDay,
  onToggleVisited,
  onSelectPlace,
}: TodayViewProps) {
  const day = trip.days.find((d) => d.id === selectedDayId) ?? null;
  const stops = trip.places
    .filter((p) => p.dayId === selectedDayId)
    .slice()
    .sort(compareByStartTime);
  const visitedCount = stops.filter((p) => p.visited).length;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">Today</span>
        <select
          aria-label="Day"
          value={selectedDayId ?? 'unassigned'}
          onChange={(e) => onSelectDay(e.target.value === 'unassigned' ? null : e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {trip.days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
              {d.date ? ` — ${d.date}` : ''}
            </option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">
        {day ? `${day.label}${day.date ? ` · ${day.date}` : ''}` : 'Unassigned'} · {visitedCount} of{' '}
        {stops.length} visited
      </p>

      {stops.length === 0 ? (
        <p className="text-sm text-gray-400">No stops planned for this day.</p>
      ) : (
        <ul className="space-y-1">
          {stops.map((p, i) => (
            <li key={p.id}>
              <div className="flex items-center gap-2 rounded px-2 py-2">
                <input
                  type="checkbox"
                  aria-label={`Visited ${p.name}`}
                  checked={p.visited ?? false}
                  onChange={(e) => onToggleVisited(p.id, e.target.checked)}
                />
                <button
                  type="button"
                  onClick={() => onSelectPlace(p.id)}
                  className="flex flex-1 items-center gap-2 text-left text-sm"
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ background: categoryColor(p.category) }}
                  />
                  {p.startTime && (
                    <span className="tabular-nums text-xs text-gray-500">{p.startTime}</span>
                  )}
                  <span className={`truncate ${p.visited ? 'text-gray-400 line-through' : ''}`}>
                    {p.name}
                  </span>
                </button>
              </div>
              {i < stops.length - 1 && (
                <div className="pl-8 text-[11px] text-gray-400">
                  ↕ {formatDistance(haversineKm(p, stops[i + 1]))} to next
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
