/**
 * Ability Score Calculations - D&D 5e
 *
 * Functions for calculating ability modifiers, score generation methods,
 * and applying racial/background bonuses following D&D 5e rules.
 */

import { ABILITY_SCORES, type AbilityScore, SKILLS } from '@/types/game';

// ============================================================================
// Constants
// ============================================================================

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
export const MIN_SCORE = 1;
export const MAX_SCORE = 30;
export const MIN_PC_SCORE = 3;
export const MAX_PC_SCORE = 20;
export const POINT_BUY_TOTAL = 27;

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

// Pre-calculated modifiers for scores 1-30 using formula: floor((score - 10) / 2)
export const MODIFIER_LOOKUP: Record<number, number> = Object.fromEntries(
  Array.from({ length: 30 }, (_, i) => [i + 1, Math.floor((i - 9) / 2)])
) as Record<number, number>;

// ============================================================================
// Validation
// ============================================================================

export function isValidScore(score: number, isPC = true): boolean {
  const min = isPC ? MIN_PC_SCORE : MIN_SCORE;
  const max = isPC ? MAX_PC_SCORE : MAX_SCORE;
  return Number.isInteger(score) && score >= min && score <= max;
}

export function validateScores(scores: number[], isPC = true): { valid: boolean; error?: string } {
  if (!Array.isArray(scores)) {
    return { valid: false, error: 'Must be an array' };
  }
  if (scores.length !== 6) {
    return { valid: false, error: `Expected 6 scores, got ${scores.length}` };
  }

  const min = isPC ? MIN_PC_SCORE : MIN_SCORE;
  const max = isPC ? MAX_PC_SCORE : MAX_SCORE;

  for (let i = 0; i < scores.length; i++) {
    if (!Number.isInteger(scores[i])) {
      return { valid: false, error: `Score ${i} must be an integer` };
    }
    if (scores[i] < min || scores[i] > max) {
      return { valid: false, error: `Score ${i} (${scores[i]}) must be ${min}-${max}` };
    }
  }

  return { valid: true };
}

// ============================================================================
// Modifier Calculation
// ============================================================================

export function calculateModifier(score: number): number {
  if (!Number.isInteger(score)) {
    throw new Error(`Score must be integer, got ${score}`);
  }
  if (score < MIN_SCORE || score > MAX_SCORE) {
    throw new Error(`Score must be ${MIN_SCORE}-${MAX_SCORE}`);
  }
  return MODIFIER_LOOKUP[score];
}

export function calculateModifierSafe(score: number): number | null {
  try {
    return calculateModifier(score);
  } catch {
    return null;
  }
}

// ============================================================================
// Skill Mapping
// ============================================================================

export function getSkillAbility(skillKey: string): AbilityScore | null {
  return SKILLS.find((s) => s.key === skillKey)?.ability ?? null;
}

export function getSkillsByAbility(ability: AbilityScore): string[] {
  return SKILLS.filter((s) => s.ability === ability).map((s) => s.key);
}

// ============================================================================
// Ability Score Generation
// ============================================================================

export type GenerationMethod = 'standard' | 'pointbuy' | 'roll' | 'manual';

export interface GenerationResult {
  scores: Record<AbilityScore, number>;
  valid: boolean;
  error?: string;
}

function createEmptyScores(): Record<AbilityScore, number> {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
}

export function generateStandardArray(
  assignments: Partial<Record<AbilityScore, number>>
): GenerationResult {
  const assigned = Object.keys(assignments) as AbilityScore[];

  if (assigned.length !== 6) {
    return { scores: createEmptyScores(), valid: false, error: 'Must assign all 6 abilities' };
  }

  const values = Object.values(assignments).sort((a, b) => b - a);
  const standard = [...STANDARD_ARRAY].sort((a, b) => b - a);

  if (JSON.stringify(values) !== JSON.stringify(standard)) {
    return {
      scores: createEmptyScores(),
      valid: false,
      error: 'Must match standard array [15, 14, 13, 12, 10, 8]',
    };
  }

  return { scores: assignments as Record<AbilityScore, number>, valid: true };
}

// ============================================================================
// Point Buy
// ============================================================================

export function calculatePointCost(score: number): number {
  if (score < 8 || score > 15) {
    throw new Error('Point buy scores must be 8-15');
  }
  return POINT_BUY_COSTS[score];
}

export function calculateTotalPointCost(scores: Record<AbilityScore, number>): number {
  return ABILITY_SCORES.reduce(
    (total, ability) => total + calculatePointCost(scores[ability] ?? 8),
    0
  );
}

