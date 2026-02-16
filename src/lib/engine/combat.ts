/**
 * Combat Statistics - D&D 5e
 *
 * Functions for calculating AC, HP, initiative, speed, and attack bonuses.
 */

import { type AbilityScore, type DieType, CLASS_HIT_DICE } from '@/types/game';
import { calculateModifier } from './ability-scores';
import { calculateProficiencyBonus } from './proficiency';

// ============================================================================
// Armor Class
// ============================================================================

export type ArmorType = 'unarmored' | 'light' | 'medium' | 'heavy';

export interface ArmorCalculation {
  base: number;
  dexModifier: number;
  shieldBonus: number;
  magicBonus: number;
  featureBonus: number;
  total: number;
}

/**
 * Calculate Armor Class
 *
 * @param armorType - Type of armor worn
 * @param armorBase - Base AC from armor (or 10 for unarmored)
 * @param dexScore - Dexterity score
 * @param hasShield - Whether character has a shield equipped
 * @param magicBonus - Magical AC bonus
 * @param featureBonus - AC bonus from class features
 * @returns Complete AC breakdown
 */
export function calculateAC(
  armorType: ArmorType,
  armorBase: number,
  dexScore: number,
  hasShield: boolean,
  magicBonus: number = 0,
  featureBonus: number = 0
): ArmorCalculation {
  const dexMod = calculateModifier(dexScore);
  let effectiveDexMod = dexMod;

  // Apply DEX modifier limits based on armor type
  if (armorType === 'medium') {
    effectiveDexMod = Math.min(dexMod, 2);
  } else if (armorType === 'heavy') {
    effectiveDexMod = 0;
  }

  // If unarmored, base is 10 + DEX
  const baseAC = armorType === 'unarmored' ? 10 : armorBase;
  const dexContribution = armorType === 'unarmored' ? dexMod : effectiveDexMod;
  const shieldBonus = hasShield ? 2 : 0;

  return {
    base: baseAC,
    dexModifier: dexContribution,
    shieldBonus,
    magicBonus,
    featureBonus,
    total: baseAC + dexContribution + shieldBonus + magicBonus + featureBonus,
  };
}

/**
 * Calculate Unarmored Defense (Barbarian or Monk feature)
 *
 * Barbarian: 10 + DEX mod + CON mod
 * Monk: 10 + DEX mod + WIS mod
 *
 * @param dexScore - Dexterity score
 * @param secondaryScore - Constitution (Barbarian) or Wisdom (Monk)
 * @returns Total unarmored defense AC
 */
export function calculateUnarmoredDefense(dexScore: number, secondaryScore: number): number {
  const dexMod = calculateModifier(dexScore);
  const secondaryMod = calculateModifier(secondaryScore);
  return 10 + dexMod + secondaryMod;
}

// ============================================================================
// Hit Points
// ============================================================================

export interface HPLevelCalculation {
  level: number;
  classKey: string;
  hitDieValue: number;
  roll: number;
  conModifier: number;
  total: number;
}

export interface MaxHPCalculation {
  levels: HPLevelCalculation[];
  maxHp: number;
  conModifierTotal: number;
  featureBonus: number;
}

/**
 * Get the maximum value of a hit die
 */
function getHitDieMax(dieType: DieType): number {
  return parseInt(dieType.replace('d', ''), 10);
}

/**
 * Get the average roll for a hit die (rounded up)
 */
function getHitDieAverage(dieType: DieType): number {
  return Math.ceil(getHitDieMax(dieType) / 2) + 1;
}

/**
 * Calculate HP for a single level
 *
 * @param level - Character level (1-20)
 * @param classKey - Class identifier
 * @param hitDie - Hit die type for the class
 * @param conScore - Constitution score
 * @param rollResult - Roll result (for level > 1), or null for fixed
 * @param useFixed - Whether to use fixed/average HP
 * @returns HP calculation for this level
 */
export function calculateLevelHP(
  level: number,
  classKey: string,
  hitDie: DieType,
  conScore: number,
  rollResult?: number,
  useFixed: boolean = true
): HPLevelCalculation {
  const conModifier = calculateModifier(conScore);
  const hitDieMax = getHitDieMax(hitDie);

  let roll: number;
  if (level === 1) {
    // First level always uses max hit die
    roll = hitDieMax;
  } else if (useFixed) {
    // Fixed/average HP
    roll = getHitDieAverage(hitDie);
  } else if (rollResult !== undefined && rollResult >= 1 && rollResult <= hitDieMax) {
    // Manual roll
    roll = rollResult;
  } else {
    throw new Error(`Invalid roll for ${hitDie}: ${rollResult}. Must be 1-${hitDieMax}`);
  }

  return {
    level,
    classKey,
    hitDieValue: hitDieMax,
    roll,
    conModifier,
    total: roll + conModifier,
  };
}

