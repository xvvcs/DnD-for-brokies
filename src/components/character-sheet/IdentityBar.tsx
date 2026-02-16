/**
 * IdentityBar Component
 *
 * Character identity header section displaying:
 * - Character name (editable)
 * - Class(es) and total level
 * - Species and background
 * - Proficiency bonus
 * - XP or milestone tracking
 * - Character portrait placeholder
 */

import React from 'react';

import { EditableField } from './EditableField';
import { ProficiencyBonus } from './ProficiencyBadge';
import { cn } from '@/lib/utils';

interface CharacterClass {
  key: string;
  name: string;
  level: number;
}

interface CharacterIdentity {
  name: string;
  classes: CharacterClass[];
  race: {
    name: string;
  };
  background: {
    name: string;
  };
  level: number;
  experiencePoints?: number;
  proficiencyBonus: number;
}

interface IdentityBarProps {
  character: CharacterIdentity;
  onUpdate: (updates: Partial<CharacterIdentity>) => void;
  onSave?: () => void;
  className?: string;
}

/**
 * Character identity header bar
 */
export function IdentityBar({ character, onUpdate, onSave, className }: IdentityBarProps) {
  // Format class display (e.g., "Fighter 5" or "Fighter 3 / Rogue 2")
  const classDisplay = character.classes.map((c) => `${c.name} ${c.level}`).join(' / ');

  // Handle name change
  const handleNameChange = (value: string | number) => {
    onUpdate({ name: value as string });
  };

  // Handle XP change
  const handleXPChange = (value: string | number) => {
    onUpdate({ experiencePoints: Number(value) });
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-amber-900 to-amber-800',
        'rounded-lg shadow-lg p-4',
        'print:bg-white print:shadow-none print:border-2 print:border-gray-300',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left section: Portrait, Name, and Basics */}
        <div className="flex items-start gap-4">
          {/* Portrait placeholder */}
          <div
            className={cn(
              'w-20 h-20 rounded-lg bg-amber-100 border-2 border-amber-300',
              'flex items-center justify-center flex-shrink-0',
              'print:bg-gray-100 print:border-gray-300'
            )}
          >
            <span className="text-3xl">🎭</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Character Name */}
            <div className="mb-2">
              <label className="text-amber-200 text-xs uppercase tracking-wider block print:text-gray-600">
                Character Name
              </label>
              <EditableField
                value={character.name}
                onChange={handleNameChange}
                onSave={onSave}
                className="text-2xl font-bold text-white print:text-gray-900"
              />
            </div>

            {/* Class, Race, Background */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-amber-100 print:text-gray-700">
              <span className="font-medium">{classDisplay}</span>
              <span className="text-amber-300 print:text-gray-400">•</span>
              <span>{character.race.name}</span>
              <span className="text-amber-300 print:text-gray-400">•</span>
              <span>{character.background.name}</span>
            </div>
          </div>
        </div>

        {/* Right section: Level, XP, Proficiency */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Total Level */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white print:text-gray-900">
              {character.level}
            </div>
            <div className="text-xs text-amber-200 uppercase tracking-wide print:text-gray-600">
              Level
            </div>
          </div>

          {/* Proficiency Bonus */}
          <ProficiencyBonus
            bonus={character.proficiencyBonus}
            className="text-white print:text-gray-900"
          />

          {/* Experience Points */}
          <div className="hidden sm:block text-right">
            <div className="text-sm text-amber-200 print:text-gray-600">Experience Points</div>
            <EditableField
              value={character.experiencePoints ?? 0}
              type="number"
              min={0}
              onChange={handleXPChange}
              onSave={onSave}
              className="text-white font-mono print:text-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for mobile or space-constrained layouts
 */
export function IdentityBarCompact({ character, onUpdate, onSave, className }: IdentityBarProps) {
  const classDisplay = character.classes.map((c) => `${c.name} ${c.level}`).join(' / ');

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-amber-900 to-amber-800',
        'rounded-lg shadow p-3',
        'print:bg-white print:shadow-none print:border print:border-gray-300',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded bg-amber-100 flex items-center justify-center',
              'print:bg-gray-100'
            )}
          >
            <span className="text-xl">🎭</span>
          </div>
          <div>
            <EditableField
              value={character.name}
              onChange={(value) => onUpdate({ name: value as string })}
              onSave={onSave}
              className="font-bold text-white print:text-gray-900"
            />
            <div className="text-xs text-amber-200 print:text-gray-600">{classDisplay}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white print:text-gray-900">
              {character.level}
            </div>
            <div className="text-[10px] text-amber-200 uppercase print:text-gray-600">Level</div>
          </div>

          <div className="text-center">
            <div className="text-xl font-bold text-white print:text-gray-900">
              +{character.proficiencyBonus}
            </div>
            <div className="text-[10px] text-amber-200 uppercase print:text-gray-600">Prof</div>
          </div>
        </div>
      </div>
    </div>
  );
}
