/**
 * Feature Management - D&D 5e
 *
 * Functions for aggregating and tracking character features,
 * including class features, species traits, background features,
 * and feats with use tracking.
 */

import type { CharacterFeature } from '@/types/game';

// ============================================================================
// Types
// ============================================================================

export interface FeatureWithLevel extends CharacterFeature {
  levelRequired: number;
}

export interface LimitedUseFeature extends CharacterFeature {
  uses: {
    max: number;
    used: number;
    resetOn: 'short' | 'long' | 'dawn' | 'other';
  };
}

export interface FeatureCollection {
  classFeatures: FeatureWithLevel[];
  speciesTraits: CharacterFeature[];
  backgroundFeature: CharacterFeature | null;
  feats: CharacterFeature[];
  allFeatures: CharacterFeature[];
}

export type RestType = 'short' | 'long';

// ============================================================================
// Feature Aggregation
// ============================================================================

/**
 * Aggregate all features for a character
 *
 * @param classLevels - Array of { classKey, level, features }
 * @param speciesTraits - Species traits
 * @param backgroundFeature - Background feature
 * @param feats - Feats
 * @returns Complete feature collection
 */
export function aggregateFeatures(
  classLevels: Array<{
    classKey: string;
    level: number;
    features: FeatureWithLevel[];
  }>,
  speciesTraits: CharacterFeature[] = [],
  backgroundFeature: CharacterFeature | null = null,
  feats: CharacterFeature[] = []
): FeatureCollection {
  const classFeatures: FeatureWithLevel[] = [];

  // Collect class features up to current level for each class
  for (const { level, features } of classLevels) {
    const availableFeatures = features.filter((f) => f.levelRequired <= level);
    classFeatures.push(...availableFeatures);
  }

  const allFeatures: CharacterFeature[] = [
    ...classFeatures,
    ...speciesTraits,
    ...(backgroundFeature ? [backgroundFeature] : []),
    ...feats,
  ];

  return {
    classFeatures,
    speciesTraits,
    backgroundFeature,
    feats,
    allFeatures,
  };
}

/**
 * Get features available at a specific character level
 *
 * @param allFeatures - All character features
 * @param characterLevel - Current character level
 * @returns Features gained at this level
 */
export function getFeaturesAtLevel(
  features: FeatureWithLevel[],
  level: number
): FeatureWithLevel[] {
  return features.filter((f) => f.levelRequired === level);
}

/**
 * Get features available up to a specific level
 *
 * @param features - All features with level requirements
 * @param maxLevel - Maximum level to include
 * @returns Features available at or below this level
 */
export function getFeaturesUpToLevel<T extends { levelRequired?: number }>(
  features: T[],
  maxLevel: number
): T[] {
  return features.filter((f) => (f.levelRequired ?? 1) <= maxLevel);
}

// ============================================================================
// Limited-Use Feature Management
// ============================================================================

/**
 * Check if a feature has limited uses
 */
export function hasLimitedUses(feature: CharacterFeature): feature is LimitedUseFeature {
  return feature.uses !== undefined;
}

/**
 * Get remaining uses for a feature
 *
 * @param feature - The feature
 * @returns Remaining uses, or null if not limited
 */
export function getRemainingUses(feature: CharacterFeature): number | null {
  if (!hasLimitedUses(feature)) return null;
  return feature.uses.max - feature.uses.used;
}

/**
 * Check if a feature has uses remaining
 *
 * @param feature - The feature
 * @returns Whether uses remain, or true if not limited
 */
export function hasUsesRemaining(feature: CharacterFeature): boolean {
  if (!hasLimitedUses(feature)) return true;
  return feature.uses.used < feature.uses.max;
}

/**
 * Use a feature (decrement uses)
 *
 * @param feature - The feature to use
 * @returns Updated feature, or null if no uses remain
 */
export function useFeature(feature: CharacterFeature): CharacterFeature | null {
  if (!hasLimitedUses(feature)) return feature;
  if (feature.uses.used >= feature.uses.max) return null;

  return {
    ...feature,
    uses: {
      ...feature.uses,
      used: feature.uses.used + 1,
    },
  };
}

/**
 * Reset feature uses
 *
 * @param feature - The feature to reset
 * @returns Feature with uses reset to maximum
 */
export function resetFeatureUses(feature: CharacterFeature): CharacterFeature {
  if (!hasLimitedUses(feature)) return feature;

  return {
    ...feature,
    uses: {
      ...feature.uses,
      used: 0,
    },
  };
}

// ============================================================================
// Rest Mechanics
// ============================================================================

/**
 * Reset features on a rest
 *
 * @param features - All character features
 * @param restType - Type of rest ('short' or 'long')
 * @returns Features with appropriate resets
 */
export function resetFeaturesOnRest(
  features: CharacterFeature[],
  restType: RestType
): CharacterFeature[] {
  return features.map((feature) => {
    if (!hasLimitedUses(feature)) return feature;

    // Short rest resets short rest features only
    // Long rest resets short rest, long rest, and dawn features
    const shouldReset =
      restType === 'long' ? feature.uses.resetOn !== 'other' : feature.uses.resetOn === 'short';

    if (!shouldReset) return feature;

    return resetFeatureUses(feature);
  });
}

/**
 * Get features that reset on a specific rest type
 *
 * @param features - All character features
 * @param restType - Type of rest
 * @returns Features that would reset on this rest
 */
