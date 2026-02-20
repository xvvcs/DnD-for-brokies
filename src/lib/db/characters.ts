/**
 * Character Data Layer
 *
 * CRUD operations and utilities for character management.
 * @module db/characters
 */

import { db } from './database';
import type { CharacterTableEntry } from './schema';
import type { Character, CharacterSummary, CharacterUpdate } from '@/types/character';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Conversions
// ============================================================================

/**
 * Convert Character type to CharacterTableEntry for database storage
 * Converts Date objects to ISO strings
 */
function toTableEntry(character: Character): CharacterTableEntry {
  return {
    ...character,
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
  };
}

/**
 * Convert CharacterTableEntry to Character type for application use
 * Converts ISO strings back to Date objects
 */
function fromTableEntry(entry: CharacterTableEntry): Character {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  };
}

/**
 * Convert CharacterTableEntry to CharacterSummary for list views
 */
function toSummary(entry: CharacterTableEntry): CharacterSummary {
  return {
    id: entry.id,
    name: entry.name,
    level: entry.level,
    race: entry.race.name,
    classes: entry.classes.map((c) => `${c.name} ${c.level}`).join(', '),
    currentHp: entry.combat.currentHp,
    maxHp: entry.combat.maxHp,
    updatedAt: new Date(entry.updatedAt),
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new character
 * @param characterData Partial character data (at minimum name, race, class)
 * @returns The created character with generated ID and timestamps
 */
export async function createCharacter(
  characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Character> {
  const now = new Date();
  const newCharacter: Character = {
    ...characterData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  await db.characters.add(toTableEntry(newCharacter));
  return newCharacter;
}

/**
 * Get a single character by ID
 * @param id Character ID
 * @returns Character or null if not found
 */
export async function getCharacter(id: string): Promise<Character | null> {
  const entry = await db.characters.get(id);
  return entry ? fromTableEntry(entry) : null;
}

/**
 * Get all characters
 * @param options Sorting and filtering options
 * @returns Array of characters
 */
export async function getAllCharacters(options?: {
  sortBy?: 'name' | 'level' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<Character[]> {
  const sortField = options?.sortBy || 'updatedAt';
  const sortOrder = options?.sortOrder || 'desc';

  // Use Dexie's orderBy for indexed sorting
  let collection = db.characters.orderBy(sortField);

  if (sortOrder === 'desc') {
    collection = collection.reverse();
  }

  let entries = await collection.toArray();

  if (options?.limit) {
    entries = entries.slice(0, options.limit);
  }

  return entries.map(fromTableEntry);
}

/**
 * Get character summaries (lightweight list view)
 * @param options Sorting and filtering options
 * @returns Array of character summaries
 */
export async function getCharacterSummaries(options?: {
  sortBy?: 'name' | 'level' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<CharacterSummary[]> {
  const sortField = options?.sortBy || 'updatedAt';
  const sortOrder = options?.sortOrder || 'desc';

  let collection = db.characters.orderBy(sortField);

  if (sortOrder === 'desc') {
    collection = collection.reverse();
  }

  let entries = await collection.toArray();

  if (options?.limit) {
    entries = entries.slice(0, options.limit);
  }

  return entries.map(toSummary);
}

/**
 * Update a character
 * @param id Character ID
 * @param changes Partial character changes
 * @returns Updated character or null if not found
 */
export async function updateCharacter(
  id: string,
  changes: CharacterUpdate
): Promise<Character | null> {
  const existing = await db.characters.get(id);
  if (!existing) return null;

  const updated: CharacterTableEntry = {
    ...existing,
    ...changes,
    id: existing.id, // Ensure ID doesn't change
    createdAt: existing.createdAt, // Ensure createdAt doesn't change
    updatedAt: new Date().toISOString(),
  };

  await db.characters.put(updated);
  return fromTableEntry(updated);
}

/**
 * Delete a character
 * @param id Character ID
 * @returns True if deleted, false if not found
 */
export async function deleteCharacter(id: string): Promise<boolean> {
  // Check if character exists
  const existing = await db.characters.get(id);
  if (!existing) return false;

  // Atomically remove from campaigns and delete the character
  await db.transaction('rw', db.characters, db.campaigns, async () => {
    const campaigns = await db.campaigns.toArray();
    for (const campaign of campaigns) {
      if (campaign.characterIds?.includes(id)) {
        campaign.characterIds = campaign.characterIds.filter((cid: string) => cid !== id);
        await db.campaigns.put(campaign);
      }
    }
    await db.characters.delete(id);
  });
  return true;
}

/**
 * Duplicate an existing character
 * @param id Character ID to duplicate
 * @param newName Optional new name (defaults to "{name} (Copy)")
 * @returns Duplicated character or null if source not found
 */
export async function duplicateCharacter(id: string, newName?: string): Promise<Character | null> {
  const source = await db.characters.get(id);
  if (!source) return null;

  const now = new Date();
  const duplicated: CharacterTableEntry = {
    ...source,
    id: uuidv4(),
    name: newName || `${source.name} (Copy)`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await db.characters.add(duplicated);
  return fromTableEntry(duplicated);
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Delete multiple characters
 * @param ids Array of character IDs to delete
 * @returns Number of characters deleted
 */
export async function deleteCharacters(ids: string[]): Promise<number> {
  let deletedCount = 0;

  await db.transaction('rw', db.characters, db.campaigns, async () => {
    for (const id of ids) {
      const deleted = await deleteCharacter(id);
      if (deleted) deletedCount++;
    }
  });

  return deletedCount;
}

/**
 * Update multiple characters' campaign assignment
 * @param characterIds Array of character IDs
 * @param campaignId Campaign ID (null to remove from all campaigns)
 */
export async function assignCharactersToCampaign(
  characterIds: string[],
  campaignId: string | null
): Promise<void> {
  await db.transaction('rw', db.characters, db.campaigns, async () => {
    for (const characterId of characterIds) {
      const character = await db.characters.get(characterId);
      if (character) {
        character.campaignId = campaignId || undefined;
        character.updatedAt = new Date().toISOString();
        await db.characters.put(character);
      }
    }
  });
}

// ============================================================================
// Search and Filter
// ============================================================================

export interface CharacterFilterOptions {
  /** Search by name (case-insensitive partial match) */
  nameQuery?: string;
  /** Filter by campaign ID */
  campaignId?: string | null;
  /** Filter by class name (partial match) */
  className?: string;
  /** Filter by minimum level */
  minLevel?: number;
  /** Filter by maximum level */
  maxLevel?: number;
  /** Sort field */
  sortBy?: 'name' | 'level' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
}

/**
 * Search and filter characters
 * @param options Filter and sort options
 * @returns Filtered character summaries
 */
export async function searchCharacters(
  options: CharacterFilterOptions = {}
): Promise<CharacterSummary[]> {
  let entries = await db.characters.toArray();

  // Apply filters
  if (options.nameQuery) {
    const query = options.nameQuery.toLowerCase();
    entries = entries.filter((char) => char.name.toLowerCase().includes(query));
  }

  if (options.campaignId !== undefined) {
    if (options.campaignId === null) {
      entries = entries.filter((char) => !char.campaignId);
    } else {
      entries = entries.filter((char) => char.campaignId === options.campaignId);
    }
  }

  if (options.className) {
    const classQuery = options.className.toLowerCase();
    entries = entries.filter((char) =>
      char.classes.some((c) => c.name.toLowerCase().includes(classQuery))
    );
  }

  if (options.minLevel !== undefined) {
    entries = entries.filter((char) => char.level >= options.minLevel!);
  }

  if (options.maxLevel !== undefined) {
    entries = entries.filter((char) => char.level <= options.maxLevel!);
  }

  // Apply sorting
  const sortField = options.sortBy || 'updatedAt';
  const sortOrder = options.sortOrder || 'desc';

  entries.sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  if (options.limit) {
    entries = entries.slice(0, options.limit);
  }

  return entries.map(toSummary);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get character statistics
 * @returns Statistics about characters in the database
 */
export async function getCharacterStats(): Promise<{
  total: number;
  byLevel: Record<number, number>;
  byCampaign: Record<string, number>;
  recentlyUpdated: CharacterSummary[];
}> {
  const characters = await db.characters.toArray();

  const byLevel: Record<number, number> = {};
  const byCampaign: Record<string, number> = {};

  for (const char of characters) {
    // Count by level
    byLevel[char.level] = (byLevel[char.level] || 0) + 1;

    // Count by campaign
    const campaignId = char.campaignId || 'uncategorized';
    byCampaign[campaignId] = (byCampaign[campaignId] || 0) + 1;
  }

  // Get 5 most recently updated
  const recentlyUpdated = characters
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(toSummary);

  return {
    total: characters.length,
    byLevel,
    byCampaign,
    recentlyUpdated,
  };
}
