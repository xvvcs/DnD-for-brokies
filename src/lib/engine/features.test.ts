/**
 * Feature Management Tests
 */

import { describe, it, expect } from 'vitest';

import {
  aggregateFeatures,
  getFeaturesAtLevel,
  getFeaturesUpToLevel,
  hasLimitedUses,
  getRemainingUses,
  hasUsesRemaining,
  useFeature,
  resetFeatureUses,
  resetFeaturesOnRest,
  getFeaturesResetOnRest,
  findFeatureById,
  findFeaturesBySource,
  searchFeatures,
  getPassiveFeatures,
  getActiveFeatures,
  groupFeaturesBySource,
  sortFeaturesByLevel,
  getFeatureSummary,
  createLimitedUseFeature,
  createPassiveFeature,
  countFeatures,
  countLimitedUseFeatures,
  hasFeature,
  getFeatureCountBySource,
} from './features';
import type { CharacterFeature } from '@/types/game';

describe('Feature Aggregation', () => {
  const mockFeatures = [
    {
      id: '1',
      name: 'Second Wind',
      description: 'Regain HP',
      source: 'Class: Fighter',
      levelRequired: 1,
    },
    {
      id: '2',
      name: 'Action Surge',
      description: 'Extra action',
      source: 'Class: Fighter',
      levelRequired: 2,
    },
    {
      id: '3',
      name: 'Extra Attack',
      description: 'Attack twice',
      source: 'Class: Fighter',
      levelRequired: 5,
    },
  ];

  const mockSpeciesTraits = [
    { id: '4', name: 'Darkvision', description: 'See in dark', source: 'Race: Elf' },
    { id: '5', name: 'Fey Ancestry', description: 'Charm immunity', source: 'Race: Elf' },
  ];

  const mockBackgroundFeature = {
    id: '6',
    name: 'Feature',
    description: 'Background feature',
    source: 'Background: Soldier',
  };

  const mockFeats = [
    { id: '7', name: 'Sharpshooter', description: 'No disadvantage', source: 'Feat: Sharpshooter' },
  ];

  describe('aggregateFeatures', () => {
    it('should aggregate all features', () => {
      const result = aggregateFeatures(
        [{ classKey: 'fighter', level: 5, features: mockFeatures }],
        mockSpeciesTraits,
        mockBackgroundFeature,
        mockFeats
      );

      expect(result.allFeatures).toHaveLength(7);
      expect(result.classFeatures).toHaveLength(3);
      expect(result.speciesTraits).toHaveLength(2);
      expect(result.backgroundFeature).toBe(mockBackgroundFeature);
      expect(result.feats).toHaveLength(1);
    });

    it('should filter class features by level', () => {
      const result = aggregateFeatures(
        [{ classKey: 'fighter', level: 2, features: mockFeatures }],
        [],
        null,
        []
      );

      expect(result.classFeatures).toHaveLength(2);
      expect(result.allFeatures).toHaveLength(2);
    });

    it('should handle empty background', () => {
      const result = aggregateFeatures(
        [{ classKey: 'fighter', level: 1, features: mockFeatures }],
        mockSpeciesTraits,
        null,
        []
      );

      expect(result.backgroundFeature).toBeNull();
      expect(result.allFeatures).toHaveLength(3); // 1 class + 2 species
    });
  });

  describe('getFeaturesAtLevel', () => {
    it('should get features at specific level', () => {
      const result = getFeaturesAtLevel(mockFeatures, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second Wind');
    });

    it('should return empty array if no features at level', () => {
      const result = getFeaturesAtLevel(mockFeatures, 3);
      expect(result).toHaveLength(0);
    });
  });

  describe('getFeaturesUpToLevel', () => {
    it('should get features up to max level', () => {
      const result = getFeaturesUpToLevel(mockFeatures, 2);
      expect(result).toHaveLength(2);
    });

    it('should include features at max level', () => {
      const result = getFeaturesUpToLevel(mockFeatures, 5);
      expect(result).toHaveLength(3);
    });
  });
});

describe('Limited-Use Feature Management', () => {
  const unlimitedFeature: CharacterFeature = {
    id: '1',
    name: 'Darkvision',
    description: 'See in dark',
    source: 'Race: Elf',
  };

  const limitedFeature: CharacterFeature = {
    id: '2',
    name: 'Second Wind',
    description: 'Regain HP',
    source: 'Class: Fighter',
    uses: {
      max: 1,
      used: 0,
      resetOn: 'short',
    },
  };

  const depletedFeature: CharacterFeature = {
    id: '3',
    name: 'Action Surge',
    description: 'Extra action',
    source: 'Class: Fighter',
    uses: {
      max: 1,
      used: 1,
      resetOn: 'short',
    },
  };

  describe('hasLimitedUses', () => {
    it('should return true for limited use features', () => {
      expect(hasLimitedUses(limitedFeature)).toBe(true);
    });

    it('should return false for unlimited features', () => {
      expect(hasLimitedUses(unlimitedFeature)).toBe(false);
    });
  });

  describe('getRemainingUses', () => {
    it('should return remaining uses for limited feature', () => {
      expect(getRemainingUses(limitedFeature)).toBe(1);
      expect(getRemainingUses(depletedFeature)).toBe(0);
    });

    it('should return null for unlimited feature', () => {
      expect(getRemainingUses(unlimitedFeature)).toBeNull();
    });
  });

  describe('hasUsesRemaining', () => {
    it('should return true if uses remain', () => {
      expect(hasUsesRemaining(limitedFeature)).toBe(true);
    });

    it('should return false if no uses remain', () => {
      expect(hasUsesRemaining(depletedFeature)).toBe(false);
    });

    it('should return true for unlimited features', () => {
      expect(hasUsesRemaining(unlimitedFeature)).toBe(true);
    });
  });

  describe('useFeature', () => {
    it('should decrement uses', () => {
      const result = useFeature(limitedFeature);
      expect(result).not.toBeNull();
      expect(result!.uses!.used).toBe(1);
    });

    it('should return null when no uses remain', () => {
      const result = useFeature(depletedFeature);
      expect(result).toBeNull();
    });

    it('should return feature unchanged for unlimited features', () => {
      const result = useFeature(unlimitedFeature);
      expect(result).toEqual(unlimitedFeature);
    });
  });

  describe('resetFeatureUses', () => {
    it('should reset uses to 0', () => {
      const result = resetFeatureUses(depletedFeature);
      expect(result.uses!.used).toBe(0);
    });

    it('should return feature unchanged for unlimited features', () => {
      const result = resetFeatureUses(unlimitedFeature);
      expect(result).toEqual(unlimitedFeature);
    });
  });
});

describe('Rest Mechanics', () => {
  const shortRestFeature: CharacterFeature = {
    id: '1',
    name: 'Second Wind',
    description: 'Regain HP',
    source: 'Class: Fighter',
    uses: {
      max: 1,
      used: 1,
      resetOn: 'short',
    },
  };

  const longRestFeature: CharacterFeature = {
    id: '2',
    name: 'Channel Divinity',
    description: 'Divine power',
    source: 'Class: Cleric',
    uses: {
      max: 2,
      used: 2,
      resetOn: 'long',
    },
  };

  const dawnFeature: CharacterFeature = {
    id: '3',
    name: 'Dawn Power',
    description: 'Daily power',
    source: 'Magic Item',
    uses: {
      max: 1,
      used: 1,
      resetOn: 'dawn',
    },
  };

  const features = [shortRestFeature, longRestFeature, dawnFeature];

  describe('resetFeaturesOnRest', () => {
    it('should reset short rest features on short rest', () => {
      const result = resetFeaturesOnRest(features, 'short');
      expect(result[0].uses!.used).toBe(0);
      expect(result[1].uses!.used).toBe(2); // Long rest feature unchanged
    });

    it('should reset all features on long rest', () => {
      const result = resetFeaturesOnRest(features, 'long');
      expect(result[0].uses!.used).toBe(0);
      expect(result[1].uses!.used).toBe(0);
      expect(result[2].uses!.used).toBe(0);
    });
  });

  describe('getFeaturesResetOnRest', () => {
    it('should get short rest features', () => {
      const result = getFeaturesResetOnRest(features, 'short');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second Wind');
    });

    it('should get all features on long rest', () => {
      const result = getFeaturesResetOnRest(features, 'long');
      expect(result).toHaveLength(3);
    });
  });
});

describe('Feature Search and Filter', () => {
  const features: CharacterFeature[] = [
    { id: '1', name: 'Darkvision', description: 'See in dark', source: 'Race: Elf' },
    { id: '2', name: 'Second Wind', description: 'Regain HP', source: 'Class: Fighter' },
    { id: '3', name: 'Action Surge', description: 'Extra action', source: 'Class: Fighter' },
  ];

  describe('findFeatureById', () => {
    it('should find feature by ID', () => {
      const result = findFeatureById(features, '2');
      expect(result?.name).toBe('Second Wind');
    });

    it('should return undefined if not found', () => {
      const result = findFeatureById(features, '999');
      expect(result).toBeUndefined();
    });
  });

  describe('findFeaturesBySource', () => {
    it('should find features by source', () => {
      const result = findFeaturesBySource(features, 'Fighter');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if none match', () => {
      const result = findFeaturesBySource(features, 'Wizard');
      expect(result).toHaveLength(0);
    });
  });

  describe('searchFeatures', () => {
    it('should search by name', () => {
      const result = searchFeatures(features, 'wind');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second Wind');
    });

    it('should search by description', () => {
      const result = searchFeatures(features, 'action');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Action Surge');
    });

    it('should be case insensitive', () => {
      const result = searchFeatures(features, 'DARK');
      expect(result).toHaveLength(1);
    });
  });

  describe('getPassiveFeatures', () => {
    it('should return only passive features', () => {
      const result = getPassiveFeatures(features);
      expect(result).toHaveLength(3); // All are passive
    });
  });

  describe('getActiveFeatures', () => {
    it('should return only features with uses', () => {
      const featuresWithUses: CharacterFeature[] = [
        ...features,
        {
          id: '4',
          name: 'Limited',
          description: 'Limited use',
          source: 'Test',
          uses: { max: 1, used: 0, resetOn: 'short' },
        },
      ];
      const result = getActiveFeatures(featuresWithUses);
      expect(result).toHaveLength(1);
    });
  });
});

describe('Feature Organization', () => {
  const features: CharacterFeature[] = [
    { id: '1', name: 'Darkvision', description: 'See in dark', source: 'Race: Elf' },
    { id: '2', name: 'Second Wind', description: 'Regain HP', source: 'Class: Fighter' },
    { id: '3', name: 'Action Surge', description: 'Extra action', source: 'Class: Fighter' },
    { id: '4', name: 'Fey Ancestry', description: 'Advantage on saves', source: 'Race: Elf' },
  ];

  describe('groupFeaturesBySource', () => {
    it('should group features by source', () => {
      const result = groupFeaturesBySource(features);
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['Race: Elf']).toHaveLength(2);
      expect(result['Class: Fighter']).toHaveLength(2);
    });
  });

  describe('sortFeaturesByLevel', () => {
    it('should sort features by level', () => {
      const levelFeatures = [
        { id: '1', name: 'Level 5', levelRequired: 5 },
        { id: '2', name: 'Level 1', levelRequired: 1 },
        { id: '3', name: 'Level 3', levelRequired: 3 },
      ];
      const result = sortFeaturesByLevel(levelFeatures);
      expect(result[0].name).toBe('Level 1');
      expect(result[1].name).toBe('Level 3');
      expect(result[2].name).toBe('Level 5');
    });
  });

  describe('getFeatureSummary', () => {
    it('should format feature summary', () => {
      const feature: CharacterFeature = {
        id: '1',
        name: 'Test',
        description: 'Test feature',
        source: 'Class: Fighter',
        level: 5,
      };
      expect(getFeatureSummary(feature)).toContain('Test');
    });

    it('should include level info', () => {
      const feature = {
        id: '1',
        name: 'Test',
        description: 'Test desc',
        source: 'Test',
        levelRequired: 3,
      };
      const summary = getFeatureSummary(feature as CharacterFeature);
      expect(summary).toContain('Level 3');
    });

    it('should include uses info', () => {
      const feature: CharacterFeature = {
        id: '1',
        name: 'Test',
        description: 'Test',
        source: 'Test',
        uses: { max: 3, used: 1, resetOn: 'short' },
      };
      const summary = getFeatureSummary(feature);
      expect(summary).toContain('[2/3]');
    });
  });
});

