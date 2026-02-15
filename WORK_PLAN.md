# DnDnB - Implementation Work Plan

## Overview

This document provides a detailed implementation roadmap for the DnDnB (D&D Character Manager) application. The work is divided into 6 major phases spanning approximately 8-10 weeks for a single developer working part-time, or 4-5 weeks full-time.

**Total Estimated Effort**: ~200-250 hours

---

## Phase 0: Foundation & Setup (Week 1)

### Goal

Establish the project foundation with proper tooling, dependencies, and project structure.

### Tasks

#### 0.1 Project Initialization

- [x] **0.1.1** Initialize Next.js 15 project with App Router
  - Use `create-next-app@latest` with TypeScript, Tailwind CSS
  - Configure `next.config.js` for static export (Vercel deployment)
  - Set up ESLint with strict rules and Prettier
  - Estimated: 2 hours

- [x] **0.1.2** Install core dependencies
  - `dexie` and `@types/dexie` for IndexedDB
  - `zustand` for state management
  - `@tanstack/react-query` for API data fetching
  - `react-pdf` for PDF export
  - `uuid` for unique IDs
  - `lucide-react` for icons
  - `date-fns` for date handling
  - Estimated: 1 hour

- [x] **0.1.3** Initialize shadcn/ui
  - Run `npx shadcn@latest init`
  - Configure component aliases and styling
  - Install base components: button, card, dialog, input, select, checkbox, tabs, accordion, scroll-area, tooltip, dropdown-menu
  - Estimated: 2 hours

- [x] **0.1.4** Set up project structure
  - Create all directories as per REQUIREMENTS.md section 5.4
  - Set up TypeScript path aliases (`@/components`, `@/lib`, `@/types`, etc.)
  - Create placeholder files for key modules
  - Estimated: 1 hour

- [x] **0.1.5** Configure development environment
  - Set up `.env.local` with API base URL
  - Configure VS Code settings and extensions recommendations
  - Set up Git hooks for linting
  - Estimated: 1 hour

#### 0.2 Type Definitions

- [x] **0.2.1** Create Open5E API types (`src/types/open5e.ts`)
  - Define interfaces for all API entities (classes, species, spells, items, etc.)
  - Define API response types with pagination
  - Define document/rulebook types
  - Estimated: 3 hours

- [x] **0.2.2** Create game mechanics types (`src/types/game.ts`)
  - Ability scores, modifiers, proficiencies
  - Combat stats (AC, HP, initiative)
  - Skills and saving throws
  - Spellcasting types
  - Equipment types
  - Conditions
  - Estimated: 2 hours

- [x] **0.2.3** Create character types (`src/types/character.ts`)
  - Main Character interface (comprehensive, matching REQUIREMENTS.md schema)
  - Character creation state types
  - Character update/change types
  - Estimated: 2 hours

- [x] **0.2.4** Create campaign types (`src/types/campaign.ts`)
  - Campaign interface
  - Campaign-character relationship types
  - Estimated: 1 hour

#### 0.3 Global Styling & Theme Setup

- [x] **0.3.1** Set up fantasy theme CSS (`src/app/globals.css`)
  - Define CSS custom properties for colors (deep reds, golds, browns, parchment)
  - Set up typography (serif headers, sans-serif body)
  - Create decorative border styles
  - Add parchment texture backgrounds
  - Note: Theme integrated into globals.css instead of separate file
  - Estimated: 3 hours

- [x] **0.3.2** Configure Tailwind with custom theme
  - Extend colors with fantasy palette
  - Add custom font families
  - Create utility classes for fantasy styling
  - Estimated: 2 hours

- [x] **0.3.3** Create layout components
  - Root layout with providers (React Query, Zustand)
  - Navigation/header component
  - Page wrapper with consistent padding
  - Loading states and error boundaries
  - Estimated: 2 hours

**Phase 0 Total**: ~22 hours

---

## Phase 1: Data Layer & API Integration (Week 1-2)

### Goal

Build the complete data persistence layer with Dexie.js and establish Open5E API integration with caching.

### Tasks

#### 1.1 Dexie.js Database Setup

- [ ] **1.1.1** Create database schema (`src/lib/db/schema.ts`)
  - Define all table interfaces
  - Set up database versioning strategy
  - Configure indexes for efficient queries
  - Estimated: 2 hours

- [ ] **1.1.2** Implement core database class (`src/lib/db/index.ts`)
  - Extend Dexie with custom database class
  - Define all tables (characters, campaigns, apiCache, settings)
  - Implement connection handling
  - Estimated: 2 hours

- [ ] **1.1.3** Create database migration strategy
  - Implement version upgrade handlers
  - Add data migration utilities
  - Create backup/restore helpers
  - Estimated: 2 hours

#### 1.2 Character Data Layer

- [ ] **1.2.1** Implement character CRUD operations (`src/lib/db/characters.ts`)
  - `createCharacter(characterData)` - create new character
  - `getCharacter(id)` - fetch single character
  - `getAllCharacters()` - list all characters with sorting
  - `updateCharacter(id, changes)` - partial update
  - `deleteCharacter(id)` - remove with cascade cleanup
  - `duplicateCharacter(id)` - copy existing character
  - Estimated: 3 hours

