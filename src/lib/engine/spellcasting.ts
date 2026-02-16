/**
 * Spellcasting Engine - D&D 5e
 *
 * Functions for spell save DC, attack rolls, spell slots, and
 * spell preparation following D&D 5e rules.
 */

import { type AbilityScore, type SpellLevel, SPELL_LEVELS } from '@/types/game';
import { calculateModifier } from './ability-scores';
import { calculateProficiencyBonus } from './proficiency';

// ============================================================================
// Caster Types and Spellcasting Abilities
// ============================================================================

export type CasterType = 'full' | 'half' | 'third' | 'pact' | 'none';

/**
 * Map of class keys to their spellcasting details
 */
export const CLASS_SPELLCASTING: Record<string, { ability: AbilityScore; casterType: CasterType }> =
  {
    // Full casters
    bard: { ability: 'CHA', casterType: 'full' },
    cleric: { ability: 'WIS', casterType: 'full' },
    druid: { ability: 'WIS', casterType: 'full' },
    sorcerer: { ability: 'CHA', casterType: 'full' },
    wizard: { ability: 'INT', casterType: 'full' },

    // Half casters
    paladin: { ability: 'CHA', casterType: 'half' },
    ranger: { ability: 'WIS', casterType: 'half' },

    // Third casters (subclasses)
    'eldritch-knight': { ability: 'INT', casterType: 'third' },
    'arcane-trickster': { ability: 'INT', casterType: 'third' },

    // Pact magic
    warlock: { ability: 'CHA', casterType: 'pact' },

    // Non-casters
    barbarian: { ability: 'WIS', casterType: 'none' },
    fighter: { ability: 'INT', casterType: 'none' },
    monk: { ability: 'WIS', casterType: 'none' },
    rogue: { ability: 'INT', casterType: 'none' },
  };

/**
 * Classes that prepare spells
 */
export const PREPARATION_CLASSES = ['cleric', 'druid', 'wizard', 'paladin'];

/**
 * Classes that know spells (limited list)
 */
export const KNOWN_SPELL_CLASSES = ['bard', 'sorcerer', 'ranger', 'warlock'];

/**
 * Get spellcasting ability for a class
 *
 * @param classKey - Class identifier
 * @returns The spellcasting ability score, or null if not a caster
 */
export function getSpellcastingAbility(classKey: string): AbilityScore | null {
  const casting = CLASS_SPELLCASTING[classKey.toLowerCase()];
  return casting?.casterType !== 'none' ? (casting?.ability ?? null) : null;
}

/**
 * Get caster type for a class
 *
 * @param classKey - Class identifier
 * @returns The caster type
 */
export function getCasterType(classKey: string): CasterType {
  return CLASS_SPELLCASTING[classKey.toLowerCase()]?.casterType ?? 'none';
}

/**
 * Determine if a class is a spellcaster
 *
 * @param classKey - Class identifier
 * @returns Whether the class can cast spells
 */
export function isSpellcaster(classKey: string): boolean {
  return getCasterType(classKey) !== 'none';
}

/**
 * Determine if a class prepares spells
 *
 * @param classKey - Class identifier
 * @returns Whether the class uses spell preparation
 */
export function isPreparationCaster(classKey: string): boolean {
  return PREPARATION_CLASSES.includes(classKey.toLowerCase());
}

/**
 * Determine if a class knows spells (limited known spells)
 *
 * @param classKey - Class identifier
 * @returns Whether the class has a limited known spell list
 */
export function isKnownSpellCaster(classKey: string): boolean {
  return KNOWN_SPELL_CLASSES.includes(classKey.toLowerCase());
}

// ============================================================================
// Spell Save DC and Attack Bonus
// ============================================================================

export interface SpellcastingStats {
  ability: AbilityScore;
  abilityModifier: number;
  proficiencyBonus: number;
  saveDC: number;
  attackBonus: number;
  itemBonus: number;
}

/**
 * Calculate spell save DC
 * Formula: 8 + proficiency bonus + spellcasting ability modifier + item bonus
 *
 * @param proficiencyBonus - Character's proficiency bonus
 * @param spellcastingModifier - Spellcasting ability modifier
 * @param itemBonus - Bonus from magic items
 * @returns Spell save DC
 */
export function calculateSpellSaveDC(
  proficiencyBonus: number,
  spellcastingModifier: number,
  itemBonus: number = 0
): number {
  return 8 + proficiencyBonus + spellcastingModifier + itemBonus;
}