/**
 * Calculate maximum HP for a character
 *
 * @param levels - Array of level data [{ level: 1, classKey: 'fighter', conScore: 16, roll: 10 }, ...]
 * @param featureBonus - Additional HP from features (Tough feat, Draconic Sorcerer, etc.)
 * @returns Complete HP calculation
 */
export function calculateMaxHP(
  levels: Array<{
    level: number;
    classKey: string;
    conScore: number;
    roll?: number;
    useFixed?: boolean;
  }>,
  featureBonus: number = 0
): MaxHPCalculation {
  const levelCalculations: HPLevelCalculation[] = [];
  let totalHP = 0;
  let totalConMod = 0;

  for (const levelData of levels) {
    const hitDie = CLASS_HIT_DICE[levelData.classKey.toLowerCase()] ?? 'd8';
    const calc = calculateLevelHP(
      levelData.level,
      levelData.classKey,
      hitDie,
      levelData.conScore,
      levelData.roll,
      levelData.useFixed ?? true
    );

    levelCalculations.push(calc);
    totalHP += calc.total;
    totalConMod += calc.conModifier;
  }

  // Add feature bonuses (applied once per level)
  const featureBonusTotal = featureBonus * levels.length;

  return {
    levels: levelCalculations,
    maxHp: totalHP + featureBonusTotal,
    conModifierTotal: totalConMod,
    featureBonus: featureBonusTotal,
  };
}

/**
 * Calculate HP increase when leveling up
 *
 * @param classKey - Class gaining the level
 * @param conScore - Constitution score
 * @param rollResult - Roll result (if not using fixed)
 * @param useFixed - Whether to use fixed HP
 * @param featureBonus - HP bonus per level from features
 * @returns HP increase for this level
 */
export function calculateLevelUpHP(
  classKey: string,
  conScore: number,
  rollResult?: number,
  useFixed: boolean = true,
  featureBonus: number = 0
): number {
  const hitDie = CLASS_HIT_DICE[classKey.toLowerCase()] ?? 'd8';
  const calc = calculateLevelHP(2, classKey, hitDie, conScore, rollResult, useFixed);
  return calc.total + featureBonus;
}

// ============================================================================
// Initiative
// ============================================================================

export interface InitiativeCalculation {
  dexModifier: number;
  featureBonus: number;
  total: number;
}

/**
 * Calculate initiative modifier
 *
 * @param dexScore - Dexterity score
 * @param featureBonus - Additional initiative bonus (from features like Alert feat)
 * @returns Initiative modifier
 */
export function calculateInitiative(
  dexScore: number,
  featureBonus: number = 0
): InitiativeCalculation {
  const dexModifier = calculateModifier(dexScore);

  return {
    dexModifier,
    featureBonus,
    total: dexModifier + featureBonus,
  };
}

// ============================================================================
// Speed
// ============================================================================

export type MovementType = 'walk' | 'fly' | 'swim' | 'climb' | 'burrow';

export interface SpeedCalculation {
  base: number;
  modifiers: number;
  total: number;
}

export interface MovementSpeeds {
  walk: SpeedCalculation;
  fly?: SpeedCalculation;
  swim?: SpeedCalculation;
  climb?: SpeedCalculation;
  burrow?: SpeedCalculation;
}

/**
 * Calculate movement speed
 *
 * @param baseSpeed - Base speed from species
 * @param modifiers - Speed modifiers (positive or negative)
 * @returns Speed calculation
 */
export function calculateSpeed(baseSpeed: number, modifiers: number = 0): SpeedCalculation {
  return {
    base: baseSpeed,
    modifiers,
    total: Math.max(0, baseSpeed + modifiers),
  };
}

/**
 * Calculate all movement speeds
 *
 * @param baseWalk - Base walking speed
 * @param speeds - Object with optional other movement types and their base speeds
 * @param modifiers - Global speed modifiers
 * @returns All movement speed calculations
 */
