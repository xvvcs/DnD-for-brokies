# DnDnB - D&D Character Manager

## Problem Domain & Requirements Specification

---

## 1. Problem Statement

Tabletop RPG players who participate in multiple D&D 5th Edition campaigns need a lightweight, fast, and free tool to create and manage multiple characters. Existing solutions like D&D Beyond are feature-rich but locked behind subscriptions, restrict free users to 6 characters, and require constant internet connectivity. Players running parallel campaigns often use different rulebooks (SRD 5.1 vs 5.2, third-party content), requiring per-character source material configuration.

**DnDnB** is a free, open-source, browser-based D&D 5e character manager that stores all data locally, supports multiple characters across campaigns, and leverages the Open5E API for game content. It aims to replicate the core character sheet experience of D&D Beyond while remaining lightweight, offline-capable after initial data fetch, and deployable to Vercel for fast access from any device.

---

## 2. Domain Model

### 2.1 Core Entities

```
Character
├── Identity (name, level, XP, portrait)
├── Species (race/lineage + traits)
├── Class(es) (multiclass support, subclass per class)
├── Background (proficiencies, feature, origin feat)
├── Ability Scores (STR, DEX, CON, INT, WIS, CHA)
├── Combat Stats (AC, HP, speed, initiative, hit dice, death saves)
├── Skills (18 skills, proficiency/expertise tracking)
├── Saving Throws (6 saves, proficiency tracking)
├── Spellcasting (slots, known/prepared spells, spell save DC, spell attack)
├── Equipment & Inventory (weapons, armor, gear, currency)
├── Features & Traits (class, species, background, feats)
├── Proficiencies (armor, weapons, tools, languages)
├── Conditions (active status effects, exhaustion)
├── Notes & Backstory (personality, ideals, bonds, flaws, backstory, session notes)
└── Configuration (rulebook sources, edition, campaign assignment)

Campaign
├── Name
├── Description
├── Assigned Characters[]
└── Allowed Rulebooks/Documents[]

Rulebook (Open5E Document)
├── Key (e.g., "srd-2014", "tob", "deepm")
├── Name
├── Publisher
├── Game System (5e-2014, 5e-2024, a5e)
└── License
```

### 2.2 Open5E Data Entities (API-sourced, cached locally)

| Entity | API Endpoint | Description |
|--------|-------------|-------------|
| Classes | `/v2/classes/` | Class definitions, features, hit dice, proficiencies |
| Species | `/v2/species/` | Races/lineages with traits |
| Backgrounds | `/v2/backgrounds/` | Background options with proficiencies and features |
| Spells | `/v2/spells/` | Full spell database with class lists |
| Weapons | `/v2/weapons/` | Weapon stats, properties, damage |
| Armor | `/v2/armor/` | Armor stats, AC calculations |
| Items | `/v2/items/` | General equipment |
| Magic Items | `/v2/magicitems/` | Magic item database |
| Feats | `/v2/feats/` | Feat options |
| Conditions | `/v2/conditions/` | Status effect definitions |
| Skills | `/v2/skills/` | Skill list with associated abilities |
| Abilities | `/v2/abilities/` | The six ability scores |
| Languages | `/v2/languages/` | Available languages |
| Documents | `/v2/documents/` | Available rulebooks/sources |
| Damage Types | `/v2/damagetypes/` | Damage type reference |
| Spell Schools | `/v2/spellschools/` | Schools of magic |

---

## 3. Functional Requirements

### FR-1: Character Management (CRUD)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-1.1 | Users can create new characters via a guided creation wizard | Must |
| FR-1.2 | Users can view a list of all saved characters with summary cards (name, species, class, level, portrait) | Must |
| FR-1.3 | Users can open a full character sheet for any saved character | Must |
| FR-1.4 | Users can edit any field on a character (inline editing on the sheet) | Must |
| FR-1.5 | Users can delete characters with confirmation dialog | Must |
| FR-1.6 | Users can duplicate an existing character as a template | Should |
| FR-1.7 | Users can assign characters to campaigns | Should |
| FR-1.8 | No hard limit on number of characters | Must |