- [ ] **1.2.2** Add character search and filtering
  - Search by name
  - Filter by campaign, class, level
  - Sort by name, level, last updated
  - Estimated: 2 hours

- [ ] **1.2.3** Implement auto-save functionality
  - Debounced save on character changes
  - Save state indicators (saving, saved, error)
  - Optimistic updates
  - Estimated: 2 hours

#### 1.3 Campaign Data Layer

- [ ] **1.3.1** Implement campaign CRUD (`src/lib/db/campaigns.ts`)
  - `createCampaign(data)`
  - `getCampaign(id)`
  - `getAllCampaigns()`
  - `updateCampaign(id, changes)`
  - `deleteCampaign(id)`
  - Estimated: 2 hours

- [ ] **1.3.2** Implement character-campaign associations
  - `assignCharacterToCampaign(characterId, campaignId)`
  - `removeCharacterFromCampaign(characterId, campaignId)`
  - `getCharactersByCampaign(campaignId)`
  - Estimated: 2 hours

#### 1.4 API Cache Layer

- [ ] **1.4.1** Create cache management utilities (`src/lib/db/cache.ts`)
  - `cacheApiData(key, data, documentKey, version)`
  - `getCachedApiData(key)` with TTL check
  - `invalidateCache(key)`
  - `clearAllCache()`
  - `getCacheStats()`
  - Estimated: 3 hours

- [ ] **1.4.2** Implement cache warming strategy
  - Batch fetch and cache on first document selection
  - Progress indicators for cache population
  - Estimated: 2 hours

#### 1.5 Open5E API Service

- [ ] **1.5.1** Create API client (`src/lib/api/client.ts`)
  - Axios/fetch wrapper with base URL
  - Request throttling (5 concurrent, 100ms delay between batches)
  - Error handling and retry logic
  - Response caching integration
  - Estimated: 3 hours

- [ ] **1.5.2** Implement document/rulebook endpoints (`src/lib/api/endpoints/documents.ts`)
  - `fetchDocuments()` - list all available documents
  - Cache documents globally (rarely change)
  - Document metadata extraction
  - Estimated: 1 hour

- [ ] **1.5.3** Implement classes endpoint (`src/lib/api/endpoints/classes.ts`)
  - `fetchClasses(documentKeys: string[])` - fetch for selected sources
  - Support pagination handling
  - Merge results from multiple documents
  - Cache per document key
  - Estimated: 2 hours

- [ ] **1.5.4** Implement species endpoint (`src/lib/api/endpoints/species.ts`)
  - `fetchSpecies(documentKeys: string[])`
  - Handle subspecies relationships
  - Cache per document
  - Estimated: 2 hours

- [ ] **1.5.5** Implement backgrounds endpoint (`src/lib/api/endpoints/backgrounds.ts`)
  - `fetchBackgrounds(documentKeys: string[])`
  - Cache per document
  - Estimated: 2 hours

- [ ] **1.5.6** Implement spells endpoint (`src/lib/api/endpoints/spells.ts`)
  - `fetchSpells(documentKeys: string[], filters?)`
  - Support level, school, class filtering
  - Handle large datasets with virtual scrolling preparation
  - Cache per document
  - Estimated: 2 hours

- [ ] **1.5.7** Implement equipment endpoints (`src/lib/api/endpoints/equipment.ts`)
  - `fetchWeapons(documentKeys: string[])`
  - `fetchArmor(documentKeys: string[])`
  - `fetchItems(documentKeys: string[])`
  - `fetchMagicItems(documentKeys: string[])`
  - Cache per document and type
  - Estimated: 3 hours

- [ ] **1.5.8** Implement reference data endpoints
  - `fetchConditions()` - cached globally
  - `fetchSkills()` - cached globally
  - `fetchLanguages()` - cached globally
  - `fetchDamageTypes()` - cached globally
  - Estimated: 2 hours

#### 1.6 React Query Integration

- [ ] **1.6.1** Set up React Query provider
  - Configure default options
  - Set up query client with persistence
  - Estimated: 1 hour

- [ ] **1.6.2** Create custom hooks for API data
  - `useDocuments()` - fetch and cache documents list
  - `useClasses(documentKeys)` - fetch classes for selected sources
  - `useSpecies(documentKeys)`
  - `useBackgrounds(documentKeys)`
  - `useSpells(documentKeys, filters)`
  - `useEquipment(documentKeys)`
  - `useConditions()`
  - `useSkills()`
  - Each hook handles loading, error, and cached states
  - Estimated: 4 hours

- [ ] **1.6.3** Create cache management UI hooks
  - `useCacheStatus()` - show cache population progress
  - `useRefreshCache()` - manual cache refresh
  - `useClearCache()` - clear and re-fetch
  - Estimated: 2 hours

**Phase 1 Total**: ~45 hours

---

## Phase 2: Game Logic Engine (Week 2-3)

### Goal

Implement all D&D 5e game mechanics calculations: ability scores, proficiency, combat stats, spellcasting.

### Tasks

#### 2.1 Ability Score Calculations (`src/lib/engine/ability-scores.ts`)

