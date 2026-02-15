/**
 * API Endpoints Tests
 *
 * Tests for all Open5E API endpoint modules:
 * - Documents
 * - Classes
 * - Species
 * - Backgrounds
 * - Spells
 * - Equipment
 * - Reference data
 *
 * Uses mocked fetch to avoid real API calls.
 * @module api/endpoints/endpoints.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/database';

// Documents
import { fetchDocuments, fetchDocument, extractDocumentMetadata } from './documents';

// Classes
import { fetchClasses, fetchClassesByDocument, fetchClass } from './classes';

// Species
import {
  fetchSpecies,
  fetchSpeciesByDocument,
  fetchSingleSpecies,
  flattenSpeciesWithSubspecies,
} from './species';

// Backgrounds
import { fetchBackgrounds, fetchBackgroundsByDocument, fetchBackground } from './backgrounds';

// Spells
import {
  fetchSpells,
  fetchSpellsByDocument,
  fetchSpell,
  filterSpellsByClass,
  groupSpellsByLevel,
} from './spells';

// Equipment
import {
  fetchWeapons,
  fetchArmor,
  fetchItems,
  fetchMagicItems,
  fetchAllEquipment,
} from './equipment';

// Reference
import {
  fetchConditions,
  fetchSkills,
  fetchLanguages,
  fetchDamageTypes,
  fetchAllReferenceData,
} from './reference';

// ============================================================================
// Helpers
// ============================================================================

function mockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: function () {
      return mockResponse(data, status);
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

function paginatedResponse<T>(
  results: T[],
  next: string | null = null
): {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} {
  return { count: results.length, next, previous: null, results };
}

// ============================================================================
// Test Setup
// ============================================================================

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  await db.apiCache.clear();
  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Documents
// ============================================================================

describe('Documents Endpoint', () => {
  const sampleDocs = [
    {
      key: 'wotc-srd',
      name: 'SRD 5.1',
      url: 'https://api.open5e.com/v2/documents/wotc-srd/',
      desc: 'Systems Reference Document',
      license_url: 'http://example.com',
      author: 'Wizards of the Coast',
      published_at: '2016-01-01',
    },
    {
      key: 'a5e',
      name: 'A5E',
      url: 'https://api.open5e.com/v2/documents/a5e/',
      desc: 'Level Up: Advanced 5th Edition',
      license_url: 'http://example.com',
      author: 'EN Publishing',
      published_at: '2021-01-01',
    },
  ];

  describe('fetchDocuments', () => {
    it('should fetch all documents', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleDocs)));

      const result = await fetchDocuments();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('wotc-srd');
      expect(result[1].key).toBe('a5e');
    });

    it('should cache documents and return from cache on second call', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleDocs)));

      await fetchDocuments();
      const result = await fetchDocuments();

      expect(result).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleDocs)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([sampleDocs[0]])));

      await fetchDocuments();
      const result = await fetchDocuments(true);

      expect(result).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchDocument', () => {
    it('should fetch a single document by key', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(sampleDocs[0]));

      const result = await fetchDocument('wotc-srd');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('wotc-srd');
    });

    it('should return null for non-existent document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ error: 'Not Found' }, 404));

      const result = await fetchDocument('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('extractDocumentMetadata', () => {
    it('should extract metadata from documents', () => {
      const metadata = extractDocumentMetadata(sampleDocs);

      expect(metadata).toHaveLength(2);
      expect(metadata[0]).toEqual({
        key: 'wotc-srd',
        name: 'SRD 5.1',
        author: 'Wizards of the Coast',
        description: 'Systems Reference Document',
        publishedAt: '2016-01-01',
      });
    });
  });
});

// ============================================================================
// Classes
// ============================================================================

describe('Classes Endpoint', () => {
  const sampleClasses = [
    {
      key: 'fighter',
      name: 'Fighter',
      url: 'https://api.open5e.com/v2/classes/fighter/',
      document: 'wotc-srd',
      description: 'A master of martial combat',
      hit_dice: 'd10',
      hp_at_1st_level: '10 + CON',
      hp_at_higher_levels: '1d10 + CON',
      prof_armor: 'All',
      prof_weapons: 'All',
      prof_tools: 'None',
      prof_saving_throws: ['STR', 'CON'],
      prof_skills: 'Choose 2',
      equipment: 'Chain mail, martial weapon',
      spellcasting_ability: null,
      subtypes_name: 'Martial Archetype',
      archetypes: [],
      class_features: [],
    },
  ];

  describe('fetchClassesByDocument', () => {
    it('should fetch classes for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleClasses)));

      const result = await fetchClassesByDocument('wotc-srd');
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('fighter');
    });
  });

  describe('fetchClasses', () => {
    it('should merge classes from multiple documents', async () => {
      const srdClasses = [sampleClasses[0]];
      const a5eClasses = [{ ...sampleClasses[0], key: 'a5e-fighter', document: 'a5e' }];

      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(srdClasses)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(a5eClasses)));

      const result = await fetchClasses(['wotc-srd', 'a5e']);
      expect(result).toHaveLength(2);
    });
  });

  describe('fetchClass', () => {
    it('should fetch a single class by key', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(sampleClasses[0]));

      const result = await fetchClass('fighter');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('fighter');
    });

    it('should return null for non-existent class', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}, 404));

      const result = await fetchClass('nonexistent');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Species
// ============================================================================

describe('Species Endpoint', () => {
  const sampleSpecies = [
    {
      key: 'elf',
      name: 'Elf',
      url: 'https://api.open5e.com/v2/races/elf/',
      document: 'wotc-srd',
      description: 'Elves are a magical people',
      speed: 30,
      size: 'medium' as const,
      languages: ['Common', 'Elvish'],
      language_desc: 'Common and Elvish',
      traits: [{ name: 'Darkvision', description: 'You can see in dim light.' }],
      subraces: [
        {
          key: 'high-elf',
          name: 'High Elf',
          description: 'A high elf subrace',
          traits: [{ name: 'Cantrip', description: 'You know one cantrip.' }],
        },
      ],
    },
    {
      key: 'dwarf',
      name: 'Dwarf',
      url: 'https://api.open5e.com/v2/races/dwarf/',
      document: 'wotc-srd',
      description: 'Bold and hardy',
      speed: 25,
      size: 'medium' as const,
      languages: ['Common', 'Dwarvish'],
      language_desc: 'Common and Dwarvish',
      traits: [{ name: 'Darkvision', description: 'Dwarven darkvision.' }],
      subraces: [],
    },
  ];

  describe('fetchSpeciesByDocument', () => {
    it('should fetch species for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleSpecies)));

      const result = await fetchSpeciesByDocument('wotc-srd');
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('elf');
    });
  });

  describe('fetchSpecies', () => {
    it('should merge species from multiple documents', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse([sampleSpecies[0]])))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([sampleSpecies[1]])));

      const result = await fetchSpecies(['wotc-srd', 'a5e']);
      expect(result).toHaveLength(2);
    });
  });

  describe('fetchSingleSpecies', () => {
    it('should fetch a single species by key', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(sampleSpecies[0]));

      const result = await fetchSingleSpecies('elf');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('elf');
    });

    it('should return null for non-existent species', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}, 404));

      const result = await fetchSingleSpecies('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('flattenSpeciesWithSubspecies', () => {
    it('should flatten species with their subspecies', () => {
      const options = flattenSpeciesWithSubspecies(sampleSpecies);

      // Elf base + High Elf subrace + Dwarf base = 3
      expect(options).toHaveLength(3);
    });

    it('should include parent info for subspecies', () => {
      const options = flattenSpeciesWithSubspecies(sampleSpecies);

      const highElf = options.find((o) => o.key === 'high-elf');
      expect(highElf).toBeDefined();
      expect(highElf?.parentKey).toBe('elf');
      expect(highElf?.parentName).toBe('Elf');
    });

    it('should combine parent and subspecies traits', () => {
      const options = flattenSpeciesWithSubspecies(sampleSpecies);

      const highElf = options.find((o) => o.key === 'high-elf');
      // Base elf trait (Darkvision) + High Elf trait (Cantrip)
      expect(highElf?.traits).toHaveLength(2);
    });

    it('should set parentKey to null for base species', () => {
      const options = flattenSpeciesWithSubspecies(sampleSpecies);

      const elf = options.find((o) => o.key === 'elf');
      expect(elf?.parentKey).toBeNull();
      expect(elf?.parentName).toBeNull();
    });

    it('should inherit speed and size from parent', () => {
      const options = flattenSpeciesWithSubspecies(sampleSpecies);

      const highElf = options.find((o) => o.key === 'high-elf');
      expect(highElf?.speed).toBe(30);
      expect(highElf?.size).toBe('medium');
    });
  });
});

// ============================================================================
// Backgrounds
// ============================================================================

describe('Backgrounds Endpoint', () => {
  const sampleBackgrounds = [
    {
      key: 'acolyte',
      name: 'Acolyte',
      url: 'https://api.open5e.com/v2/backgrounds/acolyte/',
      document: 'wotc-srd',
      description: 'You have spent your life in the service of a temple.',
      skill_proficiencies: ['Insight', 'Religion'],
      tool_proficiencies: [],
      languages: ['Two of your choice'],
      equipment: 'A holy symbol, prayer book, 5 sticks of incense',
      feature: 'Shelter of the Faithful',
      feature_description: 'You can find shelter at a temple.',
      personality_traits: [],
      ideals: [],
      bonds: [],
      flaws: [],
    },
  ];

  describe('fetchBackgroundsByDocument', () => {
    it('should fetch backgrounds for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleBackgrounds)));

      const result = await fetchBackgroundsByDocument('wotc-srd');
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('acolyte');
    });
  });

  describe('fetchBackgrounds', () => {
    it('should merge backgrounds from multiple documents', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleBackgrounds)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([])));

      const result = await fetchBackgrounds(['wotc-srd', 'a5e']);
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchBackground', () => {
    it('should fetch a single background by key', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(sampleBackgrounds[0]));

      const result = await fetchBackground('acolyte');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('acolyte');
    });
  });
});

// ============================================================================
// Spells
// ============================================================================

describe('Spells Endpoint', () => {
  const sampleSpells = [
    {
      key: 'fireball',
      name: 'Fireball',
      url: 'https://api.open5e.com/v2/spells/fireball/',
      document: 'wotc-srd',
      level: 3,
      school: 'evocation',
      casting_time: '1 action',
      range: '150 feet',
      duration: 'Instantaneous',
      concentration: false,
      ritual: false,
      components: ['V', 'S', 'M'],
      material: 'A tiny ball of bat guano and sulfur',
      desc: 'A bright streak flashes from your pointing finger...',
      higher_levels: 'When you cast this spell using a spell slot of 4th level or higher...',
      classes: ['Sorcerer', 'Wizard'],
      circles: null,
      archetypes: null,
    },
    {
      key: 'cure-wounds',
      name: 'Cure Wounds',
      url: 'https://api.open5e.com/v2/spells/cure-wounds/',
      document: 'wotc-srd',
      level: 1,
      school: 'evocation',
      casting_time: '1 action',
      range: 'Touch',
      duration: 'Instantaneous',
      concentration: false,
      ritual: false,
      components: ['V', 'S'],
      material: null,
      desc: 'A creature you touch regains hit points...',
      higher_levels: null,
      classes: ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger'],
      circles: null,
      archetypes: null,
    },
    {
      key: 'light',
      name: 'Light',
      url: 'https://api.open5e.com/v2/spells/light/',
      document: 'wotc-srd',
      level: 0,
      school: 'evocation',
      casting_time: '1 action',
      range: 'Touch',
      duration: '1 hour',
      concentration: false,
      ritual: false,
      components: ['V', 'M'],
      material: 'A firefly or phosphorescent moss',
      desc: 'You touch one object...',
      higher_levels: null,
      classes: ['Bard', 'Cleric', 'Sorcerer', 'Wizard'],
      circles: null,
      archetypes: null,
    },
  ];

  describe('fetchSpellsByDocument', () => {
    it('should fetch spells for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleSpells)));

      const result = await fetchSpellsByDocument('wotc-srd');
      expect(result).toHaveLength(3);
    });

    it('should apply filters', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse([sampleSpells[0]])));

      await fetchSpellsByDocument('wotc-srd', { level: 3, school: 'evocation' });

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('spell_level=3');
      expect(calledUrl).toContain('school=evocation');
    });
  });

  describe('fetchSpells', () => {
    it('should merge spells from multiple documents', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleSpells)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([])));

      const result = await fetchSpells(['wotc-srd', 'a5e']);
      expect(result).toHaveLength(3);
    });
  });

  describe('fetchSpell', () => {
    it('should fetch a single spell by key', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(sampleSpells[0]));

      const result = await fetchSpell('fireball');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('fireball');
    });
  });

  describe('filterSpellsByClass', () => {
    it('should filter spells by class name', () => {
      const wizardSpells = filterSpellsByClass(sampleSpells, 'Wizard');

      expect(wizardSpells).toHaveLength(2); // Fireball + Light
      expect(wizardSpells.every((s) => s.classes.includes('Wizard'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const wizardSpells = filterSpellsByClass(sampleSpells, 'wizard');
      expect(wizardSpells).toHaveLength(2);
    });

    it('should return empty array for non-matching class', () => {
      const monkSpells = filterSpellsByClass(sampleSpells, 'Monk');
      expect(monkSpells).toHaveLength(0);
    });
  });

  describe('groupSpellsByLevel', () => {
    it('should group spells by level', () => {
      const grouped = groupSpellsByLevel(sampleSpells);

      expect(grouped.get(0)).toHaveLength(1); // Light (cantrip)
      expect(grouped.get(1)).toHaveLength(1); // Cure Wounds
      expect(grouped.get(3)).toHaveLength(1); // Fireball
    });

    it('should sort spells within each level by name', () => {
      const extraSpells = [
        ...sampleSpells,
        {
          ...sampleSpells[0],
          key: 'animate-dead',
          name: 'Animate Dead',
          level: 3,
        },
      ];

      const grouped = groupSpellsByLevel(extraSpells);
      const level3 = grouped.get(3);

      expect(level3).toHaveLength(2);
      expect(level3![0].name).toBe('Animate Dead');
      expect(level3![1].name).toBe('Fireball');
    });

    it('should handle empty spell list', () => {
      const grouped = groupSpellsByLevel([]);
      expect(grouped.size).toBe(0);
    });
  });
});

// ============================================================================
// Equipment
// ============================================================================

describe('Equipment Endpoints', () => {
  const sampleWeapons = [
    {
      key: 'longsword',
      name: 'Longsword',
      url: 'https://api.open5e.com/v2/weapons/longsword/',
      document: 'wotc-srd',
      type: 'Martial Melee',
      description: 'A martial melee weapon',
      cost: '15 gp',
      weight: '3 lb.',
      damage_dice: '1d8',
      damage_type: 'slashing',
      properties: ['versatile'],
      category: 'Martial',
      armor_class: null,
      armor_category: null,
      strength_requirement: null,
      stealth_disadvantage: false,
    },
  ];

  const sampleArmor = [
    {
      key: 'chain-mail',
      name: 'Chain Mail',
      url: 'https://api.open5e.com/v2/armor/chain-mail/',
      document: 'wotc-srd',
      type: 'Heavy Armor',
      description: 'Heavy armor',
      cost: '75 gp',
      weight: '55 lb.',
      damage_dice: null,
      damage_type: null,
      properties: [],
      category: 'Heavy',
      armor_class: 16,
      armor_category: 'Heavy',
      strength_requirement: 13,
      stealth_disadvantage: true,
    },
  ];

  const sampleItems = [
    {
      key: 'rope',
      name: 'Rope, hempen (50 feet)',
      url: 'https://api.open5e.com/v2/items/rope/',
      document: 'wotc-srd',
      type: 'Adventuring Gear',
      description: 'A coil of rope',
      cost: '1 gp',
      weight: '10 lb.',
      damage_dice: null,
      damage_type: null,
      properties: [],
      category: 'Adventuring Gear',
      armor_class: null,
      armor_category: null,
      strength_requirement: null,
      stealth_disadvantage: false,
    },
  ];

  describe('fetchWeapons', () => {
    it('should fetch and merge weapons from multiple documents', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleWeapons)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([])));

      const result = await fetchWeapons(['wotc-srd', 'a5e']);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('longsword');
    });
  });

  describe('fetchArmor', () => {
    it('should fetch armor for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleArmor)));

      const result = await fetchArmor(['wotc-srd']);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('chain-mail');
    });
  });

  describe('fetchItems', () => {
    it('should fetch items for a document', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleItems)));

      const result = await fetchItems(['wotc-srd']);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('rope');
    });
  });

  describe('fetchMagicItems', () => {
    it('should fetch magic items for a document', async () => {
      const magicItems = [
        {
          ...sampleItems[0],
          key: 'bag-of-holding',
          name: 'Bag of Holding',
        },
      ];

      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(magicItems)));

      const result = await fetchMagicItems(['wotc-srd']);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('bag-of-holding');
    });
  });

  describe('fetchAllEquipment', () => {
    it('should fetch all equipment types in parallel', async () => {
      // 4 document keys * 4 equipment types = we need mocks for each
      // but each equipment type fetches for all document keys
      // weapons for wotc-srd, armor for wotc-srd, items for wotc-srd, magic for wotc-srd
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleWeapons)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleArmor)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleItems)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([])));

      const result = await fetchAllEquipment(['wotc-srd']);

      expect(result.weapons).toHaveLength(1);
      expect(result.armor).toHaveLength(1);
      expect(result.items).toHaveLength(1);
      expect(result.magicItems).toHaveLength(0);
    });
  });
});

// ============================================================================
// Reference Data
// ============================================================================

describe('Reference Data Endpoints', () => {
  const sampleConditions = [
    {
      key: 'blinded',
      name: 'Blinded',
      url: 'https://api.open5e.com/v2/conditions/blinded/',
      document: 'wotc-srd',
      description: "A blinded creature can't see.",
    },
    {
      key: 'charmed',
      name: 'Charmed',
      url: 'https://api.open5e.com/v2/conditions/charmed/',
      document: 'wotc-srd',
      description: "A charmed creature can't attack the charmer.",
    },
  ];

  const sampleSkills = [
    {
      key: 'acrobatics',
      name: 'Acrobatics',
      url: 'https://api.open5e.com/v2/skills/acrobatics/',
      document: 'wotc-srd',
      ability_score: 'DEX',
      description: 'Acrobatics skill',
    },
    {
      key: 'athletics',
      name: 'Athletics',
      url: 'https://api.open5e.com/v2/skills/athletics/',
      document: 'wotc-srd',
      ability_score: 'STR',
      description: 'Athletics skill',
    },
  ];

  const sampleLanguages = [
    {
      key: 'common',
      name: 'Common',
      url: 'https://api.open5e.com/v2/languages/common/',
      document: 'wotc-srd',
      type: 'Standard',
      typical_speakers: ['Humans'],
      script: 'Common',
    },
  ];

  const sampleDamageTypes = [
    {
      key: 'fire',
      name: 'Fire',
      url: 'https://api.open5e.com/v2/damagetypes/fire/',
      document: 'wotc-srd',
      description: 'Fire damage',
    },
  ];

  describe('fetchConditions', () => {
    it('should fetch all conditions', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleConditions)));

      const result = await fetchConditions();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('blinded');
    });
  });

  describe('fetchSkills', () => {
    it('should fetch all skills', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleSkills)));

      const result = await fetchSkills();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('acrobatics');
    });
  });

  describe('fetchLanguages', () => {
    it('should fetch all languages', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleLanguages)));

      const result = await fetchLanguages();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('common');
    });
  });

  describe('fetchDamageTypes', () => {
    it('should fetch all damage types', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleDamageTypes)));

      const result = await fetchDamageTypes();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('fire');
    });
  });

  describe('fetchAllReferenceData', () => {
    it('should fetch all reference data in parallel', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleConditions)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleSkills)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleLanguages)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleDamageTypes)));

      const result = await fetchAllReferenceData();

      expect(result.conditions).toHaveLength(2);
      expect(result.skills).toHaveLength(2);
      expect(result.languages).toHaveLength(1);
      expect(result.damageTypes).toHaveLength(1);
    });
  });

  describe('caching behavior', () => {
    it('should cache reference data and return from cache on subsequent calls', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(paginatedResponse(sampleConditions)));

      await fetchConditions();
      const result = await fetchConditions();

      expect(result).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Only one API call
    });

    it('should force refresh reference data when requested', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(paginatedResponse(sampleConditions)))
        .mockResolvedValueOnce(mockResponse(paginatedResponse([sampleConditions[0]])));

      await fetchConditions();
      const result = await fetchConditions(true);

      expect(result).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
