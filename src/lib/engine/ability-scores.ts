/**
 * Ability Score Calculations
 *
 * Functions for calculating ability modifiers, skill bonuses, and saving throws.
 */

import { type AbilityScore, SKILLS } from '@/types/game';

/**
 * Calculate ability modifier from score
 * Formula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get skill ability mapping
 */
export function getSkillAbility(skillKey: string): AbilityScore | null {
  const skill = SKILLS.find((s) => s.key === skillKey);
  return skill?.ability ?? null;
}
