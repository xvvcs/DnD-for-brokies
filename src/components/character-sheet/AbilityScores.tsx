/**
 * AbilityScores Component
 *
 * Horizontal bar displaying all 6 ability scores with inline editing.
 * Scores are displayed left-to-right in a single row with click-to-edit functionality.
 */

'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import type { AbilityScore } from '@/types/game';
import { ABILITY_SCORES } from '@/types/game';
import { formatModifier } from '@/lib/engine/ability-scores';
import { EditableField } from './EditableField';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Full names for abilities
const ABILITY_NAMES: Record<AbilityScore, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

// Rune symbols for each ability (fantasy flavor)
const ABILITY_RUNES: Record<AbilityScore, string> = {
  STR: 'ᚦ',
  DEX: 'ᚹ',
  CON: 'ᛟ',
  INT: 'ᛒ',
  WIS: 'ᛟ',
  CHA: 'ᚷ',
};

interface AbilityScoresProps {
  scores: Record<AbilityScore, number>;
  modifiers: Record<AbilityScore, number>;
  saveProficiencies: Record<AbilityScore, boolean>;
  proficiencyBonus: number;
  onScoreChange?: (ability: AbilityScore, score: number) => void;
  onSaveProficiencyChange?: (ability: AbilityScore, proficient: boolean) => void;
  onSave?: () => void;
  className?: string;
}

/**
 * Individual ability score item with inline editing
 */
function AbilityScoreItem({
  ability,
  score,
  modifier,
  onScoreChange,
  onSave,
}: {
  ability: AbilityScore;
  score: number;
  modifier: number;
  onScoreChange?: (score: number) => void;
  onSave?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2',
        'bg-gradient-to-r from-amber-100 to-amber-50',
        'border border-amber-600 rounded-lg',
        'shadow-sm flex-1 min-w-0'
      )}
    >
      {/* Rune decoration */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-800 rounded-full text-amber-100 text-xs font-bold shadow-sm">
        {ABILITY_RUNES[ability]}
      </div>

      {/* Ability abbreviation and name */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-amber-800 uppercase leading-tight">
          {ability}
        </span>
        <span className="text-[9px] text-amber-600 leading-tight truncate hidden sm:block">
          {ABILITY_NAMES[ability]}
        </span>
      </div>

      {/* Editable Score */}
      <div className="flex-shrink-0">
        <EditableField
          value={score}
          type="number"
          min={1}
          max={30}
          onChange={(val) => onScoreChange?.(Number(val))}
          onSave={onSave}
          className="w-10 text-center font-bold text-lg text-amber-900 py-0.5 px-1"
        />
      </div>

      {/* Modifier */}
      <div
        className={cn(
          'flex-shrink-0 px-1.5 py-0.5 rounded text-sm font-bold',
          modifier > 0 && 'bg-emerald-100 text-emerald-800',
          modifier < 0 && 'bg-red-100 text-red-800',
          modifier === 0 && 'bg-gray-200 text-gray-700'
        )}
      >
        {formatModifier(modifier)}
      </div>
    </div>
  );
}

/**
 * Saving throw item with proficiency toggle
 */
function SavingThrowItem({
  ability,
  isProficient,
  totalModifier,
  onToggle,
}: {
  ability: AbilityScore;
  isProficient: boolean;
  totalModifier: number;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded',
        'transition-all text-left',
        isProficient
          ? 'bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
          : 'bg-white border border-amber-200 hover:bg-amber-50'
      )}
      title={`${ABILITY_NAMES[ability]} Save`}
    >
      {/* Proficiency indicator */}
      <div
        className={cn(
          'w-3.5 h-3.5 rounded border flex items-center justify-center',
          isProficient ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-100 border-gray-300'
        )}
      >
        {isProficient && (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Ability abbreviation */}
      <span className="text-xs font-bold text-gray-700">{ability}</span>

      {/* Total modifier */}
      <span
        className={cn(
          'text-sm font-bold ml-auto',
          totalModifier > 0 && 'text-emerald-700',
          totalModifier < 0 && 'text-red-600',
          totalModifier === 0 && 'text-gray-600'
        )}
      >
        {formatModifier(totalModifier)}
      </span>
    </button>
  );
}

/**
 * Main Ability Scores Bar Component
 * Displays all 6 ability scores in a single horizontal row with inline editing
 */
export function AbilityScores({
  scores,
  modifiers,
  saveProficiencies,
  proficiencyBonus,
  onScoreChange,
  onSaveProficiencyChange,
  onSave,
  className,
}: AbilityScoresProps) {
  const [showSaves, setShowSaves] = useState(false);

  // Calculate saving throw modifiers
  const getSaveModifier = (ability: AbilityScore): number => {
    const baseMod = modifiers[ability] ?? 0;
    const profBonus = saveProficiencies[ability] ? proficiencyBonus : 0;
    return baseMod + profBonus;
  };

  // Count proficient saves
  const proficientCount = ABILITY_SCORES.filter((ability) => saveProficiencies[ability]).length;

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-amber-900 to-amber-800',
        'rounded-lg shadow-lg',
        'p-4',
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Ability Scores Row - All 6 in one line */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-amber-100 text-xs font-bold uppercase tracking-wider">
              Ability Scores
            </h3>

            {/* Minimal toggle for saving throws */}
            <button
              type="button"
              onClick={() => setShowSaves(!showSaves)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded',
                'text-[10px] font-medium uppercase tracking-wider',
                'transition-colors',
                showSaves
                  ? 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                  : 'bg-amber-800 text-amber-300 hover:bg-amber-700'
              )}
              title={showSaves ? 'Hide saving throws' : 'Show saving throws'}
            >
              {showSaves ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Saves</span>
                  {proficientCount > 0 && (
                    <span className="ml-1 text-amber-200">({proficientCount})</span>
                  )}
                </>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            {ABILITY_SCORES.map((ability) => (
              <AbilityScoreItem
                key={ability}
                ability={ability}
                score={scores[ability] ?? 10}
                modifier={modifiers[ability] ?? 0}
                onScoreChange={(score) => onScoreChange?.(ability, score)}
                onSave={onSave}
              />
            ))}
          </div>
        </div>

        {/* Saving Throws - Collapsible */}
        {showSaves && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
              Saving Throws
              <span className="text-[10px] font-normal text-amber-400 ml-2">(Click to toggle)</span>
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ABILITY_SCORES.map((ability) => (
                <SavingThrowItem
                  key={`save-${ability}`}
                  ability={ability}
                  isProficient={saveProficiencies[ability] ?? false}
                  totalModifier={getSaveModifier(ability)}
                  onToggle={() => onSaveProficiencyChange?.(ability, !saveProficiencies[ability])}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
