/**
 * Character Types
 * Main Character interface for application state and IndexedDB storage
 */

import type { AbilityScore, Alignment, Edition, Size, SpellLevel } from './game';
import type {
  ActiveCondition,
  Appearance,
  CharacterFeature,
  CombatStats,
  Currency,
  EquipmentItem,
  Personality,
  Proficiency,
  Skill,
  SpellSlot,
} from './game';

// Character Class (multiclassing support)
export interface CharacterClass {
  key: string;
  name: string;
  level: number;
  hitDiceValue: number;
  isPrimary: boolean;
  // Reference to Open5E archetype if applicable
  archetype?: string;
}

// Character Race
export interface CharacterRace {
  key: string;
  name: string;
  // Reference to subrace if applicable
  subrace?: string;
}

// Character Background
export interface CharacterBackground {
  key: string;
  name: string;
  // Custom background fields if user creates their own
  customDescription?: string;
}

// Spellcasting
export interface Spellcasting {
  ability: AbilityScore | null;
  saveDC: number;
  attackBonus: number;
  slots: SpellSlot[];
  preparedSpells: PreparedSpell[];
  knownSpells: KnownSpell[];
}

export interface KnownSpell {
  id: string;
  spellKey: string;
  name: string;
  level: SpellLevel;
  school: string;
  prepared: boolean;
}

export interface PreparedSpell {
  spellKey: string;
  level: SpellLevel;
}

// Ability Scores with modifiers and overrides
export interface CharacterAbilityScores {
  base: Record<AbilityScore, number>;
  racialBonus: Record<AbilityScore, number>;
  asiBonus: Record<AbilityScore, number>; // Ability Score Improvements from leveling
  otherBonus: Record<AbilityScore, number>; // Magic items, etc.
  override: Record<AbilityScore, number | null>; // Manual override
  // Calculated totals
  total: Record<AbilityScore, number>;
  modifier: Record<AbilityScore, number>;
  // Point buy or manual entry
  generationMethod: 'standard' | 'pointbuy' | 'roll' | 'manual';
}

// Skill proficiencies
export interface CharacterSkill {
  skillKey: string;
  proficiency: 'none' | 'half' | 'proficient' | 'expertise';
  bonus: number;
  // Whether this is from background, class, or feat
  source: string;
}

// Main Character Interface
export interface Character {
  // Identity
  id: string;
  name: string;
  playerName: string;

  // Core Attributes
  race: CharacterRace;
  classes: CharacterClass[];
  background: CharacterBackground;
  alignment: Alignment;

  // Level and Experience
  level: number;
  experiencePoints: number;

  // Game Edition
  edition: Edition;

  // Ability Scores
  abilityScores: CharacterAbilityScores;

  // Skills
  skills: CharacterSkill[];

  // Combat
  combat: CombatStats;

  // Proficiencies
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };

  // Spellcasting
  spellcasting: Spellcasting | null;

  // Equipment
  inventory: EquipmentItem[];
  currency: Currency;

  // Features & Traits
  features: CharacterFeature[];

  // Conditions
  conditions: ActiveCondition[];

  // Personality
  personality: Personality;

  // Appearance
  appearance: Appearance;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  campaignId?: string;

  // Manual Overrides (for auto-calculated values)
  overrides: {
    maxHp?: number;
    ac?: number;
    proficiencyBonus?: number;
    spellSaveDC?: number;
  };
}

// Character Summary (for list views)
export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  race: string;
  classes: string;
  currentHp: number;
  maxHp: number;
  updatedAt: Date;
}

// Character Creation State
export interface CharacterCreationState {
  step: number;
  data: Partial<Character>;
}

// Character Update Operations
export type CharacterUpdate = Partial<Omit<Character, 'id' | 'createdAt'>>;

// Validation Errors
export interface CharacterValidationError {
  field: string;
  message: string;
}
