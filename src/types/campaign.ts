/**
 * Campaign Types
 * Campaign management for character organization
 */

import type { CharacterSummary } from './character';

// Campaign Interface
export interface Campaign {
  id: string;
  name: string;
  description: string;
  edition: '2014' | '2024';
  // Game settings
  settings: CampaignSettings;
  // Characters in this campaign
  characterIds: string[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Settings
export interface CampaignSettings {
  // Allowed content sources (document keys)
  allowedDocuments: string[];
  // House rules
  houseRules: string[];
  // Variant rules
  useEncumbrance: boolean;
  useFeats: boolean;
  useMulticlassing: boolean;
  // Homebrew content
  customRaces: string[];
  customClasses: string[];
  customBackgrounds: string[];
}

// Campaign Summary (for list views)
export interface CampaignSummary {
  id: string;
  name: string;
  description: string;
  characterCount: number;
  edition: '2014' | '2024';
  updatedAt: Date;
}

// Campaign Creation State
export interface CampaignCreationState {
  step: number;
  data: Partial<Campaign>;
}

// Campaign Update Operations
export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'createdAt'>>;

// Campaign with resolved characters
export interface CampaignWithCharacters extends Campaign {
  characters: CharacterSummary[];
}
