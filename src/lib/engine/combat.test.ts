/**
 * Combat Statistics Tests
 */

import { describe, it, expect } from 'vitest';

import {
  calculateAC,
  calculateUnarmoredDefense,
  calculateLevelHP,
  calculateMaxHP,
  calculateLevelUpHP,
  calculateInitiative,
  calculateSpeed,
  calculateAllSpeeds,
  getAttackAbilityModifier,
  calculateAttackBonus,
  calculateWeaponDamage,
  formatDamage,
  processDeathSave,
  calculateHitDicePool,
  calculateHitDieHeal,
  recoverHitDice,
  rollHitDie,
  rollInitiative,
  formatCombatValue,
} from './combat';

describe('Armor Class', () => {
  describe('calculateAC', () => {
    it('should calculate unarmored AC', () => {
      const result = calculateAC('unarmored', 10, 14, false);
      expect(result.base).toBe(10);
      expect(result.dexModifier).toBe(2);
      expect(result.total).toBe(12);
    });

    it('should calculate light armor AC', () => {
      const result = calculateAC('light', 12, 16, false);
      expect(result.base).toBe(12);
      expect(result.dexModifier).toBe(3);
      expect(result.total).toBe(15);
    });

    it('should calculate medium armor AC with DEX cap', () => {
      const result = calculateAC('medium', 14, 18, false);
      expect(result.base).toBe(14);
      expect(result.dexModifier).toBe(2); // Capped at +2
      expect(result.total).toBe(16);
    });

    it('should calculate heavy armor AC without DEX', () => {
      const result = calculateAC('heavy', 16, 18, false);
      expect(result.base).toBe(16);
      expect(result.dexModifier).toBe(0);
      expect(result.total).toBe(16);
    });

    it('should add shield bonus', () => {
      const result = calculateAC('unarmored', 10, 14, true);
      expect(result.shieldBonus).toBe(2);
      expect(result.total).toBe(14);
    });

    it('should add magic bonus', () => {
      const result = calculateAC('unarmored', 10, 14, false, 1);
      expect(result.magicBonus).toBe(1);
      expect(result.total).toBe(13);
    });

    it('should add feature bonus', () => {
      const result = calculateAC('unarmored', 10, 14, false, 0, 2);
      expect(result.featureBonus).toBe(2);
      expect(result.total).toBe(14);
    });

    it('should combine all bonuses', () => {
      const result = calculateAC('medium', 14, 14, true, 1, 2);
      expect(result.total).toBe(21); // 14 + 2 + 2 + 1 + 2
    });
  });

  describe('calculateUnarmoredDefense', () => {
    it('should calculate Barbarian unarmored defense', () => {
      const result = calculateUnarmoredDefense(16, 16); // DEX +3, CON +3
      expect(result).toBe(16);
    });

    it('should calculate Monk unarmored defense', () => {
      const result = calculateUnarmoredDefense(16, 14); // DEX +3, WIS +2
      expect(result).toBe(15);
    });
  });
});