- [ ] **2.1.1** Implement ability score to modifier conversion
  - Formula: `(score - 10) / 2` rounded down
  - Handle edge cases (scores below 1, above 30)
  - Create lookup table for performance
  - Estimated: 1 hour

- [ ] **2.1.2** Implement ability score generation methods
  - Standard Array: `[15, 14, 13, 12, 10, 8]`
  - Point Buy: 27 points, costs table (8=0, 9=1, ..., 15=9), validate selections
  - Manual Entry: accept any valid array
  - Validation utilities
  - Estimated: 3 hours

- [ ] **2.1.3** Calculate racial/species ability bonuses
  - Apply bonuses from species traits
  - Handle floating bonuses (choose which ability)
  - Support 2024 rules (background gives bonuses instead)
  - Estimated: 2 hours

#### 2.2 Proficiency System (`src/lib/engine/proficiency.ts`)

- [ ] **2.2.1** Implement proficiency bonus calculation
  - Formula based on total level: `floor((level - 1) / 4) + 2`
  - Handle multiclass total levels
  - Estimated: 1 hour

- [ ] **2.2.2** Calculate skill modifiers
  - Base: ability modifier
  - Add proficiency bonus if proficient
  - Add proficiency bonus again if expertise
  - Support Jack of All Trades (half proficiency)
  - Estimated: 2 hours

- [ ] **2.2.3** Calculate saving throw modifiers
  - Base: ability modifier
  - Add proficiency bonus if proficient
  - Support class-based save proficiencies
  - Estimated: 1 hour

- [ ] **2.2.4** Passive Perception calculation
  - Base: 10 + Wisdom modifier
  - Add proficiency if Perception is proficient
  - Support expertise
  - Estimated: 1 hour

#### 2.3 Combat Statistics (`src/lib/engine/combat.ts`)

- [ ] **2.3.1** Calculate Armor Class
  - Base: 10 + DEX modifier (unarmored)
  - Light armor: base + DEX modifier
  - Medium armor: base + DEX modifier (max 2)
  - Heavy armor: base only
  - Add shield bonus (+2)
  - Support class features (Unarmored Defense, etc.)
  - Support magical bonuses
  - Estimated: 3 hours

- [ ] **2.3.2** Calculate Max HP
  - First level: hit die max + CON modifier
  - Subsequent levels: hit die avg or roll + CON modifier
  - Support fixed vs manual roll options
  - Handle multiclass (use hit die of class gaining level)
  - Apply CON modifier per level
  - Support features that modify HP (Tough feat, Draconic Sorcerer)
  - Estimated: 3 hours

- [ ] **2.3.3** Calculate initiative
  - Base: DEX modifier
  - Support features that add bonuses (Jack of All Trades, etc.)
  - Estimated: 1 hour

- [ ] **2.3.4** Calculate speed
  - Base from species
  - Apply modifiers (Encumbered, features, magic items)
  - Track different movement types (walk, fly, swim, climb, burrow)
  - Estimated: 1 hour

- [ ] **2.3.5** Calculate attack bonuses and damage
  - Melee: STR modifier + proficiency (if proficient)
  - Ranged: DEX modifier + proficiency
  - Finesse weapons: use STR or DEX (whichever is higher)
  - Apply magical weapon bonuses
  - Support versatile weapons (1d8 one-handed, 1d10 two-handed)
  - Estimated: 3 hours

#### 2.4 Spellcasting Engine (`src/lib/engine/spellcasting.ts`)

- [ ] **2.4.1** Determine spellcasting ability per class
  - Map classes to their spellcasting ability
  - Support multiple spellcasting classes (multiclass)
  - Estimated: 1 hour

- [ ] **2.4.2** Calculate Spell Save DC
  - Formula: `8 + proficiency bonus + spellcasting ability modifier`
  - Support items/features that modify DC
  - Estimated: 1 hour

- [ ] **2.4.3** Calculate Spell Attack Bonus
  - Formula: `proficiency bonus + spellcasting ability modifier`
  - Estimated: 1 hour

- [ ] **2.4.4** Calculate spell slots
  - Full casters: standard slot progression
  - Half casters (Paladin, Ranger): half level rounded down
  - Third casters (Eldritch Knight, Arcane Trickster): third level rounded down
  - Warlock: pact magic (separate slot table)
  - Multiclass: combine using PHB multiclassing rules
  - Estimated: 4 hours

- [ ] **2.4.5** Manage spell preparation/known
  - Track prepared spells (Cleric, Druid, Wizard, Paladin)
  - Track known spells (Sorcerer, Bard, Ranger)
  - Calculate max prepared based on level + ability modifier
  - Estimated: 2 hours

#### 2.5 HP Management (`src/lib/engine/hp.ts`)

- [ ] **2.5.1** Implement damage application
  - Subtract from temp HP first
  - Remainder subtracts from current HP
  - Floor at 0 HP
  - Trigger death save mode when HP reaches 0
  - Estimated: 2 hours

- [ ] **2.5.2** Implement healing application
  - Add to current HP
  - Cap at max HP
  - Reset death saves if healing brings HP above 0
  - Estimated: 1 hour

