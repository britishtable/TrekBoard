import type { Day } from '../types';

export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function pickCurrentDay(days: Day[], today: string): string | null {
  const match = days.find((d) => d.date === today);
  if (match) return match.id;
  return days[0]?.id ?? null;
}
