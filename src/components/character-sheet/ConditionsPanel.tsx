/**
 * ConditionsPanel Component
 *
 * Minimal conditions display with expandable drawer:
 * - Minimal view shows only active conditions as badges
 * - Gear icon opens drawer with full condition management
 * - Toggle all standard D&D 5e conditions
 * - Exhaustion level selector (1-6 or 1-10)
 * - Condition description tooltips from Open5E API
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConditions } from '@/hooks/api/useOpen5e';
import type { ActiveCondition } from '@/types/game';
import {
  AlertTriangle,
  Skull,
  Eye,
  Ear,
  Heart,
  Ghost,
  Wind,
  Frown,
  Stone,
  FlaskConical,
  ArrowDown,
  Grip,
  Zap,
  Moon,
  Clock,
  Loader2,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';

interface ConditionsPanelProps {
  conditions: ActiveCondition[];
  onConditionToggle?: (conditionKey: string) => void;
  onExhaustionChange?: (level: number) => void;
  maxExhaustionLevel?: 6 | 10;
  className?: string;
}

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
    icon: <Eye className="w-4 h-4" />,
    color: 'text-gray-200',
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-700',
    description:
      "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
  },
  {
    key: 'charmed',
    name: 'Charmed',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-pink-100',
    bgColor: 'bg-pink-600',
    borderColor: 'border-pink-500',
    description:
      "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
  },
  {
    key: 'deafened',
    name: 'Deafened',
    icon: <Ear className="w-4 h-4" />,
    color: 'text-gray-200',
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-500',
    description:
      "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
  },
  {
    key: 'frightened',
    name: 'Frightened',
    icon: <Ghost className="w-4 h-4" />,
    color: 'text-purple-100',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-500',
    description:
      "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
  },
  {
    key: 'grappled',
    name: 'Grappled',
    icon: <Grip className="w-4 h-4" />,
    color: 'text-orange-100',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-500',
    description:
      "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler or grappling effect.",
  },
  {
    key: 'incapacitated',
    name: 'Incapacitated',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-red-100',
    bgColor: 'bg-red-700',
    borderColor: 'border-red-600',
    description: "An incapacitated creature can't take actions or reactions.",
  },
  {
    key: 'invisible',
    name: 'Invisible',
    icon: <Wind className="w-4 h-4" />,
    color: 'text-blue-100',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-400',
    description:
      "An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
  },
  {
    key: 'paralyzed',
    name: 'Paralyzed',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-yellow-100',
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
    description:
      "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
  },
  {
    key: 'petrified',
    name: 'Petrified',
    icon: <Stone className="w-4 h-4" />,
    color: 'text-stone-200',
    bgColor: 'bg-stone-600',
    borderColor: 'border-stone-500',
    description:
      "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated, can't move or speak, and is unaware of its surroundings. Attack rolls against the creature have advantage. The creature automatically fails Strength and Dexterity saving throws. The creature has resistance to all damage. The creature is immune to poison and disease.",
  },
  {
    key: 'poisoned',
    name: 'Poisoned',
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'text-green-100',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
  },
  {
    key: 'prone',
    name: 'Prone',
    icon: <ArrowDown className="w-4 h-4" />,
    color: 'text-amber-100',
    bgColor: 'bg-amber-700',
    borderColor: 'border-amber-600',
    description:
      "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, that attack roll has disadvantage.",
  },
  {
    key: 'restrained',
    name: 'Restrained',
    icon: <Frown className="w-4 h-4" />,
    color: 'text-yellow-100',
    bgColor: 'bg-yellow-700',
    borderColor: 'border-yellow-600',
    description:
      "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
  },
  {
    key: 'stunned',
    name: 'Stunned',
    icon: <Skull className="w-4 h-4" />,
    color: 'text-indigo-100',
    bgColor: 'bg-indigo-600',
    borderColor: 'border-indigo-500',
    description:
      "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
  },
  {
    key: 'unconscious',
    name: 'Unconscious',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-gray-300',
    bgColor: 'bg-gray-900',
    borderColor: 'border-gray-700',
    description:
      "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
  },
];

const EXHAUSTION_CONFIG: ConditionConfig = {
  key: 'exhaustion',
  name: 'Exhaustion',
  icon: <Clock className="w-4 h-4" />,
  color: 'text-red-100',
  bgColor: 'bg-red-800',
  borderColor: 'border-red-700',
  description:
    "Some special abilities and environmental hazards, such as extreme heat or hunger, can lead to a special condition called exhaustion. Exhaustion is measured in six levels. An effect can give a creature one or more levels of exhaustion, as specified in the effect's description.",
};

const EXHAUSTION_LEVELS_STANDARD = [
  { level: 1, description: 'Disadvantage on ability checks' },
  { level: 2, description: 'Speed halved' },
  { level: 3, description: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, description: 'Hit point maximum halved' },
  { level: 5, description: 'Speed reduced to 0' },
  { level: 6, description: 'Death' },
];

const EXHAUSTION_LEVELS_EXTENDED = [
  ...EXHAUSTION_LEVELS_STANDARD,
  { level: 7, description: 'Disadvantage on death saving throws' },
  { level: 8, description: 'Constitution score reduced by 2' },
  { level: 9, description: 'Maximum hit points reduced by half again' },
  { level: 10, description: 'Death' },
];

function ConditionBadge({
  condition,
  config,
  onRemove,
  showRemove = false,
}: {
  condition?: ActiveCondition;
  config: ConditionConfig;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-white shadow-sm',
            config.bgColor,
            showRemove && 'pr-2'
          )}
        >
          <span className="w-3.5 h-3.5 flex-shrink-0">{config.icon}</span>
          <span>{config.name}</span>
          {condition?.exhaustionLevel !== undefined && condition.exhaustionLevel > 0 && (
            <span className="ml-0.5 opacity-90">({condition.exhaustionLevel})</span>
          )}
          {showRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="ml-1 hover:bg-white/20 rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-white border border-amber-200 text-gray-800 p-2"
      >
        <p className="font-bold text-amber-900 text-xs mb-1">{config.name}</p>
        <p className="text-[10px] leading-relaxed">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ConditionsDrawer({
  conditions,
  conditionsWithDescriptions,
  onConditionToggle,
  onExhaustionChange,
  maxExhaustionLevel,
  open,
  onOpenChange,
}: {
  conditions: ActiveCondition[];
  conditionsWithDescriptions: ConditionConfig[];
  onConditionToggle?: (conditionKey: string) => void;
  onExhaustionChange?: (level: number) => void;
  maxExhaustionLevel: 6 | 10;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [showExhaustionDetails, setShowExhaustionDetails] = useState(false);

  const activeConditionKeys = useMemo(() => {
    return new Set(conditions.map((c) => c.conditionKey));
  }, [conditions]);

  const exhaustionCondition = useMemo(() => {
    return conditions.find((c) => c.conditionKey === 'exhaustion');
  }, [conditions]);

  const exhaustionLevel = exhaustionCondition?.exhaustionLevel || 0;
  const exhaustionLevels =
    maxExhaustionLevel === 10 ? EXHAUSTION_LEVELS_EXTENDED : EXHAUSTION_LEVELS_STANDARD;

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
              Conditions Manager
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 h-[calc(100vh-80px)] p-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Standard Conditions
                </h4>
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
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Exhaustion
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExhaustionDetails(!showExhaustionDetails)}
                    className="text-xs h-7"
                  >
                    {showExhaustionDetails ? 'Hide Details' : 'Show Details'}
                    <ChevronRight
                      className={cn(
                        'w-3 h-3 ml-1 transition-transform',
                        showExhaustionDetails && 'rotate-90'
                      )}
                    />
                  </Button>
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
                          <Badge className="bg-red-600 text-white">Level {exhaustionLevel}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not Active
                          </Badge>
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
                      <p className="text-xs text-gray-600 mb-3 font-medium">
                        Select exhaustion level (0-{maxExhaustionLevel}):
                      </p>

                      <div className="grid grid-cols-6 gap-2 mb-4">
                        {[...Array(maxExhaustionLevel + 1)].map((_, idx) => {
                          const level = idx;
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
                          <p className="text-xs font-semibold text-red-800">Current Effects:</p>
                          {exhaustionLevels.slice(0, exhaustionLevel).map((ex) => (
                            <div
                              key={ex.level}
                              className="flex items-center gap-2 text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded"
                            >
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 border-red-400 shrink-0"
                              >
                                L{ex.level}
                              </Badge>
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

export function ConditionsPanel({
  conditions,
  onConditionToggle,
  onExhaustionChange,
  maxExhaustionLevel = 6,
  className,
}: ConditionsPanelProps) {
  const { data: apiConditions, isLoading } = useConditions();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const activeConditions = useMemo(() => {
    return conditions.filter((c) => c.conditionKey !== 'exhaustion');
  }, [conditions]);

  const exhaustionCondition = useMemo(() => {
    return conditions.find((c) => c.conditionKey === 'exhaustion');
  }, [conditions]);

  const exhaustionLevel = exhaustionCondition?.exhaustionLevel || 0;
  const activeConditionCount = activeConditions.length + (exhaustionLevel > 0 ? 1 : 0);

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
      <div
        className={cn(
          'bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4',
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Conditions</h3>
            {activeConditionCount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
                {activeConditionCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'p-1.5 rounded transition-colors',
              'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              activeConditionCount > 0 && 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
            )}
            title="Manage conditions"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeConditions.length === 0 && exhaustionLevel === 0 ? (
            <span className="text-xs text-gray-400 italic">No conditions</span>
          ) : (
            <>
              {activeConditions.map((condition) => {
                const config = conditionsWithDescriptions.find(
                  (c) => c.key === condition.conditionKey
                );
                if (!config) return null;
                return (
                  <ConditionBadge
                    key={condition.conditionKey}
                    condition={condition}
                    config={config}
                    onRemove={() => onConditionToggle?.(condition.conditionKey)}
                    showRemove
                  />
                );
              })}
              {exhaustionLevel > 0 && (
                <ConditionBadge
                  condition={{ conditionKey: 'exhaustion', exhaustionLevel }}
                  config={EXHAUSTION_CONFIG}
                  onRemove={() => {
                    onExhaustionChange?.(0);
                    onConditionToggle?.('exhaustion');
                  }}
                  showRemove
                />
              )}
            </>
          )}
        </div>

        <ConditionsDrawer
          conditions={conditions}
          conditionsWithDescriptions={conditionsWithDescriptions}
          onConditionToggle={onConditionToggle}
          onExhaustionChange={onExhaustionChange}
          maxExhaustionLevel={maxExhaustionLevel}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </TooltipProvider>
  );
}

export type { ConditionsPanelProps };