- [ ] **2.5.3** Implement temporary HP
  - Temp HP doesn't stack (take higher value)
  - Display separately from current HP
  - Estimated: 1 hour

- [ ] **2.5.4** Hit dice management
  - Track remaining hit dice per class
  - Calculate healing: hit die roll + CON modifier
  - Long rest: recover half of total hit dice (round up)
  - Estimated: 2 hours

- [ ] **2.5.5** Death save mechanics
  - Track successes (0-3) and failures (0-3)
  - Roll logic (d20, 10+ = success, 9- = failure, 1 = 2 failures, 20 = revive)
  - Reset on long rest or healing
  - Death on 3 failures
  - Stabilize on 3 successes
  - Estimated: 2 hours

#### 2.6 Feature Management (`src/lib/engine/features.ts`)

- [ ] **2.6.1** Aggregate all character features
  - Class features by level
  - Species traits
  - Background feature
  - Feats
  - Estimated: 2 hours

- [ ] **2.6.2** Track feature uses
  - Support limited-use features (X/rest)
  - Track current uses vs maximum
  - Reset uses on rest
  - Estimated: 2 hours

**Phase 2 Total**: ~40 hours

---

## Phase 3: Character Sheet UI (Week 3-5)

### Goal

Build the comprehensive character sheet interface with all sections from REQUIREMENTS.md.

### Tasks

#### 3.1 Shared Character Sheet Components

- [ ] **3.1.1** Create CharacterSheetLayout wrapper
  - Responsive grid layout (3-column desktop, 2-column tablet, 1-column mobile)
  - Fantasy-themed container with parchment background
  - Print-friendly styles (hide buttons, adjust layout)
  - Estimated: 2 hours

- [ ] **3.1.2** Create EditableField component
  - Click to edit inline
  - Support text, number, select input types
  - Validation and error states
  - Auto-save integration
  - Estimated: 2 hours

- [ ] **3.1.3** Create ProficiencyBadge component
  - Show proficiency level (none, proficient, expertise)
  - Toggle between states
  - Visual indicators (icons, colors)
  - Estimated: 1 hour

#### 3.2 Header / Identity Section (`src/components/character-sheet/IdentityBar.tsx`)

- [ ] **3.2.1** Display character name (editable inline)
- [ ] **3.2.2** Display class(es) + total level
- [ ] **3.2.3** Display species and background
- [ ] **3.2.4** Display proficiency bonus
- [ ] **3.2.5** Display XP or milestone toggle
- [ ] **3.2.6** Character portrait placeholder/image upload
- Estimated: 3 hours

#### 3.3 Ability Scores Panel (`src/components/character-sheet/AbilityScores.tsx`)

- [ ] **3.3.1** Display 6 ability scores with modifiers
- [ ] **3.3.2** Inline editing for ability scores
- [ ] **3.3.3** Display saving throw modifiers
- [ ] **3.3.4** Toggle proficiency for each saving throw
- [ ] **3.3.5** Visual indicators for proficient saves
- Estimated: 3 hours

#### 3.4 Skills Panel (`src/components/character-sheet/SkillsPanel.tsx`)

- [ ] **3.4.1** List all 18 skills with associated ability
- [ ] **3.4.2** Display calculated modifier for each skill
- [ ] **3.4.3** Toggle proficiency/expertise
- [ ] **3.4.4** Display Passive Perception
- [ ] **3.4.5** Sort/filter skills (all, proficient only, by ability)
- [ ] **3.4.6** Responsive: accordion on mobile/tablet
- Estimated: 3 hours

#### 3.5 Combat Stats Section (`src/components/character-sheet/CombatStats.tsx`)

- [ ] **3.5.1** Display AC with manual override option
- [ ] **3.5.2** Display Initiative
- [ ] **3.5.3** Display all speed types (walk, fly, etc.)
- [ ] **3.5.4** Display hit dice (remaining/total per class)
- [ ] **3.5.5** Death saves tracker (checkboxes)
- [ ] **3.5.6** Visual indicators for active conditions
- Estimated: 3 hours

#### 3.6 HP Tracker (`src/components/character-sheet/HPTracker.tsx`)

- [ ] **3.6.1** Large HP display (current / max)
- [ ] **3.6.2** Temp HP display
- [ ] **3.6.3** Quick +/- buttons for common values (1, 5, 10)
- [ ] **3.6.4** Custom damage/heal input with submit
- [ ] **3.6.5** Visual HP bar with color coding (green >50%, yellow 25-50%, red <25%)
- [ ] **3.6.6** Death save mode UI (when HP is 0)
- [ ] **3.6.7** Recent HP changes log (last 5 changes)
- Estimated: 4 hours

#### 3.7 Actions Panel (`src/components/character-sheet/ActionsPanel.tsx`)

- [ ] **3.7.1** Actions tab: list attacks and class actions
- [ ] **3.7.2** Bonus Actions tab
- [ ] **3.7.3** Reactions tab
- [ ] **3.7.4** Display attack bonus and damage for each action
- [ ] **3.7.5** Add custom action form
- [ ] **3.7.6** Equipped weapon attacks auto-populated
- Estimated: 4 hours

