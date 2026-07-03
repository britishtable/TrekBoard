import type { Category, Place, Trip } from '../types';
import { CATEGORIES, categoryColor, categoryLabel } from '../config/categories';
import { haversineKm, formatDistance, estWalkMinutes } from '../lib/distance';

interface SidebarProps {
  trip: Trip;
  selectedId: string | null;
  categoryFilter: Set<Category>;
  dayFilter: string | null;
  onSelectPlace(id: string): void;
  onToggleCategory(cat: Category): void;
  onSetDayFilter(dayId: string | null): void;
  onAddDay(): void;
  onMovePlace(id: string, dir: 'up' | 'down'): void;
  onSortDay(dayId: string | null): void;
  onSetDayDate(dayId: string, date: string | undefined): void;
}

export default function Sidebar({
  trip,
  selectedId,
  categoryFilter,
  dayFilter,
  onSelectPlace,
  onToggleCategory,
  onSetDayFilter,
  onAddDay,
  onMovePlace,
  onSortDay,
  onSetDayDate,
}: SidebarProps) {
  const visible = trip.places.filter((p) => {
    const catOk = categoryFilter.size === 0 || categoryFilter.has(p.category);
    const dayOk =
      dayFilter === null ||
      (dayFilter === 'unassigned' ? p.dayId === null : p.dayId === dayFilter);
    return catOk && dayOk;
  });

  const groups: { label: string; dayId: string | null; date?: string; places: Place[] }[] = [
    ...trip.days.map((d) => ({
      label: d.label,
      dayId: d.id as string | null,
      date: d.date,
      places: visible.filter((p) => p.dayId === d.id),
    })),
    { label: 'Unassigned', dayId: null, places: visible.filter((p) => p.dayId === null) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => {
            const active = categoryFilter.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggleCategory(c.id)}
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  active ? 'text-white' : 'text-gray-700'
                }`}
                style={active ? { background: c.color, borderColor: c.color } : undefined}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by day"
            value={dayFilter ?? 'all'}
            onChange={(e) =>
              onSetDayFilter(e.target.value === 'all' ? null : e.target.value)
            }
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">All days</option>
            {trip.days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
          <button
            type="button"
            onClick={onAddDay}
            className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
          >
            + Day
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {g.label}
                </h3>
                {g.dayId !== null && (
                  <input
                    type="date"
                    aria-label={`Date for ${g.label}`}
                    value={g.date ?? ''}
                    onChange={(e) => onSetDayDate(g.dayId as string, e.target.value || undefined)}
                    className="rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-600"
                  />
                )}
              </div>
              {g.places.length > 1 && (
                <button
                  type="button"
                  onClick={() => onSortDay(g.dayId)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Sort by time
                </button>
              )}
            </div>
            {g.places.length === 0 ? (
              <p className="text-xs text-gray-400">No places</p>
            ) : (
              <ul className="space-y-1">
                {g.places.map((p, i) => (
                  <li key={p.id}>
                    {i > 0 && (
                      <div className="py-0.5 pl-8 text-[11px] text-gray-400">
                        {(() => {
                          const prev = g.places[i - 1];
                          const km = haversineKm(prev, p);
                          return `↕ ${formatDistance(km)} · ~${estWalkMinutes(km)} min walk`;
                        })()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          aria-label={`Move ${p.name} up`}
                          disabled={i === 0}
                          onClick={() => onMovePlace(p.id, 'up')}
                          className="text-xs leading-none text-gray-400 enabled:hover:text-gray-700 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${p.name} down`}
                          disabled={i === g.places.length - 1}
                          onClick={() => onMovePlace(p.id, 'down')}
                          className="text-xs leading-none text-gray-400 enabled:hover:text-gray-700 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectPlace(p.id)}
                        className={`flex flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                          p.id === selectedId ? 'bg-gray-100 font-medium' : ''
                        }`}
                      >
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full"
                          style={{ background: categoryColor(p.category) }}
                          title={categoryLabel(p.category)}
                        />
                        {p.startTime && (
                          <span className="tabular-nums text-xs text-gray-500">
                            {p.startTime}
                          </span>
                        )}
                        <span className="truncate">{p.name}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
