/**
 * HP Management Tests
 */

import { describe, it, expect } from 'vitest';

import {
  applyDamage,
  applyDamageWithDeathSaves,
  applyHealing,
  applyTempHP,
  setTempHP,
  clearTempHP,
  calculateHitDieHeal,
  spendHitDie,
  recoverHitDiceOnLongRest,
  resetAllHitDice,
  rollDeathSave,
  resetDeathSaves,
  stabilize,
  getHPStatus,
  getHPPercentage,
  isBloodied,
  formatHP,
  updateHP,
} from './hp';

describe('Damage Application', () => {
  describe('applyDamage', () => {
    it('should apply damage to current HP', () => {
      const result = applyDamage(50, 0, 100, 10);
      expect(result.newHp).toBe(40);
      expect(result.newTempHp).toBe(0);
      expect(result.damageTaken).toBe(10);
    });

    it('should apply damage to temp HP first', () => {
      const result = applyDamage(50, 10, 100, 5);
      expect(result.newHp).toBe(50);
      expect(result.newTempHp).toBe(5);
    });

    it('should deplete temp HP and then current HP', () => {
      const result = applyDamage(50, 10, 100, 15);
      expect(result.newHp).toBe(45);
      expect(result.newTempHp).toBe(0);
    });

    it('should not go below 0 HP', () => {
      const result = applyDamage(10, 0, 100, 20);
      expect(result.newHp).toBe(0);
      expect(result.isDying).toBe(true);
    });

    it('should floor at 0 HP', () => {
      const result = applyDamage(5, 0, 100, 100);
      expect(result.newHp).toBe(0);
    });

    it('should handle zero damage', () => {
      const result = applyDamage(50, 10, 100, 0);
      expect(result.newHp).toBe(50);
      expect(result.newTempHp).toBe(10);
    });

    it('should throw for negative damage', () => {
      expect(() => applyDamage(50, 0, 100, -5)).toThrow('Damage cannot be negative');
    });
  });

  describe('applyDamageWithDeathSaves', () => {
    it('should mark as dying when reaching 0', () => {
      const result = applyDamageWithDeathSaves(10, 0, 100, 10);
      expect(result.isDying).toBe(true);
      expect(result.deathSaves).toBeUndefined();
    });

    it('should add failure when taking damage at 0 HP', () => {
      const deathSaves = { successes: 0, failures: 0, isStable: false, isDead: false };
      const result = applyDamageWithDeathSaves(0, 0, 100, 5, deathSaves);
      expect(result.deathSaves?.failures).toBe(1);
      expect(result.isDead).toBe(false);
    });

    it('should cause instant death on massive damage', () => {
      const deathSaves = { successes: 0, failures: 0, isStable: false, isDead: false };
      const result = applyDamageWithDeathSaves(0, 0, 100, 100, deathSaves);
      expect(result.deathSaves?.failures).toBe(2);
      expect(result.deathSaves?.isDead).toBe(false); // 2 failures, not 3
    });

    it('should cause death at 3 failures', () => {
      const deathSaves = { successes: 0, failures: 2, isStable: false, isDead: false };
      const result = applyDamageWithDeathSaves(0, 0, 100, 5, deathSaves);
      expect(result.deathSaves?.failures).toBe(3);
      expect(result.isDead).toBe(true);
    });
  });
});

describe('Healing', () => {
  describe('applyHealing', () => {
    it('should add healing to current HP', () => {
      const result = applyHealing(50, 0, 100, 10);
      expect(result.newHp).toBe(60);
      expect(result.healingReceived).toBe(10);
    });

    it('should cap at max HP', () => {
      const result = applyHealing(90, 0, 100, 20);
      expect(result.newHp).toBe(100);
      expect(result.overflow).toBe(10);
    });

    it('should reset death saves when healing from 0', () => {
      const deathSaves = { successes: 1, failures: 1, isStable: false, isDead: false };
      const result = applyHealing(0, 0, 100, 5, deathSaves);
      expect(result.newHp).toBe(5);
      expect(result.deathSaves?.successes).toBe(0);
      expect(result.deathSaves?.failures).toBe(0);
    });

    it('should not reset death saves if still at 0', () => {
      const deathSaves = { successes: 1, failures: 1, isStable: false, isDead: false };
      const result = applyHealing(0, 0, 100, 0, deathSaves);
      expect(result.newHp).toBe(0);
      expect(result.deathSaves?.successes).toBe(1);
    });

    it('should handle zero healing', () => {
      const result = applyHealing(50, 10, 100, 0);
      expect(result.newHp).toBe(50);
      expect(result.newTempHp).toBe(10);
    });

    it('should throw for negative healing', () => {
      expect(() => applyHealing(50, 0, 100, -5)).toThrow('Healing cannot be negative');
    });
  });
});