### FR-2: Character Creation Wizard

Modeled after D&D Beyond's Standard creation flow.

| ID | Requirement | Priority |
|----|------------|----------|
| FR-2.1 | **Step 0 - Configuration**: Select rulebook sources (documents), edition (2014/2024), campaign assignment, HP method (fixed/manual) | Must |
| FR-2.2 | **Step 1 - Choose Class**: Browse and select from available classes (filtered by selected sources). Set starting level. Select subclass at appropriate level. | Must |
| FR-2.3 | **Step 2 - Choose Background**: Browse and select background. View granted proficiencies, features, and origin feat (2024). | Must |
| FR-2.4 | **Step 3 - Choose Species**: Browse and select species/subspecies. View racial traits. | Must |
| FR-2.5 | **Step 4 - Ability Scores**: Support three methods: Standard Array (15,14,13,12,10,8), Point Buy (27 points), Manual Entry. Display totals with bonuses applied. | Must |
| FR-2.6 | **Step 5 - Equipment**: Select starting equipment based on class defaults. Allow manual additions. | Must |
| FR-2.7 | **Step 6 - Spells** (if spellcaster): Select cantrips and known/prepared spells from class spell list, filtered by selected sources. | Must |
| FR-2.8 | **Step 7 - Description**: Enter name, personality traits, ideals, bonds, flaws, backstory, appearance. | Must |
| FR-2.9 | **Step 8 - Review**: Summary of all selections before finalizing. | Should |
| FR-2.10 | Support multiclassing: ability to add additional classes with level allocation | Should |
| FR-2.11 | Quick Build option: select species + class + name, auto-generate rest | Could |
| FR-2.12 | Each step validates required selections and highlights incomplete fields | Must |

### FR-3: Character Sheet (View & Interact)

The character sheet is the primary interface. It must fit on one page (scrollable sections within a single viewport are acceptable) and include all of the following sections:

#### FR-3.1: Header / Identity Bar
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.1.1 | Display character name, class(es) + level, species, background | Must |
| FR-3.1.2 | Display proficiency bonus (auto-calculated from total level) | Must |
| FR-3.1.3 | Display XP / milestone toggle | Should |

#### FR-3.2: Ability Scores Panel
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.2.1 | Display all 6 ability scores with modifiers | Must |
| FR-3.2.2 | Display saving throw modifiers with proficiency indicators | Must |
| FR-3.2.3 | Allow manual override of any ability score | Must |

#### FR-3.3: Skills Panel
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.3.1 | List all 18 skills with associated ability, modifier, and proficiency/expertise indicator | Must |
| FR-3.3.2 | Display Passive Perception (10 + Perception modifier) | Must |
| FR-3.3.3 | Allow toggling proficiency/expertise for any skill | Must |

#### FR-3.4: Combat Section
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.4.1 | Display Armor Class (auto-calculated from equipped armor + DEX + shield + bonuses, with manual override) | Must |
| FR-3.4.2 | Display Initiative modifier (auto-calculated, with manual override) | Must |
| FR-3.4.3 | Display Speed (walking, and flying/swimming/climbing/burrowing if applicable) | Must |
| FR-3.4.4 | **HP Tracker**: Display Max HP, Current HP, Temporary HP | Must |
| FR-3.4.5 | **HP Tracker**: Increment/decrement buttons for healing and taking damage | Must |
| FR-3.4.6 | **HP Tracker**: Damage input subtracts from Temp HP first, then Current HP | Must |
| FR-3.4.7 | **HP Tracker**: Current HP cannot exceed Max HP (unless Temp HP) | Must |
| FR-3.4.8 | **HP Tracker**: Visual indicator when HP is low (below 50%, below 25%) | Should |
| FR-3.4.9 | **Hit Dice**: Display total and remaining hit dice per class | Must |
| FR-3.4.10 | **Hit Dice**: Spend hit dice (decrement remaining, show expected healing) | Should |
| FR-3.4.11 | **Death Saves**: Three success and three failure checkboxes | Must |
| FR-3.4.12 | **Death Saves**: Reset death saves when stabilized or healed | Must |

