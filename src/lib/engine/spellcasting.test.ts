/**
 * Spellcasting Engine Tests
 */

import { describe, it, expect } from 'vitest';

import type { SpellLevel } from '@/types/game';

import {
  getSpellcastingAbility,
  getCasterType,
  isSpellcaster,
  isPreparationCaster,
  isKnownSpellCaster,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  calculateSpellcastingStats,
  calculateEffectiveCasterLevel,
  calculateSpellSlots,
  calculateMulticlassSpellSlots,
  calculatePactMagicSlots,
  getMaxSpellLevel,
  calculateMaxPreparedSpells,
  calculateSpellPreparationLimits,
  calculateSpellsKnownLimit,
  canCastRituals,
  formatSpellSlots,
  getTotalSpellSlots,
  getRemainingSpellSlots,
  useSpellSlot,
  restoreAllSpellSlots,
  canCastSpellLevel,
} from './spellcasting';

describe('Spellcasting Abilities', () => {
  describe('getSpellcastingAbility', () => {
    it('should return correct ability for full casters', () => {
      expect(getSpellcastingAbility('wizard')).toBe('INT');
      expect(getSpellcastingAbility('cleric')).toBe('WIS');
      expect(getSpellcastingAbility('bard')).toBe('CHA');
      expect(getSpellcastingAbility('sorcerer')).toBe('CHA');
      expect(getSpellcastingAbility('druid')).toBe('WIS');
    });

    it('should return correct ability for half casters', () => {
      expect(getSpellcastingAbility('paladin')).toBe('CHA');
      expect(getSpellcastingAbility('ranger')).toBe('WIS');
    });

    it('should return correct ability for third casters', () => {
      expect(getSpellcastingAbility('eldritch-knight')).toBe('INT');
      expect(getSpellcastingAbility('arcane-trickster')).toBe('INT');
    });

    it('should return CHA for warlock', () => {
      expect(getSpellcastingAbility('warlock')).toBe('CHA');
    });

    it('should return null for non-casters', () => {
      expect(getSpellcastingAbility('barbarian')).toBeNull();
      expect(getSpellcastingAbility('fighter')).toBeNull();
      expect(getSpellcastingAbility('monk')).toBeNull();
      expect(getSpellcastingAbility('rogue')).toBeNull();
    });

    it('should handle case insensitivity', () => {
      expect(getSpellcastingAbility('WIZARD')).toBe('INT');
      expect(getSpellcastingAbility('Wizard')).toBe('INT');
    });
  });

  describe('getCasterType', () => {
    it('should identify full casters', () => {
      expect(getCasterType('wizard')).toBe('full');
      expect(getCasterType('cleric')).toBe('full');
    });

    it('should identify half casters', () => {
      expect(getCasterType('paladin')).toBe('half');
      expect(getCasterType('ranger')).toBe('half');
    });

    it('should identify third casters', () => {
      expect(getCasterType('eldritch-knight')).toBe('third');
      expect(getCasterType('arcane-trickster')).toBe('third');
    });

    it('should identify pact magic', () => {
      expect(getCasterType('warlock')).toBe('pact');
    });

    it('should identify non-casters', () => {
      expect(getCasterType('barbarian')).toBe('none');
    });
  });

  describe('isSpellcaster', () => {
    it('should return true for spellcasters', () => {
      expect(isSpellcaster('wizard')).toBe(true);
      expect(isSpellcaster('paladin')).toBe(true);
      expect(isSpellcaster('warlock')).toBe(true);
    });

    it('should return false for non-casters', () => {
      expect(isSpellcaster('barbarian')).toBe(false);
      expect(isSpellcaster('fighter')).toBe(false);
    });
  });

  describe('isPreparationCaster', () => {
    it('should return true for preparation casters', () => {
      expect(isPreparationCaster('cleric')).toBe(true);
      expect(isPreparationCaster('druid')).toBe(true);
      expect(isPreparationCaster('wizard')).toBe(true);
      expect(isPreparationCaster('paladin')).toBe(true);
    });

    it('should return false for known spell casters', () => {
      expect(isPreparationCaster('bard')).toBe(false);
      expect(isPreparationCaster('sorcerer')).toBe(false);
      expect(isPreparationCaster('warlock')).toBe(false);
      expect(isPreparationCaster('ranger')).toBe(false);
    });
  });

  describe('isKnownSpellCaster', () => {
    it('should return true for known spell casters', () => {
      expect(isKnownSpellCaster('bard')).toBe(true);
      expect(isKnownSpellCaster('sorcerer')).toBe(true);
      expect(isKnownSpellCaster('ranger')).toBe(true);
      expect(isKnownSpellCaster('warlock')).toBe(true);
    });

    it('should return false for preparation casters', () => {
      expect(isKnownSpellCaster('wizard')).toBe(false);
      expect(isKnownSpellCaster('cleric')).toBe(false);
    });
  });
});

