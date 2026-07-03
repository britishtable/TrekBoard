import { openTrekboardDb, PHOTOS_STORE } from './db';
import type { PhotoRecord } from '../types';
import type { PhotoStore } from './PhotoStore';

export function createIdbPhotoStore(): PhotoStore {
  return {
    async getPhoto(id) {
      const db = await openTrekboardDb();
      return (await db.get(PHOTOS_STORE, id)) as PhotoRecord | undefined;
    },
    async putPhoto(record) {
      const db = await openTrekboardDb();
      await db.put(PHOTOS_STORE, record, record.id);
    },
    async deletePhoto(id) {
      const db = await openTrekboardDb();
      await db.delete(PHOTOS_STORE, id);
    },
    async getAllPhotos() {
      const db = await openTrekboardDb();
      return (await db.getAll(PHOTOS_STORE)) as PhotoRecord[];
    },
  };
}