#### 3.8 Spellcasting Panel (`src/components/character-sheet/SpellcastingPanel.tsx`)

- [ ] **3.8.1** Display spellcasting ability, save DC, attack bonus
- [ ] **3.8.2** Spell slot tracker per level (checkboxes)
- [ ] **3.8.3** List spells by level with expand/collapse
- [ ] **3.8.4** Spell cards with full details (range, duration, components, description)
- [ ] **3.8.5** Mark concentration spells
- [ ] **3.8.6** Ritual indicator
- [ ] **3.8.7** Prepared/Known toggle for applicable classes
- [ ] **3.8.8** Add spell from database search
- [ ] **3.8.9** Remove spell
- Estimated: 5 hours

#### 3.9 Equipment & Inventory (`src/components/character-sheet/EquipmentPanel.tsx`)

- [ ] **3.9.1** Equipped items section (weapon, armor, shield)
- [ ] **3.9.2** Equip/unequip toggle
- [ ] **3.9.3** Backpack/inventory list
- [ ] **3.9.4** Add item from Open5E database (searchable dropdown)
- [ ] **3.9.5** Add custom item form
- [ ] **3.9.6** Currency tracker (CP, SP, EP, GP, PP)
- [ ] **3.9.7** Magic item attunement tracking
- [ ] **3.9.8** Optional encumbrance display
- Estimated: 4 hours

#### 3.10 Features & Traits (`src/components/character-sheet/FeaturesPanel.tsx`)

- [ ] **3.10.1** Class features organized by level
- [ ] **3.10.2** Species traits
- [ ] **3.10.3** Background feature
- [ ] **3.10.4** Feats
- [ ] **3.10.5** Expandable descriptions
- [ ] **3.10.6** Track limited-use features (e.g., "Rage: 2/3")
- [ ] **3.10.7** Add custom feature
- Estimated: 3 hours

#### 3.11 Conditions Panel (`src/components/character-sheet/ConditionsPanel.tsx`)

- [ ] **3.11.1** Toggle all standard conditions
- [ ] **3.11.2** Exhaustion level selector (1-6 or 1-10)
- [ ] **3.11.3** Visual indicator for active conditions
- [ ] **3.11.4** Condition description tooltips
- Estimated: 2 hours

#### 3.12 Notes & Backstory (`src/components/character-sheet/NotesPanel.tsx`)

- [ ] **3.12.1** Personality Traits field
- [ ] **3.12.2** Ideals field
- [ ] **3.12.3** Bonds field
- [ ] **3.12.4** Flaws field
- [ ] **3.12.5** Backstory text area
- [ ] **3.12.6** Appearance/description
- [ ] **3.12.7** Session notes with timestamps
- Estimated: 2 hours

#### 3.13 Character Sheet Integration

- [ ] **3.13.1** Create main CharacterSheet page (`src/app/characters/[id]/page.tsx`)
  - Assemble all panel components
  - State management with Zustand
  - Auto-save integration
  - Level up button
  - Rest buttons (short/long)
  - Export PDF button
  - Delete character button
  - Estimated: 4 hours

**Phase 3 Total**: ~45 hours

---

## Phase 4: Character Creation Wizard (Week 5-6)

### Goal

Implement the 8-step character creation wizard following D&D Beyond's flow.

### Tasks

#### 4.1 Wizard Framework

- [ ] **4.1.1** Create wizard state management (`src/stores/characterCreationStore.ts`)
  - Track current step
  - Store selections for each step
  - Validation state per step
  - Navigation (next, previous, jump to step)
  - Persist progress in session storage
  - Estimated: 3 hours

- [ ] **4.1.2** Create wizard layout component
  - Step indicator/progress bar
  - Navigation buttons (Back, Next, Save & Exit)
  - Mobile-responsive stepper
  - Estimated: 2 hours

- [ ] **4.1.3** Create StepWrapper component
  - Consistent padding and styling
  - Validation error display
  - Help/tooltip integration
  - Estimated: 1 hour

#### 4.2 Step 0: Configuration (`src/components/character-creation/StepConfig.tsx`)

- [ ] **4.2.1** Document/rulebook selector
  - Multi-select from available documents
  - Group by game system (5e 2014, 5e 2024, A5E)
  - Show document descriptions
- [ ] **4.2.2** Edition selection (2014 vs 2024)
- [ ] **4.2.3** Campaign assignment dropdown
- [ ] **4.2.4** HP method selection (fixed vs manual)
- [ ] **4.2.5** Trigger API cache warming for selected documents
- [ ] **4.2.6** Cache loading progress indicator
- Estimated: 4 hours

#### 4.3 Step 1: Choose Class (`src/components/character-creation/StepClass.tsx`)

- [ ] **4.3.1** Class browser/cards
  - Filter by selected documents
  - Show class icon, name, hit die, primary abilities
  - Expandable details with description
- [ ] **4.3.2** Level selector (1-20)
- [ ] **4.3.3** Subclass selection (at appropriate levels)
- [ ] **4.3.4** Multiclass toggle (add additional class)
- [ ] **4.3.5** Display class features gained at selected levels
- [ ] **4.3.6** Validation: must select at least one class
- Estimated: 4 hours