describe('Hit Points', () => {
  describe('calculateLevelHP', () => {
    it('should calculate first level HP (max hit die)', () => {
      const result = calculateLevelHP(1, 'fighter', 'd10', 16);
      expect(result.roll).toBe(10); // Max d10
      expect(result.conModifier).toBe(3);
      expect(result.total).toBe(13);
    });

    it('should calculate fixed HP for higher levels', () => {
      const result = calculateLevelHP(2, 'fighter', 'd10', 16, undefined, true);
      expect(result.roll).toBe(6); // Average d10 = ceil(10/2)+1
      expect(result.total).toBe(9);
    });

    it('should accept manual rolls', () => {
      const result = calculateLevelHP(2, 'fighter', 'd10', 16, 8, false);
      expect(result.roll).toBe(8);
      expect(result.total).toBe(11);
    });

    it('should throw for invalid roll', () => {
      expect(() => calculateLevelHP(2, 'fighter', 'd10', 16, 11, false)).toThrow('Invalid roll');
    });

    it('should handle different hit dice', () => {
      const wizard = calculateLevelHP(1, 'wizard', 'd6', 14);
      expect(wizard.roll).toBe(6);
      expect(wizard.total).toBe(8); // 6 + 2

      const barbarian = calculateLevelHP(1, 'barbarian', 'd12', 16);
      expect(barbarian.roll).toBe(12);
      expect(barbarian.total).toBe(15); // 12 + 3
    });
  });

  describe('calculateMaxHP', () => {
    it('should calculate HP for single class', () => {
      const levels = [
        { level: 1, classKey: 'fighter', conScore: 16 },
        { level: 2, classKey: 'fighter', conScore: 16 },
        { level: 3, classKey: 'fighter', conScore: 16 },
      ];
      const result = calculateMaxHP(levels);

      expect(result.levels).toHaveLength(3);
      expect(result.levels[0].total).toBe(13); // 10 + 3
      expect(result.levels[1].total).toBe(9); // 6 + 3 (fixed)
      expect(result.levels[2].total).toBe(9); // 6 + 3 (fixed)
      expect(result.maxHp).toBe(31);
    });

    it('should calculate HP for multiclass', () => {
      const levels = [
        { level: 1, classKey: 'fighter', conScore: 16 },
        { level: 2, classKey: 'fighter', conScore: 16 },
        { level: 3, classKey: 'wizard', conScore: 16 },
      ];
      const result = calculateMaxHP(levels);

      expect(result.levels[2].hitDieValue).toBe(6); // Wizard uses d6
      expect(result.levels[2].roll).toBe(4); // ceil(6/2)+1
    });

    it('should add feature bonus per level', () => {
      const levels = [
        { level: 1, classKey: 'fighter', conScore: 16 },
        { level: 2, classKey: 'fighter', conScore: 16 },
      ];
      const result = calculateMaxHP(levels, 2); // Tough feat gives +2 per level

      expect(result.featureBonus).toBe(4); // 2 levels × 2
      expect(result.maxHp).toBe(26); // (13 + 9) + 4
    });
  });

  describe('calculateLevelUpHP', () => {
    it('should calculate level up HP', () => {
      const result = calculateLevelUpHP('fighter', 16, undefined, true, 0);
      expect(result).toBe(9); // 6 (avg d10) + 3 (con)
    });

    it('should include feature bonus', () => {
      const result = calculateLevelUpHP('fighter', 16, undefined, true, 2);
      expect(result).toBe(11); // 6 + 3 + 2
    });
  });
});

describe('Initiative', () => {
  describe('calculateInitiative', () => {
    it('should calculate base initiative', () => {
      const result = calculateInitiative(14);
      expect(result.dexModifier).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should add feature bonus', () => {
      const result = calculateInitiative(14, 5); // Alert feat gives +5
      expect(result.featureBonus).toBe(5);
      expect(result.total).toBe(7);
    });

    it('should handle negative DEX', () => {
      const result = calculateInitiative(8);
      expect(result.dexModifier).toBe(-1);
      expect(result.total).toBe(-1);
    });
  });
});

describe('Speed', () => {
  describe('calculateSpeed', () => {
    it('should calculate base speed', () => {
      const result = calculateSpeed(30);
      expect(result.base).toBe(30);
      expect(result.modifiers).toBe(0);
      expect(result.total).toBe(30);
    });

    it('should apply positive modifier', () => {
      const result = calculateSpeed(30, 10);
      expect(result.total).toBe(40);
    });

    it('should apply negative modifier', () => {
      const result = calculateSpeed(30, -10);
      expect(result.total).toBe(20);
    });

    it('should not go below 0', () => {
      const result = calculateSpeed(30, -50);
      expect(result.total).toBe(0);
    });
  });

  describe('calculateAllSpeeds', () => {
    it('should calculate walk speed only', () => {
      const result = calculateAllSpeeds(30);
      expect(result.walk.total).toBe(30);
      expect(result.fly).toBeUndefined();
    });

    it('should calculate all movement types', () => {
      const result = calculateAllSpeeds(30, {
        fly: 60,
        swim: 15,
        climb: 20,
        burrow: 10,
      });

      expect(result.walk.total).toBe(30);
      expect(result.fly?.total).toBe(60);
      expect(result.swim?.total).toBe(15);
      expect(result.climb?.total).toBe(20);
      expect(result.burrow?.total).toBe(10);
    });

    it('should apply modifiers to all speeds', () => {
      const result = calculateAllSpeeds(30, { fly: 60 }, -10);

      expect(result.walk.total).toBe(20);
      expect(result.fly?.total).toBe(50);
    });
  });
});