#### FR-3.5: Actions Section
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.5.1 | List available Actions (attack actions with to-hit and damage, class action features) | Must |
| FR-3.5.2 | List available Bonus Actions | Must |
| FR-3.5.3 | List available Reactions | Must |
| FR-3.5.4 | Display attack rolls with modifiers (ability mod + proficiency + magic bonuses) | Must |
| FR-3.5.5 | Display damage rolls with dice notation and type | Must |

#### FR-3.6: Spellcasting Section (if applicable)
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.6.1 | Display Spellcasting Ability, Spell Save DC, Spell Attack Bonus (auto-calculated) | Must |
| FR-3.6.2 | Display spell slots per level with used/remaining tracking (clickable checkboxes) | Must |
| FR-3.6.3 | List all known/prepared spells organized by level | Must |
| FR-3.6.4 | Expandable spell cards showing full spell details (range, duration, components, description) | Must |
| FR-3.6.5 | Filter spells by level, school, prepared/known status | Should |
| FR-3.6.6 | Mark spells as concentration with active concentration indicator | Should |
| FR-3.6.7 | Ritual casting indicator | Should |

#### FR-3.7: Equipment & Inventory
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.7.1 | List equipped items (weapons, armor, shield) separately from carried inventory | Must |
| FR-3.7.2 | Equip/unequip toggle that affects AC and available attacks | Must |
| FR-3.7.3 | Currency tracker (CP, SP, EP, GP, PP) | Must |
| FR-3.7.4 | Add items from Open5E database (searchable) | Must |
| FR-3.7.5 | Add custom items (name, description, weight, quantity) | Must |
| FR-3.7.6 | Magic item attunement tracking (max 3 attuned) | Should |
| FR-3.7.7 | Weight/encumbrance tracking (optional, togglable) | Could |

#### FR-3.8: Features, Traits & Proficiencies
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.8.1 | List all class features organized by class and level | Must |
| FR-3.8.2 | List species traits | Must |
| FR-3.8.3 | List background features | Must |
| FR-3.8.4 | List selected feats with descriptions | Must |
| FR-3.8.5 | List proficiencies (armor, weapons, tools, languages) | Must |
| FR-3.8.6 | Expandable/collapsible feature descriptions | Must |
| FR-3.8.7 | Track feature uses (e.g., "Rage: 3/3 uses") with reset on rest | Should |

#### FR-3.9: Conditions & Status Effects
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.9.1 | Toggle standard D&D conditions (Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious) | Must |
| FR-3.9.2 | Track exhaustion levels (1-6 for 2014, 1-10 for 2024) | Must |
| FR-3.9.3 | Display active conditions prominently on the sheet | Must |
| FR-3.9.4 | Show condition effects/rules in tooltip or expandable section | Should |

#### FR-3.10: Notes & Backstory
| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.10.1 | Personality Traits, Ideals, Bonds, Flaws fields | Must |
| FR-3.10.2 | Free-form Backstory text area | Must |
| FR-3.10.3 | Character Appearance description | Should |
| FR-3.10.4 | Session Notes area (free-form, supports multiple entries) | Should |
| FR-3.10.5 | Organizations/Allies tracking | Could |

### FR-4: Rulebook / Source Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-4.1 | Fetch available documents (rulebooks) from Open5E API `/v2/documents/` | Must |
| FR-4.2 | Allow users to select which documents are active per character | Must |
| FR-4.3 | All content browsing (classes, species, spells, items) is filtered by selected documents | Must |
| FR-4.4 | Support both 5e 2014 (SRD 5.1) and 5e 2024 (SRD 5.2) editions | Must |
| FR-4.5 | Display document name and publisher when browsing content to avoid confusion | Must |
| FR-4.6 | Allow campaign-level document presets (all characters in a campaign share allowed sources) | Should |