describe('Spell Save DC and Attack Bonus', () => {
  describe('calculateSpellSaveDC', () => {
    it('should calculate base DC', () => {
      expect(calculateSpellSaveDC(2, 3)).toBe(13); // 8 + 2 + 3
    });

    it('should include item bonus', () => {
      expect(calculateSpellSaveDC(3, 4, 1)).toBe(16); // 8 + 3 + 4 + 1
    });

    it('should calculate high level DC', () => {
      expect(calculateSpellSaveDC(6, 5)).toBe(19); // 8 + 6 + 5
    });
  });

  describe('calculateSpellAttackBonus', () => {
    it('should calculate base bonus', () => {
      expect(calculateSpellAttackBonus(2, 3)).toBe(5);
    });

    it('should include item bonus', () => {
      expect(calculateSpellAttackBonus(3, 4, 1)).toBe(8);
    });
  });

  describe('calculateSpellcastingStats', () => {
    const abilityScores = { STR: 10, DEX: 12, CON: 14, INT: 16, WIS: 14, CHA: 10 };

    it('should calculate wizard stats', () => {
      const result = calculateSpellcastingStats('wizard', abilityScores, 5);
      expect(result).not.toBeNull();
      expect(result?.ability).toBe('INT');
      expect(result?.abilityModifier).toBe(3);
      expect(result?.proficiencyBonus).toBe(3);
      expect(result?.saveDC).toBe(14); // 8 + 3 + 3
      expect(result?.attackBonus).toBe(6); // 3 + 3
    });

    it('should calculate cleric stats', () => {
      const result = calculateSpellcastingStats('cleric', abilityScores, 5);
      expect(result?.ability).toBe('WIS');
      expect(result?.abilityModifier).toBe(2);
    });

    it('should return null for non-caster', () => {
      const result = calculateSpellcastingStats('barbarian', abilityScores, 5);
      expect(result).toBeNull();
    });
  });
});

describe('Effective Caster Level', () => {
  describe('calculateEffectiveCasterLevel', () => {
    it('should return full level for full casters', () => {
      expect(calculateEffectiveCasterLevel(5, 'full')).toBe(5);
      expect(calculateEffectiveCasterLevel(10, 'full')).toBe(10);
    });

    it('should return half (rounded down) for half casters', () => {
      expect(calculateEffectiveCasterLevel(5, 'half')).toBe(2);
      expect(calculateEffectiveCasterLevel(6, 'half')).toBe(3);
    });

    it('should return third (rounded down) for third casters', () => {
      expect(calculateEffectiveCasterLevel(10, 'third')).toBe(3);
      expect(calculateEffectiveCasterLevel(9, 'third')).toBe(3);
      expect(calculateEffectiveCasterLevel(6, 'third')).toBe(2);
    });

    it('should return 0 for non-casters', () => {
      expect(calculateEffectiveCasterLevel(10, 'none')).toBe(0);
    });

    it('should return class level for pact magic', () => {
      expect(calculateEffectiveCasterLevel(5, 'pact')).toBe(5);
    });
  });
});

