/**
 * Character Sheet Client Component
 *
 * Supports both debug mock characters (debug-fighter, debug-wizard) and live
 * DB characters. For live characters, use /characters/view?id=xxx (static export).
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  CharacterSheetLayout,
  CharacterSheetGrid,
  CharacterSheetHeader,
} from '@/components/character-sheet/CharacterSheetLayout';
import { IdentityBar } from '@/components/character-sheet/IdentityBar';
import { AbilityScores } from '@/components/character-sheet/AbilityScores';
import { SkillsPanel } from '@/components/character-sheet/SkillsPanel';
import { CombatStats } from '@/components/character-sheet/CombatStats';
import { HPTracker } from '@/components/character-sheet/HPTracker';
import { NotesPanel } from '@/components/character-sheet/NotesPanel';
import { CombatActionsPanel } from '@/components/character-sheet/CombatActionsPanel';
import { EquipmentPanel } from '@/components/character-sheet/EquipmentPanel';
import { FeaturesPanel } from '@/components/character-sheet/FeaturesPanel';
import { mockCharacter, mockSpellcaster } from '@/lib/debug/mockCharacters';
import { useCharacter } from '@/hooks/useCharacter';
import { useAutoSave, SaveIndicator } from '@/hooks/useAutoSave';
import { useCharacterStore } from '@/stores/characterStore';
import { deleteCharacter } from '@/lib/db/characters';
import type { Character, CharacterUpdate } from '@/types/character';
import type { ProficiencyLevel, SpellLevel } from '@/types/game';

const DEBUG_IDS = ['debug-fighter', 'debug-wizard'];

interface CharacterSheetClientProps {
  characterId: string;
}

function DebugCharacterSheet({ characterId }: CharacterSheetClientProps) {
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

          {/* Notes Panel */}
          <NotesPanel
            personality={character.personality}
            appearance={character.appearance}
            sessionNotes={character.sessionNotes}
            onPersonalityChange={(personality) => handleUpdate({ personality })}
            onAppearanceChange={(appearance) => handleUpdate({ appearance })}
            onSessionNotesChange={(sessionNotes) => handleUpdate({ sessionNotes })}
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
            onConditionToggle={(conditionKey) => {
              const hasCondition = character.conditions.some(
                (c) => c.conditionKey === conditionKey
              );
              if (hasCondition) {
                handleUpdate({
                  conditions: character.conditions.filter((c) => c.conditionKey !== conditionKey),
                });
              } else {
                handleUpdate({
                  conditions: [...character.conditions, { conditionKey }],
                });
              }
            }}
            onExhaustionChange={(level) => {
              const existingExhaustion = character.conditions.find(
                (c) => c.conditionKey === 'exhaustion'
              );
              if (level === 0 && existingExhaustion) {
                handleUpdate({
                  conditions: character.conditions.filter((c) => c.conditionKey !== 'exhaustion'),
                });
              } else if (existingExhaustion) {
                handleUpdate({
                  conditions: character.conditions.map((c) =>
                    c.conditionKey === 'exhaustion' ? { ...c, exhaustionLevel: level } : c
                  ),
                });
              } else {
                handleUpdate({
                  conditions: [
                    ...character.conditions,
                    { conditionKey: 'exhaustion', exhaustionLevel: level },
                  ],
                });
              }
            }}
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
          {/* Combat Actions Panel (unified Actions + Spellcasting) */}
          <CombatActionsPanel
            actions={character.actions}
            onAddAction={(action) => console.log('Add action:', action)}
            onRemoveAction={(id) => console.log('Remove action:', id)}
            onUseAction={(id) => console.log('Use action:', id)}
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

          {/* Features Panel */}
          <FeaturesPanel
            features={character.features}
            onFeatureUse={(featureId) => {
              // Decrement uses
              const updatedFeatures = character.features.map((f) =>
                f.id === featureId && f.uses
                  ? { ...f, uses: { ...f.uses, used: Math.min(f.uses.max, f.uses.used + 1) } }
                  : f
              );
              handleUpdate({ features: updatedFeatures });
            }}
            onFeatureReset={(featureId) => {
              // Reset uses
              const updatedFeatures = character.features.map((f) =>
                f.id === featureId && f.uses ? { ...f, uses: { ...f.uses, used: 0 } } : f
              );
              handleUpdate({ features: updatedFeatures });
            }}
            onAddFeature={(feature) => {
              handleUpdate({ features: [...character.features, feature] });
            }}
            onRemoveFeature={(featureId) => {
              handleUpdate({ features: character.features.filter((f) => f.id !== featureId) });
            }}
          />

          {/* Equipment Panel */}
          <EquipmentPanel
            inventory={character.inventory}
            currency={character.currency}
            documentKeys={['wotc-srd', 'srd-2024']}
            onInventoryChange={(inventory) => handleUpdate({ inventory })}
            onCurrencyChange={(currency) => handleUpdate({ currency })}
            showEncumbrance={true}
            strengthScore={character.abilityScores.total.STR}
          />

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

