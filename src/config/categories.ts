import type { Category } from '../types';

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'food', label: 'Food & Drink', color: '#e8590c' },
  { id: 'sights', label: 'Sights', color: '#1971c2' },
  { id: 'lodging', label: 'Lodging', color: '#6741d9' },
  { id: 'transport', label: 'Transport', color: '#2f9e44' },
  { id: 'other', label: 'Other', color: '#868e96' },
];

export const CATEGORY_MAP: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>;

export function categoryColor(id: Category): string {
  return CATEGORY_MAP[id]?.color ?? '#868e96';
}

export function categoryLabel(id: Category): string {
  return CATEGORY_MAP[id]?.label ?? 'Other';
}
