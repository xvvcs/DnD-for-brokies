/**
 * CombatStats Component
 *
 * Displays combat-related statistics:
 * - AC (with manual override option)
 * - Initiative
 * - Speed (all types)
 * - Hit Dice (remaining/total per class)
 * - Death Saves tracker (shown only when HP = 0)
 * - Active Conditions indicators (collapsible)
 *
 * Conditions are temporary status effects in D&D 5e that affect what a character
 * can or cannot do (e.g., Blinded, Poisoned, Stunned). Players track these during
 * combat or roleplay as they significantly impact gameplay mechanics.
 */

'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import type { CombatStats as CombatStatsType, ActiveCondition } from '@/types/game';
import type { CharacterClass } from '@/types/character';
import { formatModifier } from '@/lib/engine/ability-scores';
import { EditableField } from './EditableField';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Shield,
  Swords,
  Footprints,
  Heart,
  Skull,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CombatStatsProps {
  combatStats: CombatStatsType;
  classes: CharacterClass[];
  conditions: ActiveCondition[];
  onACChange?: (ac: number) => void;
  onDeathSaveChange?: (type: 'success' | 'failure', value: number) => void;
  onConditionToggle?: (conditionKey: string) => void;
  className?: string;
}

// Standard D&D 5e conditions
const STANDARD_CONDITIONS = [
  { key: 'blinded', name: 'Blinded', color: 'bg-gray-600' },
  { key: 'charmed', name: 'Charmed', color: 'bg-pink-600' },
  { key: 'deafened', name: 'Deafened', color: 'bg-gray-500' },
  { key: 'frightened', name: 'Frightened', color: 'bg-purple-600' },
  { key: 'grappled', name: 'Grappled', color: 'bg-orange-600' },
  { key: 'incapacitated', name: 'Incapacitated', color: 'bg-red-700' },
  { key: 'invisible', name: 'Invisible', color: 'bg-blue-400' },
  { key: 'paralyzed', name: 'Paralyzed', color: 'bg-red-600' },
  { key: 'petrified', name: 'Petrified', color: 'bg-stone-600' },
  { key: 'poisoned', name: 'Poisoned', color: 'bg-green-600' },
  { key: 'prone', name: 'Prone', color: 'bg-amber-700' },
  { key: 'restrained', name: 'Restrained', color: 'bg-yellow-700' },
  { key: 'stunned', name: 'Stunned', color: 'bg-indigo-600' },
  { key: 'unconscious', name: 'Unconscious', color: 'bg-gray-800' },
];

/**
 * Death Save Checkbox Component
 */
