/**
 * ProficiencyBadge Component
 *
 * Displays and toggles proficiency level for skills and saves
 * Levels: none, proficient, expertise
 */

import React from 'react';

import { cn } from '@/lib/utils';

export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

interface ProficiencyBadgeProps {
  level: ProficiencyLevel;
  onChange?: (level: ProficiencyLevel) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

/**
 * Badge showing proficiency level with optional toggle
 */
export function ProficiencyBadge({
  level,
  onChange,
  size = 'md',
  className,
  disabled = false,
}: ProficiencyBadgeProps) {
  const handleClick = () => {
    if (disabled || !onChange) return;

    // Cycle through levels: none -> proficient -> expertise -> none
    const nextLevel: Record<ProficiencyLevel, ProficiencyLevel> = {
      none: 'proficient',
      proficient: 'expertise',
      expertise: 'none',
    };

    onChange(nextLevel[level]);
  };

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const levelConfig = {
    none: {
      bg: 'bg-gray-200',
      border: 'border-gray-300',
      icon: '',
      title: 'Not Proficient',
    },
    proficient: {
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
      icon: '●',
      title: 'Proficient',
    },
    expertise: {
      bg: 'bg-emerald-200',
      border: 'border-emerald-600',
      icon: '★',
      title: 'Expertise',
    },
  };

  const config = levelConfig[level];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !onChange}
      title={config.title}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'border-2 font-bold transition-all',
        sizeClasses[size],
        config.bg,
        config.border,
        onChange && !disabled && 'cursor-pointer hover:scale-110 hover:shadow-md',
        disabled && 'cursor-default opacity-60',
        className
      )}
    >
      <span className="text-emerald-800">{config.icon}</span>
    </button>
  );
}

interface SkillProficiencyProps {
  skillName: string;
  modifier: number;
  level: ProficiencyLevel;
  onLevelChange?: (level: ProficiencyLevel) => void;
  ability: string;
  className?: string;
}

/**
 * Skill row with proficiency badge and modifier
 */
export function SkillProficiency({
  skillName,
  modifier,
  level,
  onLevelChange,
  ability,
  className,
}: SkillProficiencyProps) {
  const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-1 px-2 rounded',
        'hover:bg-amber-50 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <ProficiencyBadge level={level} onChange={onLevelChange} size="sm" />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{skillName}</span>
          <span className="text-xs text-gray-500">({ability})</span>
        </div>
      </div>
      <span
        className={cn(
          'font-bold text-lg',
          modifier > 0 && 'text-emerald-700',
          modifier < 0 && 'text-red-600',
          modifier === 0 && 'text-gray-600'
        )}
      >
        {modifierText}
      </span>
    </div>
  );
}

interface SaveProficiencyProps {
  ability: string;
  modifier: number;
  isProficient: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Saving throw row with proficiency toggle
 */
export function SaveProficiency({
  ability,
  modifier,
  isProficient,
  onToggle,
  className,
}: SaveProficiencyProps) {
  const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 rounded',
        'hover:bg-amber-50 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!onToggle}
          className={cn(
            'w-4 h-4 rounded border-2 transition-all',
            isProficient ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300',
            onToggle && 'hover:scale-110 cursor-pointer',
            !onToggle && 'cursor-default'
          )}
          title={isProficient ? 'Proficient' : 'Not Proficient'}
        >
          {isProficient && (
            <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <span className="font-medium">{ability}</span>
      </div>
      <span
        className={cn(
          'font-bold text-xl',
          modifier > 0 && 'text-emerald-700',
          modifier < 0 && 'text-red-600',
          modifier === 0 && 'text-gray-600'
        )}
      >
        {modifierText}
      </span>
    </div>
  );
}

/**
 * Display proficiency bonus with label
 */
export function ProficiencyBonus({ bonus, className }: { bonus: number; className?: string }) {
  const text = bonus >= 0 ? `+${bonus}` : `${bonus}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="text-2xl font-bold text-amber-800">{text}</span>
      <span className="text-xs text-gray-600 uppercase tracking-wide">Proficiency</span>
    </div>
  );
}
