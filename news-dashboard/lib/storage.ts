// Persistent storage utilities for dashboard state
export const STORAGE_KEYS = {
  CATEGORY: 'news-filter-category',
  SOURCE: 'news-filter-source',
  SORT: 'news-sort-by',
  VIEW: 'news-view-mode',
  LIMIT: 'news-limit',
} as const;

export function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageValue(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}