function DeathSaveCheckbox({
  checked,
  onToggle,
  type,
}: {
  checked: boolean;
  onToggle: () => void;
  type: 'success' | 'failure';
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-6 h-6 rounded border-2 transition-all',
        checked
          ? type === 'success'
            ? 'bg-emerald-500 border-emerald-600'
            : 'bg-red-500 border-red-600'
          : 'bg-white border-gray-300 hover:border-gray-400'
      )}
      aria-label={`${type} death save ${checked ? 'checked' : 'unchecked'}`}
    >
      {checked && (
        <svg className="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * Main Combat Stats Component
 */
export function CombatStats({
  combatStats,
  classes,
  conditions,
  onACChange,
  onDeathSaveChange,
  onConditionToggle,
  className,
}: CombatStatsProps) {
  const [isEditingAC, setIsEditingAC] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Calculate total hit dice per class
  const hitDiceByClass = classes.map((cls) => ({
    name: cls.name,
    type: `d${cls.hitDiceValue}`,
    total: cls.level,
    // For now, assume hit dice are shared across all classes (simplified)
    // In full implementation, would track separately per class
  }));

  const activeConditionKeys = new Set(conditions.map((c) => c.conditionKey));
  const activeConditionCount = activeConditionKeys.size;

  return (
    <div
      className={cn('bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-5 h-5 text-amber-700" />
        <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">Combat Stats</h3>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Armor Class */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-300 rounded-lg">
                <Shield className="w-5 h-5 text-blue-700 mb-1" />
                <div className="text-xs text-blue-600 uppercase font-medium mb-1">AC</div>
                {isEditingAC ? (
                  <EditableField
                    value={combatStats.ac.total}
                    type="number"
                    min={1}
                    max={30}
                    onChange={(val) => onACChange?.(Number(val))}
                    onSave={() => setIsEditingAC(false)}
                    className="w-12 text-center font-bold text-2xl text-blue-900"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingAC(true)}
                    className="text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors"
                  >
                    {combatStats.ac.total}
                  </button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-amber-50 border-amber-300 text-amber-900">
              <p className="text-sm">
                Armor Class - Click to edit
                <br />
                Base: {combatStats.ac.base} + DEX: {combatStats.ac.dexModifier} + Bonus:{' '}
                {combatStats.ac.bonus}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Initiative */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-300 rounded-lg">
          <Swords className="w-5 h-5 text-amber-700 mb-1" />
          <div className="text-xs text-amber-600 uppercase font-medium mb-1">Initiative</div>
          <div className="text-2xl font-bold text-amber-900">
            {formatModifier(combatStats.initiative)}
          </div>
        </div>

        {/* Speed */}
        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-green-100 to-green-50 border border-green-300 rounded-lg">
          <Footprints className="w-5 h-5 text-green-700 mb-1" />
          <div className="text-xs text-green-600 uppercase font-medium mb-1">Speed</div>
          <div className="text-2xl font-bold text-green-900">{combatStats.speed} ft</div>
        </div>

        {/* Hit Dice */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-300 rounded-lg">
                <Heart className="w-5 h-5 text-purple-700 mb-1" />
                <div className="text-xs text-purple-600 uppercase font-medium mb-1">Hit Dice</div>
                <div className="text-2xl font-bold text-purple-900">
                  {combatStats.hitDice.total - combatStats.hitDice.used}/{combatStats.hitDice.total}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-amber-50 border-amber-300 text-amber-900">
              <p className="text-sm font-medium mb-1">Hit Dice by Class:</p>
              {hitDiceByClass.map((hd, idx) => (
                <p key={idx} className="text-xs">
                  {hd.name}: {hd.total}
                  {hd.type}
                </p>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Death Saves (only show when HP is 0) */}
      {combatStats.currentHp === 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-400 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="w-5 h-5 text-red-700" />
            <h4 className="font-bold text-red-900 uppercase text-sm">Death Saves</h4>
          </div>
          <div className="space-y-2">
            {/* Successes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 w-20">Successes:</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <DeathSaveCheckbox
                    key={`success-${idx}`}
                    checked={combatStats.deathSaves.successes > idx}
                    onToggle={() =>
                      onDeathSaveChange?.(
                        'success',
                        combatStats.deathSaves.successes > idx
                          ? combatStats.deathSaves.successes - 1
                          : combatStats.deathSaves.successes + 1
                      )
                    }
                    type="success"
                  />
                ))}
              </div>
            </div>
            {/* Failures */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-red-700 w-20">Failures:</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <DeathSaveCheckbox
                    key={`failure-${idx}`}
                    checked={combatStats.deathSaves.failures > idx}
                    onToggle={() =>
                      onDeathSaveChange?.(
                        'failure',
                        combatStats.deathSaves.failures > idx
                          ? combatStats.deathSaves.failures - 1
                          : combatStats.deathSaves.failures + 1
                      )
                    }
                    type="failure"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditions */}
      <div className="pt-3 border-t border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <h4 className="font-bold text-amber-900 uppercase text-xs">Conditions</h4>
            {activeConditionCount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                {activeConditionCount} active
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setShowConditions(!showConditions)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded',
              'text-[10px] font-medium uppercase tracking-wider',
              'transition-colors',
              showConditions
                ? 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            )}
            title={showConditions ? 'Hide conditions' : 'Show conditions'}
          >
            {showConditions ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>

        {showConditions && (
          <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
            {STANDARD_CONDITIONS.map((condition) => {
              const isActive = activeConditionKeys.has(condition.key);
              return (
                <button
                  key={condition.key}
                  type="button"
                  onClick={() => onConditionToggle?.(condition.key)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all border',
                    isActive
                      ? `${condition.color} text-white border-transparent shadow-md`
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  )}
                  title={isActive ? `Remove ${condition.name}` : `Add ${condition.name}`}
                >
                  {condition.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Active conditions summary when collapsed */}
        {!showConditions && activeConditionCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {STANDARD_CONDITIONS.filter((c) => activeConditionKeys.has(c.key)).map((condition) => (
              <span
                key={condition.key}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium text-white shadow-sm',
                  condition.color
                )}
              >
                {condition.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
