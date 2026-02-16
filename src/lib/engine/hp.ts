/**
 * HP Management - D&D 5e
 *
 * Functions for damage application, healing, temporary HP,
 * hit dice, and death save mechanics.
 */

import { calculateModifier } from './ability-scores';

// ============================================================================
// Types
// ============================================================================

export interface HPChangeResult {
  previousHp: number;
  previousTempHp: number;
  newHp: number;
  newTempHp: number;
  maxHp: number;
  damageTaken?: number;
  healingReceived?: number;
  overflow?: number;
  isDead: boolean;
  isDying: boolean;
  deathSaves?: DeathSaveState;
}

export interface DeathSaveState {
  successes: number;
  failures: number;
  isStable: boolean;
  isDead: boolean;
}

export interface HitDicePool {
  [dieType: string]: {
    total: number;
    remaining: number;
  };
}

// ============================================================================
// Damage Application
// ============================================================================

/**
 * Apply damage to a character
 * Rules: Temp HP absorbs damage first, remainder hits current HP
 *
 * @param currentHp - Current hit points
 * @param tempHp - Temporary hit points
 * @param maxHp - Maximum hit points
 * @param damage - Amount of damage to apply
 * @returns HP change result
 */
export function applyDamage(
  currentHp: number,
  tempHp: number,
  maxHp: number,
  damage: number
): HPChangeResult {
  if (damage < 0) {
    throw new Error('Damage cannot be negative');
  }

  const previousHp = currentHp;
  const previousTempHp = tempHp;

  // Temp HP absorbs damage first
  let remainingDamage = damage;
  let newTempHp = tempHp;

  if (tempHp > 0) {
    if (tempHp >= damage) {
      newTempHp = tempHp - damage;
      remainingDamage = 0;
    } else {
      remainingDamage = damage - tempHp;
      newTempHp = 0;
    }
  }

  // Apply remaining damage to current HP
  const newHp = Math.max(0, currentHp - remainingDamage);

  return {
    previousHp,
    previousTempHp,
    newHp,
    newTempHp,
    maxHp,
    damageTaken: damage,
    overflow: remainingDamage > currentHp ? remainingDamage - currentHp : undefined,
    isDead: false, // Death requires death save failures
    isDying: newHp === 0,
  };
}

/**
 * Apply damage with death save tracking
 * Use this when the character is at 0 HP or when damage brings them to 0
 *
 * @param currentHp - Current hit points
 * @param tempHp - Temporary hit points
 * @param maxHp - Maximum hit points
 * @param damage - Amount of damage
 * @param deathSaves - Current death save state (if already dying)
 * @returns HP change result with death save info
 */
export function applyDamageWithDeathSaves(
  currentHp: number,
  tempHp: number,
  maxHp: number,
  damage: number,
  deathSaves?: DeathSaveState
): HPChangeResult {
  const result = applyDamage(currentHp, tempHp, maxHp, damage);

  // If damage brings HP to 0 and wasn't already at 0
  if (result.newHp === 0 && currentHp > 0) {
    result.isDying = true;
  }

  // If already at 0 HP, damage causes death save failures
  if (currentHp === 0 && deathSaves) {
    const newDeathSaves = { ...deathSaves };
    // Taking damage while at 0 HP causes 1 death save failure
    // If the damage equals or exceeds max HP, instant death (but we'll just add 2 failures)
    if (damage >= maxHp) {
      newDeathSaves.failures = Math.min(3, newDeathSaves.failures + 2);
    } else {
      newDeathSaves.failures = Math.min(3, newDeathSaves.failures + 1);
    }
    newDeathSaves.isDead = newDeathSaves.failures >= 3;
    result.deathSaves = newDeathSaves;
    result.isDead = newDeathSaves.isDead;
  }

  return result;
}

// ============================================================================
// Healing
// ============================================================================

/**
 * Apply healing to a character
 * Rules: Healing capped at max HP, resets death saves if brought above 0
 *
 * @param currentHp - Current hit points
 * @param tempHp - Temporary hit points (unchanged by healing)
 * @param maxHp - Maximum hit points
 * @param healing - Amount of healing to apply
 * @param deathSaves - Current death save state (if dying)
 * @returns HP change result
 */
