/**
 * Ability Scores Tests
 *
 * Comprehensive tests for D&D 5e ability score calculations
 */

import { describe, it, expect } from 'vitest';

import {
  calculateModifier,
  calculateModifierSafe,
  MODIFIER_LOOKUP,
  isValidScore,
  validateScores,
  getSkillAbility,
  getSkillsByAbility,
  STANDARD_ARRAY,
  POINT_BUY_TOTAL,
  POINT_BUY_COSTS,
  calculatePointCost,
  calculateTotalPointCost,
  validatePointBuy,
  generateStandardArray,
  generatePointBuy,
  generateManual,
  applySpeciesBonuses,
  calculateAbilityScores,
  formatModifier,
  getModifierString,
  getPointBuyStatus,
} from './ability-scores';

describe('Ability Score Constants', () => {
  it('should have correct standard array values', () => {
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('should have correct point buy total', () => {
    expect(POINT_BUY_TOTAL).toBe(27);
  });

  it('should have correct point buy cost table', () => {
    expect(POINT_BUY_COSTS).toEqual({
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 7,
      15: 9,
    });
  });
});

describe('Modifier Lookup Table', () => {
  it('should have correct modifier for score 1', () => {
    expect(MODIFIER_LOOKUP[1]).toBe(-5);
  });

  it('should have correct modifier for score 10', () => {
    expect(MODIFIER_LOOKUP[10]).toBe(0);
  });

  it('should have correct modifier for score 20', () => {
    expect(MODIFIER_LOOKUP[20]).toBe(5);
  });

  it('should have correct modifier for score 30', () => {
    expect(MODIFIER_LOOKUP[30]).toBe(10);
  });

  it('should have modifiers for all scores 1-30', () => {
    for (let i = 1; i <= 30; i++) {
      expect(MODIFIER_LOOKUP[i]).toBeDefined();
      expect(MODIFIER_LOOKUP[i]).toBe(Math.floor((i - 10) / 2));
    }
  });
});

describe('calculateModifier', () => {
  it('should calculate modifier for minimum score', () => {
    expect(calculateModifier(1)).toBe(-5);
  });

  it('should calculate modifier for score 10', () => {
    expect(calculateModifier(10)).toBe(0);
  });

  it('should calculate modifier for score 18', () => {
    expect(calculateModifier(18)).toBe(4);
  });

  it('should calculate modifier for maximum score', () => {
    expect(calculateModifier(30)).toBe(10);
  });

  it('should calculate negative modifiers correctly', () => {
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(9)).toBe(-1);
    expect(calculateModifier(6)).toBe(-2);
    expect(calculateModifier(3)).toBe(-4);
  });

  it('should throw error for non-integer score', () => {
    expect(() => calculateModifier(15.5)).toThrow('Score must be integer');
  });

  it('should throw error for score below minimum', () => {
    expect(() => calculateModifier(0)).toThrow('Score must be');
  });

  it('should throw error for score above maximum', () => {
    expect(() => calculateModifier(31)).toThrow('Score must be');
  });
});

describe('calculateModifierSafe', () => {
  it('should return modifier for valid score', () => {
    expect(calculateModifierSafe(15)).toBe(2);
  });

  it('should return null for invalid score', () => {
    expect(calculateModifierSafe(0)).toBeNull();
    expect(calculateModifierSafe(31)).toBeNull();
    expect(calculateModifierSafe(15.5)).toBeNull();
  });
});

describe('Ability Score Validation', () => {
  describe('isValidScore', () => {
    it('should validate PC scores correctly', () => {
      expect(isValidScore(3, true)).toBe(true);
      expect(isValidScore(20, true)).toBe(true);
      expect(isValidScore(2, true)).toBe(false);
      expect(isValidScore(21, true)).toBe(false);
    });

    it('should validate monster scores correctly', () => {
      expect(isValidScore(1, false)).toBe(true);
      expect(isValidScore(30, false)).toBe(true);
      expect(isValidScore(0, false)).toBe(false);
      expect(isValidScore(31, false)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isValidScore(15.5)).toBe(false);
      expect(isValidScore(NaN)).toBe(false);
    });
  });

  describe('validateScores', () => {
    it('should validate array of 6 scores', () => {
      const result = validateScores([15, 14, 13, 12, 10, 8]);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-array input', () => {
      const result = validateScores('not an array' as unknown as number[]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('array');
    });

    it('should reject wrong number of scores', () => {
      const result = validateScores([15, 14, 13]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6');
    });

    it('should reject non-integer scores', () => {
      const result = validateScores([15, 14, 13, 12, 10, 8.5]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('integer');
    });

    it('should reject scores outside PC range', () => {
      const result = validateScores([2, 14, 13, 12, 10, 8]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be');
    });
  });
});

describe('Skill Ability Mapping', () => {
  describe('getSkillAbility', () => {
    it('should return correct ability for athletics', () => {
      expect(getSkillAbility('athletics')).toBe('STR');
    });

    it('should return correct ability for acrobatics', () => {
      expect(getSkillAbility('acrobatics')).toBe('DEX');
    });

    it('should return correct ability for perception', () => {
      expect(getSkillAbility('perception')).toBe('WIS');
    });

    it('should return null for unknown skill', () => {
      expect(getSkillAbility('unknown_skill')).toBeNull();
    });
  });

  describe('getSkillsByAbility', () => {
    it('should return DEX skills', () => {
      const dexSkills = getSkillsByAbility('DEX');
      expect(dexSkills).toContain('acrobatics');
      expect(dexSkills).toContain('sleight_of_hand');
      expect(dexSkills).toContain('stealth');
      expect(dexSkills).toHaveLength(3);
    });

    it('should return INT skills', () => {
      const intSkills = getSkillsByAbility('INT');
      expect(intSkills).toContain('arcana');
      expect(intSkills).toContain('history');
      expect(intSkills).toContain('investigation');
      expect(intSkills).toContain('nature');
      expect(intSkills).toContain('religion');
      expect(intSkills).toHaveLength(5);
    });
  });
});

describe('Standard Array Generation', () => {
  it('should accept valid standard array assignment', () => {
    const assignments = {
      STR: 15,
      DEX: 14,
      CON: 13,
      INT: 12,
      WIS: 10,
      CHA: 8,
    };

    const result = generateStandardArray(assignments);
    expect(result.valid).toBe(true);
    expect(result.scores).toEqual(assignments);
  });

  it('should reject assignment with missing abilities', () => {
    const assignments = {
      STR: 15,
      DEX: 14,
      CON: 13,
    };

    const result = generateStandardArray(assignments);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('6');
  });

  it('should reject assignment with wrong values', () => {
    const assignments = {
      STR: 16,
      DEX: 14,
      CON: 13,
      INT: 12,
      WIS: 10,
      CHA: 8,
    };

    const result = generateStandardArray(assignments);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('standard array');
  });
});

describe('Point Buy System', () => {
  describe('calculatePointCost', () => {
    it('should return 0 for score 8', () => {
      expect(calculatePointCost(8)).toBe(0);
    });

    it('should return 9 for score 15', () => {
      expect(calculatePointCost(15)).toBe(9);
    });

    it('should return correct costs for middle scores', () => {
      expect(calculatePointCost(10)).toBe(2);
      expect(calculatePointCost(12)).toBe(4);
      expect(calculatePointCost(14)).toBe(7);
    });

    it('should throw error for score below 8', () => {
      expect(() => calculatePointCost(7)).toThrow();
    });

    it('should throw error for score above 15', () => {
      expect(() => calculatePointCost(16)).toThrow();
    });
  });

  describe('calculateTotalPointCost', () => {
    it('should calculate cost for all 8s', () => {
      const scores = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
      expect(calculateTotalPointCost(scores)).toBe(0);
    });

    it('should calculate cost for standard array', () => {
      const scores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      expect(calculateTotalPointCost(scores)).toBe(27);
    });
  });

  describe('validatePointBuy', () => {
    it('should validate standard array as valid', () => {
      const scores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const result = validatePointBuy(scores);
      expect(result.valid).toBe(true);
      expect(result.cost).toBe(27);
      expect(result.remaining).toBe(0);
    });

    it('should reject incomplete scores', () => {
      const incompleteScores = { STR: 15, DEX: 14, CON: 13 } as Record<string, number>;
      const result = validatePointBuy(incompleteScores);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing');
    });

    it('should reject score outside range', () => {
      const invalidScores = { STR: 16, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const result = validatePointBuy(invalidScores);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be 8-15');
    });

    it('should reject over budget', () => {
      const scores = { STR: 15, DEX: 15, CON: 14, INT: 14, WIS: 8, CHA: 8 };
      const result = validatePointBuy(scores);
      expect(result.valid).toBe(false);
      expect(result.cost).toBeGreaterThan(27);
      expect(result.remaining).toBeLessThan(0);
    });
  });

  describe('generatePointBuy', () => {
    it('should generate valid point buy', () => {
      const scores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const result = generatePointBuy(scores);
      expect(result.valid).toBe(true);
      expect(result.scores).toEqual(scores);
    });

    it('should return error for invalid point buy', () => {
      const scores = { STR: 16, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const result = generatePointBuy(scores);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Manual Entry Generation', () => {
  it('should accept valid manual scores', () => {
    const scores = { STR: 18, DEX: 16, CON: 14, INT: 12, WIS: 10, CHA: 8 };
    const result = generateManual(scores);
    expect(result.valid).toBe(true);
    expect(result.scores).toEqual(scores);
  });

  it('should accept rolled scores outside point buy range', () => {
    const scores = { STR: 18, DEX: 17, CON: 16, INT: 14, WIS: 12, CHA: 10 };
    const result = generateManual(scores);
    expect(result.valid).toBe(true);
  });

  it('should reject scores below PC minimum', () => {
    const scores = { STR: 2, DEX: 16, CON: 14, INT: 12, WIS: 10, CHA: 8 };
    const result = generateManual(scores);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be');
  });

  it('should reject incomplete scores', () => {
    const scores = { STR: 15, DEX: 14, CON: 13 };
    const result = generateManual(scores as Record<string, number>);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing');
  });
});

describe('Species/Racial Bonuses', () => {
  describe('applySpeciesBonuses', () => {
    it('should apply fixed racial bonuses', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [
        { ability: 'DEX' as const, bonus: 2 },
        { ability: 'WIS' as const, bonus: 1 },
      ];

      const result = applySpeciesBonuses(baseScores, speciesBonuses);
      expect(result.final.DEX).toBe(12);
      expect(result.final.WIS).toBe(11);
      expect(result.bonuses.DEX).toBe(2);
      expect(result.bonuses.WIS).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply floating bonus (any)', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'any' as const, bonus: 2 }];
      const floatingSelections = { any: 'STR' as const };

      const result = applySpeciesBonuses(baseScores, speciesBonuses, floatingSelections);
      expect(result.final.STR).toBe(12);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply any_two bonus', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'any_two' as const, bonus: 1 }];
      const floatingSelections = { any_two: 'STR,DEX' as const };

      const result = applySpeciesBonuses(baseScores, speciesBonuses, floatingSelections);
      expect(result.final.STR).toBe(11);
      expect(result.final.DEX).toBe(11);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply any_three bonus (2024 Human)', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'any_three' as const, bonus: 1 }];
      const floatingSelections = { any_three: 'STR,DEX,CON' };

      const result = applySpeciesBonuses(baseScores, speciesBonuses, floatingSelections);
      expect(result.final.STR).toBe(11);
      expect(result.final.DEX).toBe(11);
      expect(result.final.CON).toBe(11);
      expect(result.errors).toHaveLength(0);
    });

    it('should cap at 20 for player characters', () => {
      const baseScores = { STR: 19, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'STR' as const, bonus: 2 }];

      const result = applySpeciesBonuses(baseScores, speciesBonuses);
      expect(result.final.STR).toBe(20);
    });

    it('should error when floating selection missing', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'any' as const, bonus: 2 }];

      const result = applySpeciesBonuses(baseScores, speciesBonuses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('not selected');
    });

    it('should error for duplicate ability selections', () => {
      const baseScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
      const speciesBonuses = [{ ability: 'any_two' as const, bonus: 1 }];
      const floatingSelections = { any_two: 'STR,STR' as const };

      const result = applySpeciesBonuses(baseScores, speciesBonuses, floatingSelections);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Complete Ability Score Calculation', () => {
  describe('calculateAbilityScores', () => {
    it('should calculate totals with all bonus types', () => {
      const baseScores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const racialBonuses = { STR: 2, DEX: 0, CON: 0, INT: 0, WIS: 1, CHA: 0 };
      const asiBonuses = { STR: 0, DEX: 2, CON: 0, INT: 0, WIS: 0, CHA: 0 };

      const result = calculateAbilityScores(baseScores, racialBonuses, asiBonuses);

      expect(result.total.STR).toBe(17);
      expect(result.total.DEX).toBe(16);
      expect(result.total.WIS).toBe(11);
      expect(result.modifier.STR).toBe(3);
      expect(result.modifier.DEX).toBe(3);
      expect(result.modifier.WIS).toBe(0);
    });

    it('should calculate correct modifiers', () => {
      const baseScores = { STR: 10, DEX: 12, CON: 14, INT: 16, WIS: 18, CHA: 20 };

      const result = calculateAbilityScores(baseScores);

      expect(result.modifier.STR).toBe(0);
      expect(result.modifier.DEX).toBe(1);
      expect(result.modifier.CON).toBe(2);
      expect(result.modifier.INT).toBe(3);
      expect(result.modifier.WIS).toBe(4);
      expect(result.modifier.CHA).toBe(5);
    });

    it('should use 10 as default for missing base scores', () => {
      const baseScores = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
      const racialBonuses = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
      const asiBonuses = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
      const otherBonuses = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };

      const result = calculateAbilityScores(baseScores, racialBonuses, asiBonuses, otherBonuses);
      expect(result.total).toEqual(baseScores);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatModifier', () => {
    it('should format positive modifiers with +', () => {
      expect(formatModifier(0)).toBe('+0');
      expect(formatModifier(3)).toBe('+3');
      expect(formatModifier(5)).toBe('+5');
    });

    it('should format negative modifiers with -', () => {
      expect(formatModifier(-1)).toBe('-1');
      expect(formatModifier(-3)).toBe('-3');
    });
  });

  describe('getModifierString', () => {
    it('should return formatted modifier for score', () => {
      expect(getModifierString(10)).toBe('+0');
      expect(getModifierString(16)).toBe('+3');
      expect(getModifierString(8)).toBe('-1');
    });
  });

  describe('getPointBuyStatus', () => {
    it('should show completed status', () => {
      expect(getPointBuyStatus(0)).toBe('All points spent');
    });

    it('should show remaining points', () => {
      expect(getPointBuyStatus(5)).toBe('5 points remaining');
    });

    it('should show over budget', () => {
      expect(getPointBuyStatus(-3)).toBe('3 points over budget');
    });
  });
});
