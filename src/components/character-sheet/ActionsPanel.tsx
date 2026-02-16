/**
 * ActionsPanel Component
 *
 * Displays character actions organized by type:
 * - Actions tab: attacks and class actions
 * - Bonus Actions tab
 * - Reactions tab
 *
 * Features:
 * - Display attack bonuses and damage for attacks
 * - Show limited-use action tracking
 * - Auto-populate equipped weapon attacks
 * - Add custom actions
 */

'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sword, Zap, Shield, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CharacterAction, ActionType } from '@/types/game';
import { formatModifier } from '@/lib/engine/ability-scores';

interface ActionsPanelProps {
  actions: CharacterAction[];
  onAddAction?: (action: Omit<CharacterAction, 'id'>) => void;
  onRemoveAction?: (actionId: string) => void;
  onUseAction?: (actionId: string) => void;
  className?: string;
}

type TabType = 'action' | 'bonus' | 'reaction';

/**
 * Action Card Component
 * Displays a single action with details
 */
function ActionCard({
  action,
  onRemove,
  onUse,
}: {
  action: CharacterAction;
  onRemove?: (id: string) => void;
  onUse?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isCustom = action.source === 'custom';
  const hasUses = action.uses !== undefined;
  const usesRemaining = hasUses ? action.uses!.max - action.uses!.used : 0;
  const isAvailable = !hasUses || usesRemaining > 0;

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-3 transition-colors',
        isAvailable
          ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300'
          : 'bg-gray-50 border-gray-300 opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-amber-900 truncate">{action.name}</h4>
            {!isAvailable && <span className="text-xs text-red-600 font-medium">(Used)</span>}
          </div>

          {/* Attack Details */}
          {action.isAttack && action.attackDetails && (
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="font-medium text-amber-800">
                {formatModifier(action.attackDetails.bonus)} to hit
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-red-700">
                {action.attackDetails.damage} {action.attackDetails.damageType}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-amber-700 text-xs">{action.attackDetails.range}</span>
            </div>
          )}

          {/* Uses */}
          {hasUses && (
            <div className="mt-1 text-xs font-medium text-amber-700">
              {usesRemaining} / {action.uses!.max} uses
              {action.uses!.resetOn !== 'other' && (
                <span className="text-gray-500 ml-1">(resets on {action.uses!.resetOn} rest)</span>
              )}
            </div>
          )}

          {/* Source Badge */}
          <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider">
            {action.source === 'weapon' && 'Weapon'}
            {action.source === 'feature' && 'Class Feature'}
            {action.source === 'spell' && 'Spell'}
            {action.source === 'custom' && 'Custom'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {hasUses && isAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUse?.(action.id)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 px-2 h-7 text-xs"
            >
              Use
            </Button>
          )}
          {isCustom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(action.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 h-7"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-amber-100 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Description */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-200 text-sm text-gray-700 animate-in slide-in-from-top-2 duration-200">
          {action.description}
          {action.isAttack &&
            action.attackDetails &&
            action.attackDetails.properties.length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-amber-800">Properties: </span>
                <span className="text-gray-600">{action.attackDetails.properties.join(', ')}</span>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/**
 * Add Custom Action Form
 */
function AddActionForm({
  actionType,
  onAdd,
  onCancel,
}: {
  actionType: ActionType;
  onAdd: (action: Omit<CharacterAction, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    onAdd({
      name: name.trim(),
      type: actionType,
      description: description.trim(),
      isAttack: false,
      source: 'custom',
    });

    setName('');
    setDescription('');
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
      <h4 className="font-bold text-amber-900 mb-3 uppercase text-sm">Add Custom Action</h4>
      <div className="space-y-3">
        <div>
          <label htmlFor="action-name" className="block text-sm font-medium text-amber-800 mb-1">
            Name
          </label>
          <Input
            id="action-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Action name..."
            className="border-amber-300"
          />
        </div>
        <div>
          <label
            htmlFor="action-description"
            className="block text-sm font-medium text-amber-800 mb-1"
          >
            Description
          </label>
          <textarea
            id="action-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this action do?"
            rows={3}
            className="w-full px-3 py-2 border-2 border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={!name.trim() || !description.trim()} className="flex-1">
            Add Action
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Main ActionsPanel Component
 */
export function ActionsPanel({
  actions,
  onAddAction,
  onRemoveAction,
  onUseAction,
  className,
}: ActionsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('action');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter actions by type
  const filteredActions = actions.filter((action) => action.type === activeTab);

  // Get icon for tab
  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'action':
        return <Sword className="w-4 h-4" />;
      case 'bonus':
        return <Zap className="w-4 h-4" />;
      case 'reaction':
        return <Shield className="w-4 h-4" />;
    }
  };

  // Tab configuration
  const tabs: { key: TabType; label: string }[] = [
    { key: 'action', label: 'Actions' },
    { key: 'bonus', label: 'Bonus Actions' },
    { key: 'reaction', label: 'Reactions' },
  ];

  return (
    <div
      className={cn('bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sword className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">
            Actions in Combat
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-amber-100 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setShowAddForm(false);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md',
              'font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'bg-white text-amber-900 shadow'
                : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
            )}
          >
            {getTabIcon(tab.key)}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-3 mb-4">
        {filteredActions.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No {activeTab}s available</p>
            <p className="text-xs mt-1">Add a custom action below</p>
          </div>
        )}

        {filteredActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onRemove={onRemoveAction}
            onUse={onUseAction}
          />
        ))}
      </div>

      {/* Add Action Form or Button */}
      {showAddForm ? (
        <AddActionForm
          actionType={activeTab}
          onAdd={(action) => onAddAction?.(action)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom{' '}
          {activeTab === 'action' ? 'Action' : activeTab === 'bonus' ? 'Bonus Action' : 'Reaction'}
        </Button>
      )}
    </div>
  );
}
