/**
 * CombatStats Component
 *
 * Displays combat-related statistics:
 * - AC (with manual override option)
 * - Initiative
 * - Speed (all types)
 * - Hit Dice (remaining/total per class)
 * - Death Saves tracker (shown only when HP = 0)
 * - Conditions management (minimal inline)
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { CombatStats as CombatStatsType, ActiveCondition } from '@/types/game';
import type { CharacterClass } from '@/types/character';
import { formatModifier } from '@/lib/engine/ability-scores';
import { EditableField } from './EditableField';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useConditions } from '@/hooks/api/useOpen5e';
import {
  Shield,
  Swords,
  Footprints,
  Heart,
  Skull,
  Eye,
  Ear,
  Ghost,
  Grip,
  Wind,
  Stone,
  FlaskConical,
  ArrowDown,
  Frown,
  Zap,
  Moon,
  Clock,
  Settings,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface ConditionConfig {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const DEFAULT_CONDITIONS: ConditionConfig[] = [
  {
    key: 'blinded',
    name: 'Blinded',
    icon: <Eye className="w-3.5 h-3.5" />,
    color: 'text-gray-200',
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-700',
    description:
      "A blinded creature can't see and automatically fails any ability check that requires sight.",
  },
  {
    key: 'charmed',
    name: 'Charmed',
    icon: <Heart className="w-3.5 h-3.5" />,
    color: 'text-pink-100',
    bgColor: 'bg-pink-600',
    borderColor: 'border-pink-500',
    description:
      "A charmed creature can't attack the charmer or target the charmer with harmful abilities.",
  },
  {
    key: 'deafened',
    name: 'Deafened',
    icon: <Ear className="w-3.5 h-3.5" />,
    color: 'text-gray-200',
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-500',
    description:
      "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
  },
  {
    key: 'frightened',
    name: 'Frightened',
    icon: <Ghost className="w-3.5 h-3.5" />,
    color: 'text-purple-100',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    description:
      'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
  },
  {
    key: 'grappled',
    name: 'Grappled',
    icon: <Grip className="w-3.5 h-3.5" />,
    color: 'text-orange-100',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-500',
    description:
      "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
  },
  {
    key: 'incapacitated',
    name: 'Incapacitated',
    icon: <Moon className="w-3.5 h-3.5" />,
    color: 'text-red-100',
    bgColor: 'bg-red-700',
    borderColor: 'border-red-600',
    description: "An incapacitated creature can't take actions or reactions.",
  },
  {
    key: 'invisible',
    name: 'Invisible',
    icon: <Wind className="w-3.5 h-3.5" />,
    color: 'text-blue-100',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-400',
    description:
      'An invisible creature is impossible to see without the aid of magic or a special sense.',
  },
  {
    key: 'paralyzed',
    name: 'Paralyzed',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-yellow-100',
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
    description: "A paralyzed creature is incapacitated and can't move or speak.",
  },
  {
    key: 'petrified',
    name: 'Petrified',
    icon: <Stone className="w-3.5 h-3.5" />,
    color: 'text-stone-200',
    bgColor: 'bg-stone-600',
    borderColor: 'border-stone-500',
    description: 'A petrified creature is transformed into a solid inanimate substance.',
  },
  {
    key: 'poisoned',
    name: 'Poisoned',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    color: 'text-green-100',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
  },
  {
    key: 'prone',
    name: 'Prone',
    icon: <ArrowDown className="w-3.5 h-3.5" />,
    color: 'text-amber-100',
    bgColor: 'bg-amber-700',
    borderColor: 'border-amber-600',
    description: "A prone creature's only movement option is to crawl.",
  },
  {
    key: 'restrained',
    name: 'Restrained',
    icon: <Frown className="w-3.5 h-3.5" />,
    color: 'text-yellow-100',
    bgColor: 'bg-yellow-700',
    borderColor: 'border-yellow-600',
    description:
      "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
  },
  {
    key: 'stunned',
    name: 'Stunned',
    icon: <Skull className="w-3.5 h-3.5" />,
    color: 'text-indigo-100',
    bgColor: 'bg-indigo-600',
    borderColor: 'border-indigo-500',
    description: "A stunned creature is incapacitated, can't move, and can speak only falteringly.",
  },
  {
    key: 'unconscious',
    name: 'Unconscious',
    icon: <Moon className="w-3.5 h-3.5" />,
    color: 'text-gray-300',
    bgColor: 'bg-gray-900',
    borderColor: 'border-gray-700',
    description:
      "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings.",
  },
];

const EXHAUSTION_CONFIG: ConditionConfig = {
  key: 'exhaustion',
  name: 'Exhaustion',
  icon: <Clock className="w-3.5 h-3.5" />,
  color: 'text-red-100',
  bgColor: 'bg-red-800',
  borderColor: 'border-red-700',
  description: 'Exhaustion is measured in six levels.',
};

const EXHAUSTION_LEVELS = [
  { level: 1, description: 'Disadvantage on ability checks' },
  { level: 2, description: 'Speed halved' },
  { level: 3, description: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, description: 'Hit point maximum halved' },
  { level: 5, description: 'Speed reduced to 0' },
  { level: 6, description: 'Death' },
];

interface CombatStatsProps {
  combatStats: CombatStatsType;
  classes: CharacterClass[];
  conditions: ActiveCondition[];
  onACChange?: (ac: number) => void;
  onDeathSaveChange?: (type: 'success' | 'failure', value: number) => void;
  onConditionToggle?: (conditionKey: string) => void;
  onExhaustionChange?: (level: number) => void;
  className?: string;
}

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

function ConditionsManager({
  conditions,
  onConditionToggle,
  onExhaustionChange,
  open,
  onOpenChange,
}: {
  conditions: ActiveCondition[];
  onConditionToggle?: (conditionKey: string) => void;
  onExhaustionChange?: (level: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: apiConditions } = useConditions();
  const [showExhaustionDetails, setShowExhaustionDetails] = useState(false);

  const conditionsWithDescriptions = useMemo(() => {
    if (apiConditions && apiConditions.length > 0) {
      const descriptionMap = new Map(apiConditions.map((c) => [c.key, c.description]));
      return DEFAULT_CONDITIONS.map((c) => ({
        ...c,
        description: descriptionMap.get(c.key) || c.description,
      }));
    }
    return DEFAULT_CONDITIONS;
  }, [apiConditions]);

  const activeConditionKeys = useMemo(() => {
    return new Set(conditions.map((c) => c.conditionKey));
  }, [conditions]);

  const exhaustionCondition = useMemo(() => {
    return conditions.find((c) => c.conditionKey === 'exhaustion');
  }, [conditions]);

  const exhaustionLevel = exhaustionCondition?.exhaustionLevel || 0;

  const handleExhaustionClick = () => {
    if (exhaustionLevel === 0) {
      onExhaustionChange?.(1);
      onConditionToggle?.('exhaustion');
    } else {
      onExhaustionChange?.(0);
      onConditionToggle?.('exhaustion');
    }
  };

  const handleExhaustionLevelChange = (level: number) => {
    if (level === 0) {
      onExhaustionChange?.(0);
      if (exhaustionLevel > 0) {
        onConditionToggle?.('exhaustion');
      }
    } else {
      if (exhaustionLevel === 0) {
        onConditionToggle?.('exhaustion');
      }
      onExhaustionChange?.(level);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <TooltipProvider delayDuration={300} skipDelayDuration={200}>
          <SheetHeader className="border-b border-amber-200 px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Conditions
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 h-[calc(100vh-80px)] p-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Standard Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {conditionsWithDescriptions.map((condition) => {
                    const isActive = activeConditionKeys.has(condition.key);
                    return (
                      <Tooltip key={condition.key}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onConditionToggle?.(condition.key)}
                            className={cn(
                              'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 flex items-center gap-2',
                              isActive
                                ? `${condition.bgColor} ${condition.color} ${condition.borderColor} shadow-md`
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            )}
                          >
                            <span className={isActive ? condition.color : 'text-gray-500'}>
                              {condition.icon}
                            </span>
                            <span>{condition.name}</span>
                            {isActive && <X className="w-3.5 h-3.5 opacity-70" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs bg-white border border-amber-200 text-gray-800 p-3"
                        >
                          <p className="font-bold text-amber-900 mb-1">{condition.name}</p>
                          <p className="text-sm leading-relaxed">{condition.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Exhaustion</h4>
                  <button
                    type="button"
                    onClick={() => setShowExhaustionDetails(!showExhaustionDetails)}
                    className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    {showExhaustionDetails ? 'Hide' : 'Details'}
                    <ChevronRight
                      className={cn(
                        'w-3 h-3 ml-1 inline transition-transform',
                        showExhaustionDetails && 'rotate-90'
                      )}
                    />
                  </button>
                </div>

                <div className="space-y-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleExhaustionClick}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all',
                          exhaustionLevel > 0
                            ? `${EXHAUSTION_CONFIG.bgColor} ${EXHAUSTION_CONFIG.color} ${EXHAUSTION_CONFIG.borderColor} shadow-md`
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              exhaustionLevel > 0 ? EXHAUSTION_CONFIG.color : 'text-gray-500'
                            }
                          >
                            {EXHAUSTION_CONFIG.icon}
                          </span>
                          <span className="font-medium">{EXHAUSTION_CONFIG.name}</span>
                        </div>
                        {exhaustionLevel > 0 ? (
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                            Level {exhaustionLevel}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not Active</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-sm bg-white border border-amber-200 text-gray-800 p-3"
                    >
                      <p className="font-bold text-amber-900 mb-1">{EXHAUSTION_CONFIG.name}</p>
                      <p className="text-sm leading-relaxed">{EXHAUSTION_CONFIG.description}</p>
                    </TooltipContent>
                  </Tooltip>

                  {showExhaustionDetails && (
                    <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-xs text-gray-600 mb-3 font-medium">Select level (0-6):</p>
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {[0, 1, 2, 3, 4, 5, 6].map((level) => {
                          const isSelected = exhaustionLevel === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleExhaustionLevelChange(level)}
                              className={cn(
                                'h-10 rounded-lg font-bold text-sm transition-all border-2',
                                isSelected
                                  ? 'bg-red-700 text-white border-red-600 shadow-md'
                                  : level === 0
                                    ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                    : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                              )}
                            >
                              {level === 0 ? 'None' : level}
                            </button>
                          );
                        })}
                      </div>
                      {exhaustionLevel > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-red-800">Effects:</p>
                          {EXHAUSTION_LEVELS.slice(0, exhaustionLevel).map((ex) => (
                            <div
                              key={ex.level}
                              className="flex items-center gap-2 text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded"
                            >
                              <span className="font-bold shrink-0">L{ex.level}</span>
                              <span>{ex.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}

export function CombatStats({
  combatStats,
  classes,
  conditions,
  onACChange,
  onDeathSaveChange,
  onConditionToggle,
  onExhaustionChange,
  className,
}: CombatStatsProps) {
  const [isEditingAC, setIsEditingAC] = useState(false);
  const [showConditionsManager, setShowConditionsManager] = useState(false);

  const hitDiceByClass = classes.map((cls) => ({
    name: cls.name,
    type: `d${cls.hitDiceValue}`,
    total: cls.level,
  }));

  const activeConditions = conditions.filter((c) => c.conditionKey !== 'exhaustion');
  const exhaustionCondition = conditions.find((c) => c.conditionKey === 'exhaustion');
  const exhaustionLevel = exhaustionCondition?.exhaustionLevel || 0;
  const activeConditionCount = activeConditions.length + (exhaustionLevel > 0 ? 1 : 0);

  return (
    <div
      className={cn('bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4', className)}
    >
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-5 h-5 text-amber-700" />
        <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">Combat Stats</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <TooltipProvider delayDuration={300} skipDelayDuration={200}>
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

        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-300 rounded-lg">
          <Swords className="w-5 h-5 text-amber-700 mb-1" />
          <div className="text-xs text-amber-600 uppercase font-medium mb-1">Initiative</div>
          <div className="text-2xl font-bold text-amber-900">
            {formatModifier(combatStats.initiative)}
          </div>
        </div>

        <div className="flex flex-col items-center p-3 bg-gradient-to-br from-green-100 to-green-50 border border-green-300 rounded-lg">
          <Footprints className="w-5 h-5 text-green-700 mb-1" />
          <div className="text-xs text-green-600 uppercase font-medium mb-1">Speed</div>
          <div className="text-2xl font-bold text-green-900">{combatStats.speed} ft</div>
        </div>

        <TooltipProvider delayDuration={300} skipDelayDuration={200}>
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

      {combatStats.currentHp === 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-400 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="w-5 h-5 text-red-700" />
            <h4 className="font-bold text-red-900 uppercase text-sm">Death Saves</h4>
          </div>
          <div className="space-y-2">
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

      {/* Minimal Conditions Bar */}
      <div className="pt-3 border-t border-amber-200">
        <div className="flex items-center gap-2">
          {activeConditionCount === 0 ? (
            <span className="text-xs text-gray-400 italic flex-1">No conditions</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {activeConditions.slice(0, 4).map((condition) => {
                const config = DEFAULT_CONDITIONS.find((c) => c.key === condition.conditionKey);
                if (!config) return null;
                return (
                  <Tooltip key={condition.conditionKey}>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white',
                          config.bgColor
                        )}
                      >
                        {config.icon}
                        <span>{config.name}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-white border border-amber-200 text-gray-800 p-2"
                    >
                      <p className="font-bold text-amber-900 text-xs">{config.name}</p>
                      <p className="text-[10px] leading-relaxed">{config.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {exhaustionLevel > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white',
                        EXHAUSTION_CONFIG.bgColor
                      )}
                    >
                      {EXHAUSTION_CONFIG.icon}
                      <span>Exhaustion ({exhaustionLevel})</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-white border border-amber-200 text-gray-800 p-2"
                  >
                    <p className="font-bold text-amber-900 text-xs">{EXHAUSTION_CONFIG.name}</p>
                    <p className="text-[10px] leading-relaxed">{EXHAUSTION_CONFIG.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {activeConditions.length > 4 && (
                <span className="text-[10px] text-gray-500">
                  +{activeConditions.length - 4} more
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowConditionsManager(true)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Manage conditions"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConditionsManager
        conditions={conditions}
        onConditionToggle={onConditionToggle}
        onExhaustionChange={onExhaustionChange}
        open={showConditionsManager}
        onOpenChange={setShowConditionsManager}
      />
    </div>
  );
}