describe('Attack and Damage', () => {
  describe('getAttackAbilityModifier', () => {
    it('should use DEX for ranged attacks', () => {
      const result = getAttackAbilityModifier('ranged', false, 16, 14);
      expect(result.ability).toBe('DEX');
      expect(result.modifier).toBe(2);
    });

    it('should use STR for melee attacks', () => {
      const result = getAttackAbilityModifier('melee', false, 16, 14);
      expect(result.ability).toBe('STR');
      expect(result.modifier).toBe(3);
    });

    it('should use DEX for finesse if higher', () => {
      const result = getAttackAbilityModifier('melee', true, 12, 16);
      expect(result.ability).toBe('DEX');
      expect(result.modifier).toBe(3);
    });

    it('should use STR for finesse if equal or higher', () => {
      const result = getAttackAbilityModifier('melee', true, 16, 14);
      expect(result.ability).toBe('STR');
      expect(result.modifier).toBe(3);
    });
  });

  describe('calculateAttackBonus', () => {
    it('should calculate proficient melee attack', () => {
      const result = calculateAttackBonus('melee', false, true, 16, 14, 5, 1);
      expect(result.abilityModifier).toBe(3);
      expect(result.proficiencyBonus).toBe(3);
      expect(result.magicBonus).toBe(1);
      expect(result.total).toBe(7);
    });

    it('should calculate non-proficient attack', () => {
      const result = calculateAttackBonus('melee', false, false, 16, 14, 5);
      expect(result.proficiencyBonus).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should calculate finesse attack using DEX', () => {
      const result = calculateAttackBonus('melee', true, true, 12, 16, 5);
      expect(result.abilityModifier).toBe(3); // DEX 16 = +3
      expect(result.total).toBe(6);
    });
  });

  describe('calculateWeaponDamage', () => {
    it('should calculate melee weapon damage', () => {
      const result = calculateWeaponDamage('1d8', 'melee', false, 16, 14, 1);
      expect(result.dice).toBe('1d8');
      expect(result.abilityModifier).toBe(3);
      expect(result.magicBonus).toBe(1);
    });

    it('should calculate versatile weapon one-handed', () => {
      const result = calculateWeaponDamage('1d8', 'melee', false, 16, 14, 0, true, false);
      expect(result.dice).toBe('1d8');
      expect(result.versatile).toBeUndefined();
    });

    it('should calculate versatile weapon two-handed', () => {
      const result = calculateWeaponDamage('1d8', 'melee', false, 16, 14, 0, true, true);
      expect(result.dice).toBe('1d10');
      expect(result.versatile).toBe('1d10');
    });
  });

  describe('formatDamage', () => {
    it('should format damage with positive modifier', () => {
      const damage = { dice: '1d8', abilityModifier: 3, magicBonus: 1 };
      expect(formatDamage(damage)).toBe('1d8 + 4');
    });

    it('should format damage with no modifier', () => {
      const damage = { dice: '1d8', abilityModifier: 0, magicBonus: 0 };
      expect(formatDamage(damage)).toBe('1d8');
    });

    it('should format damage with negative modifier', () => {
      const damage = { dice: '1d8', abilityModifier: -1, magicBonus: 0 };
      expect(formatDamage(damage)).toBe('1d8 - 1');
    });
  });
});

