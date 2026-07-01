import type { Trip } from '../types';

export interface TripBackup {
  version: 1;
  exportedAt: number;
  trips: Trip[];
}

function isTripShaped(t: unknown): t is Trip {
  if (!t || typeof t !== 'object') return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    Array.isArray(o.days) &&
    Array.isArray(o.places)
  );
}

export function serializeBackup(trips: Trip[]): string {
  const backup: TripBackup = { version: 1, exportedAt: Date.now(), trips };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(json: string): Trip[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('That file is not a TrekBoard backup.');
  }
  const b = parsed as Partial<TripBackup>;
  if (b.version !== 1) throw new Error('Unsupported backup version.');
  if (!Array.isArray(b.trips)) throw new Error('Backup has no trips.');
  return b.trips.map((t) => {
    if (!isTripShaped(t)) throw new Error('Backup contains an invalid trip.');
    return { ...t, id: crypto.randomUUID() };
  });
}
