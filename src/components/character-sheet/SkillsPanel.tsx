/**
 * SkillsPanel Component
 *
 * Displays all 18 D&D 5e skills with proficiency/expertise toggles,
 * modifiers, and Passive Perception. Includes filtering and responsive design.
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { SKILLS, type AbilityScore, type ProficiencyLevel } from '@/types/game';
import { formatModifier } from '@/lib/engine/ability-scores';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Filter, Eye } from 'lucide-react';

// Skill descriptions for tooltips
const SKILL_DESCRIPTIONS: Record<string, string> = {
  acrobatics:
    'Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation.',
  animal_handling:
    "When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal's intentions, the DM might call for a Wisdom (Animal Handling) check.",
  arcana:
    'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.',
  athletics:
    'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.',
  deception:
    'Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.',
  history:
    'Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.',
  insight:
    "Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone's next move.",
  intimidation:
    'When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.',
  investigation:
    'When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.',
  medicine:
    'A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.',
  nature:
    'Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.',
  perception:
    'Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.',
  performance:
    'Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.',
  persuasion:
    'When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.',
  religion:
    'Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.',
  sleight_of_hand:
    'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.',
  stealth:
    'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.',
  survival:
    'The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand and other natural hazards.',
};

type FilterType = 'all' | 'proficient' | 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

interface SkillsPanelProps {
  abilityModifiers: Record<AbilityScore, number>;
  skillProficiencies: Record<string, ProficiencyLevel>;
  proficiencyBonus: number;
  onSkillProficiencyChange?: (skillKey: string, level: ProficiencyLevel) => void;
  className?: string;
}

/**
 * Calculate skill modifier including proficiency
 */
function calculateSkillModifier(
  abilityModifier: number,
  proficiencyLevel: ProficiencyLevel,
  proficiencyBonus: number
): number {
  const multipliers: Record<ProficiencyLevel, number> = {
    none: 0,
    half: 0.5,
    proficient: 1,
    expertise: 2,
  };

  return abilityModifier + Math.floor(multipliers[proficiencyLevel] * proficiencyBonus);
}

/**
 * Individual skill row with proficiency toggle
 */
