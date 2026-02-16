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
import { mockCharacter, mockSpellcaster } from '@/lib/debug/mockCharacters';
import type { Character } from '@/types/character';

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
          {/* Skills Panel Placeholder */}
          <CharacterSheetSection title="Skills">
            <div className="text-center py-8 text-gray-500">Skills panel coming soon...</div>
          </CharacterSheetSection>

          {/* Passive Perception */}
          <CharacterSheetSection title="Passive Perception">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-amber-900">
                {10 + (character.abilityScores.modifier.WIS || 0)}
              </div>
            </div>
          </CharacterSheetSection>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-4">
          {/* HP Tracker */}
          <CharacterSheetSection
            title="Hit Points"
            action={
              <span className="text-amber-100 text-sm">
                {character.combat.currentHp + character.combat.tempHp} / {character.combat.maxHp}
              </span>
            }
          >
            <div className="space-y-4">
              {/* HP Bar */}
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${(character.combat.currentHp / character.combat.maxHp) * 100}%`,
                  }}
                />
                {character.combat.tempHp > 0 && (
                  <div
                    className="absolute h-full bg-blue-400 transition-all"
                    style={{
                      left: `${(character.combat.currentHp / character.combat.maxHp) * 100}%`,
                      width: `${(character.combat.tempHp / character.combat.maxHp) * 100}%`,
                    }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-800">
                  {character.combat.currentHp} / {character.combat.maxHp} HP
                </div>
              </div>

              {/* Temp HP */}
              {character.combat.tempHp > 0 && (
                <div className="flex justify-between items-center text-blue-600">
                  <span>Temp HP:</span>
                  <span className="font-bold">+{character.combat.tempHp}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm">
                  -1 HP
                </button>
                <button className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm">
                  -5 HP
                </button>
                <button className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-sm">
                  -10 HP
                </button>
                <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-sm">
                  +1 HP
                </button>
                <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-sm">
                  +5 HP
                </button>
                <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-sm">
                  +10 HP
                </button>
              </div>
            </div>
          </CharacterSheetSection>

          {/* Combat Stats */}
          <CharacterSheetSection title="Combat Stats">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-amber-50 rounded">
                <div className="text-2xl font-bold text-amber-900">{character.combat.ac.total}</div>
                <div className="text-xs text-gray-600 uppercase">Armor Class</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded">
                <div className="text-2xl font-bold text-amber-900">
                  {character.combat.initiative >= 0
                    ? `+${character.combat.initiative}`
                    : character.combat.initiative}
                </div>
                <div className="text-xs text-gray-600 uppercase">Initiative</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded">
                <div className="text-2xl font-bold text-amber-900">{character.combat.speed} ft</div>
                <div className="text-xs text-gray-600 uppercase">Speed</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded">
                <div className="text-2xl font-bold text-amber-900">
                  {character.combat.hitDice.total - character.combat.hitDice.used}/
                  {character.combat.hitDice.total}
                </div>
                <div className="text-xs text-gray-600 uppercase">Hit Dice</div>
              </div>
            </div>
          </CharacterSheetSection>

          {/* Death Saves */}
          {character.combat.currentHp === 0 && (
            <CharacterSheetSection title="Death Saves">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">Successes:</span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 ${
                          i < character.combat.deathSaves.successes
                            ? 'bg-emerald-500 border-emerald-600'
                            : 'bg-gray-200 border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">Failures:</span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 ${
                          i < character.combat.deathSaves.failures
                            ? 'bg-red-500 border-red-600'
                            : 'bg-gray-200 border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CharacterSheetSection>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
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