export function calculateAllSpeeds(
  baseWalk: number,
  speeds: Partial<Record<MovementType, number>> = {},
  modifiers: number = 0
): MovementSpeeds {
  const result: MovementSpeeds = {
    walk: calculateSpeed(baseWalk, modifiers),
  };

  if (speeds.fly !== undefined) {
    result.fly = calculateSpeed(speeds.fly, modifiers);
  }
  if (speeds.swim !== undefined) {
    result.swim = calculateSpeed(speeds.swim, modifiers);
  }
  if (speeds.climb !== undefined) {
    result.climb = calculateSpeed(speeds.climb, modifiers);
  }
  if (speeds.burrow !== undefined) {
    result.burrow = calculateSpeed(speeds.burrow, modifiers);
  }

  return result;
}

// ============================================================================
// Attack Bonuses and Damage
// ============================================================================

export type AttackType = 'melee' | 'ranged';

export interface AttackCalculation {
  abilityModifier: number;
  proficiencyBonus: number;
  magicBonus: number;
  total: number;
  damage: DamageCalculation;
}

export interface DamageCalculation {
  dice: string;
  abilityModifier: number;
  magicBonus: number;
  versatile?: string;
}

/**
 * Determine which ability modifier to use for an attack
 *
 * @param attackType - Melee or ranged
 * @param isFinesse - Whether weapon has finesse property
 * @param strScore - Strength score
 * @param dexScore - Dexterity score
 * @returns The ability score to use and its modifier
 */
export function getAttackAbilityModifier(
  attackType: AttackType,
  isFinesse: boolean,
  strScore: number,
  dexScore: number
): { ability: AbilityScore; modifier: number } {
  if (attackType === 'ranged') {
    // Ranged attacks always use DEX
    return { ability: 'DEX', modifier: calculateModifier(dexScore) };
  }

  // Melee attacks
  if (isFinesse) {
    // Finesse weapons use STR or DEX, whichever is higher
    const strMod = calculateModifier(strScore);
    const dexMod = calculateModifier(dexScore);
    if (dexMod > strMod) {
      return { ability: 'DEX', modifier: dexMod };
    }
    return { ability: 'STR', modifier: strMod };
  }

  // Standard melee uses STR
  return { ability: 'STR', modifier: calculateModifier(strScore) };
}

/**
 * Calculate attack bonus
 *
 * @param attackType - Melee or ranged
 * @param isFinesse - Whether weapon has finesse property
 * @param isProficient - Whether character is proficient with the weapon
 * @param strScore - Strength score
 * @param dexScore - Dexterity score
 * @param characterLevel - Character level
 * @param magicBonus - Magical weapon bonus
 * @returns Complete attack calculation
 */
export function calculateAttackBonus(
  attackType: AttackType,
  isFinesse: boolean,
  isProficient: boolean,
  strScore: number,
  dexScore: number,
  characterLevel: number,
  magicBonus: number = 0
): AttackCalculation {
  const { modifier: abilityModifier } = getAttackAbilityModifier(
    attackType,
    isFinesse,
    strScore,
    dexScore
  );

  const proficiencyBonus = isProficient ? calculateProficiencyBonus(characterLevel) : 0;

  return {
    abilityModifier,
    proficiencyBonus,
    magicBonus,
    total: abilityModifier + proficiencyBonus + magicBonus,
    damage: {
      dice: '1d8', // Default, should be overridden
      abilityModifier,
      magicBonus,
    },
  };
}

/**
 * Calculate damage for a weapon attack
 *
 * @param baseDamage - Base damage dice (e.g., '1d8')
 * @param attackType - Melee or ranged
 * @param isFinesse - Whether weapon has finesse property
 * @param strScore - Strength score
 * @param dexScore - Dexterity score
 * @param magicBonus - Magical weapon bonus
 * @param isVersatile - Whether weapon is versatile
 * @param isTwoHanded - Whether weapon is being wielded two-handed
 * @returns Complete damage calculation
 */
export function calculateWeaponDamage(
  baseDamage: string,
  attackType: AttackType,
  isFinesse: boolean,
  strScore: number,
  dexScore: number,
  magicBonus: number = 0,
  isVersatile: boolean = false,
  isTwoHanded: boolean = false
): DamageCalculation {
  const { modifier: abilityModifier } = getAttackAbilityModifier(
    attackType,
    isFinesse,
    strScore,
    dexScore
  );

  const damage: DamageCalculation = {
    dice: baseDamage,
    abilityModifier,
    magicBonus,
  };

  // Handle versatile weapons (e.g., Longsword: 1d8 one-handed, 1d10 two-handed)
  if (isVersatile && isTwoHanded) {
    // Convert to higher die: d8 -> d10, d6 -> d8, d10 -> d12
    const versatileDice = baseDamage.replace(/d(\d+)/, (_, num) => {
      const current = parseInt(num, 10);
      const next = current + 2;
      return `d${next > 12 ? 12 : next}`;
    });
    damage.versatile = versatileDice;
    damage.dice = versatileDice;
  }

  return damage;
}

