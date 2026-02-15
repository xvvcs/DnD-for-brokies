/**
 * Character Progression
 *
 * Functions for level-up calculations, XP thresholds, and multiclassing.
 */

// XP thresholds for each level (5e standard)
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

/**
 * Get XP required for next level
 */
export function getXPForLevel(level: number): number {
  return XP_THRESHOLDS[level] ?? 355000;
}