/**
 * Calculate spell attack bonus
 * Formula: proficiency bonus + spellcasting ability modifier + item bonus
 *
 * @param proficiencyBonus - Character's proficiency bonus
 * @param spellcastingModifier - Spellcasting ability modifier
 * @param itemBonus - Bonus from magic items (e.g., +1 wand)
 * @returns Spell attack bonus
 */
export function calculateSpellAttackBonus(
  proficiencyBonus: number,
  spellcastingModifier: number,
  itemBonus: number = 0
): number {
  return proficiencyBonus + spellcastingModifier + itemBonus;
}

/**
 * Calculate complete spellcasting stats for a character
 *
 * @param classKey - Primary spellcasting class
 * @param abilityScores - All ability scores
 * @param characterLevel - Total character level
 * @param itemBonus - Magic item bonus
 * @returns Complete spellcasting statistics
 */
export function calculateSpellcastingStats(
  classKey: string,
  abilityScores: Record<AbilityScore, number>,
  characterLevel: number,
  itemBonus: number = 0
): SpellcastingStats | null {
  const ability = getSpellcastingAbility(classKey);
  if (!ability) return null;

  const abilityModifier = calculateModifier(abilityScores[ability]);
  const proficiencyBonus = calculateProficiencyBonus(characterLevel);

  return {
    ability,
    abilityModifier,
    proficiencyBonus,
    saveDC: calculateSpellSaveDC(proficiencyBonus, abilityModifier, itemBonus),
    attackBonus: calculateSpellAttackBonus(proficiencyBonus, abilityModifier, itemBonus),
    itemBonus,
  };
}

// ============================================================================
// Spell Slots
// ============================================================================

/**
 * Standard spell slot progression for full casters
 * Index 0 is cantrips (not used), 1-9 are spell levels
 */
