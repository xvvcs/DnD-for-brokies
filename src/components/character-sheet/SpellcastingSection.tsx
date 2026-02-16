/**
 * SpellcastingSection Component
 *
 * Displays spellcasting abilities, spell slots, and spell list
 * Extracted from CombatActionsPanel for better separation of concerns
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  BookOpen,
  Star,
  Check,
  Plus,
} from 'lucide-react';
import type { SpellSlot, SpellLevel } from '@/types/game';
import type { Spellcasting, KnownSpell } from '@/types/character';
import type { Open5eSpell } from '@/types/open5e';
import { formatModifier } from '@/lib/engine/ability-scores';
import { isPreparationCaster, isKnownSpellCaster } from '@/lib/engine/spellcasting';

interface SpellcastingSectionProps {
  spellcasting: Spellcasting | null;
  primaryClassKey: string;
  onSpellSlotUse?: (level: SpellLevel, isUsed: boolean) => void;
  onSpellTogglePrepared?: (spellKey: string) => void;
  onAddSpell?: (spell: Open5eSpell) => void;
  onRemoveSpell?: (spellKey: string) => void;
}

/**
 * Spell Slot Tracker
 */
function SpellSlotTracker({
  slots,
  onToggle,
}: {
  slots: SpellSlot[];
  onToggle?: (level: SpellLevel, index: number, isUsed: boolean) => void;
}) {
  const validSlots = slots.filter((s) => s.max > 0 && s.level > 0);

  if (validSlots.length === 0) {
    return <p className="text-sm text-gray-500">No spell slots available</p>;
  }

  return (
    <div className="space-y-3">
      {validSlots.map((slot) => {
        const remaining = slot.max - slot.used;
        const slots = Array.from({ length: slot.max }, (_, i) => i);

        return (
          <div key={slot.level} className="flex items-center gap-3">
            <div className="w-16 text-sm font-bold text-purple-900">Level {slot.level}</div>

            <div className="flex items-center gap-2 flex-wrap">
              {slots.map((index) => {
                const isUsed = index < slot.used;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onToggle?.(slot.level, index, !isUsed)}
                    className={cn(
                      'w-6 h-6 border-2 rounded flex items-center justify-center transition-colors',
                      isUsed
                        ? 'bg-purple-700 border-purple-700'
                        : 'bg-white border-purple-300 hover:border-purple-500'
                    )}
                    aria-label={`Spell slot ${index + 1} of level ${slot.level}${isUsed ? ' (used)' : ' (available)'}`}
                  >
                    {isUsed && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}

              <span className="ml-2 text-sm font-medium text-purple-700">
                {remaining}/{slot.max}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Spell Card
 */
function SpellCard({
  spell,
  isPrepared,
  canTogglePrepared,
  onTogglePrepared,
  onRemove,
}: {
  spell: KnownSpell;
  isPrepared: boolean;
  canTogglePrepared: boolean;
  onTogglePrepared?: (spellKey: string) => void;
  onRemove?: (spellKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isCantrip = spell.level === 0;
  const showPreparedToggle = canTogglePrepared && !isCantrip;

  return (
    <div className="border-2 border-purple-300 rounded-lg p-3 bg-gradient-to-b from-purple-50 to-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-purple-900">{spell.name}</h4>

            {!isCantrip && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Level {spell.level}
              </span>
            )}

            {isCantrip && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                Cantrip
              </span>
            )}

            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              {spell.school}
            </span>
          </div>

          {showPreparedToggle && (
            <div className="mt-1 flex items-center gap-2">
              <Checkbox
                id={`prepared-${spell.id}`}
                checked={isPrepared}
                onCheckedChange={() => onTogglePrepared?.(spell.spellKey)}
                className="border-purple-400"
              />
              <label
                htmlFor={`prepared-${spell.id}`}
                className="text-sm font-medium text-purple-700 cursor-pointer"
              >
                {isPrepared ? 'Prepared' : 'Not Prepared'}
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove?.(spell.spellKey)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 h-7"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-purple-100 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-purple-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-700" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-purple-200 text-sm space-y-2 animate-in slide-in-from-top-2 duration-200">
          <p className="text-gray-700">
            <span className="font-medium text-purple-800">School:</span> {spell.school}
          </p>
          <p className="text-gray-700">
            <span className="font-medium text-purple-800">Level:</span>{' '}
            {isCantrip ? 'Cantrip' : `Level ${spell.level}`}
          </p>
          <p className="text-gray-500 italic text-xs">
            Full spell details would be loaded from Open5E API
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Spell Level Section
 */
function SpellLevelSection({
  level,
  spells,
  canTogglePrepared,
  onTogglePrepared,
  onRemoveSpell,
}: {
  level: SpellLevel;
  spells: KnownSpell[];
  canTogglePrepared: boolean;
  onTogglePrepared?: (spellKey: string) => void;
  onRemoveSpell?: (spellKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const levelName = level === 0 ? 'Cantrips' : `Level ${level} Spells`;
  const preparedCount = spells.filter((s) => s.prepared).length;

  return (
    <div className="border-2 border-purple-300 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-700" />
          <h4 className="font-bold text-purple-900 uppercase text-sm">{levelName}</h4>
          <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-medium rounded">
            {spells.length}
          </span>
          {canTogglePrepared && level > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              {preparedCount} prepared
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-purple-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-700" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {spells.map((spell) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              isPrepared={spell.prepared}
              canTogglePrepared={canTogglePrepared}
              onTogglePrepared={onTogglePrepared}
              onRemove={onRemoveSpell}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Add Spell Interface
 */
function AddSpellInterface({ onCancel }: { onCancel: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-purple-900 uppercase text-sm">Add Spell</h4>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for spells..."
          className="pl-9 border-purple-300"
        />
      </div>

      <div className="text-center py-6 text-gray-500 text-sm">
        <p>Spell search and selection interface will be implemented here.</p>
        <p className="text-xs mt-1">
          This will fetch spells from Open5E API and allow filtering by level, school, and class.
        </p>
      </div>
    </div>
  );
}

/**
 * SpellcastingSection Main Component
 */
export function SpellcastingSection({
  spellcasting,
  primaryClassKey,
  onSpellSlotUse,
  onSpellTogglePrepared,
  onRemoveSpell,
}: SpellcastingSectionProps) {
  const [showAddSpell, setShowAddSpell] = useState(false);

  // Calculate values before early return (hooks must be called unconditionally)
  const usesPreparation = isPreparationCaster(primaryClassKey);
  const usesKnownSpells = isKnownSpellCaster(primaryClassKey);

  const spellsByLevel = useMemo(() => {
    if (!spellcasting) return new Map<SpellLevel, KnownSpell[]>();

    const grouped = new Map<SpellLevel, KnownSpell[]>();

    for (const spell of spellcasting.knownSpells) {
      const existing = grouped.get(spell.level) || [];
      existing.push(spell);
      grouped.set(spell.level, existing);
    }

    for (const [level, spells] of grouped.entries()) {
      grouped.set(
        level,
        spells.sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    return grouped;
  }, [spellcasting]);

  const levels = useMemo(() => {
    return Array.from(spellsByLevel.keys()).sort((a, b) => a - b);
  }, [spellsByLevel]);

  // Early return after all hooks
  if (!spellcasting) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="font-medium">No Spellcasting Ability</p>
        <p className="text-sm mt-1">This character does not have spellcasting.</p>
      </div>
    );
  }

  const handleSlotToggle = (level: SpellLevel, index: number, isUsed: boolean) => {
    onSpellSlotUse?.(level, isUsed);
  };

  const hasSlots = spellcasting.slots.some((s) => s.max > 0 && s.level > 0);

  return (
    <div className="space-y-4">
      {/* Spellcasting Stats */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-purple-700 font-medium uppercase tracking-wider mb-1">
            Ability
          </div>
          <div className="text-2xl font-bold text-purple-900">{spellcasting.ability || 'N/A'}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-purple-700 font-medium uppercase tracking-wider mb-1">
            Save DC
          </div>
          <div className="text-2xl font-bold text-purple-900">{spellcasting.saveDC}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-purple-700 font-medium uppercase tracking-wider mb-1">
            Attack
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {formatModifier(spellcasting.attackBonus)}
          </div>
        </div>
      </div>

      {/* Spell Slots */}
      {hasSlots && (
        <div className="p-4 bg-white border-2 border-purple-300 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-purple-700" />
            <h4 className="font-bold text-purple-900 uppercase text-sm">Spell Slots</h4>
          </div>
          <SpellSlotTracker slots={spellcasting.slots} onToggle={handleSlotToggle} />
        </div>
      )}

      {/* Info Banners */}
      {usesPreparation && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">
              You can prepare spells after a long rest. Toggle checkboxes to mark prepared.
            </span>
          </div>
        </div>
      )}

      {usesKnownSpells && !usesPreparation && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">
              You have a fixed set of known spells. They are always available to cast.
            </span>
          </div>
        </div>
      )}

      {/* Spell List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {levels.length === 0 && !showAddSpell && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No spells known</p>
            <p className="text-xs mt-1">Add spells to your spell list</p>
          </div>
        )}

        {levels.map((level) => {
          const levelSpells = spellsByLevel.get(level) || [];
          return (
            <SpellLevelSection
              key={level}
              level={level}
              spells={levelSpells}
              canTogglePrepared={usesPreparation}
              onTogglePrepared={onSpellTogglePrepared}
              onRemoveSpell={onRemoveSpell}
            />
          );
        })}
      </div>

      {/* Add Spell */}
      {showAddSpell ? (
        <AddSpellInterface onCancel={() => setShowAddSpell(false)} />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddSpell(true)}
          className="w-full border-dashed border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Spell
        </Button>
      )}
    </div>
  );
}