#### 4.4 Step 2: Choose Background (`src/components/character-creation/StepBackground.tsx`)

- [ ] **4.4.1** Background browser/cards
  - Filter by selected documents
  - Show granted proficiencies, skills, tools
- [ ] **4.4.2** Origin feat selection (2024 rules)
- [ ] **4.4.3** Background feature description
- [ ] **4.4.4** Validation: must select background
- Estimated: 3 hours

#### 4.5 Step 3: Choose Species (`src/components/character-creation/StepSpecies.tsx`)

- [ ] **4.5.1** Species browser/cards
  - Filter by selected documents
  - Show traits summary
- [ ] **4.5.2** Subspecies/lineage selection if applicable
- [ ] **4.5.3** Display racial traits with descriptions
- [ ] **4.5.4** Handle ability score bonuses
- [ ] **4.5.5** Validation: must select species
- Estimated: 3 hours

#### 4.6 Step 4: Ability Scores (`src/components/character-creation/StepAbilityScores.tsx`)

- [ ] **4.6.1** Method selector (Standard Array, Point Buy, Manual)
- [ ] **4.6.2** Standard Array implementation
  - Display values [15, 14, 13, 12, 10, 8]
  - Drag-and-drop or dropdown assignment to abilities
- [ ] **4.6.3** Point Buy implementation
  - 27 points pool
  - Cost table (8=0, 9=1, ..., 15=9)
  - Real-time remaining points display
  - Prevent invalid selections
- [ ] **4.6.4** Manual Entry implementation
  - Six number inputs
  - Validation (3-18 range)
- [ ] **4.6.5** Display final scores with modifiers
- [ ] **4.6.6** Apply racial/background bonuses (per edition rules)
- Estimated: 5 hours

#### 4.7 Step 5: Equipment (`src/components/character-creation/StepEquipment.tsx`)

- [ ] **4.7.1** Display class starting equipment options
  - Parse and present choices (e.g., "martial weapon OR two simple weapons")
- [ ] **4.7.2** Selection interface for each equipment choice
- [ ] **4.7.3** Background starting equipment (auto-added)
- [ ] **4.7.4** Gold piece alternative option
- [ ] **4.7.5** Add additional items manually
- [ ] **4.7.6** Mark items as equipped
- [ ] **4.7.7** Starting currency
- Estimated: 4 hours

#### 4.8 Step 6: Spells (`src/components/character-creation/StepSpells.tsx`)

- [ ] **4.8.1** Display only if character has spellcasting
- [ ] **4.8.2** Cantrip selection (number based on class)
- [ ] **4.8.3** Spell selection based on class rules:
  - Known spells (Bard, Sorcerer): select from list
  - Prepared spells (Cleric, Druid, Wizard): select prepared from larger list
  - Auto-populated (Warlock): limited choices
- [ ] **4.8.4** Spell browser with search and filters
- [ ] **4.8.5** Display spell details on selection
- [ ] **4.8.6** Validation: must select required number of spells
- Estimated: 4 hours

#### 4.9 Step 7: Description (`src/components/character-creation/StepDescription.tsx`)

- [ ] **4.9.1** Character name input (required)
- [ ] **4.9.2** Personality Traits text area
- [ ] **4.9.3** Ideals text area
- [ ] **4.9.4** Bonds text area
- [ ] **4.9.5** Flaws text area
- [ ] **4.9.6** Backstory rich text area
- [ ] **4.9.7** Appearance/description
- [ ] **4.9.8** Portrait upload (optional)
- Estimated: 2 hours

#### 4.10 Step 8: Review (`src/components/character-creation/StepReview.tsx`)

- [ ] **4.10.1** Summary of all selections
  - Collapsible sections for each step
- [ ] **4.10.2** Display calculated stats (HP, AC, etc.)
- [ ] **4.10.3** Validation: highlight any incomplete required fields
- [ ] **4.10.4** "Create Character" button
- [ ] **4.10.5** Save to database and redirect to character sheet
- Estimated: 2 hours

#### 4.11 Wizard Integration

- [ ] **4.11.1** Create wizard page (`src/app/characters/new/page.tsx`)
- [ ] **4.11.2** Integrate all steps with state management
- [ ] **4.11.3** Step validation before navigation
- [ ] **4.11.4** Progress persistence (session storage)
- [ ] **4.11.5** Cancel/exit confirmation
- Estimated: 2 hours

**Phase 4 Total**: ~40 hours

---

## Phase 5: Character Management & Campaigns (Week 6-7)

### Goal

Build the home page with character list and campaign management features.

### Tasks

#### 5.1 Character List Page (`src/app/page.tsx`)

- [ ] **5.1.1** Empty state when no characters
  - Welcome message
  - "Create First Character" CTA
  - Estimated: 1 hour

- [ ] **5.1.2** Character grid/cards
  - Card with portrait, name, species, class, level
  - Last modified date
  - Quick actions (view, edit, delete)
  - Estimated: 2 hours

