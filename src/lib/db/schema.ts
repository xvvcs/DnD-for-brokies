/**
 * Database Schema Definitions
 *
 * TypeScript interfaces and schema definitions for Dexie.js IndexedDB.
 * @module db/schema
 */

import type { Character } from '@/types/character';
import type { Campaign } from '@/types/campaign';

// ============================================================================
// Database Tables
// ============================================================================

/**
 * Character table entry
 * Stores the full character data with IndexedDB-compatible types
 */
export interface CharacterTableEntry extends Omit<Character, 'createdAt' | 'updatedAt'> {
  // Dexie stores dates as strings, so we keep them as ISO strings
  createdAt: string;
  updatedAt: string;
}

/**
 * Campaign table entry
 * Stores campaign data with IndexedDB-compatible types
 */
export interface CampaignTableEntry extends Omit<Campaign, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

/**
 * API Cache entry for Open5E data
 * Caches API responses to reduce network requests
 */
export interface ApiCacheEntry {
  /** Cache key: format "{endpoint}:{paramsHash}" */
  key: string;
  /** The cached data */
  data: unknown;
  /** Document key this data belongs to */
  documentKey: string;
  /** API version/document version */
  version: string;
  /** Timestamp when cached */
  cachedAt: string;
  /** Time-to-live in milliseconds (default: 24 hours) */
  ttl: number;
}

/**
 * Application settings
 * Stores user preferences and app state
 */
export interface SettingsEntry {
  /** Setting key */
  key: string;
  /** Setting value (JSON-serializable) */
  value: unknown;
  /** Last updated timestamp */
  updatedAt: string;
}

// ============================================================================
// Database Schema Definition
// ============================================================================

/**
 * Database version and schema configuration
 * Increment version when changing indexes or adding tables
 */
export const DB_CONFIG = {
  name: 'dndnb',
  version: 2,
  tables: {
    characters: {
      name: 'characters',
      primaryKey: 'id',
      indexes: [
        'name',
        'level',
        'updatedAt',
        'campaignId',
        // Compound indexes for common queries
        '[level+updatedAt]',
        '[name+updatedAt]',
      ],
    },
    campaigns: {
      name: 'campaigns',
      primaryKey: 'id',
      indexes: ['name', 'updatedAt'],
    },
    apiCache: {
      name: 'apiCache',
      primaryKey: 'key',
      indexes: ['documentKey', 'cachedAt'],
    },
    settings: {
      name: 'settings',
      primaryKey: 'key',
      indexes: [],
    },
  },
} as const;

/**
 * Type helper for table names
 */
export type TableName = keyof typeof DB_CONFIG.tables;

/**
 * Type mapping from table names to entry types
 */
export interface TableTypes {
  characters: CharacterTableEntry;
  campaigns: CampaignTableEntry;
  apiCache: ApiCacheEntry;
  settings: SettingsEntry;
}

// ============================================================================
// Default TTL Values
// ============================================================================

/**
 * Cache TTL configuration
 * Different types of data have different lifetimes
 */
export const CACHE_TTL = {
  /** Reference data (conditions, skills, languages) - 30 days */
  reference: 30 * 24 * 60 * 60 * 1000,
  /** Game content (classes, species, backgrounds) - 7 days */
  content: 7 * 24 * 60 * 60 * 1000,
  /** Spells and equipment - 7 days */
  spells: 7 * 24 * 60 * 60 * 1000,
  /** Documents list - 30 days (rarely changes) */
  documents: 30 * 24 * 60 * 60 * 1000,
  /** Default - 24 hours */
  default: 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Settings Keys
// ============================================================================

/**
 * Known settings keys for type safety
 */
export const SETTINGS_KEYS = {
  /** Last selected documents for character creation */
  lastSelectedDocuments: 'lastSelectedDocuments',
  /** UI preferences */
  sidebarOpen: 'sidebarOpen',
  /** Theme preference */
  theme: 'theme',
  /** Last visited character ID */
  lastCharacterId: 'lastCharacterId',
  /** Cache statistics */
  cacheStats: 'cacheStats',
  /** Auth0 sub of the first/owner account (single-account lock) */
  authOwnerSub: 'authOwnerSub',
} as const;

/**
 * Type for settings keys
 */
export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];
