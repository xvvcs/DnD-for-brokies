import Dexie, { Table } from 'dexie';
import type {
  CharacterTableEntry,
  CampaignTableEntry,
  ApiCacheEntry,
  SettingsEntry,
} from './schema';
import { DB_CONFIG } from './schema';

/**
 * DnDnB Database Class
 *
 * Extended Dexie database with all tables and indexes configured.
 * Supports characters, campaigns, API caching, and application settings.
 */
class DnDnBDatabase extends Dexie {
  /** Character storage table */
  characters!: Table<CharacterTableEntry, string>;
  /** Campaign storage table */
  campaigns!: Table<CampaignTableEntry, string>;
  /** API response cache table */
  apiCache!: Table<ApiCacheEntry, string>;
  /** Application settings table */
  settings!: Table<SettingsEntry, string>;

  constructor() {
    super(DB_CONFIG.name);

    // Define database schema with indexes for efficient queries
    this.version(DB_CONFIG.version).stores({
      characters: DB_CONFIG.tables.characters.indexes.join(', '),
      campaigns: DB_CONFIG.tables.campaigns.indexes.join(', '),
      apiCache: DB_CONFIG.tables.apiCache.indexes.join(', '),
      settings: DB_CONFIG.tables.settings.indexes.join(', '),
    });
  }

  /**
   * Check database connection status
   * @returns Promise<boolean> - true if connected
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.open();
      return this.isOpen();
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   * @returns Object with table row counts
   */
  async getStats(): Promise<{
    characters: number;
    campaigns: number;
    apiCache: number;
    settings: number;
  }> {
    const [characters, campaigns, apiCache, settings] = await Promise.all([
      this.characters.count(),
      this.campaigns.count(),
      this.apiCache.count(),
      this.settings.count(),
    ]);

    return {
      characters,
      campaigns,
      apiCache,
      settings,
    };
  }

  /**
   * Clear all data (use with caution!)
   * Useful for testing or user-initiated data reset
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.characters.clear(),
      this.campaigns.clear(),
      this.apiCache.clear(),
      this.settings.clear(),
    ]);
  }
}

/**
 * Singleton database instance
 * Use this throughout the application
 */
export const db = new DnDnBDatabase();

/**
 * Re-export database types for convenience
 */
export type { CharacterTableEntry, CampaignTableEntry, ApiCacheEntry, SettingsEntry };
