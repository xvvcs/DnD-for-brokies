/**
 * Open5E API Response Types
 * Based on Open5E API v2 documentation
 * @see https://api.open5e.com/
 */

// Base entity with common fields
export interface Open5eEntity {
  key: string;
  name: string;
  url: string;
  document: string;
}

// Race / Ancestry
export interface Open5eRace extends Open5eEntity {
  description: string;
  speed: number;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  languages: string[];
  language_desc: string;
  traits: Open5eTrait[];
  subraces: Open5eSubrace[];
}

export interface Open5eSubrace {
  key: string;
  name: string;
  description: string;
  traits: Open5eTrait[];
}

// Class
export interface Open5eClass extends Open5eEntity {
  description: string;
  hit_dice: string;
  hp_at_1st_level: string;
  hp_at_higher_levels: string;
  prof_armor: string;
  prof_weapons: string;
  prof_tools: string;
  prof_saving_throws: string[];
  prof_skills: string;
  equipment: string;
  spellcasting_ability: string | null;
  subtypes_name: string;
  archetypes: Open5eArchetype[];
  class_features: Open5eClassFeature[];
}

export interface Open5eArchetype {
  key: string;
  name: string;
  description: string;
  features: Open5eClassFeature[];
}

export interface Open5eClassFeature {
  key: string;
  name: string;
  description: string;
  level: number;
}

// Feat
export interface Open5eFeat extends Open5eEntity {
  desc: string;
  prerequisite?: string;
  has_prerequisite?: boolean;
  benefits?: Array<{ desc: string }>;
  type?: string;
}

// Background
export interface Open5eBackground extends Open5eEntity {
  description: string;
  skill_proficiencies: string[];
  tool_proficiencies: string[];
  languages: string[];
  equipment: string;
  feature: string;
  feature_description: string;
  personality_traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

// Ability
export interface Open5eAbilityScore extends Open5eEntity {
  full_name: string;
  description: string;
  skills: Open5eSkill[];
}

// Skill
export interface Open5eSkill extends Open5eEntity {
  ability_score: string;
  description: string;
}

// Language
export interface Open5eLanguage extends Open5eEntity {
  type: string;
  typical_speakers: string[];
  script: string;
}

// Condition
export interface Open5eCondition extends Open5eEntity {
  description: string;
}

// Equipment / Item
export interface Open5eItem extends Open5eEntity {
  type: string;
  description: string;
  cost: string;
  weight: string | null;
  damage_dice: string | null;
  damage_type: string | null;
  properties: string[];
  category: string;
  armor_class: number | null;
  armor_category: string | null;
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
}

// Armor
export interface Open5eArmor extends Open5eItem {
  armor_class: number;
  armor_category: string;
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
}

// Weapon
export interface Open5eWeapon extends Open5eItem {
  damage_dice: string;
  damage_type: string;
  properties: string[];
}

// Spell
export interface Open5eSpell extends Open5eEntity {
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  components: string[];
  material: string | null;
  desc: string;
  higher_levels: string | null;
  classes: string[];
  circles: string | null;
  archetypes: string | null;
}

// Spell List (for classes)
export interface Open5eSpellList extends Open5eEntity {
  slug: string;
  desc: string;
  spells: Open5eSpell[];
}

// Document
export interface Open5eDocument {
  key: string;
  name: string;
  url: string;
  desc: string;
  license_url: string;
  author: string;
  published_at: string;
}

// Trait (for races and classes)
export interface Open5eTrait {
  name: string;
  description: string;
}

// API Response wrappers
export interface Open5ePaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Open5eRacesResponse = Open5ePaginatedResponse<Open5eRace>;
export type Open5eClassesResponse = Open5ePaginatedResponse<Open5eClass>;
export type Open5eBackgroundsResponse = Open5ePaginatedResponse<Open5eBackground>;
export type Open5eAbilitiesResponse = Open5ePaginatedResponse<Open5eAbilityScore>;
export type Open5eSkillsResponse = Open5ePaginatedResponse<Open5eSkill>;
export type Open5eLanguagesResponse = Open5ePaginatedResponse<Open5eLanguage>;
export type Open5eConditionsResponse = Open5ePaginatedResponse<Open5eCondition>;
export type Open5eItemsResponse = Open5ePaginatedResponse<Open5eItem>;
export type Open5eSpellsResponse = Open5ePaginatedResponse<Open5eSpell>;
export type Open5eSpellListsResponse = Open5ePaginatedResponse<Open5eSpellList>;
export type Open5eDocumentsResponse = Open5ePaginatedResponse<Open5eDocument>;

// API Query Parameters
export interface Open5eQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  document__key?: string;
  ordering?: string;
}
