/**
 * Proficiency System Tests
 */

import { describe, it, expect } from 'vitest';

import {
  calculateProficiencyBonus,
  calculateTotalLevel,
  getMulticlassProficiencyBonus,
  calculateProficiencyLevelBonus,
  calculateSkillModifier,
  calculateAllSkillModifiers,
  calculateSavingThrowModifier,
  calculateAllSavingThrowModifiers,
  calculatePassivePerception,
  calculatePassivePerceptionFromModifier,
  getProficiencyLevelName,
  hasJackOfAllTrades,
  getEffectiveProficiencyLevel,
} from './proficiency';

describe('Proficiency Bonus Calculation', () => {
  describe('calculateProficiencyBonus', () => {
    it('should return +2 for level 1', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
    });

    it('should return +2 for levels 1-4', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
      expect(calculateProficiencyBonus(4)).toBe(2);
    });

    it('should return +3 for levels 5-8', () => {
      expect(calculateProficiencyBonus(5)).toBe(3);
      expect(calculateProficiencyBonus(8)).toBe(3);
    });

    it('should return +4 for levels 9-12', () => {
      expect(calculateProficiencyBonus(9)).toBe(4);
      expect(calculateProficiencyBonus(12)).toBe(4);
    });

    it('should return +5 for levels 13-16', () => {
      expect(calculateProficiencyBonus(13)).toBe(5);
      expect(calculateProficiencyBonus(16)).toBe(5);
    });

    it('should return +6 for levels 17-20', () => {
      expect(calculateProficiencyBonus(17)).toBe(6);
      expect(calculateProficiencyBonus(20)).toBe(6);
    });

    it('should throw error for level below 1', () => {
      expect(() => calculateProficiencyBonus(0)).toThrow('Level must be 1-20');
    });

    it('should throw error for level above 20', () => {
      expect(() => calculateProficiencyBonus(21)).toThrow('Level must be 1-20');
    });

    it('should throw error for non-integer level', () => {
      expect(() => calculateProficiencyBonus(5.5)).toThrow('Level must be 1-20');
    });
  });

  describe('calculateTotalLevel', () => {
    it('should calculate single class level', () => {
      expect(calculateTotalLevel([5])).toBe(5);
    });

    it('should sum multiclass levels', () => {
      expect(calculateTotalLevel([5, 3])).toBe(8);
      expect(calculateTotalLevel([5, 3, 2])).toBe(10);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalLevel([])).toBe(0);
    });
  });

  describe('getMulticlassProficiencyBonus', () => {
    it('should calculate correct bonus for multiclass', () => {
      expect(getMulticlassProficiencyBonus([5, 3])).toBe(3); // Total 8 = +3
      expect(getMulticlassProficiencyBonus([5, 3, 2])).toBe(4); // Total 10 = +4
    });
  });
});

describe('Proficiency Level Bonus', () => {
  describe('calculateProficiencyLevelBonus', () => {
    const proficiencyBonus = 4;

    it('should return 0 for none', () => {
      expect(calculateProficiencyLevelBonus('none', proficiencyBonus)).toBe(0);
    });

    it('should return half (floor) for half proficiency', () => {
      expect(calculateProficiencyLevelBonus('half', 3)).toBe(1); // floor(1.5)
      expect(calculateProficiencyLevelBonus('half', 4)).toBe(2); // floor(2.0)
      expect(calculateProficiencyLevelBonus('half', 5)).toBe(2); // floor(2.5)
    });

    it('should return full bonus for proficient', () => {
      expect(calculateProficiencyLevelBonus('proficient', proficiencyBonus)).toBe(4);
    });

    it('should return double bonus for expertise', () => {
      expect(calculateProficiencyLevelBonus('expertise', proficiencyBonus)).toBe(8);
    });
  });
});