### FR-5: Campaign Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-5.1 | Create, edit, and delete campaigns | Should |
| FR-5.2 | Assign/unassign characters to campaigns | Should |
| FR-5.3 | Campaign-level rulebook configuration that pre-populates character source selections | Should |
| FR-5.4 | View all characters in a campaign from a campaign dashboard | Should |

### FR-6: Level Up Flow

| ID | Requirement | Priority |
|----|------------|----------|
| FR-6.1 | Level up a character from the character sheet | Must |
| FR-6.2 | Auto-calculate new Max HP (based on hit die + CON modifier, fixed or manual entry) | Must |
| FR-6.3 | Present new class feature choices at each level (subclass, ASI/feat, spell selections) | Must |
| FR-6.4 | Update spell slots, proficiency bonus, and other level-dependent values | Must |
| FR-6.5 | Support multiclass level up (choose which class gains the level) | Should |

### FR-7: Rest Mechanics

| ID | Requirement | Priority |
|----|------------|----------|
| FR-7.1 | **Short Rest**: Spend Hit Dice to recover HP (display expected healing per die: hit die + CON mod) | Should |
| FR-7.2 | **Long Rest**: Restore HP to maximum, recover half of total hit dice (round down), restore all spell slots, reset death saves | Should |
| FR-7.3 | Track which features reset on short rest vs long rest | Could |

### FR-8: PDF Export

| ID | Requirement | Priority |
|----|------------|----------|
| FR-8.1 | Export character sheet as a downloadable PDF | Must |
| FR-8.2 | PDF layout should resemble a traditional D&D character sheet | Should |
| FR-8.3 | Include all character data: stats, spells, equipment, features, notes | Must |

### FR-9: Data Persistence & API Caching

| ID | Requirement | Priority |
|----|------------|----------|
| FR-9.1 | All character data stored locally in IndexedDB via Dexie.js | Must |
| FR-9.2 | Open5E API responses cached in IndexedDB per document | Must |
| FR-9.3 | Cache invalidation: manual refresh button + version/timestamp check | Must |
| FR-9.4 | First launch fetches and caches all selected document data | Must |
| FR-9.5 | App remains functional offline after initial data cache | Should |
| FR-9.6 | Data architecture must support future JSON import/export for backup/sharing | Must |

---

## 4. Non-Functional Requirements

### NFR-1: Performance
| ID | Requirement | Priority |
|----|------------|----------|
| NFR-1.1 | Character sheet loads in under 2 seconds (after initial cache) | Must |
| NFR-1.2 | API data caching reduces network requests to near-zero during normal use | Must |
| NFR-1.3 | Smooth interactions (no jank on HP changes, spell slot toggling, etc.) | Must |
| NFR-1.4 | Lighthouse performance score > 90 on Vercel deployment | Should |

### NFR-2: Usability
| ID | Requirement | Priority |
|----|------------|----------|
| NFR-2.1 | Character sheet fits in a single viewport (scrollable subsections within a fixed layout) | Must |
| NFR-2.2 | Responsive design: usable on desktop (primary), tablet, and mobile | Must |
| NFR-2.3 | Fantasy/D&D-inspired visual theme (ornate borders, parchment textures, fantasy typography) | Must |
| NFR-2.4 | Dark mode support | Should |
| NFR-2.5 | Keyboard accessible (tab navigation, enter to confirm) | Should |
| NFR-2.6 | Character creation wizard is completable in under 10 minutes | Should |

### NFR-3: Reliability
| ID | Requirement | Priority |
|----|------------|----------|
| NFR-3.1 | No data loss: all changes auto-saved to IndexedDB immediately | Must |
| NFR-3.2 | Graceful handling of Open5E API downtime (use cached data, show warnings) | Must |
| NFR-3.3 | Browser compatibility: Chrome, Firefox, Safari, Edge (latest 2 versions) | Must |