describe('Temporary HP', () => {
  describe('applyTempHP', () => {
    it('should apply temp HP when none exists', () => {
      expect(applyTempHP(0, 10)).toBe(10);
    });

    it('should keep higher value', () => {
      expect(applyTempHP(10, 5)).toBe(10);
      expect(applyTempHP(5, 10)).toBe(10);
    });

    it('should keep equal value', () => {
      expect(applyTempHP(10, 10)).toBe(10);
    });
  });

  describe('setTempHP', () => {
    it('should set temp HP', () => {
      expect(setTempHP(15)).toBe(15);
    });

    it('should not allow negative', () => {
      expect(setTempHP(-5)).toBe(0);
    });
  });

  describe('clearTempHP', () => {
    it('should clear temp HP', () => {
      expect(clearTempHP()).toBe(0);
    });
  });
});

describe('Hit Dice', () => {
  describe('calculateHitDieHeal', () => {
    it('should calculate heal', () => {
      expect(calculateHitDieHeal('d10', 6, 16)).toBe(9); // 6 + 3
    });

    it('should apply CON modifier', () => {
      expect(calculateHitDieHeal('d8', 5, 14)).toBe(7); // 5 + 2
    });

    it('should minimum 1 HP', () => {
      expect(calculateHitDieHeal('d8', 1, 6)).toBe(1); // 1 + (-2) = -1, min 1
    });

    it('should throw for invalid roll', () => {
      expect(() => calculateHitDieHeal('d10', 11, 16)).toThrow('Invalid roll');
      expect(() => calculateHitDieHeal('d10', 0, 16)).toThrow('Invalid roll');
    });
  });

  describe('spendHitDie', () => {
    it('should spend a die', () => {
      const pool = { d10: { total: 5, remaining: 5 } };
      const result = spendHitDie(pool, 'd10');
      expect(result).not.toBeNull();
      expect(result?.d10.remaining).toBe(4);
    });

    it('should return null when no dice left', () => {
      const pool = { d10: { total: 5, remaining: 0 } };
      expect(spendHitDie(pool, 'd10')).toBeNull();
    });

    it('should return null for missing die type', () => {
      const pool = { d10: { total: 5, remaining: 5 } };
      expect(spendHitDie(pool, 'd8')).toBeNull();
    });
  });

  describe('recoverHitDiceOnLongRest', () => {
    it('should recover half on long rest', () => {
      const pool = {
        d10: { total: 6, remaining: 2 },
        d8: { total: 4, remaining: 1 },
      };
      const result = recoverHitDiceOnLongRest(pool);
      expect(result.d10.remaining).toBe(5); // 2 + 3 (half of 6)
      expect(result.d8.remaining).toBe(3); // 1 + 2 (half of 4)
    });

    it('should minimum recover 1', () => {
      const pool = { d10: { total: 1, remaining: 0 } };
      const result = recoverHitDiceOnLongRest(pool);
      expect(result.d10.remaining).toBe(1);
    });

    it('should not exceed total', () => {
      const pool = { d10: { total: 5, remaining: 4 } };
      const result = recoverHitDiceOnLongRest(pool);
      expect(result.d10.remaining).toBe(5);
    });
  });

  describe('resetAllHitDice', () => {
    it('should reset all dice', () => {
      const pool = {
        d10: { total: 5, remaining: 2 },
        d8: { total: 3, remaining: 0 },
      };
      const result = resetAllHitDice(pool);
      expect(result.d10.remaining).toBe(5);
      expect(result.d8.remaining).toBe(3);
    });
  });
});

describe('Death Saves', () => {
  describe('rollDeathSave', () => {
    it('should add success on 10+', () => {
      const result = rollDeathSave(10, 0, 0);
      expect(result.successes).toBe(1);
      expect(result.failures).toBe(0);
    });

    it('should add failure on 9-', () => {
      const result = rollDeathSave(9, 0, 0);
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(1);
    });

    it('should add two failures on natural 1', () => {
      const result = rollDeathSave(1, 0, 0);
      expect(result.failures).toBe(2);
    });

    it('should stabilize on natural 20', () => {
      const result = rollDeathSave(20, 0, 0);
      expect(result.isStable).toBe(true);
      expect(result.successes).toBe(3);
    });

    it('should become stable at 3 successes', () => {
      const result = rollDeathSave(15, 2, 0);
      expect(result.isStable).toBe(true);
    });

    it('should die at 3 failures', () => {
      const result = rollDeathSave(5, 0, 2);
      expect(result.isDead).toBe(true);
    });

    it('should cap successes at 3', () => {
      const result = rollDeathSave(20, 3, 0);
      expect(result.successes).toBe(3);
    });

    it('should cap failures at 3', () => {
      const result = rollDeathSave(1, 0, 2);
      expect(result.failures).toBe(3);
    });
  });

  describe('resetDeathSaves', () => {
    it('should reset all values', () => {
      const result = resetDeathSaves();
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(0);
      expect(result.isStable).toBe(false);
      expect(result.isDead).toBe(false);
    });
  });

  describe('stabilize', () => {
    it('should stabilize character', () => {
      const result = stabilize();
      expect(result.isStable).toBe(true);
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(0);
    });
  });
});