export function validatePointBuy(scores: Record<AbilityScore, number>): {
  valid: boolean;
  cost: number;
  remaining: number;
  error?: string;
} {
  const missing = ABILITY_SCORES.filter((a) => scores[a] === undefined);
  if (missing.length > 0) {
    return {
      valid: false,
      cost: 0,
      remaining: POINT_BUY_TOTAL,
      error: `Missing: ${missing.join(', ')}`,
    };
  }

  for (const ability of ABILITY_SCORES) {
    const score = scores[ability];
    if (score < 8 || score > 15) {
      return {
        valid: false,
        cost: 0,
        remaining: POINT_BUY_TOTAL,
        error: `${ability} (${score}) must be 8-15`,
      };
    }
  }

  const cost = calculateTotalPointCost(scores);
  const remaining = POINT_BUY_TOTAL - cost;

  if (cost > POINT_BUY_TOTAL) {
    return { valid: false, cost, remaining, error: `Over budget: ${cost}/${POINT_BUY_TOTAL}` };
  }

  return { valid: true, cost, remaining };
}

export function generatePointBuy(scores: Record<AbilityScore, number>): GenerationResult {
  const validation = validatePointBuy(scores);
  return validation.valid
    ? { scores, valid: true }
    : { scores, valid: false, error: validation.error };
}

export function generateManual(
  scores: Record<AbilityScore, number>,
  isPC = true
): GenerationResult {
  const missing = ABILITY_SCORES.filter((a) => scores[a] === undefined);
  if (missing.length > 0) {
    return { scores, valid: false, error: `Missing: ${missing.join(', ')}` };
  }

  const min = isPC ? MIN_PC_SCORE : MIN_SCORE;
  const max = isPC ? MAX_PC_SCORE : MAX_SCORE;

  for (const ability of ABILITY_SCORES) {
    const score = scores[ability];
    if (!Number.isInteger(score) || score < min || score > max) {
      return { scores, valid: false, error: `${ability} (${score}) must be ${min}-${max}` };
    }
  }

  return { scores, valid: true };
}

// ============================================================================
// Racial/Species Bonuses
// ============================================================================

export interface SpeciesBonus {
  ability: AbilityScore | 'any' | 'any_two' | 'any_three';
  bonus: number;
}

export function applySpeciesBonuses(
  base: Record<AbilityScore, number>,
  bonuses: SpeciesBonus[],
  selections: Record<string, string> = {}
): {
  final: Record<AbilityScore, number>;
  bonuses: Record<AbilityScore, number>;
  errors: string[];
} {
  const result: Record<AbilityScore, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
  const errors: string[] = [];
  const used = new Set<AbilityScore>();

  const applyBonus = (ability: AbilityScore, bonus: number) => {
    if (used.has(ability)) {
      errors.push(`${ability} already has bonus`);
    } else {
      result[ability] += bonus;
      used.add(ability);
    }
  };

  for (const bonus of bonuses) {
    if (bonus.ability === 'any') {
      const selected = selections['any'] as AbilityScore | undefined;
      if (!selected) errors.push("'any' not selected");
      else applyBonus(selected, bonus.bonus);
    } else if (bonus.ability === 'any_two') {
      const selected = selections['any_two']?.split(',') as AbilityScore[] | undefined;
      if (!selected || selected.length !== 2) errors.push("'any_two' needs 2 selections");
      else if (selected[0] === selected[1]) errors.push("'any_two' must be different");
      else selected.forEach((a) => applyBonus(a, 1));
    } else if (bonus.ability === 'any_three') {
      const selected = selections['any_three']?.split(',') as AbilityScore[] | undefined;
      if (!selected || selected.length !== 3) errors.push("'any_three' needs 3 selections");
      else if (new Set(selected).size !== 3) errors.push("'any_three' must be different");
      else selected.forEach((a) => applyBonus(a, 1));
    } else {
      applyBonus(bonus.ability, bonus.bonus);
    }
  }

  const final: Record<AbilityScore, number> = { ...base };
  for (const ability of ABILITY_SCORES) {
    final[ability] = Math.min(MAX_PC_SCORE, final[ability] + result[ability]);
  }

  return { final, bonuses: result, errors };
}

// ============================================================================
// Complete Calculation
// ============================================================================

function createZeroScores(): Record<AbilityScore, number> {
  return { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
}

export function calculateAbilityScores(
  base: Record<AbilityScore, number>,
  racial: Record<AbilityScore, number> = createZeroScores(),
  asi: Record<AbilityScore, number> = createZeroScores(),
  other: Record<AbilityScore, number> = createZeroScores()
) {
  const total: Record<AbilityScore, number> = { ...base };
  const modifier: Record<AbilityScore, number> = { ...base };

  for (const ability of ABILITY_SCORES) {
    total[ability] = base[ability] + racial[ability] + asi[ability] + other[ability];
    modifier[ability] = calculateModifier(total[ability]);
  }

  return {
    base: { ...base },
    racialBonus: { ...racial },
    asiBonus: { ...asi },
    otherBonus: { ...other },
    total,
    modifier,
  };
}

// ============================================================================
// Utilities
// ============================================================================

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function getModifierString(score: number): string {
  return formatModifier(calculateModifier(score));
}

export function getPointBuyStatus(remaining: number): string {
  if (remaining === 0) return 'All points spent';
  if (remaining > 0) return `${remaining} points remaining`;
  return `${Math.abs(remaining)} points over budget`;
}