describe('Spell Slots', () => {
  describe('calculateSpellSlots', () => {
    it('should calculate full caster slots', () => {
      const slots = calculateSpellSlots(5, 'full');
      expect(slots[0].max).toBe(0); // Cantrips not tracked in slots
      expect(slots[1].max).toBe(4); // 4 level 1
      expect(slots[2].max).toBe(3); // 3 level 2
      expect(slots[3].max).toBe(2); // 2 level 3
      expect(slots[4].max).toBe(0); // No level 4 yet
    });

    it('should calculate half caster slots', () => {
      const slots = calculateSpellSlots(10, 'half'); // Effective level 5
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(3);
      expect(slots[3].max).toBe(2);
    });

    it('should calculate third caster slots', () => {
      const slots = calculateSpellSlots(9, 'third'); // Effective level 3
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(2);
    });

    it('should return zero slots for non-casters', () => {
      const slots = calculateSpellSlots(10, 'none');
      expect(slots.every((s) => s.max === 0)).toBe(true);
    });

    it('should return zero slots for pact magic', () => {
      const slots = calculateSpellSlots(10, 'pact');
      expect(slots.every((s) => s.max === 0)).toBe(true);
    });

    it('should handle low level casters', () => {
      const slots = calculateSpellSlots(1, 'full');
      expect(slots[1].max).toBe(2);
      expect(slots[2].max).toBe(0);
    });
  });

  describe('calculateMulticlassSpellSlots', () => {
    it('should combine full and half caster', () => {
      // Wizard 5 + Paladin 6 = 5 + 3 = effective level 8
      const slots = calculateMulticlassSpellSlots([
        { classKey: 'wizard', level: 5 },
        { classKey: 'paladin', level: 6 },
      ]);
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(3);
      expect(slots[3].max).toBe(3);
      expect(slots[4].max).toBe(2);
    });

    it('should combine multiple full casters', () => {
      // Wizard 3 + Cleric 3 = effective level 6
      const slots = calculateMulticlassSpellSlots([
        { classKey: 'wizard', level: 3 },
        { classKey: 'cleric', level: 3 },
      ]);
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(3);
      expect(slots[3].max).toBe(3);
    });

    it('should include third casters', () => {
      // Wizard 6 + Eldritch Knight 9 = 6 + 3 = effective level 9
      const slots = calculateMulticlassSpellSlots([
        { classKey: 'wizard', level: 6 },
        { classKey: 'eldritch-knight', level: 9 },
      ]);
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(3);
      expect(slots[3].max).toBe(3);
      expect(slots[4].max).toBe(3);
      expect(slots[5].max).toBe(1);
    });

    it('should ignore non-casters', () => {
      const slots = calculateMulticlassSpellSlots([
        { classKey: 'wizard', level: 5 },
        { classKey: 'fighter', level: 3 },
      ]);
      expect(slots[1].max).toBe(4);
      expect(slots[2].max).toBe(3);
      expect(slots[3].max).toBe(2);
    });
  });

  describe('calculatePactMagicSlots', () => {
    it('should return pact slots for warlock', () => {
      const level1 = calculatePactMagicSlots(1);
      expect(level1).toEqual({ slots: 1, slotLevel: 1 });

      const level5 = calculatePactMagicSlots(5);
      expect(level5).toEqual({ slots: 2, slotLevel: 3 });

      const level11 = calculatePactMagicSlots(11);
      expect(level11).toEqual({ slots: 3, slotLevel: 5 });

      const level17 = calculatePactMagicSlots(17);
      expect(level17).toEqual({ slots: 4, slotLevel: 5 });
    });

    it('should return null for level 0', () => {
      expect(calculatePactMagicSlots(0)).toBeNull();
    });
  });

  describe('getMaxSpellLevel', () => {
    it('should return correct max level for full casters', () => {
      expect(getMaxSpellLevel(1, 'full')).toBe(1);
      expect(getMaxSpellLevel(5, 'full')).toBe(3);
      expect(getMaxSpellLevel(9, 'full')).toBe(5);
      expect(getMaxSpellLevel(17, 'full')).toBe(9);
    });

    it('should return correct max level for half casters', () => {
      expect(getMaxSpellLevel(2, 'half')).toBe(1); // Effective 1
      expect(getMaxSpellLevel(10, 'half')).toBe(3); // Effective 5
    });

    it('should return correct max level for pact magic', () => {
      expect(getMaxSpellLevel(1, 'pact')).toBe(1);
      expect(getMaxSpellLevel(9, 'pact')).toBe(5);
    });

    it('should return null for non-casters', () => {
      expect(getMaxSpellLevel(10, 'none')).toBeNull();
    });
  });
});

describe('Spell Preparation', () => {
  describe('calculateMaxPreparedSpells', () => {
    it('should calculate prepared spells', () => {
      expect(calculateMaxPreparedSpells(5, 16)).toBe(8); // 5 + 3
    });

    it('should minimum of 1', () => {
      expect(calculateMaxPreparedSpells(1, 3)).toBe(1); // 1 + (-4), min 1
    });

    it('should handle high ability', () => {
      expect(calculateMaxPreparedSpells(10, 20)).toBe(15); // 10 + 5
    });
  });

  describe('calculateSpellPreparationLimits', () => {
    it('should calculate wizard limits', () => {
      const result = calculateSpellPreparationLimits('wizard', 5, 16);
      expect(result).not.toBeNull();
      expect(result?.maxPrepared).toBe(8);
      expect(result?.cantripsKnown).toBe(4);
    });

    it('should calculate cleric limits', () => {
      const result = calculateSpellPreparationLimits('cleric', 5, 14);
      expect(result?.maxPrepared).toBe(7); // 5 + 2
      expect(result?.cantripsKnown).toBe(4);
    });

    it('should calculate paladin limits (half level)', () => {
      const result = calculateSpellPreparationLimits('paladin', 6, 16);
      expect(result?.maxPrepared).toBe(6); // 3 + 3 (half level 6 = 3)
    });

    it('should return null for known spell casters', () => {
      expect(calculateSpellPreparationLimits('sorcerer', 5, 16)).toBeNull();
      expect(calculateSpellPreparationLimits('bard', 5, 16)).toBeNull();
    });
  });

  describe('calculateSpellsKnownLimit', () => {
    it('should calculate bard limits', () => {
      const result = calculateSpellsKnownLimit('bard', 5);
      expect(result).not.toBeNull();
      expect(result?.spellsKnown).toBe(8);
      expect(result?.cantripsKnown).toBe(3);
    });

    it('should calculate sorcerer limits', () => {
      const result = calculateSpellsKnownLimit('sorcerer', 5);
      expect(result?.spellsKnown).toBe(6);
      expect(result?.cantripsKnown).toBe(5);
    });

    it('should calculate ranger limits', () => {
      const result = calculateSpellsKnownLimit('ranger', 5);
      expect(result?.spellsKnown).toBe(4);
    });

    it('should return null for preparation casters', () => {
      expect(calculateSpellsKnownLimit('wizard', 5)).toBeNull();
    });
  });
});