describe('Death Saves', () => {
  describe('processDeathSave', () => {
    it('should count success on 10+', () => {
      const result = processDeathSave(10, 0, 0);
      expect(result.successes).toBe(1);
      expect(result.failures).toBe(0);
      expect(result.isStable).toBe(false);
    });

    it('should count failure on 9-', () => {
      const result = processDeathSave(9, 0, 0);
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(1);
    });

    it('should count two failures on natural 1', () => {
      const result = processDeathSave(1, 0, 0);
      expect(result.failures).toBe(2);
    });

    it('should revive on natural 20', () => {
      const result = processDeathSave(20, 1, 1);
      expect(result.revived).toBe(true);
    });

    it('should become stable at 3 successes', () => {
      const result = processDeathSave(15, 2, 0);
      expect(result.successes).toBe(3);
      expect(result.isStable).toBe(true);
    });

    it('should die at 3 failures', () => {
      const result = processDeathSave(5, 0, 2);
      expect(result.failures).toBe(3);
      expect(result.isDead).toBe(true);
    });

    it('should cap successes at 3', () => {
      const result = processDeathSave(20, 3, 0);
      expect(result.successes).toBe(3);
    });

    it('should cap failures at 3', () => {
      const result = processDeathSave(1, 0, 2);
      expect(result.failures).toBe(3);
    });
  });
});

describe('Hit Dice', () => {
  describe('calculateHitDicePool', () => {
    it('should calculate single class pool', () => {
      const result = calculateHitDicePool([{ classKey: 'fighter', level: 5 }]);
      expect(result['d10']).toEqual({ total: 5, remaining: 5 });
    });

    it('should calculate multiclass pool', () => {
      const result = calculateHitDicePool([
        { classKey: 'fighter', level: 3 },
        { classKey: 'wizard', level: 2 },
      ]);
      expect(result['d10']).toEqual({ total: 3, remaining: 3 });
      expect(result['d6']).toEqual({ total: 2, remaining: 2 });
    });
  });

  describe('calculateHitDieHeal', () => {
    it('should calculate heal with CON modifier', () => {
      const result = calculateHitDieHeal('d10', 6, 16);
      expect(result).toBe(9); // 6 + 3
    });

    it('should throw for invalid roll', () => {
      expect(() => calculateHitDieHeal('d10', 11, 16)).toThrow('Invalid roll');
    });
  });

  describe('recoverHitDice', () => {
    it('should recover half on long rest', () => {
      const result = recoverHitDice(2, 6);
      expect(result).toBe(5); // 2 + ceil(6/2) = 2 + 3 = 5
    });

    it('should recover at least 1', () => {
      const result = recoverHitDice(0, 1);
      expect(result).toBe(1); // 0 + max(1, ceil(1/2)) = 0 + 1
    });

    it('should not exceed total', () => {
      const result = recoverHitDice(5, 6);
      expect(result).toBe(6);
    });
  });
});

describe('Utility Functions', () => {
  describe('rollHitDie', () => {
    it('should return valid roll', () => {
      const result = rollHitDie('d10');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('rollInitiative', () => {
    it('should return valid initiative roll', () => {
      const result = rollInitiative(2);
      expect(result).toBeGreaterThanOrEqual(3); // 1 + 2
      expect(result).toBeLessThanOrEqual(22); // 20 + 2
    });
  });

  describe('formatCombatValue', () => {
    it('should format positive with sign', () => {
      expect(formatCombatValue(5)).toBe('+5');
      expect(formatCombatValue(0)).toBe('+0');
    });

    it('should format negative without extra sign', () => {
      expect(formatCombatValue(-3)).toBe('-3');
    });

    it('should format without sign when requested', () => {
      expect(formatCombatValue(5, false)).toBe('5');
      expect(formatCombatValue(-3, false)).toBe('-3');
    });
  });
});