export function getFeaturesResetOnRest(
  features: CharacterFeature[],
  restType: RestType
): LimitedUseFeature[] {
  return features.filter((f): f is LimitedUseFeature => {
    if (!hasLimitedUses(f)) return false;
    return restType === 'long' || f.uses.resetOn === restType;
  });
}

// ============================================================================
// Feature Search and Filter
// ============================================================================

/**
 * Find a feature by ID
 *
 * @param features - All features
 * @param id - Feature ID
 * @returns The feature, or undefined if not found
 */
export function findFeatureById(
  features: CharacterFeature[],
  id: string
): CharacterFeature | undefined {
  return features.find((f) => f.id === id);
}

/**
 * Find features by source
 *
 * @param features - All features
 * @param source - Source to search for (e.g., "Class: Fighter")
 * @returns Matching features
 */
export function findFeaturesBySource(
  features: CharacterFeature[],
  source: string
): CharacterFeature[] {
  return features.filter((f) => f.source.includes(source));
}

/**
 * Search features by name
 *
 * @param features - All features
 * @param query - Search query
 * @returns Matching features
 */
export function searchFeatures(features: CharacterFeature[], query: string): CharacterFeature[] {
  const lowerQuery = query.toLowerCase();
  return features.filter(
    (f) =>
      f.name.toLowerCase().includes(lowerQuery) || f.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get features that provide passive bonuses
 * (Features without uses and without activation)
 *
 * @param features - All features
 * @returns Passive features
 */
export function getPassiveFeatures(features: CharacterFeature[]): CharacterFeature[] {
  return features.filter((f) => !hasLimitedUses(f));
}

/**
 * Get active features (with limited uses)
 *
 * @param features - All features
 * @returns Active features
 */
export function getActiveFeatures(features: CharacterFeature[]): LimitedUseFeature[] {
  return features.filter(hasLimitedUses);
}

// ============================================================================
// Feature Organization
// ============================================================================

/**
 * Group features by source
 *
 * @param features - All features
 * @returns Features grouped by source
 */
export function groupFeaturesBySource(
  features: CharacterFeature[]
): Record<string, CharacterFeature[]> {
  const groups: Record<string, CharacterFeature[]> = {};

  for (const feature of features) {
    if (!groups[feature.source]) {
      groups[feature.source] = [];
    }
    groups[feature.source].push(feature);
  }

  return groups;
}

/**
 * Sort features by level
 *
 * @param features - Features with level information
 * @returns Sorted features
 */
export function sortFeaturesByLevel<T extends { levelRequired?: number }>(features: T[]): T[] {
  return [...features].sort((a, b) => (a.levelRequired ?? 0) - (b.levelRequired ?? 0));
}

/**
 * Get feature summary
 *
 * @param feature - The feature
 * @returns Summary string
 */
export function getFeatureSummary(feature: CharacterFeature): string {
  const levelInfo = 'levelRequired' in feature ? ` (Level ${feature.levelRequired})` : '';
  const usesInfo = hasLimitedUses(feature)
    ? ` [${feature.uses.max - feature.uses.used}/${feature.uses.max}]`
    : '';
  return `${feature.name}${levelInfo}${usesInfo}`;
}

// ============================================================================
// Common Feature Patterns
// ============================================================================

/**
 * Create a limited-use feature
 *
 * @param id - Feature ID
 * @param name - Feature name
 * @param description - Feature description
 * @param source - Feature source
 * @param maxUses - Maximum uses
 * @param resetOn - When uses reset
 * @param level - Level required (optional)
 * @returns Created feature
 */
export function createLimitedUseFeature(
  id: string,
  name: string,
  description: string,
  source: string,
  maxUses: number,
  resetOn: 'short' | 'long' | 'dawn' | 'other',
  level?: number
): LimitedUseFeature {
  return {
    id,
    name,
    description,
    source,
    level,
    uses: {
      max: maxUses,
      used: 0,
      resetOn,
    },
  };
}

/**
 * Create a passive feature
 *
 * @param id - Feature ID
 * @param name - Feature name
 * @param description - Feature description
 * @param source - Feature source
 * @param level - Level required (optional)
 * @returns Created feature
 */
export function createPassiveFeature(
  id: string,
  name: string,
  description: string,
  source: string,
  level?: number
): CharacterFeature {
  return {
    id,
    name,
    description,
    source,
    level,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Count total features
 *
 * @param collection - Feature collection
 * @returns Total count
 */
export function countFeatures(collection: FeatureCollection): number {
  return collection.allFeatures.length;
}

/**
 * Count limited-use features
 *
 * @param features - All features
 * @returns Count of limited-use features
 */
export function countLimitedUseFeatures(features: CharacterFeature[]): number {
  return features.filter(hasLimitedUses).length;
}

/**
 * Check if character has a specific feature
 *
 * @param features - All features
 * @param featureId - Feature ID to check
 * @returns Whether feature exists
 */
export function hasFeature(features: CharacterFeature[], featureId: string): boolean {
  return features.some((f) => f.id === featureId);
}

/**
 * Get feature count by source
 *
 * @param features - All features
 * @param source - Source to count
 * @returns Count of features from this source
 */
export function getFeatureCountBySource(features: CharacterFeature[], source: string): number {
  return features.filter((f) => f.source === source).length;
}
