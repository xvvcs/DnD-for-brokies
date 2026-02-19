/**
 * Campaign Data Layer Sanity Tests
 *
 * Quick tests to verify basic CRUD operations and character-campaign associations work correctly.
 * Note: fake-indexeddb has a limitation where get() by primary key doesn't work
 * properly, so we use toArray() and filter as a workaround in these tests.
 * @module db/campaigns.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import type { CampaignTableEntry, CharacterTableEntry } from './schema';

// Helper to get campaign by ID (workaround for fake-indexeddb limitation)
async function getCampaignById(id: string): Promise<CampaignTableEntry | undefined> {
  const all = await db.campaigns.toArray();
  return all.find((c) => c.id === id);
}

// Helper to get character by ID (workaround for fake-indexeddb limitation)
async function getCharacterById(id: string): Promise<CharacterTableEntry | undefined> {
  const all = await db.characters.toArray();
  return all.find((c) => c.id === id);
}

// Test campaign factory
let testCampaignTimestampOffset = 0;
function createTestCampaign(
  id: string,
  overrides: Partial<CampaignTableEntry> = {}
): CampaignTableEntry {
  const now = new Date(Date.now() + testCampaignTimestampOffset++).toISOString();
  return {
    id,
    name: 'Test Campaign',
    description: 'A test campaign for adventures',
    edition: '2014',
    settings: {
      allowedDocuments: ['wotc-srd'],
      houseRules: [],
      useEncumbrance: false,
      useFeats: true,
      useMulticlassing: true,
      customRaces: [],
      customClasses: [],
      customBackgrounds: [],
    },
    characterIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Test character factory
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
    actions: [],
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
    sessionNotes: [],
    overrides: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Database Campaign Operations', () => {
  beforeEach(async () => {
    testCampaignTimestampOffset = 0;
    testCharTimestampOffset = 0;
    // Ensure database is open and clean
    if (!db.isOpen()) {
      await db.open();
    }
    await db.campaigns.clear();
    await db.characters.clear();
  });

  describe('create/add operations', () => {
    it('should add a campaign to the database', async () => {
      const campaign = createTestCampaign('camp-test-1', { name: "Storm King's Thunder" });
      await db.campaigns.add(campaign);

      const all = await db.campaigns.toArray();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("Storm King's Thunder");
      expect(all[0].id).toBe('camp-test-1');
    });

    it('should generate timestamps correctly', async () => {
      const before = Date.now();
      const campaign = createTestCampaign('camp-timestamp-1');
      await db.campaigns.add(campaign);
      const after = Date.now();

      const all = await db.campaigns.toArray();
      const createdTime = new Date(all[0].createdAt).getTime();
      expect(createdTime).toBeGreaterThanOrEqual(before);
      expect(createdTime).toBeLessThanOrEqual(after);
    });

    it('should initialize with empty character list', async () => {
      const campaign = createTestCampaign('camp-empty-1');
      await db.campaigns.add(campaign);

      const all = await db.campaigns.toArray();
      expect(all[0].characterIds).toEqual([]);
    });
  });

  describe('read operations', () => {
    it('should retrieve all campaigns', async () => {
      await db.campaigns.add(createTestCampaign('camp-read-1', { name: 'First Campaign' }));
      await db.campaigns.add(createTestCampaign('camp-read-2', { name: 'Second Campaign' }));
      await db.campaigns.add(createTestCampaign('camp-read-3', { name: 'Third Campaign' }));

      const all = await db.campaigns.toArray();
      expect(all).toHaveLength(3);
      expect(all.map((c) => c.name)).toContain('First Campaign');
      expect(all.map((c) => c.name)).toContain('Second Campaign');
      expect(all.map((c) => c.name)).toContain('Third Campaign');
    });

    it('should return empty array when no campaigns exist', async () => {
      const all = await db.campaigns.toArray();
      expect(all).toHaveLength(0);
    });

    it('should order campaigns by name', async () => {
      await db.campaigns.add(createTestCampaign('camp-sort-z', { name: 'Zzz Campaign' }));
      await db.campaigns.add(createTestCampaign('camp-sort-a', { name: 'Aaa Campaign' }));
      await db.campaigns.add(createTestCampaign('camp-sort-m', { name: 'Mmm Campaign' }));

      const sorted = await db.campaigns.orderBy('name').toArray();
      expect(sorted[0].name).toBe('Aaa Campaign');
      expect(sorted[1].name).toBe('Mmm Campaign');
      expect(sorted[2].name).toBe('Zzz Campaign');
    });

    it('should filter by edition', async () => {
      await db.campaigns.add(createTestCampaign('camp-2014', { edition: '2014' }));
      await db.campaigns.add(createTestCampaign('camp-2024-1', { edition: '2024' }));
      await db.campaigns.add(createTestCampaign('camp-2024-2', { edition: '2024' }));

      const all = await db.campaigns.toArray();
      const edition2024 = all.filter((c) => c.edition === '2024');
      expect(edition2024).toHaveLength(2);
    });
  });

  describe('update operations', () => {
    it('should update campaign fields', async () => {
      await db.campaigns.add(createTestCampaign('camp-update-1', { name: 'Original Name' }));

      const existing = await getCampaignById('camp-update-1');
      expect(existing).toBeDefined();

      await db.campaigns.put({
        ...existing!,
        name: 'Updated Name',
        updatedAt: new Date().toISOString(),
      });

      const updated = await getCampaignById('camp-update-1');
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update timestamp on save', async () => {
      const originalTime = new Date(Date.now() - 1000).toISOString();
      await db.campaigns.add(createTestCampaign('camp-update-2', { updatedAt: originalTime }));

      const existing = await getCampaignById('camp-update-2');
      const newTime = new Date().toISOString();
      await db.campaigns.put({ ...existing!, updatedAt: newTime });

      const updated = await getCampaignById('camp-update-2');
      expect(updated?.updatedAt).toBe(newTime);
    });
  });

  describe('delete operations', () => {
    it('should delete a campaign', async () => {
      await db.campaigns.add(createTestCampaign('camp-delete-1'));

      let all = await db.campaigns.toArray();
      expect(all).toHaveLength(1);

      await db.campaigns.delete('camp-delete-1');

      all = await db.campaigns.toArray();
      expect(all).toHaveLength(0);
    });

    it('should delete without error when campaign does not exist', async () => {
      await expect(db.campaigns.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('character-campaign associations', () => {
    beforeEach(async () => {
      // Set up test data
      await db.campaigns.add(createTestCampaign('camp-assoc-1', { name: 'Test Campaign' }));
      await db.characters.add(createTestCharacter('char-assoc-1', { name: 'Test Character' }));
    });

    it('should assign character to campaign', async () => {
      const campaign = await getCampaignById('camp-assoc-1');
      expect(campaign?.characterIds).toEqual([]);

      await db.campaigns.put({
        ...campaign!,
        characterIds: ['char-assoc-1'],
        updatedAt: new Date().toISOString(),
      });

      const character = await getCharacterById('char-assoc-1');
      await db.characters.put({ ...character!, campaignId: 'camp-assoc-1' });

      const updatedCampaign = await getCampaignById('camp-assoc-1');
      const updatedCharacter = await getCharacterById('char-assoc-1');

      expect(updatedCampaign?.characterIds).toContain('char-assoc-1');
      expect(updatedCharacter?.campaignId).toBe('camp-assoc-1');
    });

    it('should remove character from campaign', async () => {
      // First assign
      await db.campaigns.put({
        ...(await getCampaignById('camp-assoc-1'))!,
        characterIds: ['char-assoc-1'],
        updatedAt: new Date().toISOString(),
      });
      let character = await getCharacterById('char-assoc-1');
      await db.characters.put({ ...character!, campaignId: 'camp-assoc-1' });

      // Then remove
      const campaign = await getCampaignById('camp-assoc-1');
      await db.campaigns.put({
        ...campaign!,
        characterIds: [],
        updatedAt: new Date().toISOString(),
      });
      character = await getCharacterById('char-assoc-1');
      await db.characters.put({ ...character!, campaignId: undefined });

      const updatedCampaign = await getCampaignById('camp-assoc-1');
      const updatedCharacter = await getCharacterById('char-assoc-1');

      expect(updatedCampaign?.characterIds).toEqual([]);
      expect(updatedCharacter?.campaignId).toBeUndefined();
    });

    it('should track multiple characters in campaign', async () => {
      await db.characters.add(createTestCharacter('char-assoc-2', { name: 'Character 2' }));
      await db.characters.add(createTestCharacter('char-assoc-3', { name: 'Character 3' }));

      await db.campaigns.put({
        ...(await getCampaignById('camp-assoc-1'))!,
        characterIds: ['char-assoc-1', 'char-assoc-2', 'char-assoc-3'],
        updatedAt: new Date().toISOString(),
      });

      const campaign = await getCampaignById('camp-assoc-1');
      expect(campaign?.characterIds).toHaveLength(3);
      expect(campaign?.characterIds).toContain('char-assoc-1');
      expect(campaign?.characterIds).toContain('char-assoc-2');
      expect(campaign?.characterIds).toContain('char-assoc-3');
    });

    it('should handle character deletion by cleaning up campaign reference', async () => {
      // Assign character to campaign
      await db.campaigns.put({
        ...(await getCampaignById('camp-assoc-1'))!,
        characterIds: ['char-assoc-1'],
        updatedAt: new Date().toISOString(),
      });

      // Delete character
      await db.characters.delete('char-assoc-1');

      // Clean up campaign manually (simulates what deleteCampaign should do)
      const campaign = await getCampaignById('camp-assoc-1');
      if (campaign) {
        campaign.characterIds = campaign.characterIds.filter((id) => id !== 'char-assoc-1');
        await db.campaigns.put(campaign);
      }

      const updatedCampaign = await getCampaignById('camp-assoc-1');
      expect(updatedCampaign?.characterIds).toEqual([]);
    });

    it('should handle campaign deletion by cleaning up character references', async () => {
      // Assign character to campaign
      await db.campaigns.put({
        ...(await getCampaignById('camp-assoc-1'))!,
        characterIds: ['char-assoc-1'],
        updatedAt: new Date().toISOString(),
      });
      let character = await getCharacterById('char-assoc-1');
      await db.characters.put({ ...character!, campaignId: 'camp-assoc-1' });

      // Delete campaign and clean up character
      await db.campaigns.delete('camp-assoc-1');
      character = await getCharacterById('char-assoc-1');
      await db.characters.put({ ...character!, campaignId: undefined });

      const updatedCharacter = await getCharacterById('char-assoc-1');
      expect(updatedCharacter?.campaignId).toBeUndefined();

      const campaign = await getCampaignById('camp-assoc-1');
      expect(campaign).toBeUndefined();
    });
  });

  describe('bulk operations', () => {
    it('should add multiple campaigns', async () => {
      await db.campaigns.bulkAdd([
        createTestCampaign('bulk-camp-1'),
        createTestCampaign('bulk-camp-2'),
        createTestCampaign('bulk-camp-3'),
      ]);

      const all = await db.campaigns.toArray();
      expect(all).toHaveLength(3);
    });

    it('should count campaigns correctly', async () => {
      expect(await db.campaigns.count()).toBe(0);

      await db.campaigns.add(createTestCampaign('count-camp-1'));
      expect(await db.campaigns.count()).toBe(1);

      await db.campaigns.add(createTestCampaign('count-camp-2'));
      expect(await db.campaigns.count()).toBe(2);
    });
  });

  describe('search and filter', () => {
    beforeEach(async () => {
      await db.campaigns.add(
        createTestCampaign('search-storm', {
          name: "Storm King's Thunder",
          edition: '2014',
          characterIds: ['char1', 'char2'],
        })
      );
      await db.campaigns.add(
        createTestCampaign('search-abyss', {
          name: 'Out of the Abyss',
          edition: '2014',
          characterIds: ['char3'],
        })
      );
      await db.campaigns.add(
        createTestCampaign('search-phandelver', {
          name: 'Lost Mine of Phandelver',
          edition: '2024',
          characterIds: [],
        })
      );
    });

    it('should filter by name', async () => {
      const all = await db.campaigns.toArray();
      const filtered = all.filter((c) => c.name.toLowerCase().includes('abyss'));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Out of the Abyss');
    });

    it('should filter by edition', async () => {
      const all = await db.campaigns.toArray();
      const filtered2014 = all.filter((c) => c.edition === '2014');
      const filtered2024 = all.filter((c) => c.edition === '2024');
      expect(filtered2014).toHaveLength(2);
      expect(filtered2024).toHaveLength(1);
    });

    it('should find empty campaigns', async () => {
      const all = await db.campaigns.toArray();
      const empty = all.filter((c) => c.characterIds.length === 0);
      expect(empty).toHaveLength(1);
      expect(empty[0].name).toBe('Lost Mine of Phandelver');
    });
  });

  describe('campaign summaries', () => {
    it('should include character count in summary data', async () => {
      await db.campaigns.add(
        createTestCampaign('summary-camp-1', {
          name: 'Test Campaign',
          characterIds: ['char1', 'char2', 'char3'],
        })
      );

      const all = await db.campaigns.toArray();
      const campaign = all[0];

      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.characterIds.length).toBe(3);
    });
  });

  describe('statistics', () => {
    it('should calculate edition distribution', async () => {
      await db.campaigns.add(createTestCampaign('stats-ed-1', { edition: '2014' }));
      await db.campaigns.add(createTestCampaign('stats-ed-2', { edition: '2014' }));
      await db.campaigns.add(createTestCampaign('stats-ed-3', { edition: '2024' }));

      const all = await db.campaigns.toArray();
      const byEdition: Record<string, number> = {};
      for (const camp of all) {
        byEdition[camp.edition] = (byEdition[camp.edition] || 0) + 1;
      }

      expect(byEdition['2014']).toBe(2);
      expect(byEdition['2024']).toBe(1);
    });

    it('should calculate total characters across campaigns', async () => {
      await db.campaigns.add(createTestCampaign('stats-char-1', { characterIds: ['c1', 'c2'] }));
      await db.campaigns.add(
        createTestCampaign('stats-char-2', { characterIds: ['c3', 'c4', 'c5'] })
      );
      await db.campaigns.add(createTestCampaign('stats-char-3', { characterIds: [] }));

      const all = await db.campaigns.toArray();
      const totalCharacters = all.reduce((sum, camp) => sum + camp.characterIds.length, 0);

      expect(totalCharacters).toBe(5);
    });

    it('should find largest campaign', async () => {
      await db.campaigns.add(
        createTestCampaign('stats-large-1', { name: 'Small', characterIds: ['c1'] })
      );
      await db.campaigns.add(
        createTestCampaign('stats-large-2', {
          name: 'Large',
          characterIds: ['c2', 'c3', 'c4', 'c5'],
        })
      );
      await db.campaigns.add(
        createTestCampaign('stats-large-3', { name: 'Medium', characterIds: ['c6', 'c7'] })
      );

      const all = await db.campaigns.toArray();
      const largest = all.reduce((max, camp) =>
        camp.characterIds.length > max.characterIds.length ? camp : max
      );

      expect(largest.name).toBe('Large');
      expect(largest.characterIds.length).toBe(4);
    });
  });
});