### NFR-4: Maintainability
| ID | Requirement | Priority |
|----|------------|----------|
| NFR-4.1 | TypeScript strict mode for type safety | Must |
| NFR-4.2 | Component-based architecture with clear separation of concerns | Must |
| NFR-4.3 | Open5E API integration isolated behind a service layer (easy to swap/update) | Must |
| NFR-4.4 | Database schema versioned with Dexie migration support | Must |

### NFR-5: Deployment
| ID | Requirement | Priority |
|----|------------|----------|
| NFR-5.1 | Deployable to Vercel with zero configuration | Must |
| NFR-5.2 | No server-side state or database required (fully client-side) | Must |
| NFR-5.3 | Environment-based configuration (API base URL, feature flags) | Should |

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS v4 |
| Local Database | Dexie.js (IndexedDB wrapper) |
| Data Fetching | TanStack Query (React Query) for API calls with IndexedDB cache |
| State Management | React Context + Zustand (for cross-component character state) |
| PDF Generation | react-pdf or jspdf |
| Deployment | Vercel |
| Linting / Formatting | ESLint + Prettier |
| Testing | Vitest + React Testing Library |

### 5.2 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐   ┌────────────┐ │
│  │  Next.js App │    │  Dexie.js    │   │ IndexedDB  │ │
│  │  (React UI)  │◄──►│  Service     │◄─►│            │ │
│  │              │    │  Layer       │   │ - Characters│ │
│  └──────┬───────┘    └──────┬───────┘   │ - Campaigns│ │
│         │                   │           │ - API Cache │ │
│         │                   │           └────────────┘ │
│         │                   │                          │
│         │           ┌───────▼───────┐                  │
│         │           │  Open5E API   │                  │
│         │           │  Service      │                  │
│         │           └───────┬───────┘                  │
│         │                   │                          │
└─────────┼───────────────────┼──────────────────────────┘
          │                   │
          │                   ▼
          │           ┌───────────────┐
          │           │ api.open5e.com│
          │           │   /v2/...     │
          │           └───────────────┘
          │
          ▼
    ┌───────────┐
    │  Vercel   │
    │  (Host)   │
    └───────────┘
```

### 5.3 Database Schema (Dexie.js / IndexedDB)

```typescript
// Characters table
interface Character {
  id: string;                    // UUID
  name: string;
  level: number;
  xp: number;
  species: SpeciesSelection;
  classes: ClassSelection[];     // Supports multiclass
  background: BackgroundSelection;
  abilityScores: AbilityScores;
  hp: { max: number; current: number; temp: number };
  hitDice: HitDiceState[];
  deathSaves: { successes: number; failures: number };
  ac: { base: number; override?: number };
  speed: SpeedValues;
  skills: SkillProficiencies;
  savingThrows: SavingThrowProficiencies;
  spellcasting: SpellcastingState;
  equipment: EquipmentState;
  features: FeatureState[];
  feats: FeatSelection[];
  proficiencies: ProficiencyState;
  conditions: ActiveCondition[];
  exhaustion: number;
  currency: Currency;
  notes: CharacterNotes;
  campaignId?: string;
  documentKeys: string[];        // Selected rulebook sources
  edition: '2014' | '2024';
  portrait?: string;             // Base64 or URL
  createdAt: Date;
  updatedAt: Date;
}

