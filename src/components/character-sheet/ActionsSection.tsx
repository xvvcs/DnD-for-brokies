/**
 * ActionsSection Component
 *
 * Displays actions organized by action type (actions, bonus actions, reactions)
 * Extracted from CombatActionsPanel for better separation of concerns
 */

'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CharacterAction, ActionType } from '@/types/game';
import { formatModifier } from '@/lib/engine/ability-scores';

interface ActionsSectionProps {
  actions: CharacterAction[];
  actionType: ActionType;
  onAddAction?: (action: Omit<CharacterAction, 'id'>) => void;
  onRemoveAction?: (actionId: string) => void;
  onUseAction?: (actionId: string) => void;
}

/**
 * Action Card Component
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-amber-900 truncate">{action.name}</h4>
            {!isAvailable && <span className="text-xs text-red-600 font-medium">(Used)</span>}
          </div>

          {action.isAttack && action.attackDetails && (
            <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
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

          {hasUses && (
            <div className="mt-1 text-xs font-medium text-amber-700">
              {usesRemaining} / {action.uses!.max} uses
              {action.uses!.resetOn !== 'other' && (
                <span className="text-gray-500 ml-1">(resets on {action.uses!.resetOn} rest)</span>
              )}
            </div>
          )}

          <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider">
            {action.source === 'weapon' && 'Weapon'}
            {action.source === 'feature' && 'Class Feature'}
            {action.source === 'spell' && 'Spell'}
            {action.source === 'custom' && 'Custom'}
          </div>
        </div>

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
            onClick={() => setExpanded(!expanded)}
            className="text-amber-700 hover:text-amber-900 p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && action.description && (
        <div className="mt-3 pt-3 border-t border-amber-200 text-sm text-gray-700">
          {action.description}
        </div>
      )}
    </div>
  );
}

/**
 * Add Action Interface Component
 */
function AddActionInterface({
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

  const handleSubmit = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      description: description.trim() || '',
      type: actionType,
      source: 'custom',
      isAttack: false,
    });

    setName('');
    setDescription('');
    onCancel();
  };

  return (
    <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50">
      <h4 className="font-bold text-amber-900 mb-3">Add Custom Action</h4>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dash, Disengage, Grapple"
            className="w-full px-3 py-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this action does..."
            className="w-full px-3 py-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={3}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Add Action
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ActionsSection Main Component
 */
export function ActionsSection({
  actions,
  actionType,
  onAddAction,
  onRemoveAction,
  onUseAction,
}: ActionsSectionProps) {
  const [showAddAction, setShowAddAction] = useState(false);

  const filteredActions = actions.filter((a) => a.type === actionType);

  return (
    <div className="space-y-3">
      {/* Actions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onRemove={onRemoveAction}
            onUse={onUseAction}
          />
        ))}

        {filteredActions.length === 0 && !showAddAction && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No actions available</p>
          </div>
        )}
      </div>

      {/* Add Action Interface */}
      {showAddAction ? (
        <AddActionInterface
          actionType={actionType}
          onAdd={(action) => {
            onAddAction?.(action);
            setShowAddAction(false);
          }}
          onCancel={() => setShowAddAction(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddAction(true)}
          className="w-full border-dashed border-2 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Custom Action
        </Button>
      )}
    </div>
  );
}