describe('Skill Modifiers', () => {
  const abilityScores = { STR: 16, DEX: 14, CON: 15, INT: 12, WIS: 10, CHA: 8 };
  const characterLevel = 5; // +3 proficiency

  describe('calculateSkillModifier', () => {
    it('should calculate unproficient skill', () => {
      const result = calculateSkillModifier('athletics', abilityScores, 'none', characterLevel);
      expect(result.abilityModifier).toBe(3); // STR 16 = +3
      expect(result.proficiencyBonus).toBe(0);
      expect(result.total).toBe(3);
      expect(result.proficiencyLevel).toBe('none');
    });

    it('should calculate proficient skill', () => {
      const result = calculateSkillModifier(
        'athletics',
        abilityScores,
        'proficient',
        characterLevel
      );
      expect(result.abilityModifier).toBe(3);
      expect(result.proficiencyBonus).toBe(3);
      expect(result.total).toBe(6);
    });

    it('should calculate expertise skill', () => {
      const result = calculateSkillModifier(
        'perception',
        abilityScores,
        'expertise',
        characterLevel
      );
      expect(result.abilityModifier).toBe(0); // WIS 10 = +0
      expect(result.proficiencyBonus).toBe(6); // +3 * 2
      expect(result.total).toBe(6);
    });

    it('should calculate half proficiency skill', () => {
      const result = calculateSkillModifier('acrobatics', abilityScores, 'half', characterLevel);
      expect(result.abilityModifier).toBe(2); // DEX 14 = +2
      expect(result.proficiencyBonus).toBe(1); // floor(3 * 0.5)
      expect(result.total).toBe(3);
    });

    it('should throw error for unknown skill', () => {
      expect(() =>
        calculateSkillModifier('unknown_skill', abilityScores, 'none', characterLevel)
      ).toThrow('Unknown skill');
    });
  });

  describe('calculateAllSkillModifiers', () => {
    it('should calculate all 18 skills', () => {
      const proficiencies = {
        athletics: 'proficient' as const,
        perception: 'expertise' as const,
        stealth: 'half' as const,
      };

      const result = calculateAllSkillModifiers(abilityScores, proficiencies, characterLevel);

      expect(Object.keys(result)).toHaveLength(18);
      expect(result['athletics'].total).toBe(6); // +3 STR +3 prof
      expect(result['perception'].total).toBe(6); // +0 WIS +6 expertise
      expect(result['stealth'].total).toBe(3); // +2 DEX +1 half
      expect(result['acrobatics'].total).toBe(2); // +2 DEX +0 none
    });
  });
});

describe('Saving Throw Modifiers', () => {
  const abilityScores = { STR: 16, DEX: 14, CON: 15, INT: 12, WIS: 10, CHA: 8 };
  const characterLevel = 5; // +3 proficiency

  describe('calculateSavingThrowModifier', () => {
    it('should calculate non-proficient save', () => {
      const result = calculateSavingThrowModifier('STR', abilityScores.STR, false, characterLevel);
      expect(result.abilityModifier).toBe(3);
      expect(result.proficiencyBonus).toBe(0);
      expect(result.total).toBe(3);
      expect(result.isProficient).toBe(false);
    });

    it('should calculate proficient save', () => {
      const result = calculateSavingThrowModifier('DEX', abilityScores.DEX, true, characterLevel);
      expect(result.abilityModifier).toBe(2);
      expect(result.proficiencyBonus).toBe(3);
      expect(result.total).toBe(5);
      expect(result.isProficient).toBe(true);
    });
  });

  describe('calculateAllSavingThrowModifiers', () => {
    it('should calculate all 6 saving throws', () => {
      const proficientSaves: ('STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA')[] = ['STR', 'DEX'];
      const result = calculateAllSavingThrowModifiers(
        abilityScores,
        proficientSaves,
        characterLevel
      );

      expect(Object.keys(result)).toHaveLength(6);
      expect(result.STR.total).toBe(6); // +3 +3
      expect(result.DEX.total).toBe(5); // +2 +3
      expect(result.CON.total).toBe(2); // +2 +0
      expect(result.INT.total).toBe(1); // +1 +0
      expect(result.WIS.total).toBe(0); // +0 +0
      expect(result.CHA.total).toBe(-1); // -1 +0
    });
  });
});