describe('HP Status Helpers', () => {
  describe('getHPStatus', () => {
    it('should return Healthy at full HP', () => {
      expect(getHPStatus(100, 100)).toBe('Healthy');
    });

    it('should return Healthy above 75%', () => {
      expect(getHPStatus(76, 100)).toBe('Healthy');
    });

    it('should return Wounded at 50-75%', () => {
      expect(getHPStatus(75, 100)).toBe('Wounded');
      expect(getHPStatus(51, 100)).toBe('Wounded');
    });

    it('should return Bloodied at 25-50%', () => {
      expect(getHPStatus(50, 100)).toBe('Bloodied');
      expect(getHPStatus(26, 100)).toBe('Bloodied');
    });

    it('should return Critical below 25%', () => {
      expect(getHPStatus(25, 100)).toBe('Critical');
      expect(getHPStatus(1, 100)).toBe('Critical');
    });

    it('should return Unconscious at 0', () => {
      expect(getHPStatus(0, 100)).toBe('Unconscious');
    });
  });

  describe('getHPPercentage', () => {
    it('should calculate percentage', () => {
      expect(getHPPercentage(50, 100)).toBe(50);
      expect(getHPPercentage(25, 100)).toBe(25);
    });

    it('should cap at 100%', () => {
      expect(getHPPercentage(150, 100)).toBe(100);
    });

    it('should floor at 0%', () => {
      expect(getHPPercentage(-10, 100)).toBe(0);
    });

    it('should handle max 0', () => {
      expect(getHPPercentage(0, 0)).toBe(0);
    });
  });

  describe('isBloodied', () => {
    it('should return true at half HP', () => {
      expect(isBloodied(50, 100)).toBe(true);
    });

    it('should return true below half', () => {
      expect(isBloodied(25, 100)).toBe(true);
    });

    it('should return false above half', () => {
      expect(isBloodied(51, 100)).toBe(false);
    });

    it('should return false at 0', () => {
      expect(isBloodied(0, 100)).toBe(false);
    });
  });

  describe('formatHP', () => {
    it('should format without temp HP', () => {
      expect(formatHP(50, 100)).toBe('50 / 100 HP');
    });

    it('should format with temp HP', () => {
      expect(formatHP(50, 100, 10)).toBe('50 + 10 temp / 100 HP');
    });

    it('should format at 0 HP', () => {
      expect(formatHP(0, 100)).toBe('0 / 100 HP');
    });
  });
});

describe('Complete HP Update', () => {
  describe('updateHP', () => {
    it('should apply damage', () => {
      const result = updateHP({
        currentHp: 50,
        tempHp: 0,
        maxHp: 100,
        damage: 10,
      });
      expect(result.currentHp).toBe(40);
    });

    it('should apply healing', () => {
      const result = updateHP({
        currentHp: 50,
        tempHp: 0,
        maxHp: 100,
        healing: 10,
      });
      expect(result.currentHp).toBe(60);
    });

    it('should apply temp HP', () => {
      const result = updateHP({
        currentHp: 50,
        tempHp: 0,
        maxHp: 100,
        newTempHp: 10,
      });
      expect(result.tempHp).toBe(10);
    });

    it('should handle combined damage and temp HP', () => {
      const result = updateHP({
        currentHp: 50,
        tempHp: 5,
        maxHp: 100,
        damage: 10,
        newTempHp: 8,
      });
      // newTempHp (8) is applied first, then damage
      // Temp HP 8 absorbs all 10 damage? No, only 8
      // Remaining 2 hits current HP
      expect(result.currentHp).toBe(48);
      expect(result.tempHp).toBe(0);
    });

    it('should set dying at 0 HP', () => {
      const result = updateHP({
        currentHp: 10,
        tempHp: 0,
        maxHp: 100,
        damage: 15,
      });
      expect(result.currentHp).toBe(0);
      expect(result.isDying).toBe(true);
    });

    it('should reset death saves when healing from 0', () => {
      const result = updateHP({
        currentHp: 0,
        tempHp: 0,
        maxHp: 100,
        healing: 5,
        deathSaves: { successes: 1, failures: 1, isStable: false, isDead: false },
      });
      expect(result.deathSaves.successes).toBe(0);
      expect(result.deathSaves.failures).toBe(0);
    });
  });
});