function LiveCharacterSheet({ characterId }: CharacterSheetClientProps) {
  const router = useRouter();
  const { data: loadedCharacter, isLoading, error } = useCharacter(characterId);
  const { draft, setOriginal, updateDraft, markSaved } = useCharacterStore();
  const {
    saveState,
    lastSavedAt,
    error: saveError,
    save,
  } = useAutoSave({
    characterId,
    delay: 1000,
    onSave: () => markSaved(),
  });

  useEffect(() => {
    if (loadedCharacter) setOriginal(loadedCharacter);
  }, [loadedCharacter, setOriginal]);

  const handleUpdate = useCallback(
    (patch: Partial<Character>) => {
      updateDraft(patch as CharacterUpdate);
      void save(patch as CharacterUpdate);
    },
    [updateDraft, save]
  );

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Delete "${draft?.name ?? 'this character'}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteCharacter(characterId);
      router.push('/');
    } catch {
      alert('Failed to delete character. Please try again.');
    }
  }, [characterId, draft?.name, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground animate-pulse">Loading character…</div>
      </div>
    );
  }

  if (error || !loadedCharacter) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : 'Character not found.'}
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-muted rounded hover:bg-muted/80 text-sm"
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  const character = (draft as Character | null) ?? loadedCharacter;
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;
  const skillProficiencies: Record<string, ProficiencyLevel> = {};
  character.skills.forEach((skill) => {
    skillProficiencies[skill.skillKey] = skill.proficiency as ProficiencyLevel;
  });
  const saveProficiencies = {
    STR: character.classes.some((c) => c.key === 'fighter' || c.key === 'barbarian'),
    DEX: false,
    CON: character.classes.some((c) => c.key === 'fighter' || c.key === 'barbarian'),
    INT: false,
    WIS: false,
    CHA: false,
  };

  return (
    <CharacterSheetLayout>
      <div className="flex items-center justify-between px-4 py-2 border-b print:hidden">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </button>
        <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} error={saveError} />
      </div>

      <CharacterSheetHeader>
        <IdentityBar
          character={{
            name: character.name,
            classes: character.classes,
            race: character.race,
            background: character.background,
            level: character.level,
            experiencePoints: character.experiencePoints,
            proficiencyBonus,
          }}
          onUpdate={(updates) => {
            handleUpdate({
              name: updates.name ?? character.name,
              experiencePoints: updates.experiencePoints ?? character.experiencePoints,
            });
          }}
        />
      </CharacterSheetHeader>

      <CharacterSheetHeader>
        <AbilityScores
          scores={character.abilityScores.total}
          modifiers={character.abilityScores.modifier}
          saveProficiencies={saveProficiencies}
          proficiencyBonus={proficiencyBonus}
          onScoreChange={(ability, score) => {
            const newBase = { ...character.abilityScores.base, [ability]: score };
            handleUpdate({ abilityScores: { ...character.abilityScores, base: newBase } });
          }}
          onSaveProficiencyChange={() => {}}
        />
      </CharacterSheetHeader>

      <CharacterSheetGrid>
        <div className="flex flex-col gap-4">
          <SkillsPanel
            abilityModifiers={character.abilityScores.modifier}
            skillProficiencies={skillProficiencies}
            proficiencyBonus={proficiencyBonus}
            onSkillProficiencyChange={(skillKey, level) => {
              const existing = character.skills.find((s) => s.skillKey === skillKey);
              if (existing) {
                handleUpdate({
                  skills: character.skills.map((s) =>
                    s.skillKey === skillKey ? { ...s, proficiency: level } : s
                  ),
                });
              } else {
                handleUpdate({
                  skills: [
                    ...character.skills,
                    { skillKey, proficiency: level, bonus: 0, source: 'manual' },
                  ],
                });
              }
            }}
          />
          <NotesPanel
            personality={character.personality}
            appearance={character.appearance}
            sessionNotes={character.sessionNotes}
            onPersonalityChange={(personality) => handleUpdate({ personality })}
            onAppearanceChange={(appearance) => handleUpdate({ appearance })}
            onSessionNotesChange={(sessionNotes) => handleUpdate({ sessionNotes })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <CombatStats
            combatStats={character.combat}
            classes={character.classes}
            conditions={character.conditions}
            onACChange={(ac) =>
              handleUpdate({
                combat: { ...character.combat, ac: { ...character.combat.ac, total: ac } },
              })
            }
            onDeathSaveChange={(type, value) => {
              const key = type === 'success' ? 'successes' : 'failures';
              handleUpdate({
                combat: {
                  ...character.combat,
                  deathSaves: { ...character.combat.deathSaves, [key]: value },
                },
              });
            }}
            onConditionToggle={(conditionKey) => {
              const has = character.conditions.some((c) => c.conditionKey === conditionKey);
              handleUpdate({
                conditions: has
                  ? character.conditions.filter((c) => c.conditionKey !== conditionKey)
                  : [...character.conditions, { conditionKey }],
              });
            }}
            onExhaustionChange={(level) => {
              const existing = character.conditions.find((c) => c.conditionKey === 'exhaustion');
              if (level === 0) {
                handleUpdate({
                  conditions: character.conditions.filter((c) => c.conditionKey !== 'exhaustion'),
                });
              } else if (existing) {
                handleUpdate({
                  conditions: character.conditions.map((c) =>
                    c.conditionKey === 'exhaustion' ? { ...c, exhaustionLevel: level } : c
                  ),
                });
              } else {
                handleUpdate({
                  conditions: [
                    ...character.conditions,
                    { conditionKey: 'exhaustion', exhaustionLevel: level },
                  ],
                });
              }
            }}
          />
          <HPTracker
            currentHp={character.combat.currentHp}
            maxHp={character.combat.maxHp}
            tempHp={character.combat.tempHp}
            onHpChange={(current, temp) =>
              handleUpdate({ combat: { ...character.combat, currentHp: current, tempHp: temp } })
            }
            onDamage={(amount) => {
              let remaining = amount;
              let newTemp = character.combat.tempHp;
              if (newTemp > 0) {
                const absorbed = Math.min(newTemp, remaining);
                newTemp -= absorbed;
                remaining -= absorbed;
              }
              const newCurrent = Math.max(0, character.combat.currentHp - remaining);
              handleUpdate({
                combat: { ...character.combat, currentHp: newCurrent, tempHp: newTemp },
              });
            }}
            onHeal={(amount) => {
              const newCurrent = Math.min(
                character.combat.maxHp,
                character.combat.currentHp + amount
              );
              const deathSaves =
                character.combat.currentHp === 0 && newCurrent > 0
                  ? { successes: 0, failures: 0 }
                  : character.combat.deathSaves;
              handleUpdate({
                combat: { ...character.combat, currentHp: newCurrent, deathSaves },
              });
            }}
            onTempHpChange={(amount) => {
              const newTemp = Math.max(character.combat.tempHp, amount);
              handleUpdate({ combat: { ...character.combat, tempHp: newTemp } });
            }}
          />
          <div className="grid grid-cols-2 gap-3 print:hidden">
            <button
              type="button"
              className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg font-bold hover:bg-blue-200 transition-colors"
            >
              Short Rest
            </button>
            <button
              type="button"
              className="px-4 py-3 bg-indigo-100 text-indigo-800 rounded-lg font-bold hover:bg-indigo-200 transition-colors"
            >
              Long Rest
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <CombatActionsPanel
            actions={character.actions}
            onAddAction={(action) =>
              handleUpdate({
                actions: [...character.actions, { ...action, id: `action-${Date.now()}` }],
              })
            }
            onRemoveAction={(id) =>
              handleUpdate({ actions: character.actions.filter((a) => a.id !== id) })
            }
            onUseAction={(id) => {
              handleUpdate({
                actions: character.actions.map((a) =>
                  a.id === id && a.uses
                    ? { ...a, uses: { ...a.uses, used: Math.min(a.uses.max, a.uses.used + 1) } }
                    : a
                ),
              });
            }}
            spellcasting={character.spellcasting}
            primaryClassKey={character.classes[0]?.key || ''}
            onSpellSlotUse={(level, isUsed) => {
              if (!character.spellcasting) return;
              handleUpdate({
                spellcasting: {
                  ...character.spellcasting!,
                  slots: character.spellcasting!.slots.map((s) =>
                    s.level === level
                      ? {
                          ...s,
                          used: isUsed ? Math.min(s.max, s.used + 1) : Math.max(0, s.used - 1),
                        }
                      : s
                  ),
                },
              });
            }}
            onSpellTogglePrepared={(spellKey) => {
              if (!character.spellcasting) return;
              handleUpdate({
                spellcasting: {
                  ...character.spellcasting!,
                  knownSpells: character.spellcasting!.knownSpells.map((s) =>
                    s.spellKey === spellKey ? { ...s, prepared: !s.prepared } : s
                  ),
                },
              });
            }}
            onAddSpell={(spell) => {
              if (!character.spellcasting) return;
              const level = (spell.level ?? 0) as SpellLevel;
              const already = character.spellcasting.knownSpells.some(
                (s) => s.spellKey === spell.key
              );
              if (already) return;
              handleUpdate({
                spellcasting: {
                  ...character.spellcasting!,
                  knownSpells: [
                    ...character.spellcasting!.knownSpells,
                    {
                      id: `spell-${Date.now()}`,
                      spellKey: spell.key,
                      name: spell.name,
                      level,
                      school: spell.school,
                      prepared: false,
                    },
                  ],
                },
              });
            }}
            onRemoveSpell={(spellKey) => {
              if (!character.spellcasting) return;
              handleUpdate({
                spellcasting: {
                  ...character.spellcasting!,
                  knownSpells: character.spellcasting!.knownSpells.filter(
                    (s) => s.spellKey !== spellKey
                  ),
                },
              });
            }}
          />
          <FeaturesPanel
            features={character.features}
            onFeatureUse={(featureId) => {
              handleUpdate({
                features: character.features.map((f) =>
                  f.id === featureId && f.uses
                    ? { ...f, uses: { ...f.uses, used: Math.min(f.uses.max, f.uses.used + 1) } }
                    : f
                ),
              });
            }}
            onFeatureReset={(featureId) => {
              handleUpdate({
                features: character.features.map((f) =>
                  f.id === featureId && f.uses ? { ...f, uses: { ...f.uses, used: 0 } } : f
                ),
              });
            }}
            onAddFeature={(feature) => handleUpdate({ features: [...character.features, feature] })}
            onRemoveFeature={(featureId) =>
              handleUpdate({ features: character.features.filter((f) => f.id !== featureId) })
            }
          />
          <EquipmentPanel
            inventory={character.inventory}
            currency={character.currency}
            documentKeys={['wotc-srd', 'srd-2024']}
            onInventoryChange={(inventory) => handleUpdate({ inventory })}
            onCurrencyChange={(currency) => handleUpdate({ currency })}
            showEncumbrance={true}
            strengthScore={character.abilityScores.total.STR}
          />
        </div>
      </CharacterSheetGrid>

      <div className="px-4 pb-4 flex justify-between items-center print:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 font-medium opacity-50 cursor-not-allowed"
            disabled
            title="Level Up — coming soon"
          >
            Level Up
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium opacity-50 cursor-not-allowed"
            disabled
            title="Export PDF — coming soon"
          >
            Export PDF
          </button>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium transition-colors"
          onClick={handleDelete}
        >
          Delete Character
        </button>
      </div>
    </CharacterSheetLayout>
  );
}

export function CharacterSheetClient({ characterId }: CharacterSheetClientProps) {
  if (DEBUG_IDS.includes(characterId)) {
    return <DebugCharacterSheet characterId={characterId} />;
  }
  return <LiveCharacterSheet characterId={characterId} />;
}
