/**
 * Campaign Data Layer
 *
 * CRUD operations and utilities for campaign management.
 * @module db/campaigns
 */

import { db } from './database';
import type { CampaignTableEntry } from './schema';
import type { Campaign, CampaignSummary, CampaignUpdate } from '@/types/campaign';
import type { CharacterSummary } from '@/types/character';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Conversions
// ============================================================================

/**
 * Convert Campaign type to CampaignTableEntry for database storage
 * Converts Date objects to ISO strings
 */
function toTableEntry(campaign: Campaign): CampaignTableEntry {
  return {
    ...campaign,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

/**
 * Convert CampaignTableEntry to Campaign type for application use
 * Converts ISO strings back to Date objects
 */
function fromTableEntry(entry: CampaignTableEntry): Campaign {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  };
}

/**
 * Convert CampaignTableEntry to CampaignSummary for list views
 */
function toSummary(entry: CampaignTableEntry): CampaignSummary {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    characterCount: entry.characterIds.length,
    edition: entry.edition,
    updatedAt: new Date(entry.updatedAt),
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new campaign
 * @param campaignData Partial campaign data (at minimum name and edition)
 * @returns The created campaign with generated ID and timestamps
 */
export async function createCampaign(
  campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Campaign> {
  const now = new Date();
  const newCampaign: Campaign = {
    ...campaignData,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  await db.campaigns.add(toTableEntry(newCampaign));
  return newCampaign;
}

/**
 * Get a single campaign by ID
 * @param id Campaign ID
 * @returns Campaign or null if not found
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
  const entry = await db.campaigns.get(id);
  return entry ? fromTableEntry(entry) : null;
}

/**
 * Get all campaigns
 * @param options Sorting options
 * @returns Array of campaigns
 */
export async function getAllCampaigns(options?: {
  sortBy?: 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<Campaign[]> {
  const sortField = options?.sortBy || 'updatedAt';
  const sortOrder = options?.sortOrder || 'desc';

  // Use Dexie's orderBy for indexed sorting
  let collection = db.campaigns.orderBy(sortField);

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
 * Get campaign summaries (lightweight list view)
 * @param options Sorting options
 * @returns Array of campaign summaries
 */
export async function getCampaignSummaries(options?: {
  sortBy?: 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<CampaignSummary[]> {
  const sortField = options?.sortBy || 'updatedAt';
  const sortOrder = options?.sortOrder || 'desc';

  let collection = db.campaigns.orderBy(sortField);

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
 * Update a campaign
 * @param id Campaign ID
 * @param changes Partial campaign changes
 * @returns Updated campaign or null if not found
 */
export async function updateCampaign(
  id: string,
  changes: CampaignUpdate
): Promise<Campaign | null> {
  const existing = await db.campaigns.get(id);
  if (!existing) return null;

  const updated: CampaignTableEntry = {
    ...existing,
    ...changes,
    id: existing.id, // Ensure ID doesn't change
    createdAt: existing.createdAt, // Ensure createdAt doesn't change
    updatedAt: new Date().toISOString(),
  };

  await db.campaigns.put(updated);
  return fromTableEntry(updated);
}

/**
 * Delete a campaign
 * @param id Campaign ID
 * @returns True if deleted, false if not found
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  // Check if campaign exists
  const existing = await db.campaigns.get(id);
  if (!existing) return false;

  await db.transaction('rw', db.campaigns, db.characters, async () => {
    // Remove campaign assignment from all characters
    const characters = await db.characters.where('campaignId').equals(id).toArray();
    for (const character of characters) {
      character.campaignId = undefined;
      character.updatedAt = new Date().toISOString();
      await db.characters.put(character);
    }

    // Delete the campaign
    await db.campaigns.delete(id);
  });

  return true;
}

// ============================================================================
// Character-Campaign Associations
// ============================================================================

/**
 * Assign a character to a campaign
 * Updates both the campaign's characterIds and the character's campaignId
 * @param characterId Character ID to assign
 * @param campaignId Campaign ID to assign to
 * @returns True if successful, false if character or campaign not found
 */
export async function assignCharacterToCampaign(
  characterId: string,
  campaignId: string
): Promise<boolean> {
  return await db.transaction('rw', db.campaigns, db.characters, async () => {
    // Get character and campaign
    const character = await db.characters.get(characterId);
    const campaign = await db.campaigns.get(campaignId);

    if (!character || !campaign) return false;

    // Remove character from previous campaign if assigned
    if (character.campaignId && character.campaignId !== campaignId) {
      const previousCampaign = await db.campaigns.get(character.campaignId);
      if (previousCampaign) {
        previousCampaign.characterIds = previousCampaign.characterIds.filter(
          (id) => id !== characterId
        );
        previousCampaign.updatedAt = new Date().toISOString();
        await db.campaigns.put(previousCampaign);
      }
    }

    // Update character's campaignId
    character.campaignId = campaignId;
    character.updatedAt = new Date().toISOString();
    await db.characters.put(character);

    // Add character to campaign's characterIds if not already present
    if (!campaign.characterIds.includes(characterId)) {
      campaign.characterIds.push(characterId);
      campaign.updatedAt = new Date().toISOString();
      await db.campaigns.put(campaign);
    }

    return true;
  });
}

/**
 * Remove a character from a campaign
 * Updates both the campaign's characterIds and the character's campaignId
 * @param characterId Character ID to remove
 * @param campaignId Campaign ID to remove from
 * @returns True if successful, false if character or campaign not found
 */
export async function removeCharacterFromCampaign(
  characterId: string,
  campaignId: string
): Promise<boolean> {
  return await db.transaction('rw', db.campaigns, db.characters, async () => {
    // Get character and campaign
    const character = await db.characters.get(characterId);
    const campaign = await db.campaigns.get(campaignId);

    if (!character || !campaign) return false;

    // Remove character's campaign assignment
    character.campaignId = undefined;
    character.updatedAt = new Date().toISOString();
    await db.characters.put(character);

    // Remove character from campaign's characterIds
    campaign.characterIds = campaign.characterIds.filter((id) => id !== characterId);
    campaign.updatedAt = new Date().toISOString();
    await db.campaigns.put(campaign);

    return true;
  });
}

/**
 * Get all characters in a campaign
 * @param campaignId Campaign ID
 * @returns Array of character summaries or null if campaign not found
 */
export async function getCharactersByCampaign(
  campaignId: string
): Promise<CharacterSummary[] | null> {
  const campaign = await db.campaigns.get(campaignId);
  if (!campaign) return null;

  // Fetch all characters in the campaign
  const characters = await db.characters.bulkGet(campaign.characterIds);

  // Filter out any null results (deleted characters) and convert to summaries
  return characters
    .filter((char): char is NonNullable<typeof char> => char !== null && char !== undefined)
    .map((char) => ({
      id: char.id,
      name: char.name,
      level: char.level,
      race: char.race.name,
      classes: char.classes.map((c) => `${c.name} ${c.level}`).join(', '),
      currentHp: char.combat.currentHp,
      maxHp: char.combat.maxHp,
      updatedAt: new Date(char.updatedAt),
    }));
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Delete multiple campaigns
 * @param ids Array of campaign IDs to delete
 * @returns Number of campaigns deleted
 */
export async function deleteCampaigns(ids: string[]): Promise<number> {
  let deletedCount = 0;

  await db.transaction('rw', db.campaigns, db.characters, async () => {
    for (const id of ids) {
      const deleted = await deleteCampaign(id);
      if (deleted) deletedCount++;
    }
  });

  return deletedCount;
}

/**
 * Assign multiple characters to a campaign
 * @param characterIds Array of character IDs
 * @param campaignId Campaign ID to assign to
 * @returns Number of characters successfully assigned
 */
export async function assignCharactersToCampaign(
  characterIds: string[],
  campaignId: string
): Promise<number> {
  let assignedCount = 0;

  await db.transaction('rw', db.campaigns, db.characters, async () => {
    for (const characterId of characterIds) {
      const success = await assignCharacterToCampaign(characterId, campaignId);
      if (success) assignedCount++;
    }
  });

  return assignedCount;
}

/**
 * Remove multiple characters from their campaigns
 * @param characterIds Array of character IDs
 * @returns Number of characters successfully removed
 */
export async function removeCharactersFromCampaigns(characterIds: string[]): Promise<number> {
  let removedCount = 0;

  await db.transaction('rw', db.campaigns, db.characters, async () => {
    for (const characterId of characterIds) {
      const character = await db.characters.get(characterId);
      if (character && character.campaignId) {
        const success = await removeCharacterFromCampaign(characterId, character.campaignId);
        if (success) removedCount++;
      }
    }
  });

  return removedCount;
}

// ============================================================================
// Search and Filter
// ============================================================================

export interface CampaignFilterOptions {
  /** Search by name (case-insensitive partial match) */
  nameQuery?: string;
  /** Filter by edition */
  edition?: '2014' | '2024';
  /** Sort field */
  sortBy?: 'name' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
}

/**
 * Search and filter campaigns
 * @param options Filter and sort options
 * @returns Filtered campaign summaries
 */
export async function searchCampaigns(
  options: CampaignFilterOptions = {}
): Promise<CampaignSummary[]> {
  let entries = await db.campaigns.toArray();

  // Apply filters
  if (options.nameQuery) {
    const query = options.nameQuery.toLowerCase();
    entries = entries.filter((campaign) => campaign.name.toLowerCase().includes(query));
  }

  if (options.edition) {
    entries = entries.filter((campaign) => campaign.edition === options.edition);
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
 * Get campaign statistics
 * @returns Statistics about campaigns in the database
 */
export async function getCampaignStats(): Promise<{
  total: number;
  byEdition: Record<'2014' | '2024', number>;
  totalCharacters: number;
  averageCharactersPerCampaign: number;
  largestCampaign: { id: string; name: string; characterCount: number } | null;
}> {
  const campaigns = await db.campaigns.toArray();

  const byEdition: Record<'2014' | '2024', number> = {
    '2014': 0,
    '2024': 0,
  };

  let totalCharacters = 0;
  let largestCampaign: { id: string; name: string; characterCount: number } | null = null;

  for (const campaign of campaigns) {
    // Count by edition
    byEdition[campaign.edition]++;

    // Count total characters
    totalCharacters += campaign.characterIds.length;

    // Track largest campaign
    if (!largestCampaign || campaign.characterIds.length > largestCampaign.characterCount) {
      largestCampaign = {
        id: campaign.id,
        name: campaign.name,
        characterCount: campaign.characterIds.length,
      };
    }
  }

  return {
    total: campaigns.length,
    byEdition,
    totalCharacters,
    averageCharactersPerCampaign: campaigns.length > 0 ? totalCharacters / campaigns.length : 0,
    largestCampaign,
  };
}
