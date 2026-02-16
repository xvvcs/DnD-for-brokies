/**
 * AbilityScores Component
 *
 * Displays and manages character ability scores with:
 * - 6 ability scores with modifiers
 * - Inline editing support
 * - Saving throw modifiers
 * - Proficiency toggles
 * - Fantasy-themed styling with rune borders
 */

import React, { useState, useCallback } from 'react';

import { cn } from '@/lib/utils';
import type { AbilityScore } from '@/types/game';
import { ABILITY_SCORES } from '@/types/game';
import { formatModifier } from '@/lib/engine/ability-scores';
import { useEditMode } from '@/hooks/useEditMode';
import { Button } from '@/components/ui/button';
import { Edit2, Check } from 'lucide-react';

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
  className?: string;
}

/**
 * Individual ability score card
 */
function AbilityCard({
  ability,
  score,
  modifier,
  isEditing,
  onScoreChange,
}: {
  ability: AbilityScore;
  score: number;
  modifier: number;
  isEditing: boolean;
  onScoreChange?: (score: number) => void;
}) {
  const [editValue, setEditValue] = useState(score.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 30) {
      onScoreChange?.(numValue);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-3',
        'bg-gradient-to-b from-amber-100 to-amber-50',
        'border-2 border-amber-700 rounded-lg',
        'shadow-md transition-all',
        'hover:shadow-lg hover:border-amber-600',
        isEditing && 'ring-2 ring-amber-500 ring-offset-2'
      )}
    >
      {/* Rune decoration */}
      <div className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center bg-amber-800 rounded-full text-amber-100 text-xs font-bold shadow-sm">
        {ABILITY_RUNES[ability]}
      </div>

      {/* Ability abbreviation */}
      <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
        {ability}
      </div>

      {/* Ability name (hidden on very small screens) */}
      <div className="hidden sm:block text-[10px] text-amber-600 mb-1 text-center leading-tight">
        {ABILITY_NAMES[ability].slice(0, 3)}
      </div>

      {/* Score display or input */}
      {isEditing ? (
        <input
          type="number"
          min={1}
          max={30}
          value={editValue}
          onChange={handleChange}
          className={cn(
            'w-14 text-center text-2xl font-bold',
            'bg-white border-2 border-amber-500 rounded',
            'focus:outline-none focus:ring-2 focus:ring-amber-400',
            'text-amber-900'
          )}
        />
      ) : (
        <div className="text-2xl font-bold text-amber-900">{score}</div>
      )}

      {/* Modifier */}
      <div
        className={cn(
          'mt-1 px-2 py-0.5 rounded-full text-sm font-bold',
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
 * Saving throw row
 */
function SavingThrowRow({
  ability,
  isProficient,
  proficiencyBonus,
  totalModifier,
  onToggle,
  isEditing,
}: {
  ability: AbilityScore;
  isProficient: boolean;
  proficiencyBonus: number;
  totalModifier: number;
  onToggle?: () => void;
  isEditing: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 rounded',
        'bg-white border border-amber-200',
        'hover:bg-amber-50 transition-colors',
        isProficient && 'bg-emerald-50 border-emerald-200'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Proficiency checkbox */}
        <button
          type="button"
          onClick={onToggle}
          disabled={!isEditing || !onToggle}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isProficient ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-100 border-gray-300',
            isEditing && onToggle && 'cursor-pointer hover:scale-110',
            (!isEditing || !onToggle) && 'cursor-default'
          )}
          title={isProficient ? 'Proficient' : 'Not Proficient'}
        >
          {isProficient && (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Ability name */}
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-gray-900">{ABILITY_NAMES[ability]}</span>
          <span className="text-xs text-gray-500">({ability})</span>
        </div>

        {/* Proficiency indicator text */}
        {isProficient && (
          <span className="text-xs text-emerald-600 font-medium hidden sm:inline">
            +{proficiencyBonus} prof
          </span>
        )}
      </div>

      {/* Total modifier */}
      <div
        className={cn(
          'font-bold text-lg',
          totalModifier > 0 && 'text-emerald-700',
          totalModifier < 0 && 'text-red-600',
          totalModifier === 0 && 'text-gray-600'
        )}
      >
        {formatModifier(totalModifier)}
      </div>
    </div>
  );
}

/**
 * Main Ability Scores Panel
 */
export function AbilityScores({
  scores,
  modifiers,
  saveProficiencies,
  proficiencyBonus,
  onScoreChange,
  onSaveProficiencyChange,
  className,
}: AbilityScoresProps) {
  const { isEditing, startEditing, stopEditing } = useEditMode();

  const handleScoreChange = useCallback(
    (ability: AbilityScore, score: number) => {
      onScoreChange?.(ability, score);
    },
    [onScoreChange]
  );

  const handleSaveToggle = useCallback(
    (ability: AbilityScore) => {
      if (!isEditing || !onSaveProficiencyChange) return;
      onSaveProficiencyChange(ability, !saveProficiencies[ability]);
    },
    [isEditing, saveProficiencies, onSaveProficiencyChange]
  );

  // Calculate saving throw modifiers
  const getSaveModifier = (ability: AbilityScore): number => {
    const baseMod = modifiers[ability] ?? 0;
    const profBonus = saveProficiencies[ability] ? proficiencyBonus : 0;
    return baseMod + profBonus;
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border-2 border-amber-800 shadow-md',
        'bg-gradient-to-br from-amber-50 to-orange-50',
        className
      )}
    >
      {/* Header with edit toggle */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-gradient-to-r from-amber-800 to-amber-700',
          'border-b-2 border-amber-900'
        )}
      >
        <h3 className="font-serif font-bold text-amber-100 text-lg">Ability Scores</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={isEditing ? stopEditing : startEditing}
          className={cn('text-amber-100 hover:text-white hover:bg-amber-600', 'print:hidden')}
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Done
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Ability Score Cards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ABILITY_SCORES.map((ability) => (
            <AbilityCard
              key={ability}
              ability={ability}
              score={scores[ability] ?? 10}
              modifier={modifiers[ability] ?? 0}
              isEditing={isEditing}
              onScoreChange={(score) => handleScoreChange(ability, score)}
            />
          ))}
        </div>

        {/* Saving Throws Section */}
        <div className="border-t-2 border-amber-200 pt-4">
          <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">
            Saving Throws
            {isEditing && (
              <span className="text-xs font-normal text-amber-600 ml-2">
                (Click checkboxes to toggle proficiency)
              </span>
            )}
          </h4>
          <div className="space-y-2">
            {ABILITY_SCORES.map((ability) => (
              <SavingThrowRow
                key={`save-${ability}`}
                ability={ability}
                isProficient={saveProficiencies[ability] ?? false}
                proficiencyBonus={proficiencyBonus}
                totalModifier={getSaveModifier(ability)}
                onToggle={() => handleSaveToggle(ability)}
                isEditing={isEditing}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
