import type { PhotoRecord } from '../types';

export interface PhotoStore {
  getPhoto(id: string): Promise<PhotoRecord | undefined>;
  putPhoto(record: PhotoRecord): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  getAllPhotos(): Promise<PhotoRecord[]>;
}