/**
 * Format damage string for display
 *
 * @param damage - Damage calculation
 * @returns Formatted string (e.g., "1d8 + 5" or "1d8 - 1")
 */
export function formatDamage(damage: DamageCalculation): string {
  const totalMod = damage.abilityModifier + damage.magicBonus;
  if (totalMod === 0) return damage.dice;
  if (totalMod > 0) return `${damage.dice} + ${totalMod}`;
  return `${damage.dice} - ${Math.abs(totalMod)}`;
}

// ============================================================================
// Death Saves
// ============================================================================

export interface DeathSaveResult {
  roll: number;
  successes: number;
  failures: number;
  isStable: boolean;
  isDead: boolean;
  revived: boolean;
}

/**
 * Process a death saving throw
 *
 * @param roll - d20 roll result
 * @param currentSuccesses - Current success count (0-3)
 * @param currentFailures - Current failure count (0-3)
 * @returns Death save result
 */
export function processDeathSave(
  roll: number,
  currentSuccesses: number = 0,
  currentFailures: number = 0
): DeathSaveResult {
  let successes = currentSuccesses;
  let failures = currentFailures;
  let revived = false;

  if (roll === 20) {
    // Natural 20: Regain 1 HP
    revived = true;
  } else if (roll === 1) {
    // Natural 1: Two failures
    failures += 2;
  } else if (roll >= 10) {
    // 10+: Success
    successes += 1;
  } else {
    // 9-: Failure
    failures += 1;
  }

  return {
    roll,
    successes: Math.min(3, successes),
    failures: Math.min(3, failures),
    isStable: successes >= 3,
    isDead: failures >= 3,
    revived,
  };
}

// ============================================================================
// Hit Dice
// ============================================================================

export interface HitDicePool {
  [dieType: string]: {
    total: number;
    remaining: number;
  };
}

/**
 * Calculate total hit dice pool from class levels
 *
 * @param classLevels - Array of { classKey, level }
 * @returns Hit dice pool by type
 */
export function calculateHitDicePool(
  classLevels: Array<{ classKey: string; level: number }>
): HitDicePool {
  const pool: HitDicePool = {};

  for (const { classKey, level } of classLevels) {
    const dieType = CLASS_HIT_DICE[classKey.toLowerCase()] ?? 'd8';
    if (!pool[dieType]) {
      pool[dieType] = { total: 0, remaining: 0 };
    }
    pool[dieType].total += level;
    pool[dieType].remaining += level;
  }

  return pool;
}

/**
 * Calculate HP recovered from spending a hit die
 *
 * @param dieType - Hit die type (e.g., 'd10')
 * @param rollResult - Roll result
 * @param conScore - Constitution score
 * @returns HP recovered
 */
export function calculateHitDieHeal(
  dieType: DieType,
  rollResult: number,
  conScore: number
): number {
  const max = getHitDieMax(dieType);
  if (rollResult < 1 || rollResult > max) {
    throw new Error(`Invalid roll for ${dieType}: ${rollResult}`);
  }
  return rollResult + calculateModifier(conScore);
}

/**
 * Recover hit dice on a long rest
 * Rule: Recover half of total (rounded up), minimum 1
 *
 * @param currentRemaining - Current remaining dice
 * @param total - Total dice for this type
 * @returns New remaining amount
 */
export function recoverHitDice(currentRemaining: number, total: number): number {
  const recovered = Math.max(1, Math.ceil(total / 2));
  return Math.min(total, currentRemaining + recovered);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Roll a hit die
 *
 * @param dieType - Die type (e.g., 'd8')
 * @returns Random roll (1 to max)
 */
export function rollHitDie(dieType: DieType): number {
  const max = getHitDieMax(dieType);
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Roll initiative
 *
 * @param initiativeModifier - Initiative modifier
 * @returns Initiative roll result
 */
export function rollInitiative(initiativeModifier: number): number {
  return Math.floor(Math.random() * 20) + 1 + initiativeModifier;
}

/**
 * Format a combat stat for display
 *
 * @param value - Numeric value
 * @param includeSign - Whether to include + sign for positive values
 * @returns Formatted string
 */
export function formatCombatValue(value: number, includeSign: boolean = true): string {
  if (!includeSign) return value.toString();
  return value >= 0 ? `+${value}` : `${value}`;
}
