import type { Category, Place, Trip } from '../types';
import { CATEGORIES, categoryColor, categoryLabel } from '../config/categories';

interface SidebarProps {
  trip: Trip;
  selectedId: string | null;
  categoryFilter: Set<Category>;
  dayFilter: string | null;
  onSelectPlace(id: string): void;
  onToggleCategory(cat: Category): void;
  onSetDayFilter(dayId: string | null): void;
  onAddDay(): void;
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
}: SidebarProps) {
  const visible = trip.places.filter((p) => {
    const catOk = categoryFilter.size === 0 || categoryFilter.has(p.category);
    const dayOk =
      dayFilter === null ||
      (dayFilter === 'unassigned' ? p.dayId === null : p.dayId === dayFilter);
    return catOk && dayOk;
  });

  const groups: { label: string; places: Place[] }[] = [
    ...trip.days.map((d) => ({
      label: d.label,
      places: visible.filter((p) => p.dayId === d.id),
    })),
    { label: 'Unassigned', places: visible.filter((p) => p.dayId === null) },
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
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {g.label}
            </h3>
            {g.places.length === 0 ? (
              <p className="text-xs text-gray-400">No places</p>
            ) : (
              <ul className="space-y-1">
                {g.places.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPlace(p.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                        p.id === selectedId ? 'bg-gray-100 font-medium' : ''
                      }`}
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ background: categoryColor(p.category) }}
                        title={categoryLabel(p.category)}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
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
