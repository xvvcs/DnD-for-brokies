/**
 * Spellcasting Calculations
 *
 * Functions for spell save DC, attack rolls, and slot calculations.
 */

/**
 * Calculate spell save DC
 * Formula: 8 + proficiency bonus + spellcasting ability modifier
 */
export function calculateSpellSaveDC(
  proficiencyBonus: number,
  spellcastingModifier: number
): number {
  return 8 + proficiencyBonus + spellcastingModifier;
}

/**
 * Calculate spell attack bonus
 * Formula: proficiency bonus + spellcasting ability modifier
 */
export function calculateSpellAttackBonus(
  proficiencyBonus: number,
  spellcastingModifier: number
): number {
  return proficiencyBonus + spellcastingModifier;
}
