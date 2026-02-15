/**
 * Combat Calculations
 *
 * Functions for HP, AC, initiative, attacks, and other combat mechanics.
 */

/**
 * Calculate proficiency bonus based on character level
 * Formula: floor((level - 1) / 4) + 2
 */
export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}
