/**
 * Game Mechanics Types
 * Core D&D 5e mechanics and enums
 */

// Ability Scores
export const ABILITY_SCORES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
export type AbilityScore = (typeof ABILITY_SCORES)[number];

// Skills mapped to ability scores
export interface Skill {
  key: string;
  name: string;
  ability: AbilityScore;
}

export const SKILLS: Skill[] = [
  { key: 'acrobatics', name: 'Acrobatics', ability: 'DEX' },
  { key: 'animal_handling', name: 'Animal Handling', ability: 'WIS' },
  { key: 'arcana', name: 'Arcana', ability: 'INT' },
  { key: 'athletics', name: 'Athletics', ability: 'STR' },
  { key: 'deception', name: 'Deception', ability: 'CHA' },
  { key: 'history', name: 'History', ability: 'INT' },
  { key: 'insight', name: 'Insight', ability: 'WIS' },
  { key: 'intimidation', name: 'Intimidation', ability: 'CHA' },
  { key: 'investigation', name: 'Investigation', ability: 'INT' },
  { key: 'medicine', name: 'Medicine', ability: 'WIS' },
  { key: 'nature', name: 'Nature', ability: 'INT' },
  { key: 'perception', name: 'Perception', ability: 'WIS' },
  { key: 'performance', name: 'Performance', ability: 'CHA' },
  { key: 'persuasion', name: 'Persuasion', ability: 'CHA' },
  { key: 'religion', name: 'Religion', ability: 'INT' },
  { key: 'sleight_of_hand', name: 'Sleight of Hand', ability: 'DEX' },
  { key: 'stealth', name: 'Stealth', ability: 'DEX' },
  { key: 'survival', name: 'Survival', ability: 'WIS' },
];

// Alignment
export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

// Sizes
export const SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'] as const;
export type Size = (typeof SIZES)[number];

// D&D Editions
export const EDITIONS = ['2014', '2024'] as const;
export type Edition = (typeof EDITIONS)[number];

// Die Types
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

// Hit Die by class
export const CLASS_HIT_DICE: Record<string, DieType> = {
  barbarian: 'd12',
  bard: 'd8',
  cleric: 'd8',
  druid: 'd8',
  fighter: 'd10',
  monk: 'd8',
  paladin: 'd10',
  ranger: 'd10',
  rogue: 'd8',
  sorcerer: 'd6',
  warlock: 'd8',
  wizard: 'd6',
};

// Proficiency Bonus by level
export function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

// Ability modifier calculation
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Spellcasting
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type SpellLevel = (typeof SPELL_LEVELS)[number];

export interface SpellSlot {
  level: SpellLevel;
  max: number;
  used: number;
}

// Spell schools
export const SPELL_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
] as const;
export type SpellSchool = (typeof SPELL_SCHOOLS)[number];

// Equipment
export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  equipped: boolean;
  // Reference to Open5E item key
  itemKey?: string;
}

// Currency
export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

// Armor Class
export interface ArmorClass {
  base: number;
  dexModifier: number;
  bonus: number;
  total: number;
}

// Combat Stats
export interface CombatStats {
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: ArmorClass;
  initiative: number;
  speed: number;
  hitDice: {
    type: DieType;
    total: number;
    used: number;
  };
  deathSaves: {
    successes: number;
    failures: number;
  };
}

// Proficiency Types
export type ProficiencyLevel = 'none' | 'half' | 'proficient' | 'expertise';

export interface Proficiency {
  key: string;
  level: ProficiencyLevel;
}

// Conditions
export interface ActiveCondition {
  conditionKey: string;
  source?: string;
  duration?: string;
  description?: string;
}

// Attacks
export interface Attack {
  id: string;
  name: string;
  ability: AbilityScore;
  bonus: number;
  damage: string;
  damageType: string;
  range: string;
  properties: string[];
  // Reference to weapon/item if applicable
  itemKey?: string;
}

// Features and Traits
export interface CharacterFeature {
  id: string;
  name: string;
  description: string;
  source: string; // e.g., "Class: Fighter", "Race: Elf", "Feat: Sharpshooter"
  level?: number;
  uses?: {
    max: number;
    used: number;
    resetOn: 'short' | 'long' | 'dawn' | 'other';
  };
}

// Personality
export interface Personality {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  appearance: string;
  backstory: string;
  allies: string;
  enemies: string;
  notes: string;
}

// Physical Appearance
export interface Appearance {
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  other: string;
}