- [ ] **5.1.3** Character filtering and sorting
  - Search by name
  - Filter by campaign, class, level range
  - Sort by name, level, last updated
  - Estimated: 2 hours

- [ ] **5.1.4** Character actions
  - "New Character" button (prominent)
  - Duplicate character
  - Delete with confirmation dialog
  - Estimated: 2 hours

#### 5.2 Campaign Management

- [ ] **5.2.1** Campaign list page (`src/app/campaigns/page.tsx`)
  - List all campaigns with character count
  - Create new campaign button
  - Estimated: 2 hours

- [ ] **5.2.2** Create/Edit Campaign modal
  - Name input
  - Description textarea
  - Default rulebook selection
  - Estimated: 2 hours

- [ ] **5.2.3** Campaign detail view
  - Show all characters in campaign
  - Assign/unassign characters
  - Edit campaign settings
  - Delete campaign (with confirmation)
  - Estimated: 2 hours

- [ ] **5.2.4** Campaign selection in character creation
  - Dropdown in Step 0
  - Pre-populate rulebooks based on campaign
  - Estimated: 1 hour

#### 5.3 Level Up Flow

- [ ] **5.3.1** Level up button on character sheet
- [ ] **5.3.2** HP increase dialog (fixed or manual roll)
- [ ] **5.3.3** Feature selection at new level
  - ASI or Feat choice (if applicable)
  - Subclass selection (if applicable)
  - Spell selections (if applicable)
- [ ] **5.3.4** Multiclass option (add new class)
- [ ] **5.3.5** Update all dependent stats (spell slots, proficiency, etc.)
- [ ] **5.3.6** Confirmation and save
- Estimated: 4 hours

#### 5.4 Rest Mechanics

- [ ] **5.4.1** Short Rest button
  - Hit dice spending UI
  - Feature refresh (Warlock slots, etc.)
  - Confirmation dialog
- [ ] **5.4.2** Long Rest button
  - Restore HP to max
  - Recover hit dice (half total, rounded up)
  - Restore all spell slots
  - Reset death saves
  - Reset limited-use features
  - Confirmation dialog
- [ ] **5.4.3** Rest history log (optional display)
- Estimated: 3 hours

**Phase 5 Total**: ~25 hours

---

## Phase 6: Polish, PDF Export & Deployment (Week 7-8)

### Goal

Add PDF export, finalize styling, and deploy to Vercel.

### Tasks

#### 6.1 PDF Export (`src/lib/pdf/`)

- [ ] **6.1.1** Set up react-pdf
  - Install dependency
  - Configure fonts (include fantasy font)
  - Estimated: 1 hour

- [ ] **6.1.2** Create PDF layout components
  - Header with character identity
  - Two-column layout for stats
  - Traditional D&D character sheet styling
  - Estimated: 3 hours

- [ ] **6.1.3** Implement PDF generation
  - Map all character data to PDF fields
  - Handle spells (multiple pages if needed)
  - Handle equipment and features
  - Estimated: 4 hours

- [ ] **6.1.4** PDF download functionality
  - "Export to PDF" button on character sheet
  - Generate and trigger download
  - Filename: `{character-name}-level-{level}.pdf`
  - Estimated: 1 hour

#### 6.2 UI Polish & Theme Refinement

- [ ] **6.2.1** Refine fantasy theme
  - Ensure consistent colors across all components
  - Add hover states and transitions
  - Fine-tune typography hierarchy
  - Estimated: 3 hours

- [ ] **6.2.2** Add loading states
  - Skeleton screens for character list
  - Spinners for API operations
  - Progress indicators for cache warming
  - Estimated: 2 hours

- [ ] **6.2.3** Add error handling UI
  - Error boundaries
  - Toast notifications for errors/success
  - Friendly error messages
  - Estimated: 2 hours

- [ ] **6.2.4** Add empty states
  - No characters yet
  - No spells (non-caster)
  - No equipment
  - Estimated: 1 hour

- [ ] **6.2.5** Mobile responsiveness pass
  - Test all breakpoints
  - Adjust layouts for tablet and mobile
  - Touch-friendly controls
  - Estimated: 3 hours

#### 6.3 Testing

- [ ] **6.3.1** Set up testing framework
  - Vitest configuration
  - React Testing Library setup
  - Estimated: 1 hour

- [ ] **6.3.2** Write unit tests for game engine
  - Ability score calculations
  - Proficiency calculations
  - HP calculations
  - Spell slot calculations
  - Estimated: 4 hours

- [ ] **6.3.3** Write component tests (critical paths)
  - Character creation wizard
  - HP tracker
  - Spell slot tracker
  - Estimated: 3 hours

- [ ] **6.3.4** Manual testing
  - Create characters for all 12 classes
  - Test multiclassing
  - Test both 2014 and 2024 editions
  - Test PDF export
  - Estimated: 4 hours

#### 6.4 Performance Optimization

- [ ] **6.4.1** Code splitting
  - Lazy load wizard steps
  - Lazy load PDF export
  - Estimated: 2 hours

- [ ] **6.4.2** Optimize API data handling
  - Virtual scrolling for long spell lists
  - Memoize expensive calculations
  - Estimated: 2 hours