export function applyHealing(
  currentHp: number,
  tempHp: number,
  maxHp: number,
  healing: number,
  deathSaves?: DeathSaveState
): HPChangeResult {
  if (healing < 0) {
    throw new Error('Healing cannot be negative');
  }

  const previousHp = currentHp;
  const newHp = Math.min(maxHp, currentHp + healing);
  const overflow = currentHp + healing > maxHp ? currentHp + healing - maxHp : undefined;

  // Reset death saves if healing brings HP above 0
  const resetDeathSaves = currentHp === 0 && newHp > 0;

  return {
    previousHp,
    previousTempHp: tempHp,
    newHp,
    newTempHp: tempHp,
    maxHp,
    healingReceived: healing,
    overflow,
    isDead: false,
    isDying: newHp === 0,
    deathSaves: resetDeathSaves
      ? { successes: 0, failures: 0, isStable: false, isDead: false }
      : deathSaves,
  };
}

// ============================================================================
// Temporary HP
// ============================================================================

/**
 * Apply temporary HP
 * Rules: Temp HP doesn't stack - take the higher value
 *
 * @param currentTempHp - Current temporary hit points
 * @param newTempHp - New temporary hit points to apply
 * @returns The resulting temporary HP (higher of the two)
 */
export function applyTempHP(currentTempHp: number, newTempHp: number): number {
  return Math.max(currentTempHp, newTempHp);
}

/**
 * Set temporary HP (forcing a specific value)
 * Use this when an effect specifically sets temp HP to a value
 *
 * @param value - Temporary HP value
 * @returns The value (for consistency with applyTempHP)
 */
export function setTempHP(value: number): number {
  return Math.max(0, value);
}

/**
 * Remove all temporary HP
 * @returns 0
 */
export function clearTempHP(): number {
  return 0;
}

// ============================================================================
// Hit Dice
// ============================================================================

/**
 * Get the maximum value of a hit die
 */
function getHitDieMax(dieType: string): number {
  return parseInt(dieType.replace('d', ''), 10);
}

/**
 * Calculate HP healed from spending a hit die
 *
 * @param dieType - Hit die type (e.g., 'd10')
 * @param rollResult - Die roll result
 * @param conScore - Constitution score
 * @returns HP recovered
 */
export function calculateHitDieHeal(dieType: string, rollResult: number, conScore: number): number {
  const max = getHitDieMax(dieType);
  if (rollResult < 1 || rollResult > max) {
    throw new Error(`Invalid roll for ${dieType}: ${rollResult}`);
  }
  const conMod = calculateModifier(conScore);
  return Math.max(1, rollResult + conMod); // Minimum 1 HP healed
}

/**
 * Spend a hit die from the pool
 *
 * @param pool - Hit dice pool
 * @param dieType - Type of hit die to spend
 * @returns Updated pool or null if no dice available
 */
export function spendHitDie(pool: HitDicePool, dieType: string): HitDicePool | null {
  const dice = pool[dieType];
  if (!dice || dice.remaining <= 0) {
    return null;
  }

  return {
    ...pool,
    [dieType]: {
      ...dice,
      remaining: dice.remaining - 1,
    },
  };
}

/**
 * Recover hit dice on a long rest
 * Rule: Recover half of total (rounded up), minimum 1
 *
 * @param pool - Hit dice pool
 * @returns Updated pool with recovered dice
 */
export function recoverHitDiceOnLongRest(pool: HitDicePool): HitDicePool {
  const newPool: HitDicePool = {};

  for (const [dieType, dice] of Object.entries(pool)) {
    const recovered = Math.max(1, Math.ceil(dice.total / 2));
    newPool[dieType] = {
      total: dice.total,
      remaining: Math.min(dice.total, dice.remaining + recovered),
    };
  }

  return newPool;
}

/**
 * Reset all hit dice (full recovery)
 *
 * @param pool - Hit dice pool
 * @returns Pool with all dice recovered
 */
export function resetAllHitDice(pool: HitDicePool): HitDicePool {
  const newPool: HitDicePool = {};

  for (const [dieType, dice] of Object.entries(pool)) {
    newPool[dieType] = {
      total: dice.total,
      remaining: dice.total,
    };
  }

  return newPool;
}

// ============================================================================
// Death Saves
// ============================================================================

/**
 * Process a death saving throw roll
 *
 * @param roll - d20 roll result
 * @param currentSuccesses - Current success count (0-3)
 * @param currentFailures - Current failure count (0-3)
 * @returns Updated death save state
 */
