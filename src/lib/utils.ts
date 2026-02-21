import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Open5e v2 API may return { name, key, url } objects instead of strings.
 * Safely extract a display string for rendering.
 */
export function toOpen5eDisplayString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    if ('name' in val) return String((val as { name: string }).name);
    if ('key' in val) return String((val as { key: string }).key);
  }
  if (Array.isArray(val)) {
    return val
      .map((v) => toOpen5eDisplayString(v))
      .filter(Boolean)
      .join(', ');
  }
  return '';
}
