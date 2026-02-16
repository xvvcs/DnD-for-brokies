/**
 * Proficiency System - D&D 5e
 *
 * Functions for calculating proficiency bonuses, skill modifiers,
 * saving throws, and passive perception following D&D 5e rules.
 */

import { ABILITY_SCORES, type AbilityScore, SKILLS, type ProficiencyLevel } from '@/types/game';
import { calculateModifier } from './ability-scores';

// ============================================================================
// Proficiency Bonus Calculation
// ============================================================================

/**
 * Calculate proficiency bonus based on character level
 * Formula: floor((level - 1) / 4) + 2
 *
 * @param level - Total character level (1-20)
 * @returns Proficiency bonus (2-6)
 */
export function calculateProficiencyBonus(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Level must be 1-20, got ${level}`);
  }
  return Math.floor((level - 1) / 4) + 2;
}

/**
 * Calculate total level from multiple classes (multiclassing)
 *
 * @param classLevels - Array of class levels
 * @returns Total character level
 */
export function calculateTotalLevel(classLevels: number[]): number {
  return classLevels.reduce((sum, level) => sum + level, 0);
}

/**
 * Get proficiency bonus for a multiclassed character
 *
 * @param classLevels - Array of class levels
 * @returns Proficiency bonus based on total level
 */
export function getMulticlassProficiencyBonus(classLevels: number[]): number {
  return calculateProficiencyBonus(calculateTotalLevel(classLevels));
}

// ============================================================================
// Proficiency Level Multipliers
// ============================================================================

/**
 * Get the multiplier for each proficiency level
 * - none: 0
 * - half: 0.5 (Jack of All Trades)
 * - proficient: 1
 * - expertise: 2
 */
const PROFICIENCY_MULTIPLIERS: Record<ProficiencyLevel, number> = {
  none: 0,
  half: 0.5,
  proficient: 1,
  expertise: 2,
};

/**
 * Calculate bonus from proficiency level
 *
 * @param proficiencyLevel - Level of proficiency
 * @param proficiencyBonus - Character's proficiency bonus
 * @returns The bonus to add
 */
export function calculateProficiencyLevelBonus(
  proficiencyLevel: ProficiencyLevel,
  proficiencyBonus: number
): number {
  return Math.floor(PROFICIENCY_MULTIPLIERS[proficiencyLevel] * proficiencyBonus);
}

// ============================================================================
// Skill Modifiers
// ============================================================================

export interface SkillModifier {
  skillKey: string;
  abilityModifier: number;
  proficiencyBonus: number;
  total: number;
  proficiencyLevel: ProficiencyLevel;
}

/**
 * Calculate a single skill modifier
 *
 * @param skillKey - The skill identifier (e.g., 'perception', 'athletics')
 * @param abilityScores - Record of ability scores
 * @param proficiencyLevel - Level of proficiency in this skill
 * @param characterLevel - Total character level
 * @returns Complete skill modifier breakdown
 */
export function calculateSkillModifier(
  skillKey: string,
  abilityScores: Record<AbilityScore, number>,
  proficiencyLevel: ProficiencyLevel,
  characterLevel: number
): SkillModifier {
  const skill = SKILLS.find((s) => s.key === skillKey);
  if (!skill) {
    throw new Error(`Unknown skill: ${skillKey}`);
  }

  const abilityModifier = calculateModifier(abilityScores[skill.ability]);
  const proficiencyBonus = calculateProficiencyBonus(characterLevel);
  const bonus = calculateProficiencyLevelBonus(proficiencyLevel, proficiencyBonus);

  return {
    skillKey,
    abilityModifier,
    proficiencyBonus: bonus,
    total: abilityModifier + bonus,
    proficiencyLevel,
  };
}

/**
 * Calculate all skill modifiers for a character
 *
 * @param abilityScores - Record of ability scores
 * @param skillProficiencies - Map of skill keys to proficiency levels
 * @param characterLevel - Total character level
 * @returns Record of all skill modifiers
 */
export function calculateAllSkillModifiers(
  abilityScores: Record<AbilityScore, number>,
  skillProficiencies: Record<string, ProficiencyLevel>,
  characterLevel: number
): Record<string, SkillModifier> {
  const result: Record<string, SkillModifier> = {};

  for (const skill of SKILLS) {
    result[skill.key] = calculateSkillModifier(
      skill.key,
      abilityScores,
      skillProficiencies[skill.key] ?? 'none',
      characterLevel
    );
  }

  return result;
}

// ============================================================================
// Saving Throw Modifiers
// ============================================================================

export interface SavingThrowModifier {
  ability: AbilityScore;
  abilityModifier: number;
  proficiencyBonus: number;
  total: number;
  isProficient: boolean;
}

/**
 * Calculate a single saving throw modifier
 *
 * @param ability - The ability score (STR, DEX, etc.)
 * @param abilityScore - The ability score value
 * @param isProficient - Whether the character is proficient in this save
 * @param characterLevel - Total character level
 * @returns Complete saving throw modifier breakdown
 */
export function calculateSavingThrowModifier(
  ability: AbilityScore,
  abilityScore: number,
  isProficient: boolean,
  characterLevel: number
): SavingThrowModifier {
  const abilityModifier = calculateModifier(abilityScore);
  const proficiencyBonus = isProficient ? calculateProficiencyBonus(characterLevel) : 0;

  return {
    ability,
    abilityModifier,
    proficiencyBonus,
    total: abilityModifier + proficiencyBonus,
    isProficient,
  };
}

/**
 * Calculate all saving throw modifiers for a character
 *
 * @param abilityScores - Record of ability scores
 * @param proficientSaves - Array of abilities the character is proficient in
 * @param characterLevel - Total character level
 * @returns Record of all saving throw modifiers
 */
export function calculateAllSavingThrowModifiers(
  abilityScores: Record<AbilityScore, number>,
  proficientSaves: AbilityScore[],
  characterLevel: number
): Record<AbilityScore, SavingThrowModifier> {
  const result = {} as Record<AbilityScore, SavingThrowModifier>;
  const proficientSet = new Set(proficientSaves);

  for (const ability of ABILITY_SCORES) {
    result[ability] = calculateSavingThrowModifier(
      ability,
      abilityScores[ability],
      proficientSet.has(ability),
      characterLevel
    );
  }

  return result;
}

// ============================================================================
// Passive Perception
// ============================================================================

export interface PassivePerception {
  base: number;
  wisdomModifier: number;
  proficiencyBonus: number;
  total: number;
  isProficient: boolean;
}

/**
 * Calculate Passive Perception
 * Formula: 10 + Wisdom modifier + (proficiency bonus if proficient in Perception)
 *
 * @param wisdomScore - Wisdom ability score
 * @param proficiencyLevel - Perception proficiency level
 * @param characterLevel - Total character level
 * @returns Complete passive perception breakdown
 */
export function calculatePassivePerception(
  wisdomScore: number,
  proficiencyLevel: ProficiencyLevel,
  characterLevel: number
): PassivePerception {
  const wisdomModifier = calculateModifier(wisdomScore);
  const proficiencyBonus = calculateProficiencyBonus(characterLevel);
  const bonus = calculateProficiencyLevelBonus(proficiencyLevel, proficiencyBonus);

  return {
    base: 10,
    wisdomModifier,
    proficiencyBonus: bonus,
    total: 10 + wisdomModifier + bonus,
    isProficient: proficiencyLevel !== 'none',
  };
}

/**
 * Calculate Passive Perception from skill modifier directly
 * This is useful when you already have the skill modifier calculated
 *
 * @param perceptionSkillModifier - The total Perception skill modifier
 * @returns Passive perception score
 */
export function calculatePassivePerceptionFromModifier(perceptionSkillModifier: number): number {
  return 10 + perceptionSkillModifier;
}

// Re-export formatModifier from ability-scores for convenience
export { formatModifier } from './ability-scores';

/**
 * Get the display name for a proficiency level
 *
 * @param level - The proficiency level
 * @returns Human-readable name
 */
export function getProficiencyLevelName(level: ProficiencyLevel): string {
  const names: Record<ProficiencyLevel, string> = {
    none: 'Not Proficient',
    half: 'Half Proficient',
    proficient: 'Proficient',
    expertise: 'Expertise',
  };
  return names[level];
}

/**
 * Check if a character has Jack of All Trades feature
 * (Bard level 2+, or other features that grant half proficiency)
 *
 * @param classLevels - Map of class names to levels
 * @returns Whether the character has Jack of All Trades
 */
export function hasJackOfAllTrades(classLevels: Record<string, number>): boolean {
  // Jack of All Trades is a Bard feature gained at level 2
  return (classLevels['bard'] ?? 0) >= 2;
}

/**
 * Get the default proficiency level for a skill
 * Considers Jack of All Trades for non-proficient skills
 *
 * @param skillKey - The skill identifier
 * @param skillProficiencies - Map of skill proficiencies
 * @param hasJackOfAllTrades - Whether character has Jack of All Trades
 * @returns The effective proficiency level
 */
export function getEffectiveProficiencyLevel(
  skillKey: string,
  skillProficiencies: Record<string, ProficiencyLevel>,
  hasJackOfAllTrades: boolean
): ProficiencyLevel {
  const level = skillProficiencies[skillKey] ?? 'none';
  if (level === 'none' && hasJackOfAllTrades) {
    return 'half';
  }
  return level;
}