describe('Feature Creation', () => {
  describe('createLimitedUseFeature', () => {
    it('should create limited use feature', () => {
      const result = createLimitedUseFeature(
        '1',
        'Second Wind',
        'Regain HP',
        'Class: Fighter',
        1,
        'short',
        1
      );
      expect(result.name).toBe('Second Wind');
      expect(result.uses.max).toBe(1);
      expect(result.uses.resetOn).toBe('short');
      expect(result.level).toBe(1);
    });
  });

  describe('createPassiveFeature', () => {
    it('should create passive feature', () => {
      const result = createPassiveFeature('1', 'Darkvision', 'See in dark', 'Race: Elf');
      expect(result.name).toBe('Darkvision');
      expect(result.uses).toBeUndefined();
    });
  });
});

describe('Utility Functions', () => {
  const allFeatures: CharacterFeature[] = [
    { id: '1', name: 'Class', description: 'Class feature', source: 'Class: Fighter' },
    { id: '2', name: 'Species', description: 'Species trait', source: 'Race: Elf' },
    {
      id: '3',
      name: 'Background',
      description: 'Background feature',
      source: 'Background: Soldier',
    },
    { id: '4', name: 'Feat', description: 'Feat description', source: 'Feat: Sharpshooter' },
  ];

  const collection = {
    classFeatures: [
      {
        id: '1',
        name: 'Class',
        description: 'Class feature',
        source: 'Class: Fighter',
        levelRequired: 1,
      },
    ],
    speciesTraits: [
      { id: '2', name: 'Species', description: 'Species trait', source: 'Race: Elf' },
    ],
    backgroundFeature: {
      id: '3',
      name: 'Background',
      description: 'Background feature',
      source: 'Background: Soldier',
    },
    feats: [
      { id: '4', name: 'Feat', description: 'Feat description', source: 'Feat: Sharpshooter' },
    ],
    allFeatures,
  };

  describe('countFeatures', () => {
    it('should count all features', () => {
      expect(countFeatures(collection)).toBe(4);
    });
  });

  describe('countLimitedUseFeatures', () => {
    it('should count limited use features', () => {
      const features: CharacterFeature[] = [
        { id: '1', name: 'Passive', description: 'Passive', source: 'Test' },
        {
          id: '2',
          name: 'Active',
          description: 'Active',
          source: 'Test',
          uses: { max: 1, used: 0, resetOn: 'short' },
        },
      ];
      expect(countLimitedUseFeatures(features)).toBe(1);
    });
  });

  describe('hasFeature', () => {
    it('should return true if feature exists', () => {
      expect(hasFeature(collection.allFeatures, '1')).toBe(true);
    });

    it('should return false if feature does not exist', () => {
      expect(hasFeature(collection.allFeatures, '999')).toBe(false);
    });
  });

  describe('getFeatureCountBySource', () => {
    it('should count features by source', () => {
      expect(getFeatureCountBySource(collection.allFeatures, 'Class: Fighter')).toBe(1);
      expect(getFeatureCountBySource(collection.allFeatures, 'Race: Elf')).toBe(1);
    });
  });
});