describe('Passive Perception', () => {
  const characterLevel = 5; // +3 proficiency

  describe('calculatePassivePerception', () => {
    it('should calculate without proficiency', () => {
      const result = calculatePassivePerception(14, 'none', characterLevel);
      expect(result.base).toBe(10);
      expect(result.wisdomModifier).toBe(2);
      expect(result.proficiencyBonus).toBe(0);
      expect(result.total).toBe(12);
      expect(result.isProficient).toBe(false);
    });

    it('should calculate with proficiency', () => {
      const result = calculatePassivePerception(14, 'proficient', characterLevel);
      expect(result.wisdomModifier).toBe(2);
      expect(result.proficiencyBonus).toBe(3);
      expect(result.total).toBe(15);
      expect(result.isProficient).toBe(true);
    });

    it('should calculate with expertise', () => {
      const result = calculatePassivePerception(12, 'expertise', characterLevel);
      expect(result.wisdomModifier).toBe(1);
      expect(result.proficiencyBonus).toBe(6);
      expect(result.total).toBe(17);
    });

    it('should calculate with half proficiency (Jack of All Trades)', () => {
      const result = calculatePassivePerception(10, 'half', characterLevel);
      expect(result.wisdomModifier).toBe(0);
      expect(result.proficiencyBonus).toBe(1);
      expect(result.total).toBe(11);
    });
  });

  describe('calculatePassivePerceptionFromModifier', () => {
    it('should calculate from positive modifier', () => {
      expect(calculatePassivePerceptionFromModifier(5)).toBe(15);
    });

    it('should calculate from zero modifier', () => {
      expect(calculatePassivePerceptionFromModifier(0)).toBe(10);
    });

    it('should calculate from negative modifier', () => {
      expect(calculatePassivePerceptionFromModifier(-1)).toBe(9);
    });
  });
});

describe('Utility Functions', () => {
  describe('getProficiencyLevelName', () => {
    it('should return correct names', () => {
      expect(getProficiencyLevelName('none')).toBe('Not Proficient');
      expect(getProficiencyLevelName('half')).toBe('Half Proficient');
      expect(getProficiencyLevelName('proficient')).toBe('Proficient');
      expect(getProficiencyLevelName('expertise')).toBe('Expertise');
    });
  });

  describe('hasJackOfAllTrades', () => {
    it('should return true for Bard 2+', () => {
      expect(hasJackOfAllTrades({ bard: 2 })).toBe(true);
      expect(hasJackOfAllTrades({ bard: 5 })).toBe(true);
    });

    it('should return false for Bard 1', () => {
      expect(hasJackOfAllTrades({ bard: 1 })).toBe(false);
    });

    it('should return false for non-Bard', () => {
      expect(hasJackOfAllTrades({ fighter: 5 })).toBe(false);
      expect(hasJackOfAllTrades({})).toBe(false);
    });

    it('should return true for multiclass with Bard 2+', () => {
      expect(hasJackOfAllTrades({ fighter: 3, bard: 2 })).toBe(true);
    });
  });

  describe('getEffectiveProficiencyLevel', () => {
    it('should return actual level if already proficient', () => {
      const proficiencies = { perception: 'proficient' as const };
      expect(getEffectiveProficiencyLevel('perception', proficiencies, true)).toBe('proficient');
      expect(getEffectiveProficiencyLevel('perception', proficiencies, false)).toBe('proficient');
    });

    it('should return expertise if set', () => {
      const proficiencies = { perception: 'expertise' as const };
      expect(getEffectiveProficiencyLevel('perception', proficiencies, true)).toBe('expertise');
    });

    it('should upgrade none to half with Jack of All Trades', () => {
      const proficiencies = {};
      expect(getEffectiveProficiencyLevel('perception', proficiencies, true)).toBe('half');
    });

    it('should keep none without Jack of All Trades', () => {
      const proficiencies = {};
      expect(getEffectiveProficiencyLevel('perception', proficiencies, false)).toBe('none');
    });
  });
});