describe('Ritual Casting', () => {
  describe('canCastRituals', () => {
    it('should return true for ritual casters', () => {
      expect(canCastRituals('wizard')).toBe(true);
      expect(canCastRituals('cleric')).toBe(true);
      expect(canCastRituals('druid')).toBe(true);
      expect(canCastRituals('bard')).toBe(true);
    });

    it('should return false for non-ritual casters', () => {
      expect(canCastRituals('sorcerer')).toBe(false);
      expect(canCastRituals('warlock')).toBe(false);
      expect(canCastRituals('paladin')).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatSpellSlots', () => {
    it('should format spell slots', () => {
      const slots = [
        { level: 0 as SpellLevel, max: 0, used: 0 },
        { level: 1 as SpellLevel, max: 4, used: 2 },
        { level: 2 as SpellLevel, max: 3, used: 0 },
      ];
      expect(formatSpellSlots(slots)).toBe('2/4 level 1, 3/3 level 2');
    });

    it('should return message for no slots', () => {
      const slots = [{ level: 0 as SpellLevel, max: 0, used: 0 }];
      expect(formatSpellSlots(slots)).toBe('No spell slots');
    });
  });

  describe('getTotalSpellSlots', () => {
    it('should calculate total slots', () => {
      const slots = [
        { level: 1 as SpellLevel, max: 4, used: 0 },
        { level: 2 as SpellLevel, max: 3, used: 0 },
      ];
      expect(getTotalSpellSlots(slots)).toBe(7);
    });
  });

  describe('getRemainingSpellSlots', () => {
    it('should calculate remaining slots', () => {
      const slots = [
        { level: 1 as SpellLevel, max: 4, used: 2 },
        { level: 2 as SpellLevel, max: 3, used: 1 },
      ];
      expect(getRemainingSpellSlots(slots)).toBe(4); // 2 + 2
    });
  });

  describe('useSpellSlot', () => {
    it('should use a spell slot', () => {
      const slots = [
        { level: 1 as SpellLevel, max: 4, used: 0 },
        { level: 2 as SpellLevel, max: 3, used: 0 },
      ];
      const result = useSpellSlot(slots, 1 as SpellLevel);
      expect(result).not.toBeNull();
      // Level 1 is at index 0
      expect(result![0].used).toBe(1);
      expect(result![1].used).toBe(0);
    });

    it('should return null when no slots available', () => {
      const slots = [{ level: 1 as SpellLevel, max: 4, used: 4 }];
      expect(useSpellSlot(slots, 1 as SpellLevel)).toBeNull();
    });

    it('should return null for non-existent level', () => {
      const slots = [{ level: 1 as SpellLevel, max: 4, used: 0 }];
      expect(useSpellSlot(slots, 9 as SpellLevel)).toBeNull();
    });
  });

  describe('restoreAllSpellSlots', () => {
    it('should restore all used slots', () => {
      const slots = [
        { level: 1 as SpellLevel, max: 4, used: 3 },
        { level: 2 as SpellLevel, max: 3, used: 2 },
      ];
      const result = restoreAllSpellSlots(slots);
      expect(result.every((s) => s.used === 0)).toBe(true);
    });
  });

  describe('canCastSpellLevel', () => {
    it('should allow cantrips for all casters', () => {
      expect(canCastSpellLevel(0, 1, 'full')).toBe(true);
      expect(canCastSpellLevel(0, 1, 'half')).toBe(true);
    });

    it('should check spell level availability', () => {
      expect(canCastSpellLevel(1, 1, 'full')).toBe(true);
      expect(canCastSpellLevel(3, 5, 'full')).toBe(true);
      expect(canCastSpellLevel(9, 17, 'full')).toBe(true);
    });

    it('should deny spells above max level', () => {
      expect(canCastSpellLevel(3, 4, 'full')).toBe(false);
      expect(canCastSpellLevel(9, 16, 'full')).toBe(false);
    });

    it('should deny for non-casters', () => {
      expect(canCastSpellLevel(1, 10, 'none')).toBe(false);
    });
  });
});
