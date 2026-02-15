/**
 * Database Layer Sanity Tests
 *
 * Quick tests to verify basic CRUD operations work correctly.
 * Note: fake-indexeddb has a limitation where get() by primary key doesn't work
 * properly, so we use toArray() and filter as a workaround in these tests.
 * @module db/characters.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import type { CharacterTableEntry } from './schema';

// Helper to get character by ID (workaround for fake-indexeddb limitation)
async function getCharacterById(id: string): Promise<CharacterTableEntry | undefined> {
  const all = await db.characters.toArray();
  return all.find((c) => c.id === id);
}

// Test character factory - use unique timestamps to avoid fake-indexeddb compound index collisions
let testCharTimestampOffset = 0;
function createTestCharacter(
  id: string,
  overrides: Partial<CharacterTableEntry> = {}
): CharacterTableEntry {
  const now = new Date(Date.now() + testCharTimestampOffset++).toISOString();
  return {
    id,
    name: 'Test Character',
    playerName: 'Test Player',
    race: { key: 'human', name: 'Human' },
    classes: [{ key: 'fighter', name: 'Fighter', level: 1, hitDiceValue: 10, isPrimary: true }],
    background: { key: 'soldier', name: 'Soldier' },
    alignment: 'Neutral Good',
    level: 1,
    experiencePoints: 0,
    edition: '2014',
    abilityScores: {
      base: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
      racialBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      asiBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      otherBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      override: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null },
      total: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
      modifier: { STR: 2, DEX: 2, CON: 1, INT: 1, WIS: 0, CHA: -1 },
      generationMethod: 'standard',
    },
    skills: [],
    combat: {
      maxHp: 12,
      currentHp: 12,
      tempHp: 0,
      ac: { base: 10, dexModifier: 2, bonus: 0, total: 12 },
      initiative: 2,
      speed: 30,
      hitDice: { type: 'd10', total: 1, used: 0 },
      deathSaves: { successes: 0, failures: 0 },
    },
    proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
    spellcasting: null,
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
    features: [],
    conditions: [],
    personality: {
      traits: [],
      ideals: [],
      bonds: [],
      flaws: [],
      appearance: '',
      backstory: '',
      allies: '',
      enemies: '',
      notes: '',
    },
    appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', other: '' },
    overrides: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Database Character Operations', () => {
  beforeEach(async () => {
    testCharTimestampOffset = 0;
    // Ensure database is open and clean
    if (!db.isOpen()) {
      await db.open();
    }
    await db.characters.clear();
  });

  describe('create/add operations', () => {
    it('should add a character to the database', async () => {
      const character = createTestCharacter('add-test-1', { name: 'Aragorn' });
      await db.characters.add(character);

      const all = await db.characters.toArray();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('Aragorn');
      expect(all[0].id).toBe('add-test-1');
    });

    it('should generate timestamps correctly', async () => {
      const before = Date.now();
      const character = createTestCharacter('timestamp-test-1');
      await db.characters.add(character);
      const after = Date.now();

      const all = await db.characters.toArray();
      const createdTime = new Date(all[0].createdAt).getTime();
      expect(createdTime).toBeGreaterThanOrEqual(before);
      expect(createdTime).toBeLessThanOrEqual(after);
    });
  });

  describe('read operations', () => {
    it('should retrieve all characters', async () => {
      await db.characters.add(createTestCharacter('read-1', { name: 'First' }));
      await db.characters.add(createTestCharacter('read-2', { name: 'Second' }));
      await db.characters.add(createTestCharacter('read-3', { name: 'Third' }));

      const all = await db.characters.toArray();
      expect(all).toHaveLength(3);
      expect(all.map((c) => c.name)).toContain('First');
      expect(all.map((c) => c.name)).toContain('Second');
      expect(all.map((c) => c.name)).toContain('Third');
    });

    it('should return empty array when no characters exist', async () => {
      const all = await db.characters.toArray();
      expect(all).toHaveLength(0);
    });

    it('should order characters by name', async () => {
      await db.characters.add(createTestCharacter('read-sort-z', { name: 'Zebra' }));
      await db.characters.add(createTestCharacter('read-sort-a', { name: 'Apple' }));
      await db.characters.add(createTestCharacter('read-sort-b', { name: 'Banana' }));

      const sorted = await db.characters.orderBy('name').toArray();
      expect(sorted[0].name).toBe('Apple');
      expect(sorted[1].name).toBe('Banana');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('should order characters by level', async () => {
      await db.characters.add(createTestCharacter('level-sort-1', { level: 1 }));
      await db.characters.add(createTestCharacter('level-sort-10', { level: 10 }));
      await db.characters.add(createTestCharacter('level-sort-5', { level: 5 }));

      const sorted = await db.characters.orderBy('level').toArray();
      expect(sorted[0].level).toBe(1);
      expect(sorted[1].level).toBe(5);
      expect(sorted[2].level).toBe(10);
    });
  });

  describe('update operations', () => {
    it('should update character fields', async () => {
      await db.characters.add(createTestCharacter('update-1', { name: 'Original' }));

      const existing = await getCharacterById('update-1');
      expect(existing).toBeDefined();

      await db.characters.put({
        ...existing!,
        name: 'Updated',
        updatedAt: new Date().toISOString(),
      });

      const updated = await getCharacterById('update-1');
      expect(updated?.name).toBe('Updated');
    });

    it('should update timestamp on save', async () => {
      const originalTime = new Date(Date.now() - 1000).toISOString();
      await db.characters.add(createTestCharacter('update-2', { updatedAt: originalTime }));

      const existing = await getCharacterById('update-2');
      const newTime = new Date().toISOString();
      await db.characters.put({ ...existing!, updatedAt: newTime });

      const updated = await getCharacterById('update-2');
      expect(updated?.updatedAt).toBe(newTime);
    });
  });

  describe('delete operations', () => {
    it('should delete a character', async () => {
      await db.characters.add(createTestCharacter('delete-1'));

      let all = await db.characters.toArray();
      expect(all).toHaveLength(1);

      await db.characters.delete('delete-1');

      all = await db.characters.toArray();
      expect(all).toHaveLength(0);
    });

    it('should delete without error when character does not exist', async () => {
      await expect(db.characters.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('bulk operations', () => {
    it('should add multiple characters', async () => {
      await db.characters.bulkAdd([
        createTestCharacter('bulk-1'),
        createTestCharacter('bulk-2'),
        createTestCharacter('bulk-3'),
      ]);

      const all = await db.characters.toArray();
      expect(all).toHaveLength(3);
    });

    it('should count characters correctly', async () => {
      expect(await db.characters.count()).toBe(0);

      await db.characters.add(createTestCharacter('count-1'));
      expect(await db.characters.count()).toBe(1);

      await db.characters.add(createTestCharacter('count-2'));
      expect(await db.characters.count()).toBe(2);
    });
  });

  describe('search and filter', () => {
    beforeEach(async () => {
      await db.characters.add(
        createTestCharacter('aragorn', { name: 'Aragorn', level: 10, campaignId: 'campaign-1' })
      );
      await db.characters.add(
        createTestCharacter('arabella', { name: 'Arabella', level: 5, campaignId: 'campaign-1' })
      );
      await db.characters.add(
        createTestCharacter('boromir', { name: 'Boromir', level: 8, campaignId: 'campaign-2' })
      );
      await db.characters.add(
        createTestCharacter('legolas', {
          name: 'Legolas',
          level: 12,
          campaignId: undefined,
          classes: [
            { key: 'ranger', name: 'Ranger', level: 12, hitDiceValue: 10, isPrimary: true },
          ],
        })
      );
    });

    it('should filter by name', async () => {
      const all = await db.characters.toArray();
      const filtered = all.filter((c) => c.name.toLowerCase().includes('ara'));
      expect(filtered).toHaveLength(2);
    });

    it('should filter by campaign ID', async () => {
      const all = await db.characters.toArray();
      const filtered = all.filter((c) => c.campaignId === 'campaign-1');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by null campaign ID (uncategorized)', async () => {
      const all = await db.characters.toArray();
      const filtered = all.filter((c) => !c.campaignId);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Legolas');
    });

    it('should filter by level range', async () => {
      const all = await db.characters.toArray();
      const filtered = all.filter((c) => c.level >= 8 && c.level <= 10);
      expect(filtered).toHaveLength(2);
    });

    it('should filter by class name', async () => {
      const all = await db.characters.toArray();
      const filtered = all.filter((c) =>
        c.classes.some((cls) => cls.name.toLowerCase().includes('ranger'))
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Legolas');
    });
  });

  describe('character summaries', () => {
    it('should generate summary from character data', async () => {
      await db.characters.add(
        createTestCharacter('summary-legolas', {
          name: 'Legolas',
          level: 5,
          race: { key: 'elf', name: 'Elf' },
          classes: [{ key: 'ranger', name: 'Ranger', level: 5, hitDiceValue: 10, isPrimary: true }],
          combat: {
            maxHp: 40,
            currentHp: 40,
            tempHp: 0,
            ac: { base: 15, dexModifier: 3, bonus: 0, total: 18 },
            initiative: 3,
            speed: 35,
            hitDice: { type: 'd10', total: 5, used: 0 },
            deathSaves: { successes: 0, failures: 0 },
          },
        })
      );

      const all = await db.characters.toArray();
      const char = all[0];

      // Verify summary fields
      expect(char.name).toBe('Legolas');
      expect(char.level).toBe(5);
      expect(char.race.name).toBe('Elf');
      expect(char.classes[0].name).toBe('Ranger');
      expect(char.classes[0].level).toBe(5);
    });
  });

  describe('statistics', () => {
    it('should calculate level distribution', async () => {
      await db.characters.add(createTestCharacter('stats-level-1', { level: 1 }));
      await db.characters.add(createTestCharacter('stats-level-2', { level: 1 }));
      await db.characters.add(createTestCharacter('stats-level-3', { level: 5 }));
      await db.characters.add(createTestCharacter('stats-level-4', { level: 10 }));

      const all = await db.characters.toArray();
      const byLevel: Record<number, number> = {};
      for (const char of all) {
        byLevel[char.level] = (byLevel[char.level] || 0) + 1;
      }

      expect(all).toHaveLength(4);
      expect(byLevel[1]).toBe(2);
      expect(byLevel[5]).toBe(1);
      expect(byLevel[10]).toBe(1);
    });

    it('should track campaign distribution', async () => {
      await db.characters.add(createTestCharacter('stats-camp-1', { campaignId: 'camp-1' }));
      await db.characters.add(createTestCharacter('stats-camp-2', { campaignId: 'camp-1' }));
      await db.characters.add(createTestCharacter('stats-camp-3', { campaignId: 'camp-2' }));
      await db.characters.add(createTestCharacter('stats-camp-4', { campaignId: undefined }));

      const all = await db.characters.toArray();
      const byCampaign: Record<string, number> = {};
      for (const char of all) {
        const campId = char.campaignId || 'uncategorized';
        byCampaign[campId] = (byCampaign[campId] || 0) + 1;
      }

      expect(byCampaign['camp-1']).toBe(2);
      expect(byCampaign['camp-2']).toBe(1);
      expect(byCampaign['uncategorized']).toBe(1);
    });

    it('should return recently updated characters', async () => {
      const now = new Date();
      await db.characters.add(
        createTestCharacter('recent-1', {
          name: 'First',
          updatedAt: new Date(now.getTime() - 2000).toISOString(),
        })
      );
      await db.characters.add(
        createTestCharacter('recent-2', {
          name: 'Second',
          updatedAt: new Date(now.getTime() - 1000).toISOString(),
        })
      );
      await db.characters.add(
        createTestCharacter('recent-3', {
          name: 'Third',
          updatedAt: now.toISOString(),
        })
      );

      const all = await db.characters.toArray();
      const sorted = all.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      expect(sorted[0].name).toBe('Third');
      expect(sorted[1].name).toBe('Second');
      expect(sorted[2].name).toBe('First');
    });
  });
});
