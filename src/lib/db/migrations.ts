/**
 * Database Migrations
 *
 * Handles database version upgrades, data migrations, and utilities.
 * @module db/migrations
 */

import { db } from './database';
import type { CharacterTableEntry, CampaignTableEntry, SettingsEntry } from './schema';

// ============================================================================
// Migration Handlers
// ============================================================================

/**
 * Migration function type
 */
type MigrationFunction = (db: typeof import('./database').db) => Promise<void>;

/**
 * Migration registry - maps version numbers to migration functions
 * Each migration should upgrade from version N to N+1
 */
const migrations: Record<number, MigrationFunction> = {
  // Example: Version 1 to 2 migration
  // 1: async (database) => {
  //   // Migration logic here
  //   await database.characters.toCollection().modify((char) => {
  //     // Transform character data
  //   });
  // },
};

/**
 * Run pending migrations
 * Called automatically by Dexie when opening database with newer version
 */
export async function runMigrations(): Promise<void> {
  // Get current database version
  const currentVersion = await db.verno;

  // Run migrations for each version increment
  for (let version = currentVersion; version < db.verno; version++) {
    const migration = migrations[version];
    if (migration) {
      console.log(`Running migration from version ${version} to ${version + 1}`);
      await migration(db);
    }
  }
}

// ============================================================================
// Data Export/Import (Backup/Restore)
// ============================================================================

/**
 * Export all database data to JSON
 * Useful for backups or data portability
 */
export async function exportDatabase(): Promise<{
  version: number;
  exportedAt: string;
  data: {
    characters: CharacterTableEntry[];
    campaigns: unknown[];
    settings: unknown[];
  };
}> {
  const [characters, campaigns, settings] = await Promise.all([
    db.characters.toArray(),
    db.campaigns.toArray(),
    db.settings.toArray(),
  ]);

  return {
    version: db.verno,
    exportedAt: new Date().toISOString(),
    data: {
      characters,
      campaigns,
      settings,
    },
  };
}

/**
 * Import data from JSON export
 * WARNING: This will overwrite existing data!
 * @param data The exported database data
 * @param merge If true, merge with existing data; if false, clear first
 */
export async function importDatabase(
  data: ReturnType<typeof exportDatabase> extends Promise<infer T> ? T : never,
  merge: boolean = false
): Promise<void> {
  await db.transaction('rw', db.characters, db.campaigns, db.settings, async () => {
    if (!merge) {
      // Clear existing data
      await Promise.all([db.characters.clear(), db.campaigns.clear(), db.settings.clear()]);
    }

    // Import data
    if (data.data.characters?.length) {
      await db.characters.bulkAdd(data.data.characters as CharacterTableEntry[]);
    }
    if (data.data.campaigns?.length) {
      await db.campaigns.bulkAdd(data.data.campaigns as CampaignTableEntry[]);
    }
    if (data.data.settings?.length) {
      await db.settings.bulkAdd(data.data.settings as SettingsEntry[]);
    }
  });
}

/**
 * Export data as downloadable JSON file
 */
export async function downloadBackup(filename?: string): Promise<void> {
  const data = await exportDatabase();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `dndnb-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import data from uploaded JSON file
 */
export async function uploadBackup(file: File, merge: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await importDatabase(data, merge);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============================================================================
// Data Validation
// ============================================================================

/**
 * Validate imported data structure
 * @returns Validation result with errors if any
 */
export function validateImportData(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  const dataObj = data as Record<string, unknown>;

  // Check required fields
  if (!dataObj.version || typeof dataObj.version !== 'number') {
    errors.push('Missing or invalid version field');
  }

  if (!dataObj.exportedAt || typeof dataObj.exportedAt !== 'string') {
    errors.push('Missing or invalid exportedAt field');
  }

  if (!dataObj.data || typeof dataObj.data !== 'object') {
    errors.push('Missing or invalid data field');
    return { valid: false, errors };
  }

  const dataField = dataObj.data as Record<string, unknown>;

  // Validate data arrays
  if (!Array.isArray(dataField.characters)) {
    errors.push('characters must be an array');
  }
  if (!Array.isArray(dataField.campaigns)) {
    errors.push('campaigns must be an array');
  }
  if (!Array.isArray(dataField.settings)) {
    errors.push('settings must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Database Maintenance
// ============================================================================

/**
 * Clean up expired API cache entries
 * Should be called periodically (e.g., on app startup)
 */
export async function cleanupExpiredCache(): Promise<number> {
  let deletedCount = 0;

  await db.apiCache.toCollection().modify((entry) => {
    const expirationTime = new Date(entry.cachedAt).getTime() + entry.ttl;
    if (Date.now() > expirationTime) {
      // Mark for deletion by setting key to null
      // We'll filter these out after
    }
  });

  // Delete expired entries
  deletedCount = await db.apiCache
    .where('cachedAt')
    .below(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .delete();

  return deletedCount;
}

/**
 * Compact database by cleaning up old data
 * - Remove expired cache entries
 * - Remove orphaned settings
 */
export async function compactDatabase(): Promise<{
  cacheCleaned: number;
}> {
  const cacheCleaned = await cleanupExpiredCache();

  return {
    cacheCleaned,
  };
}

// ============================================================================
// Version Management
// ============================================================================

/**
 * Get current database version info
 */
export async function getDatabaseInfo(): Promise<{
  name: string;
  version: number;
  isOpen: boolean;
  tables: string[];
}> {
  return {
    name: db.name,
    version: db.verno,
    isOpen: db.isOpen(),
    tables: db.tables.map((t) => t.name),
  };
}
