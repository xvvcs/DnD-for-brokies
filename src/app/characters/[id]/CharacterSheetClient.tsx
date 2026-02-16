/**
 * Character Sheet Client Component
 *
 * The actual character sheet UI (client-side only)
 */

'use client';

import React, { useState } from 'react';

import {
  CharacterSheetLayout,
  CharacterSheetGrid,
  CharacterSheetSection,
  CharacterSheetHeader,
} from '@/components/character-sheet/CharacterSheetLayout';
import { IdentityBar } from '@/components/character-sheet/IdentityBar';
import { AbilityScores } from '@/components/character-sheet/AbilityScores';
import { SkillsPanel } from '@/components/character-sheet/SkillsPanel';
import { CombatStats } from '@/components/character-sheet/CombatStats';
import { HPTracker } from '@/components/character-sheet/HPTracker';
import { ActionsPanel } from '@/components/character-sheet/ActionsPanel';
import { SpellcastingPanel } from '@/components/character-sheet/SpellcastingPanel';
import { mockCharacter, mockSpellcaster } from '@/lib/debug/mockCharacters';
import type { Character } from '@/types/character';
import type { ProficiencyLevel, SpellLevel } from '@/types/game';

interface CharacterSheetClientProps {
  characterId: string;
}

export function CharacterSheetClient({ characterId }: CharacterSheetClientProps) {
  // Use appropriate mock character based on ID
  const isWizard = characterId === 'debug-wizard';
  const [character, setCharacter] = useState<Character>(isWizard ? mockSpellcaster : mockCharacter);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Handle character updates
  const handleUpdate = (updates: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  };

  // Handle save trigger
  const handleSave = () => {
    setSaveStatus('saving');
    // TODO: Actually save to database
    setTimeout(() => {
      setSaveStatus('saved');
    }, 500);
  };

  // Calculate proficiency bonus based on level
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;

  // Convert skills array to proficiency map
  const skillProficiencies: Record<string, ProficiencyLevel> = {};
  character.skills.forEach((skill) => {
    skillProficiencies[skill.skillKey] = skill.proficiency as ProficiencyLevel;
  });

  return (
    <CharacterSheetLayout>
      {/* Debug Banner */}
      <div className="bg-yellow-100 border-b-2 border-yellow-400 px-4 py-2 text-center print:hidden">
        <span className="font-bold text-yellow-800">🔧 DEBUG MODE</span>
        <span className="text-yellow-700 ml-2">Character ID: {characterId}</span>
        <span className="text-yellow-700 ml-4">
          Status:{' '}
          {saveStatus === 'saving'
            ? '💾 Saving...'
            : saveStatus === 'saved'
              ? '✓ Saved'
              : '⚠ Error'}
        </span>
      </div>

      {/* Character Header */}
      <CharacterSheetHeader>
        <IdentityBar
          character={{
            name: character.name,
            classes: character.classes,
            race: character.race,
            background: character.background,
            level: character.level,
            experiencePoints: character.experiencePoints,
            proficiencyBonus: proficiencyBonus,
          }}
          onUpdate={(updates) => {
            handleUpdate({
              name: updates.name ?? character.name,
              experiencePoints: updates.experiencePoints ?? character.experiencePoints,
            });
          }}
          onSave={handleSave}
        />
      </CharacterSheetHeader>

      {/* Ability Scores Bar - Right under header */}
      <CharacterSheetHeader>
        <AbilityScores
          scores={character.abilityScores.total}
          modifiers={character.abilityScores.modifier}
          saveProficiencies={{
            STR: character.classes.some((c) => c.key === 'fighter' || c.key === 'barbarian'),
            DEX: false,
            CON: character.classes.some((c) => c.key === 'fighter' || c.key === 'barbarian'),
            INT: false,
            WIS: false,
            CHA: false,
          }}
          proficiencyBonus={proficiencyBonus}
          onScoreChange={(ability, score) => {
            // TODO: Update ability score
            console.log(`Update ${ability} to ${score}`);
          }}
          onSaveProficiencyChange={(ability, proficient) => {
            // TODO: Toggle save proficiency
            console.log(`Toggle ${ability} save proficiency to ${proficient}`);
          }}
          onSave={handleSave}
        />
      </CharacterSheetHeader>

      {/* Main Content Grid */}
      <CharacterSheetGrid>
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Skills Panel */}
          <SkillsPanel
            abilityModifiers={character.abilityScores.modifier}
            skillProficiencies={skillProficiencies}
            proficiencyBonus={proficiencyBonus}
            onSkillProficiencyChange={(skillKey, level) => {
              // TODO: Update skill proficiency
              console.log(`Update ${skillKey} proficiency to ${level}`);
            }}
          />
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-4">
          {/* Combat Stats */}
          <CombatStats
            combatStats={character.combat}
            classes={character.classes}
            conditions={character.conditions}
            onACChange={(ac) => console.log('AC changed:', ac)}
            onDeathSaveChange={(type, value) => console.log('Death save changed:', type, value)}
            onConditionToggle={(key) => console.log('Condition toggled:', key)}
          />

          {/* HP Tracker */}
          <HPTracker
            currentHp={character.combat.currentHp}
            maxHp={character.combat.maxHp}
            tempHp={character.combat.tempHp}
            onHpChange={(current, temp) => console.log('HP changed:', current, temp)}
            onDamage={(amount) => console.log('Damage taken:', amount)}
            onHeal={(amount) => console.log('Healed:', amount)}
            onTempHpChange={(amount) => console.log('Temp HP changed:', amount)}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Actions Panel */}
          <ActionsPanel
            actions={character.actions}
            onAddAction={(action) => console.log('Add action:', action)}
            onRemoveAction={(id) => console.log('Remove action:', id)}
            onUseAction={(id) => console.log('Use action:', id)}
          />

          {/* Spellcasting Panel */}
          {character.spellcasting && (
            <SpellcastingPanel
              spellcasting={character.spellcasting}
              primaryClassKey={character.classes[0]?.key || ''}
              onSpellSlotUse={(level: SpellLevel, isUsed: boolean) =>
                console.log('Spell slot used:', level, isUsed)
              }
              onSpellTogglePrepared={(spellKey: string) =>
                console.log('Toggle spell prepared:', spellKey)
              }
              onAddSpell={(spell) => console.log('Add spell:', spell)}
              onRemoveSpell={(spellKey: string) => console.log('Remove spell:', spellKey)}
            />
          )}

          {/* Features */}
          <CharacterSheetSection title="Features & Traits">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {character.features.map((feature) => (
                <div key={feature.id} className="p-2 bg-amber-50 rounded text-sm">
                  <div className="font-medium text-amber-900">{feature.name}</div>
                  <div className="text-xs text-gray-600">{feature.source}</div>
                  {feature.uses && (
                    <div className="text-xs mt-1">
                      Uses: {feature.uses.max - feature.uses.used}/{feature.uses.max}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CharacterSheetSection>

          {/* Currency */}
          <CharacterSheetSection title="Currency">
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(character.currency)
                .filter(([, amount]) => amount > 0)
                .map(([type, amount]) => (
                  <div key={type} className="text-center p-2 bg-amber-50 rounded">
                    <div className="font-bold text-amber-900">{amount}</div>
                    <div className="text-xs text-gray-600 uppercase">{type}</div>
                  </div>
                ))}
            </div>
          </CharacterSheetSection>

          {/* Rest Buttons */}
          <div className="grid grid-cols-2 gap-3 print:hidden">
            <button className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg font-bold hover:bg-blue-200 transition-colors">
              Short Rest
            </button>
            <button className="px-4 py-3 bg-indigo-100 text-indigo-800 rounded-lg font-bold hover:bg-indigo-200 transition-colors">
              Long Rest
            </button>
          </div>
        </div>
      </CharacterSheetGrid>

      {/* Footer Actions */}
      <div className="px-4 pb-4 flex justify-between items-center print:hidden">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 font-medium">
            Level Up
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">
            Export PDF
          </button>
        </div>
        <button className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">
          Delete Character
        </button>
      </div>
    </CharacterSheetLayout>
  );
}