// Campaigns table
interface Campaign {
  id: string;
  name: string;
  description: string;
  documentKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Cache table
interface CachedAPIData {
  key: string;          // e.g., "spells:srd-2014"
  endpoint: string;
  documentKey: string;
  data: any[];
  fetchedAt: Date;
  version: string;
}
```

### 5.4 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home / Character list
│   ├── characters/
│   │   ├── new/page.tsx          # Character creation wizard
│   │   └── [id]/page.tsx         # Character sheet view
│   ├── campaigns/
│   │   └── page.tsx              # Campaign management
│   └── layout.tsx                # Root layout with providers
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── character-sheet/          # Character sheet sections
│   │   ├── AbilityScores.tsx
│   │   ├── CombatStats.tsx
│   │   ├── HPTracker.tsx
│   │   ├── SkillsPanel.tsx
│   │   ├── ActionsPanel.tsx
│   │   ├── SpellcastingPanel.tsx
│   │   ├── EquipmentPanel.tsx
│   │   ├── FeaturesPanel.tsx
│   │   ├── ConditionsPanel.tsx
│   │   └── NotesPanel.tsx
│   ├── character-creation/       # Wizard step components
│   │   ├── StepClass.tsx
│   │   ├── StepBackground.tsx
│   │   ├── StepSpecies.tsx
│   │   ├── StepAbilityScores.tsx
│   │   ├── StepEquipment.tsx
│   │   ├── StepSpells.tsx
│   │   ├── StepDescription.tsx
│   │   └── StepReview.tsx
│   └── shared/                   # Shared UI components
├── lib/
│   ├── db/                       # Dexie.js database
│   │   ├── schema.ts
│   │   ├── characters.ts
│   │   ├── campaigns.ts
│   │   └── cache.ts
│   ├── api/                      # Open5E API service
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── endpoints/
│   │       ├── classes.ts
│   │       ├── species.ts
│   │       ├── spells.ts
│   │       ├── equipment.ts
│   │       └── documents.ts
│   ├── engine/                   # Game logic / calculations
│   │   ├── ability-scores.ts
│   │   ├── combat.ts
│   │   ├── spellcasting.ts
│   │   ├── proficiency.ts
│   │   └── hp.ts
│   └── utils/                    # Shared utilities
├── hooks/                        # Custom React hooks
│   ├── useCharacter.ts
│   ├── useCampaign.ts
│   ├── useOpen5E.ts
│   └── useLocalDB.ts
├── stores/                       # Zustand stores
│   └── characterStore.ts
├── types/                        # TypeScript type definitions
│   ├── character.ts
│   ├── campaign.ts
│   ├── open5e.ts
│   └── game.ts
└── styles/                       # Global styles, theme
    ├── globals.css
    └── fantasy-theme.css
```

---

## 6. Open5E API Integration Details

### 6.1 API Configuration

- **Base URL**: `https://api.open5e.com/v2/`
- **Authentication**: None required (public API)
- **Format**: JSON (`?format=json`)
- **Pagination**: All list endpoints paginated; fetch all pages during cache build

### 6.2 Document Filtering Strategy

Every content query must include `?document__key=<key>` to filter by the user's selected rulebooks. When a character has multiple documents selected, issue parallel requests per document and merge results.

### 6.3 Key Endpoints Used

| Feature | Endpoint | Cache Strategy |
|---------|----------|---------------|
| Available rulebooks | `/v2/documents/` | Cache on first load, refresh weekly |
| Class options | `/v2/classes/?document__key=X` | Cache per document, refresh on demand |
| Species options | `/v2/species/?document__key=X` | Cache per document, refresh on demand |
| Background options | `/v2/backgrounds/?document__key=X` | Cache per document, refresh on demand |
| Spell database | `/v2/spells/?document__key=X` | Cache per document, refresh on demand |
| Weapon list | `/v2/weapons/?document__key=X` | Cache per document, refresh on demand |
| Armor list | `/v2/armor/?document__key=X` | Cache per document, refresh on demand |
| General items | `/v2/items/?document__key=X` | Cache per document, refresh on demand |
| Magic items | `/v2/magicitems/?document__key=X` | Cache per document, refresh on demand |
| Feats | `/v2/feats/?document__key=X` | Cache per document, refresh on demand |
| Conditions | `/v2/conditions/` | Cache globally |
| Skills | `/v2/skills/` | Cache globally |
| Languages | `/v2/languages/` | Cache globally |

### 6.4 API Data Gaps & Mitigations

The Open5E API provides SRD content only. Several features available in D&D Beyond require manual entry:

| Missing Data | Mitigation |
|-------------|------------|
| Not all subclasses available | Allow manual entry of subclass name and features |
| Some species missing | Allow custom species with manual trait entry |
| Class feature details may be incomplete | Display what's available, allow user to add custom features |
| No character portrait API | Support image upload (stored as base64 in IndexedDB) |
| Starting equipment choices not structured | Present equipment list, let user select manually |

---

## 7. User Flows

### 7.1 First-Time User Flow

```
1. Land on home page → empty state with "Create Character" CTA
2. Select rulebooks/documents to use → triggers API fetch and cache
3. Enter character creation wizard
4. Complete all steps → character saved to IndexedDB
5. Redirected to character sheet
```

### 7.2 Returning User Flow

```
1. Land on home page → see character list
2. Click character card → open character sheet
3. Make changes (HP, spell slots, notes) → auto-saved
4. Navigate back to character list
```

### 7.3 HP Tracking Flow

```
1. View current HP on character sheet
2. Take Damage:
   a. Click "Damage" button or decrement
   b. Enter damage amount
   c. Temp HP absorbed first, remainder from Current HP
   d. Current HP floors at 0
   e. If HP reaches 0, prompt for death save tracking
3. Heal:
   a. Click "Heal" button or increment
   b. Enter healing amount
   c. Current HP increases, capped at Max HP
   d. If at 0 HP with death saves, reset death saves
```

### 7.4 Level Up Flow

```
1. Click "Level Up" on character sheet
2. Select which class gains the level (if multiclass)
3. HP increase: auto-calculate fixed value or enter manual roll
4. New features/choices presented based on new level
5. Update spell slots, proficiency if applicable
6. Confirm → character updated
```

---

## 8. UI/UX Design Guidelines

### 8.1 Visual Theme: Fantasy / D&D-Inspired

- **Color Palette**: Deep reds, golds, dark browns, parchment/cream backgrounds
- **Typography**: Serif fonts for headers (e.g., Cinzel, MedievalSharp), clean sans-serif for body text
- **Borders**: Ornate/decorative borders on panels and cards
- **Textures**: Subtle parchment/paper textures on card backgrounds
- **Icons**: Fantasy-themed icons for sections (sword for attacks, shield for AC, book for spells)
- **Inspiration**: D&D Beyond's dark theme with gold accents

### 8.2 Character Sheet Layout (Single Page)

```
┌─────────────────────────────────────────────────────────┐
│  [Character Name]   [Class + Level]   [Species]   [BG]  │
│  Proficiency: +3    HP: 45/52  THP: 5    AC: 18        │
├──────────┬─────────────────────────┬────────────────────┤
│ ABILITY  │     COMBAT & ACTIONS    │   SPELLS/FEATURES  │
│ SCORES   │                         │                    │
│          │  ┌─ HP Tracker ───────┐ │  ┌─ Spell Slots ─┐│
│ STR: 16  │  │ [- ] 45/52 [+ ]   │ │  │ 1st: ●●●○     ││
│ DEX: 14  │  │ Temp HP: 5        │ │  │ 2nd: ●●○      ││
│ CON: 13  │  │ Hit Dice: 5d10    │ │  │ 3rd: ●○○      ││
│ INT: 10  │  └───────────────────┘ │  └────────────────┘│
│ WIS: 12  │                         │                    │
│ CHA:  8  │  ┌─ Actions ─────────┐ │  ┌─ Spell List ──┐│
│          │  │ Longsword +7      │ │  │ Cantrips       ││
│ SAVES    │  │ 1d8+4 slashing    │ │  │ 1st Level      ││
│ SKILLS   │  │ ...               │ │  │ 2nd Level      ││
│          │  └───────────────────┘ │  │ ...            ││
│          │                         │  └────────────────┘│
│          │  ┌─ Death Saves ─────┐ │                    │
│          │  │ S: ○○○  F: ○○○   │ │  ┌─ Features ────┐│
│          │  └───────────────────┘ │  │ Class Features ││
│          │                         │  │ Species Traits ││
│          │  ┌─ Conditions ──────┐ │  │ Feats          ││
│          │  │ [toggle buttons]  │ │  └────────────────┘│
├──────────┴─────────────────────────┴────────────────────┤
│  EQUIPMENT & INVENTORY          │  NOTES & BACKSTORY    │
│  Equipped | Backpack | Currency │  Traits | Backstory   │
└─────────────────────────────────┴───────────────────────┘
```

### 8.3 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Desktop (1280px+) | Full 3-column layout as above |
| Tablet (768px-1279px) | 2-column layout, skills collapse into accordion |
| Mobile (< 768px) | Single column, tabbed navigation between sections |

---

## 9. Constraints & Assumptions

### Constraints
1. **Open5E API is community-maintained** -- no SLA, may have downtime; aggressive caching required
2. **SRD content only** -- not all PHB content is available; manual entry must fill gaps
3. **No server-side storage** -- all data in browser; clearing browser data deletes characters
4. **IndexedDB size limits** -- typically 50MB+; sufficient for character data and cached API responses
5. **Open5E API has no rate limit documentation** -- implement request throttling (max 5 concurrent, 100ms delay between batches)

### Assumptions
1. Users have a modern browser with IndexedDB support
2. Users have internet access for initial API data fetch
3. Users are familiar with D&D 5e rules and terminology
4. The Open5E v2 API remains stable and publicly accessible
5. Users will manage at most ~20-30 characters (not hundreds)

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Open5E API goes down permanently | Critical | Low | Cache all data locally; consider bundling SRD data as fallback |
| Open5E API changes breaking schema | High | Medium | Version API service layer; schema validation on cached data |
| Browser data cleared by user | High | Medium | Prominent warning about local storage; architecture supports future export |
| API data insufficient for character creation | Medium | High | Allow manual entry for all fields; semi-automated approach |
| IndexedDB storage limits hit | Low | Low | Implement cache eviction; compress stored data |
| Performance issues with large spell databases | Medium | Medium | Virtual scrolling for long lists; lazy-load spell details |

---

## 11. Future Considerations (Out of Scope for V1)

These features are explicitly deferred but the architecture must not prevent them:

1. **JSON Import/Export** -- backup characters and share between devices
2. **PWA / Offline Mode** -- service worker for full offline support
3. **Cloud Sync** -- optional account system for cross-device sync
4. **Dice Roller** -- integrated dice rolling with history
5. **Encounter Tracker** -- DM-facing combat initiative tracker
6. **Party View** -- view all campaign characters side by side
7. **Homebrew Content Creator** -- create custom classes, species, spells
8. **Character Sharing** -- share character sheets via URL
9. **Multiple Themes** -- light mode, additional fantasy themes
10. **Accessibility Audit** -- WCAG 2.1 AA compliance

---

## 12. Acceptance Criteria Summary

The MVP is considered complete when:

- [ ] A user can create a new character through a guided wizard selecting class, species, background, ability scores, equipment, and spells
- [ ] Character data persists in the browser across sessions via IndexedDB
- [ ] The character sheet displays all core sections (abilities, skills, combat, actions, spells, equipment, features, conditions, notes)
- [ ] HP can be manually tracked (damage, healing, temp HP) with proper rules enforcement
- [ ] Spell slots can be tracked (used/available)
- [ ] Death saves can be tracked
- [ ] Multiple characters can be managed from a character list page
- [ ] Rulebook sources can be configured per character
- [ ] Both 5e 2014 and 2024 editions are supported
- [ ] Open5E API data is cached locally for fast access
- [ ] The character sheet is usable on desktop and tablet
- [ ] The app has a fantasy/D&D-inspired visual theme
- [ ] Characters can be exported as PDF
- [ ] The app deploys successfully to Vercel
- [ ] The app functions after initial load without requiring internet connectivity