export function rollDeathSave(
  roll: number,
  currentSuccesses: number = 0,
  currentFailures: number = 0
): DeathSaveState {
  let successes = currentSuccesses;
  let failures = currentFailures;

  if (roll === 20) {
    // Natural 20: Immediate stabilization (handled by caller)
    successes = 3;
  } else if (roll === 1) {
    // Natural 1: Two failures
    failures = Math.min(3, failures + 2);
  } else if (roll >= 10) {
    // 10+: Success
    successes = Math.min(3, successes + 1);
  } else {
    // 9 or less: Failure
    failures = Math.min(3, failures + 1);
  }

  return {
    successes,
    failures,
    isStable: successes >= 3,
    isDead: failures >= 3,
  };
}

/**
 * Reset death saves (e.g., after healing or stabilization)
 * @returns Reset death save state
 */
export function resetDeathSaves(): DeathSaveState {
  return {
    successes: 0,
    failures: 0,
    isStable: false,
    isDead: false,
  };
}

/**
 * Stabilize a dying character (no healing, just stops dying)
 * @returns Stabilized death save state
 */
export function stabilize(): DeathSaveState {
  return {
    successes: 0,
    failures: 0,
    isStable: true,
    isDead: false,
  };
}

// ============================================================================
// HP Status Helpers
// ============================================================================

/**
 * Get HP status description
 *
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @returns Status description
 */
export function getHPStatus(currentHp: number, maxHp: number): string {
  if (currentHp <= 0) return 'Unconscious';
  if (currentHp <= maxHp * 0.25) return 'Critical';
  if (currentHp <= maxHp * 0.5) return 'Bloodied';
  if (currentHp <= maxHp * 0.75) return 'Wounded';
  return 'Healthy';
}

/**
 * Get HP percentage
 *
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @returns Percentage (0-100)
 */
export function getHPPercentage(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((currentHp / maxHp) * 100)));
}

/**
 * Check if character is bloodied (half HP or less)
 *
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @returns Whether bloodied
 */
export function isBloodied(currentHp: number, maxHp: number): boolean {
  return currentHp > 0 && currentHp <= maxHp * 0.5;
}

/**
 * Format HP for display
 *
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @param tempHp - Temporary HP
 * @returns Formatted string
 */
export function formatHP(currentHp: number, maxHp: number, tempHp: number = 0): string {
  if (tempHp > 0) {
    return `${currentHp} + ${tempHp} temp / ${maxHp} HP`;
  }
  return `${currentHp} / ${maxHp} HP`;
}

// ============================================================================
// Complete HP Update
// ============================================================================

/**
 * Complete HP state update
 * Handles damage, healing, and temp HP in one call
 *
 * @param params - HP update parameters
 * @returns Complete HP state
 */
export interface HPState {
  currentHp: number;
  tempHp: number;
  maxHp: number;
  deathSaves: DeathSaveState;
  isDead: boolean;
  isDying: boolean;
}

export interface HPUpdateParams {
  currentHp: number;
  tempHp: number;
  maxHp: number;
  damage?: number;
  healing?: number;
  newTempHp?: number;
  deathSaves?: DeathSaveState;
}

export function updateHP(params: HPUpdateParams): HPState {
  let { currentHp, tempHp, deathSaves } = params;
  const { maxHp } = params;

  // Apply temp HP first (if provided)
  if (params.newTempHp !== undefined) {
    tempHp = applyTempHP(tempHp, params.newTempHp);
  }

  // Apply damage
  if (params.damage && params.damage > 0) {
    const damageResult = applyDamageWithDeathSaves(
      currentHp,
      tempHp,
      maxHp,
      params.damage,
      deathSaves
    );
    currentHp = damageResult.newHp;
    tempHp = damageResult.newTempHp;
    deathSaves = damageResult.deathSaves || deathSaves;
  }

  // Apply healing
  if (params.healing && params.healing > 0) {
    const healResult = applyHealing(currentHp, tempHp, maxHp, params.healing, deathSaves);
    currentHp = healResult.newHp;
    tempHp = healResult.newTempHp;
    deathSaves = healResult.deathSaves || deathSaves;
  }

  return {
    currentHp,
    tempHp,
    maxHp,
    deathSaves: deathSaves || resetDeathSaves(),
    isDead: deathSaves?.isDead || false,
    isDying: currentHp === 0 && !deathSaves?.isDead && !deathSaves?.isStable,
  };
}
