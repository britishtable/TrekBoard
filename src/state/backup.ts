import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import type { Trip, PhotoRecord } from '../types';

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

interface PhotoMeta {
  id: string;
  mime: string;
  width: number;
  height: number;
  createdAt: number;
}

export async function exportBackupZip(
  trips: Trip[],
  photos: PhotoRecord[],
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(serializeBackup(trips)),
  };
  const meta: PhotoMeta[] = [];
  for (const p of photos) {
    files[`photos/${p.id}.jpg`] = new Uint8Array(await p.blob.arrayBuffer());
    meta.push({
      id: p.id, mime: p.mime, width: p.width, height: p.height,
      createdAt: p.createdAt,
    });
  }
  files['photos.json'] = strToU8(JSON.stringify(meta));
  return new Blob([zipSync(files)], { type: 'application/zip' });
}

export async function importBackupZip(
  file: File,
): Promise<{ trips: Trip[]; photos: PhotoRecord[] }> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const manifest = files['manifest.json'];
  if (!manifest) throw new Error('Backup zip has no manifest.json.');
  const trips = parseBackup(strFromU8(manifest));

  const metaRaw = files['photos.json'];
  const metas: PhotoMeta[] = metaRaw ? JSON.parse(strFromU8(metaRaw)) : [];
  const photos: PhotoRecord[] = metas.map((m) => {
    const bytes = files[`photos/${m.id}.jpg`];
    if (!bytes) throw new Error(`Backup zip is missing photo ${m.id}.`);
    return {
      id: m.id,
      blob: new Blob([bytes], { type: m.mime }),
      mime: m.mime, width: m.width, height: m.height, createdAt: m.createdAt,
    };
  });
  return { trips, photos };
}