export const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [0, 4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [0, 4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [0, 4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [0, 4, 3, 3, 3, 3, 2, 2, 1, 1],
};

/**
 * Pact Magic spell slots for Warlocks
 * Warlocks always have slots of their maximum spell level
 */
export const PACT_MAGIC_SLOTS: Record<number, { slots: number; slotLevel: number }> = {
  1: { slots: 1, slotLevel: 1 },
  2: { slots: 2, slotLevel: 1 },
  3: { slots: 2, slotLevel: 2 },
  4: { slots: 2, slotLevel: 2 },
  5: { slots: 2, slotLevel: 3 },
  6: { slots: 2, slotLevel: 3 },
  7: { slots: 2, slotLevel: 4 },
  8: { slots: 2, slotLevel: 4 },
  9: { slots: 2, slotLevel: 5 },
  10: { slots: 2, slotLevel: 5 },
  11: { slots: 3, slotLevel: 5 },
  12: { slots: 3, slotLevel: 5 },
  13: { slots: 3, slotLevel: 5 },
  14: { slots: 3, slotLevel: 5 },
  15: { slots: 3, slotLevel: 5 },
  16: { slots: 3, slotLevel: 5 },
  17: { slots: 4, slotLevel: 5 },
  18: { slots: 4, slotLevel: 5 },
  19: { slots: 4, slotLevel: 5 },
  20: { slots: 4, slotLevel: 5 },
};

export interface SpellSlotCount {
  level: SpellLevel;
  max: number;
  used: number;
}

/**
 * Calculate effective caster level for spell slots
 * Full: 1× level
 * Half: ½× level (rounded down)
 * Third: ⅓× level (rounded down)
 *
 * @param classLevel - Class level
 * @param casterType - Type of caster
 * @returns Effective caster level
 */
export function calculateEffectiveCasterLevel(classLevel: number, casterType: CasterType): number {
  switch (casterType) {
    case 'full':
      return classLevel;
    case 'half':
      return Math.floor(classLevel / 2);
    case 'third':
      return Math.floor(classLevel / 3);
    case 'pact':
      return classLevel; // Pact magic is handled separately
    case 'none':
    default:
      return 0;
  }
}

/**
 * Calculate spell slots for a single class
 *
 * @param classLevel - Class level
 * @param casterType - Type of caster
 * @returns Array of spell slot counts (index 0 is cantrips)
 */
export function calculateSpellSlots(classLevel: number, casterType: CasterType): SpellSlotCount[] {
  if (casterType === 'none' || casterType === 'pact') {
    return SPELL_LEVELS.map((level) => ({ level, max: 0, used: 0 }));
  }

  const effectiveLevel = calculateEffectiveCasterLevel(classLevel, casterType);

  if (effectiveLevel < 1) {
    return SPELL_LEVELS.map((level) => ({ level, max: 0, used: 0 }));
  }

  const slots = FULL_CASTER_SLOTS[Math.min(20, effectiveLevel)];

  return SPELL_LEVELS.map((level) => ({
    level,
    max: slots[level] ?? 0,
    used: 0,
  }));
}

/**
 * Calculate multiclass spell slots (PHB rules)
 * Sum effective caster levels from all classes, then look up slots
 *
 * @param classLevels - Array of { classKey, level }
 * @returns Array of spell slot counts
 */
export function calculateMulticlassSpellSlots(
  classLevels: Array<{ classKey: string; level: number }>
): SpellSlotCount[] {
  let totalEffectiveLevel = 0;

  for (const { classKey, level } of classLevels) {
    const casterType = getCasterType(classKey);
    totalEffectiveLevel += calculateEffectiveCasterLevel(level, casterType);
  }

  if (totalEffectiveLevel < 1) {
    return SPELL_LEVELS.map((level) => ({ level, max: 0, used: 0 }));
  }

  const slots = FULL_CASTER_SLOTS[Math.min(20, totalEffectiveLevel)];

  return SPELL_LEVELS.map((level) => ({
    level,
    max: slots[level] ?? 0,
    used: 0,
  }));
}

/**
 * Calculate Pact Magic slots for Warlocks
 *
 * @param warlockLevel - Warlock level
 * @returns Pact magic slot information
 */
export function calculatePactMagicSlots(
  warlockLevel: number
): { slots: number; slotLevel: SpellLevel } | null {
  if (warlockLevel < 1) return null;
  const pactSlots = PACT_MAGIC_SLOTS[Math.min(20, warlockLevel)];
  return {
    slots: pactSlots.slots,
    slotLevel: pactSlots.slotLevel as SpellLevel,
  };
}

/**
 * Get the maximum spell level a caster can cast
 *
 * @param classLevel - Class level
 * @param casterType - Type of caster
 * @returns Highest spell level available (0 for cantrips only, null for non-casters)
 */
export function getMaxSpellLevel(classLevel: number, casterType: CasterType): SpellLevel | null {
  if (casterType === 'none') return null;

  if (casterType === 'pact') {
    const pactSlots = calculatePactMagicSlots(classLevel);
    return pactSlots?.slotLevel ?? null;
  }

  const effectiveLevel = calculateEffectiveCasterLevel(classLevel, casterType);
  const slots = FULL_CASTER_SLOTS[Math.min(20, effectiveLevel)];

  // Find highest level with slots
  for (let i = 9; i >= 1; i--) {
    if (slots[i] > 0) return i as SpellLevel;
  }

  return 0; // Only cantrips
}

// ============================================================================
// Spell Preparation and Known Spells
// ============================================================================

export interface SpellPreparationLimits {
  maxPrepared: number;
  abilityModifier: number;
  classLevel: number;
  cantripsKnown: number;
}

/**
 * Calculate maximum number of prepared spells
 * Formula: Class level + spellcasting ability modifier (minimum 1)
 *
 * @param classLevel - Class level (for Paladin, character level / 2 rounded down)
 * @param abilityScore - Spellcasting ability score
 * @returns Maximum number of spells that can be prepared
 */
export function calculateMaxPreparedSpells(classLevel: number, abilityScore: number): number {
  const abilityModifier = calculateModifier(abilityScore);
  return Math.max(1, classLevel + abilityModifier);
}

/**
 * Get cantrips known by level for each class
 */
export const CANTRIPS_KNOWN: Record<string, number[]> = {
  bard: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  cleric: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druid: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  sorcerer: [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  warlock: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  wizard: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
};

/**
 * Get spells known by level for classes with limited known spells
 */
export const SPELLS_KNOWN: Record<string, number[]> = {
  bard: [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  ranger: [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  // Warlock is special - they have limited spell slots, not known spells
  warlock: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15],
};

/**
 * Calculate spell preparation limits for a class
 *
 * @param classKey - Class identifier
 * @param classLevel - Class level
 * @param abilityScore - Spellcasting ability score
 * @returns Preparation limits
 */
export function calculateSpellPreparationLimits(
  classKey: string,
  classLevel: number,
  abilityScore: number
): SpellPreparationLimits | null {
  const lowerKey = classKey.toLowerCase();

  if (!isPreparationCaster(lowerKey)) {
    return null;
  }

  // Paladin uses half their level for preparation
  const effectiveLevel = lowerKey === 'paladin' ? Math.floor(classLevel / 2) : classLevel;

  return {
    maxPrepared: calculateMaxPreparedSpells(effectiveLevel, abilityScore),
    abilityModifier: calculateModifier(abilityScore),
    classLevel: effectiveLevel,
    cantripsKnown: CANTRIPS_KNOWN[lowerKey]?.[classLevel] ?? 0,
  };
}

/**
 * Calculate spells known limit for classes with limited known spells
 *
 * @param classKey - Class identifier
 * @param classLevel - Class level
 * @returns Maximum spells known (null for preparation casters)
 */
export function calculateSpellsKnownLimit(
  classKey: string,
  classLevel: number
): { spellsKnown: number; cantripsKnown: number } | null {
  const lowerKey = classKey.toLowerCase();

  if (!isKnownSpellCaster(lowerKey)) {
    return null;
  }

  const cantrips = CANTRIPS_KNOWN[lowerKey]?.[classLevel] ?? 0;

  // Warlock doesn't have "spells known" in the traditional sense
  // They have their patron spells + chosen spells
  if (lowerKey === 'warlock') {
    return {
      spellsKnown: SPELLS_KNOWN[lowerKey]?.[classLevel] ?? 0,
      cantripsKnown: cantrips,
    };
  }

  return {
    spellsKnown: SPELLS_KNOWN[lowerKey]?.[classLevel] ?? 0,
    cantripsKnown: cantrips,
  };
}

// ============================================================================
// Ritual Casting
// ============================================================================

/**
 * Check if a class can cast spells as rituals
 *
 * @param classKey - Class identifier
 * @returns Whether the class has ritual casting
 */
export function canCastRituals(classKey: string): boolean {
  const ritualClasses = ['bard', 'cleric', 'druid', 'wizard'];
  return ritualClasses.includes(classKey.toLowerCase());
}

/**
 * Check if a spell can be cast as a ritual by a class
 * Note: This is a simplified check; actual spell data would be needed
 *
 * @param classKey - Class identifier
 * @returns Whether the class can ritual cast
 */
export function isRitualCaster(classKey: string): boolean {
  return canCastRituals(classKey);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format spell slot information for display
 *
 * @param slots - Spell slot counts
 * @returns Formatted string
 */
export function formatSpellSlots(slots: SpellSlotCount[]): string {
  const available = slots.filter((s) => s.level > 0 && s.max > 0);
  if (available.length === 0) return 'No spell slots';

  return available.map((s) => `${s.max - s.used}/${s.max} level ${s.level}`).join(', ');
}

/**
 * Get total spell slots across all levels
 *
 * @param slots - Spell slot counts
 * @returns Total number of spell slots
 */
export function getTotalSpellSlots(slots: SpellSlotCount[]): number {
  return slots.reduce((sum, s) => sum + s.max, 0);
}

/**
 * Get remaining spell slots across all levels
 *
 * @param slots - Spell slot counts
 * @returns Number of unused spell slots
 */
export function getRemainingSpellSlots(slots: SpellSlotCount[]): number {
  return slots.reduce((sum, s) => sum + (s.max - s.used), 0);
}

/**
 * Use a spell slot
 *
 * @param slots - Current spell slots
 * @param level - Spell level to use
 * @returns Updated spell slots (or null if no slot available)
 */
export function useSpellSlot(slots: SpellSlotCount[], level: SpellLevel): SpellSlotCount[] | null {
  const slot = slots.find((s) => s.level === level);
  if (!slot || slot.used >= slot.max) return null;

  return slots.map((s) => (s.level === level ? { ...s, used: s.used + 1 } : s));
}

/**
 * Restore all spell slots (e.g., after a long rest)
 *
 * @param slots - Current spell slots
 * @returns Reset spell slots
 */
export function restoreAllSpellSlots(slots: SpellSlotCount[]): SpellSlotCount[] {
  return slots.map((s) => ({ ...s, used: 0 }));
}

/**
 * Check if a character can cast a spell of a given level
 *
 * @param spellLevel - Spell level to check
 * @param classLevel - Character/Class level
 * @param casterType - Type of caster
 * @returns Whether the spell can be cast
 */
export function canCastSpellLevel(
  spellLevel: SpellLevel,
  classLevel: number,
  casterType: CasterType
): boolean {
  if (spellLevel === 0) return true; // Cantrips
  if (casterType === 'none') return false;

  const maxLevel = getMaxSpellLevel(classLevel, casterType);
  return maxLevel !== null && spellLevel <= maxLevel;
}