function SkillRow({
  skillKey,
  skillName,
  ability,
  abilityModifier,
  proficiencyLevel,
  proficiencyBonus,
  onProficiencyChange,
}: {
  skillKey: string;
  skillName: string;
  ability: AbilityScore;
  abilityModifier: number;
  proficiencyLevel: ProficiencyLevel;
  proficiencyBonus: number;
  onProficiencyChange?: (level: ProficiencyLevel) => void;
}) {
  const modifier = calculateSkillModifier(abilityModifier, proficiencyLevel, proficiencyBonus);

  const handleClick = () => {
    if (!onProficiencyChange) return;

    // Cycle: none -> proficient -> expertise -> none
    const nextLevel: Record<ProficiencyLevel, ProficiencyLevel> = {
      none: 'proficient',
      half: 'proficient',
      proficient: 'expertise',
      expertise: 'none',
    };

    onProficiencyChange(nextLevel[proficiencyLevel]);
  };

  const proficiencyConfig = {
    none: { icon: '', bg: 'bg-gray-100', border: 'border-gray-300', title: 'Not Proficient' },
    half: {
      icon: '◐',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      title: 'Half Proficient (Jack of All Trades)',
    },
    proficient: {
      icon: '●',
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
      title: 'Proficient',
    },
    expertise: {
      icon: '★',
      bg: 'bg-emerald-200',
      border: 'border-emerald-600',
      title: 'Expertise',
    },
  };

  const config = proficiencyConfig[proficiencyLevel];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-md',
              'border transition-all',
              proficiencyLevel !== 'none' && proficiencyLevel !== 'half'
                ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white border-amber-200 hover:bg-amber-50'
            )}
          >
            {/* Proficiency Badge */}
            <button
              type="button"
              onClick={handleClick}
              disabled={!onProficiencyChange}
              title={config.title}
              className={cn(
                'w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center',
                'font-bold text-xs transition-all',
                config.bg,
                config.border,
                onProficiencyChange && 'cursor-pointer hover:scale-110 hover:shadow-md',
                !onProficiencyChange && 'cursor-default'
              )}
            >
              <span className="text-emerald-800">{config.icon}</span>
            </button>

            {/* Skill Name and Ability */}
            <div className="flex-1 ml-3 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm text-gray-900">{skillName}</span>
                <span className="text-xs text-gray-500 uppercase">({ability})</span>
              </div>
            </div>

            {/* Modifier */}
            <span
              className={cn(
                'font-bold text-lg ml-3 flex-shrink-0',
                modifier > 0 && 'text-emerald-700',
                modifier < 0 && 'text-red-600',
                modifier === 0 && 'text-gray-600'
              )}
            >
              {formatModifier(modifier)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-xs bg-amber-50 border-amber-300 text-amber-900 p-3"
        >
          <p className="text-sm">{SKILL_DESCRIPTIONS[skillKey]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Main Skills Panel Component
 */
export function SkillsPanel({
  abilityModifiers,
  skillProficiencies,
  proficiencyBonus,
  onSkillProficiencyChange,
  className,
}: SkillsPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate Passive Perception
  const perceptionProficiency = skillProficiencies['perception'] ?? 'none';
  const perceptionModifier = calculateSkillModifier(
    abilityModifiers.WIS,
    perceptionProficiency,
    proficiencyBonus
  );
  const passivePerception = 10 + perceptionModifier;

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = SKILLS;

    if (filter === 'proficient') {
      filtered = SKILLS.filter((skill) => {
        const level = skillProficiencies[skill.key] ?? 'none';
        return level === 'proficient' || level === 'expertise';
      });
    } else if (filter !== 'all') {
      // Filter by ability
      filtered = SKILLS.filter((skill) => skill.ability === filter);
    }

    return filtered;
  }, [filter, skillProficiencies]);

  // Count proficient skills
  const proficientCount = SKILLS.filter((skill) => {
    const level = skillProficiencies[skill.key] ?? 'none';
    return level === 'proficient' || level === 'expertise';
  }).length;

  return (
    <div
      className={cn('bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4', className)}
    >
      {/* Header with Passive Perception */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">Skills</h3>
          {proficientCount > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
              {proficientCount} proficient
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Passive Perception - minimal display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Passive Perception:</span>
            <span className="text-sm font-bold text-blue-800">{passivePerception}</span>
          </div>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-2 rounded hover:bg-amber-100 transition-colors"
            title={isCollapsed ? 'Expand skills' : 'Collapse skills'}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              All ({SKILLS.length})
            </Button>
            <Button
              variant={filter === 'proficient' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('proficient')}
              className="text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              Proficient ({proficientCount})
            </Button>
            {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityScore[]).map((ability) => {
              const count = SKILLS.filter((s) => s.ability === ability).length;
              return (
                <Button
                  key={ability}
                  variant={filter === ability ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(ability)}
                  className="text-xs"
                >
                  {ability} ({count})
                </Button>
              );
            })}
          </div>

          {/* Skills List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No skills match the current filter.</p>
              </div>
            ) : (
              filteredSkills.map((skill) => (
                <SkillRow
                  key={skill.key}
                  skillKey={skill.key}
                  skillName={skill.name}
                  ability={skill.ability}
                  abilityModifier={abilityModifiers[skill.ability]}
                  proficiencyLevel={skillProficiencies[skill.key] ?? 'none'}
                  proficiencyBonus={proficiencyBonus}
                  onProficiencyChange={
                    onSkillProficiencyChange
                      ? (level) => onSkillProficiencyChange(skill.key, level)
                      : undefined
                  }
                />
              ))
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-amber-200">
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gray-100"></span>
                <span>Not Proficient</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-[10px]">
                  ●
                </span>
                <span>Proficient</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-[10px]">
                  ★
                </span>
                <span>Expertise</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
