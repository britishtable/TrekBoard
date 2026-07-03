import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Place } from '../types';
import type { PhotoStore } from '../storage/PhotoStore';
import { resizeImage } from '../lib/resizeImage';

interface PhotoSectionProps {
  place: Place;
  photoStore: PhotoStore;
  onChange(patch: Partial<Omit<Place, 'id'>>): void;
}

export default function PhotoSection({ place, photoStore, onChange }: PhotoSectionProps) {
  const ids = place.photoIds ?? [];
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load object URLs for the current photo ids; revoke them on change/unmount.
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const next: Record<string, string> = {};
      for (const id of ids) {
        const rec = await photoStore.getPhoto(id);
        if (rec) {
          const url = URL.createObjectURL(rec.blob);
          created.push(url);
          next[id] = url;
        }
      }
      if (cancelled) {
        created.forEach((u) => URL.revokeObjectURL(u));
      } else {
        setUrls(next);
      }
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
    // ids joined so the effect reruns when the set of photos changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), photoStore]);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const added: string[] = [];
    for (const file of files) {
      const { blob, width, height } = await resizeImage(file);
      const id = crypto.randomUUID();
      await photoStore.putPhoto({
        id, blob, mime: 'image/jpeg', width, height, createdAt: Date.now(),
      });
      added.push(id);
    }
    if (added.length) onChange({ photoIds: [...ids, ...added] });
  }

  async function handleDelete(id: string) {
    await photoStore.deletePhoto(id);
    onChange({ photoIds: ids.filter((i) => i !== id) });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Photos</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
        >
          Add photos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {ids.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {ids.map((id) => (
            <div key={id} className="group relative aspect-square">
              {urls[id] && (
                <img
                  src={urls[id]}
                  alt=""
                  onClick={() => setViewing(urls[id])}
                  className="h-full w-full cursor-pointer rounded object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleDelete(id)}
                aria-label="Delete photo"
                className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewing(null)}
        >
          <img src={viewing} alt="" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </div>
  );
}
