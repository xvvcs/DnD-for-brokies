/**
 * SpellcastingSection Component
 *
 * Displays spellcasting abilities, spell slots, and spell list
 * Extracted from CombatActionsPanel for better separation of concerns
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import { useSpells } from '@/hooks/api/useOpen5e';
import { fetchSpell } from '@/lib/api/endpoints/spells';
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
import { toOpen5eDisplayString } from '@/lib/utils';

interface SpellcastingSectionProps {
  spellcasting: Spellcasting | null;
  primaryClassKey: string;
  documentKeys: string[];
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
    <div className="space-y-1.5">
      {validSlots.map((slot) => {
        const remaining = slot.max - slot.used;
        const slots = Array.from({ length: slot.max }, (_, i) => i);

        return (
          <div key={slot.level} className="flex items-center gap-2">
            <div className="w-10 text-xs font-bold text-purple-900">Lv{slot.level}</div>

            <div className="flex items-center gap-1 flex-wrap">
              {slots.map((index) => {
                const isUsed = index < slot.used;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onToggle?.(slot.level, index, !isUsed)}
                    className={cn(
                      'w-5 h-5 border rounded flex items-center justify-center transition-colors',
                      isUsed
                        ? 'bg-purple-700 border-purple-700'
                        : 'bg-white border-purple-300 hover:border-purple-500'
                    )}
                    aria-label={`Spell slot ${index + 1} of level ${slot.level}${isUsed ? ' (used)' : ' (available)'}`}
                  >
                    {isUsed && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}

              <span className="ml-1 text-xs font-medium text-purple-700">
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

  const {
    data: fullSpell,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['spell', spell.spellKey],
    queryFn: () => fetchSpell(spell.spellKey),
    enabled: expanded,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  return (
    <div className="border border-purple-300 rounded p-2 bg-gradient-to-b from-purple-50 to-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-sm text-purple-900">{spell.name}</h4>

            {!isCantrip && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">
                Lv{spell.level}
              </span>
            )}

            {isCantrip && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                Cantrip
              </span>
            )}

            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
              {toOpen5eDisplayString(spell.school)}
            </span>
          </div>

          {showPreparedToggle && (
            <div className="mt-1 flex items-center gap-1.5">
              <Checkbox
                id={`prepared-${spell.id}`}
                checked={isPrepared}
                onCheckedChange={() => onTogglePrepared?.(spell.spellKey)}
                className="border-purple-400 h-3 w-3"
              />
              <label
                htmlFor={`prepared-${spell.id}`}
                className="text-xs text-purple-700 cursor-pointer"
              >
                {isPrepared ? 'Prepared' : 'Not Prepared'}
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove?.(spell.spellKey)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-1 h-6"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-purple-100 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-purple-700" />
            ) : (
              <ChevronDown className="w-3 h-3 text-purple-700" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-purple-200 text-xs space-y-1">
          {isLoading ? (
            <p className="text-gray-500 animate-pulse py-2">Loading spell details...</p>
          ) : isError || !fullSpell ? (
            <p className="text-red-500 italic py-2">Spell details unavailable offline</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                <p className="text-gray-700">
                  <span className="font-medium text-purple-800">Casting Time:</span>{' '}
                  {toOpen5eDisplayString(fullSpell.casting_time)}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-purple-800">Range:</span>{' '}
                  {toOpen5eDisplayString(fullSpell.range)}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-purple-800">Components:</span>{' '}
                  {toOpen5eDisplayString(fullSpell.components)}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-purple-800">Duration:</span>{' '}
                  {toOpen5eDisplayString(fullSpell.duration)}
                </p>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-purple-100 pt-2 mt-2">
                {fullSpell.desc}
              </p>
              {fullSpell.higher_levels && (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mt-2">
                  <span className="font-bold text-purple-800">At Higher Levels:</span>{' '}
                  {fullSpell.higher_levels}
                </p>
              )}
            </>
          )}
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
    <div className="border border-purple-300 rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          <h4 className="font-bold text-purple-900 text-xs">{levelName}</h4>
          <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-medium rounded">
            {spells.length}
          </span>
          {canTogglePrepared && level > 0 && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
              {preparedCount} prep
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-purple-700" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
        )}
      </button>

      {expanded && (
        <div className="p-2 space-y-1.5">
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
function AddSpellInterface({
  onCancel,
  documentKeys,
  onAddSpell,
}: {
  onCancel: () => void;
  documentKeys: string[];
  onAddSpell?: (spell: Open5eSpell) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Fetch all spells once, cache locally
  const { data: allSpells = [], isLoading, isError, refetch } = useSpells(documentKeys);

  const filteredSpells = useMemo(() => {
    let result = allSpells;

    if (levelFilter !== 'all') {
      const levelNum = parseInt(levelFilter, 10);
      result = result.filter((s) => s.level === levelNum);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          toOpen5eDisplayString(s.school).toLowerCase().includes(term)
      );
    }

    return result;
  }, [allSpells, searchTerm, levelFilter]);

  const visibleSpells = useMemo(
    () => filteredSpells.slice(0, visibleCount),
    [filteredSpells, visibleCount]
  );

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 50, filteredSpells.length));
      }
    },
    [filteredSpells.length]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h4 className="font-bold text-purple-900 uppercase text-sm">Add Spell from SRD</h4>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 mb-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(50);
            }}
            placeholder="Search spells..."
            className="pl-9 border-purple-300 bg-white"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value);
            setVisibleCount(50);
          }}
          className="px-3 border border-purple-300 rounded-md text-sm bg-white text-gray-700 w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Levels</option>
          <option value="0">Cantrips</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-3 shrink-0">
          Failed to load spells.
          <Button variant="outline" size="sm" className="mt-2 ml-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <Command className="flex-1 border border-purple-200 rounded-lg overflow-hidden bg-white">
        <CommandList className="max-h-full">
          <CommandEmpty>{isLoading ? 'Loading spells...' : 'No spells found.'}</CommandEmpty>
          <CommandGroup>
            {visibleSpells.map((spell) => (
              <CommandItem
                key={spell.key}
                value={spell.key}
                className="py-2 px-3 border-b border-gray-50 last:border-0 hover:bg-purple-50"
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium text-purple-900">{spell.name}</div>
                    <div className="text-xs text-gray-500">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} •{' '}
                      {toOpen5eDisplayString(spell.school)} •{' '}
                      {toOpen5eDisplayString(spell.casting_time)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                    onClick={() => {
                      onAddSpell?.(spell);
                      onCancel();
                    }}
                  >
                    Add
                  </Button>
                </div>
              </CommandItem>
            ))}
            {visibleCount < filteredSpells.length && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center">
                <span className="text-xs text-gray-400">Loading more...</span>
              </div>
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

/**
 * SpellcastingSection Main Component
 */
