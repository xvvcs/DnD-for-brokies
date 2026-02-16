/**
 * CombatActionsPanel Component
 *
 * Unified panel for all combat-related actions and spellcasting.
 * Uses a tabbed interface to save space and organize content.
 *
 * Design:
 * - Uses TabbedPanel for reusable tab navigation
 * - Each section is a separate component (ActionsSection, SpellcastingSection)
 * - Easily expandable - add new sections by adding to tabs array
 * - Conditional sections (e.g., spellcasting only for casters)
 */

'use client';

import React from 'react';

import { Sword, Zap, Shield, Sparkles } from 'lucide-react';
import type { CharacterAction } from '@/types/game';
import type { Spellcasting } from '@/types/character';
import type { SpellLevel } from '@/types/game';
import type { Open5eSpell } from '@/types/open5e';

import { TabbedPanel, type TabDefinition } from './TabbedPanel';
import { ActionsSection } from './ActionsSection';
import { SpellcastingSection } from './SpellcastingSection';

interface CombatActionsPanelProps {
  // Actions props
  actions: CharacterAction[];
  onAddAction?: (action: Omit<CharacterAction, 'id'>) => void;
  onRemoveAction?: (actionId: string) => void;
  onUseAction?: (actionId: string) => void;

  // Spellcasting props
  spellcasting?: Spellcasting | null;
  primaryClassKey?: string;
  onSpellSlotUse?: (level: SpellLevel, isUsed: boolean) => void;
  onSpellTogglePrepared?: (spellKey: string) => void;
  onAddSpell?: (spell: Open5eSpell) => void;
  onRemoveSpell?: (spellKey: string) => void;
}

export function CombatActionsPanel({
  actions,
  onAddAction,
  onRemoveAction,
  onUseAction,
  spellcasting,
  primaryClassKey = '',
  onSpellSlotUse,
  onSpellTogglePrepared,
  onAddSpell,
  onRemoveSpell,
}: CombatActionsPanelProps) {
  // Build tabs array
  const tabs: TabDefinition[] = [
    {
      key: 'actions',
      label: 'Actions',
      icon: <Sword className="w-4 h-4" />,
      content: (
        <ActionsSection
          actions={actions}
          actionType="action"
          onAddAction={onAddAction}
          onRemoveAction={onRemoveAction}
          onUseAction={onUseAction}
        />
      ),
    },
    {
      key: 'bonus',
      label: 'Bonus',
      icon: <Zap className="w-4 h-4" />,
      content: (
        <ActionsSection
          actions={actions}
          actionType="bonus"
          onAddAction={onAddAction}
          onRemoveAction={onRemoveAction}
          onUseAction={onUseAction}
        />
      ),
    },
    {
      key: 'reactions',
      label: 'Reactions',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <ActionsSection
          actions={actions}
          actionType="reaction"
          onAddAction={onAddAction}
          onRemoveAction={onRemoveAction}
          onUseAction={onUseAction}
        />
      ),
    },
  ];

  // Conditionally add spellcasting tab if character has spellcasting
  if (spellcasting) {
    tabs.push({
      key: 'spellcasting',
      label: 'Spells',
      icon: <Sparkles className="w-4 h-4" />,
      content: (
        <SpellcastingSection
          spellcasting={spellcasting}
          primaryClassKey={primaryClassKey}
          onSpellSlotUse={onSpellSlotUse}
          onSpellTogglePrepared={onSpellTogglePrepared}
          onAddSpell={onAddSpell}
          onRemoveSpell={onRemoveSpell}
        />
      ),
    });
  }

  return <TabbedPanel title="Combat Actions" tabs={tabs} defaultTab="actions" />;
}