- [ ] **6.4.3** Lighthouse audit
  - Performance > 90
  - Accessibility checks
  - Best practices
  - Estimated: 2 hours

#### 6.5 Deployment

- [ ] **6.5.1** Configure for Vercel
  - Update `next.config.js` for static export
  - Add `vercel.json` if needed
  - Environment variables
  - Estimated: 1 hour

- [ ] **6.5.2** Deploy to Vercel
  - Connect GitHub repo
  - Configure build settings
  - Deploy production build
  - Estimated: 1 hour

- [ ] **6.5.3** Post-deployment verification
  - Test all features on production
  - Verify IndexedDB persistence
  - Check API caching
  - Estimated: 2 hours

#### 6.6 Documentation

- [ ] **6.6.1** Create README.md
  - Project description
  - Setup instructions
  - Deployment guide
  - Technology stack
  - Estimated: 2 hours

- [ ] **6.6.2** Create user guide
  - How to create a character
  - How to manage HP and spell slots
  - How to level up
  - How to export PDF
  - Estimated: 2 hours

**Phase 6 Total**: ~45 hours

---

## Summary

### Timeline

| Phase     | Description            | Duration    | Effort         |
| --------- | ---------------------- | ----------- | -------------- |
| Phase 0   | Foundation & Setup     | Week 1      | 22 hours       |
| Phase 1   | Data Layer & API       | Week 1-2    | 45 hours       |
| Phase 2   | Game Logic Engine      | Week 2-3    | 40 hours       |
| Phase 3   | Character Sheet UI     | Week 3-5    | 45 hours       |
| Phase 4   | Creation Wizard        | Week 5-6    | 40 hours       |
| Phase 5   | Management & Campaigns | Week 6-7    | 25 hours       |
| Phase 6   | Polish & Deployment    | Week 7-8    | 45 hours       |
| **Total** |                        | **8 weeks** | **~262 hours** |

### Critical Path

The critical path for MVP completion:

1. **Foundation** (Phase 0) → Must complete first
2. **Data Layer** (Phase 1) → Required for all features
3. **Game Engine** (Phase 2) → Required for calculations
4. **Character Sheet** (Phase 3) → Core user experience
5. **Creation Wizard** (Phase 4) → Required for new characters
6. **Management** (Phase 5) → Required for multiple characters
7. **Deployment** (Phase 6) → Final delivery

### Optional Features (Could be deferred)

Features marked as "Could" or "Should" in REQUIREMENTS.md can be deferred if time-constrained:

- Quick Build option (FR-2.11)
- Weight/encumbrance (FR-3.7.7)
- Organizations/Allies tracking (FR-3.10.5)
- Campaign management (FR-5.x - all)
- Short/Long Rest mechanics (FR-7.x)
- Feature use tracking (FR-3.8.7)
- Dark mode support (NFR-2.4)
- Comprehensive test suite

### Dependencies & Order

**Must be completed before dependent tasks:**

- **Phase 0 (Foundation)** must be complete before any other phase
- **Phase 1 (Data Layer)** must be complete before Phase 2, 3, 4, 5
- **Phase 2 (Game Engine)** must be complete before Phase 3 (Character Sheet)
- **Phase 3 (Character Sheet)** must have core structure before Phase 5 (Level Up)
- **Phase 4 (Wizard)** must have data layer (Phase 1) but can parallel with Phase 3

### Parallel Work Opportunities

If working with multiple developers:

- **Phase 1 (Data Layer)** and **Phase 2 (Game Engine)** can be worked on in parallel by different developers
- **Phase 3 (Character Sheet)** panels can be split across multiple developers
- **Phase 4 (Wizard)** steps can be split across multiple developers
- **Phase 6 (Testing)** can be done in parallel with other work

### Risk Mitigation During Implementation

1. **Open5E API Unavailability**
   - Cache all data aggressively in Phase 1
   - Implement offline-first approach
   - Add manual entry fallbacks

2. **Scope Creep**
   - Strictly defer "Could" features to post-MVP
   - Use feature flags for experimental features

3. **Complex Game Mechanics**
   - Start with core rules (2014 edition)
   - Add 2024 edition variations incrementally
   - Provide manual override for all calculations

4. **Performance Issues**
   - Test with maximum data load early (all spells, all items)
   - Implement virtualization from start for long lists
   - Profile and optimize during Phase 6

---

## Appendix: Definition of Done

Each task is considered done when:

1. Code is written and follows project conventions
2. TypeScript compiles without errors (strict mode)
3. Basic manual testing passes
4. Code is committed to Git
5. (For UI tasks) Responsive design works on desktop, tablet, and mobile
6. (For engine tasks) Unit tests pass
7. (For integration tasks) Feature works end-to-end

Each phase is considered complete when:

1. All tasks in the phase are done
2. Phase acceptance criteria are met
3. Integration with previous phases works
4. No critical bugs exist
5. Code review completed (if applicable)

MVP is considered complete when:

1. All "Must" requirements from REQUIREMENTS.md are implemented
2. All acceptance criteria are met
3. App is deployed to Vercel and functional
4. At least one successful character creation → play → level up cycle has been tested
5. PDF export works for created characters