export function SpellcastingSection({
  spellcasting,
  primaryClassKey,
  documentKeys,
  onSpellSlotUse,
  onSpellTogglePrepared,
  onAddSpell,
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
    <div className="space-y-2">
      {/* Spellcasting Stats */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 rounded">
        <div className="text-center">
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wider">
            Ability
          </div>
          <div className="text-lg font-bold text-purple-900">{spellcasting.ability || 'N/A'}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wider">
            Save DC
          </div>
          <div className="text-lg font-bold text-purple-900">{spellcasting.saveDC}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wider">
            Attack
          </div>
          <div className="text-lg font-bold text-purple-900">
            {formatModifier(spellcasting.attackBonus)}
          </div>
        </div>
      </div>

      {/* Spell Slots */}
      {hasSlots && (
        <div className="p-2 bg-white border border-purple-300 rounded">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-purple-700" />
            <h4 className="font-bold text-purple-900 text-xs">Spell Slots</h4>
          </div>
          <SpellSlotTracker slots={spellcasting.slots} onToggle={handleSlotToggle} />
        </div>
      )}

      {/* Info Banners */}
      {usesPreparation && (
        <div className="p-2 bg-green-50 border border-green-300 rounded text-xs text-green-800">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            <span>Prepare spells after long rest</span>
          </div>
        </div>
      )}

      {usesKnownSpells && !usesPreparation && (
        <div className="p-2 bg-blue-50 border border-blue-300 rounded text-xs text-blue-800">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            <span>Known spells always available</span>
          </div>
        </div>
      )}

      {/* Spell List */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {levels.length === 0 && !showAddSpell && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-xs">No spells known</p>
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
        <AddSpellInterface
          onCancel={() => setShowAddSpell(false)}
          documentKeys={documentKeys}
          onAddSpell={onAddSpell}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddSpell(true)}
          className="w-full border-dashed border-2 border-purple-300 text-purple-700 hover:bg-purple-50 h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Spell
        </Button>
      )}
    </div>
  );
}
