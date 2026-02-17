/**
 * FeaturesPanel Component
 *
 * Comprehensive features and traits management interface:
 * - Class features organized by level
 * - Species traits with descriptions from Open5E
 * - Background feature with description from Open5E
 * - Feats with descriptions from Open5E
 * - Expandable/collapsible descriptions for all features
 * - Track limited-use features (e.g., "Rage: 2/3")
 * - Add custom feature
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Swords,
  Users,
  Scroll,
  Star,
  Zap,
  Minus,
  RotateCcw,
} from 'lucide-react';
import type { CharacterFeature } from '@/types/game';

interface FeaturesPanelProps {
  features: CharacterFeature[];
  onFeatureUse?: (featureId: string) => void;
  onFeatureReset?: (featureId: string, resetType?: 'short' | 'long' | 'all') => void;
  onAddFeature?: (feature: CharacterFeature) => void;
  onRemoveFeature?: (featureId: string) => void;
  className?: string;
}

// Source type with icon and color
type FeatureSource = 'class' | 'species' | 'background' | 'feat' | 'custom';

interface SourceConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}

const SOURCE_CONFIG: Record<FeatureSource, SourceConfig> = {
  class: {
    icon: <Swords className="w-4 h-4" />,
    label: 'Class',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  species: {
    icon: <Users className="w-4 h-4" />,
    label: 'Species',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
  },
  background: {
    icon: <Scroll className="w-4 h-4" />,
    label: 'Background',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  feat: {
    icon: <Star className="w-4 h-4" />,
    label: 'Feat',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  custom: {
    icon: <Sparkles className="w-4 h-4" />,
    label: 'Custom',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
};

// Parse source string to get type and name
function parseSource(source: string): { type: FeatureSource; name: string } {
  const lowerSource = source.toLowerCase();
  if (lowerSource.startsWith('class:')) {
    return { type: 'class', name: source.replace(/^class:\s*/i, '') };
  } else if (lowerSource.startsWith('race:') || lowerSource.startsWith('species:')) {
    return { type: 'species', name: source.replace(/^(race|species):\s*/i, '') };
  } else if (lowerSource.startsWith('background:')) {
    return { type: 'background', name: source.replace(/^background:\s*/i, '') };
  } else if (lowerSource.startsWith('feat:')) {
    return { type: 'feat', name: source.replace(/^feat:\s*/i, '') };
  }
  return { type: 'custom', name: source };
}

// Feature card component
function FeatureCard({
  feature,
  onUse,
  onReset,
  onRemove,
}: {
  feature: CharacterFeature;
  onUse?: (id: string) => void;
  onReset?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { type, name: sourceName } = parseSource(feature.source);
  const config = SOURCE_CONFIG[type];

  const hasUses = feature.uses && feature.uses.max > 0;
  const remainingUses = hasUses ? feature.uses!.max - feature.uses!.used : 0;

  const handleUse = () => {
    if (hasUses && remainingUses > 0) {
      onUse?.(feature.id);
    }
  };

  const handleReset = () => {
    if (hasUses) {
      onReset?.(feature.id);
    }
  };

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-3 transition-all',
        config.bgColor,
        config.color.replace('text-', 'border-').replace('700', '300'),
        'bg-gradient-to-b from-white to-opacity-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {config.icon}
            <h4 className={cn('font-bold truncate', config.color)}>{feature.name}</h4>
            {feature.level && (
              <Badge variant="outline" className="text-[10px] h-5">
                Lvl {feature.level}
              </Badge>
            )}
          </div>

          {/* Source & Uses */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{sourceName}</span>

            {/* Limited Use Tracking */}
            {hasUses && (
              <div className="flex items-center gap-1">
                <Badge
                  variant={remainingUses > 0 ? 'default' : 'secondary'}
                  className={cn(
                    'text-[10px] h-5',
                    remainingUses === 0 && 'bg-red-100 text-red-700'
                  )}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {remainingUses}/{feature.uses!.max}
                </Badge>

                {/* Use/Reset Buttons */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleUse}
                        disabled={remainingUses === 0}
                        className={cn(
                          'w-5 h-5 flex items-center justify-center rounded text-xs transition-colors',
                          remainingUses > 0
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use feature</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="w-5 h-5 flex items-center justify-center rounded text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset uses</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Remove Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onRemove?.(feature.id)}
                  className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove feature</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Expand Button */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Description */}
      {expanded && (
        <div
          className={cn(
            'mt-3 pt-3 border-t text-sm animate-in slide-in-from-top-2 duration-200',
            config.color.replace('text-', 'border-').replace('700', '200')
          )}
        >
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{feature.description}</p>

          {feature.uses && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="font-medium">Reset:</span>{' '}
              {feature.uses.resetOn === 'short'
                ? 'Short Rest'
                : feature.uses.resetOn === 'long'
                  ? 'Long Rest'
                  : feature.uses.resetOn === 'dawn'
                    ? 'At Dawn'
                    : 'Special'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Add feature dialog
function AddFeatureDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (feature: Omit<CharacterFeature, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('custom');
  const [sourceName, setSourceName] = useState('');
  const [level, setLevel] = useState('');
  const [hasLimitedUses, setHasLimitedUses] = useState(false);
  const [maxUses, setMaxUses] = useState('1');
  const [resetOn, setResetOn] = useState<'short' | 'long' | 'dawn' | 'other'>('short');

  const sourceOptions = [
    { value: 'class', label: 'Class Feature', placeholder: 'e.g., Fighter' },
    { value: 'species', label: 'Species Trait', placeholder: 'e.g., Elf' },
    { value: 'background', label: 'Background Feature', placeholder: 'e.g., Soldier' },
    { value: 'feat', label: 'Feat', placeholder: 'e.g., Sharpshooter' },
    { value: 'custom', label: 'Custom', placeholder: 'Custom source' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const feature: Omit<CharacterFeature, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      source:
        source === 'custom'
          ? sourceName.trim() || 'Custom'
          : `${source.charAt(0).toUpperCase() + source.slice(1)}: ${sourceName.trim()}`,
      ...(level && { level: parseInt(level, 10) }),
      ...(hasLimitedUses && {
        uses: {
          max: parseInt(maxUses, 10) || 1,
          used: 0,
          resetOn,
        },
      }),
    };

    onAdd(feature);

    // Reset form
    setName('');
    setDescription('');
    setSourceName('');
    setLevel('');
    setHasLimitedUses(false);
    setMaxUses('1');
    onOpenChange(false);
  };

  const currentSource = sourceOptions.find((s) => s.value === source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Custom Feature
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feature Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Feature Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Action Surge"
              className="mt-1"
              required
            />
          </div>

          {/* Source Type & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Source Type</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Source Name</label>
              <Input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder={currentSource?.placeholder}
                className="mt-1"
              />
            </div>
          </div>

          {/* Level (for class features) */}
          {source === 'class' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Level Gained</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g., 2"
                className="mt-1"
              />
            </div>
          )}

          {/* Limited Use Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="limited-use"
              checked={hasLimitedUses}
              onChange={(e) => setHasLimitedUses(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="limited-use" className="text-sm font-medium text-gray-700">
              Limited Uses (e.g., Rage, Second Wind)
            </label>
          </div>

          {/* Limited Use Options */}
          {hasLimitedUses && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Max Uses</label>
                <Input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reset On</label>
                <select
                  value={resetOn}
                  onChange={(e) => setResetOn(e.target.value as typeof resetOn)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="short">Short Rest</option>
                  <option value="long">Long Rest</option>
                  <option value="dawn">At Dawn</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter feature description..."
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={!name.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main FeaturesPanel Component
export function FeaturesPanel({
  features,
  onFeatureUse,
  onFeatureReset,
  onAddFeature,
  onRemoveFeature,
  className,
}: FeaturesPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<FeatureSource | 'all'>('all');

  // Group features by source type
  const groupedFeatures = useMemo(() => {
    const groups: Record<FeatureSource, CharacterFeature[]> = {
      class: [],
      species: [],
      background: [],
      feat: [],
      custom: [],
    };

    features.forEach((feature) => {
      const { type } = parseSource(feature.source);
      groups[type].push(feature);
    });

    // Sort class features by level
    groups.class.sort((a, b) => (a.level || 0) - (b.level || 0));

    return groups;
  }, [features]);

  // Get filtered features
  const filteredFeatures = useMemo(() => {
    if (filter === 'all') return features;
    return groupedFeatures[filter];
  }, [features, filter, groupedFeatures]);

  // Count features by source
  const counts = useMemo(() => {
    return {
      all: features.length,
      class: groupedFeatures.class.length,
      species: groupedFeatures.species.length,
      background: groupedFeatures.background.length,
      feat: groupedFeatures.feat.length,
      custom: groupedFeatures.custom.length,
    };
  }, [features, groupedFeatures]);

  // Handle adding a new feature
  const handleAddFeature = (featureData: Omit<CharacterFeature, 'id'>) => {
    const newFeature: CharacterFeature = {
      ...featureData,
      id: `feature-${Date.now()}`,
    };
    onAddFeature?.(newFeature);
  };

  // Handle using a feature
  const handleUseFeature = (featureId: string) => {
    const feature = features.find((f) => f.id === featureId);
    if (feature?.uses && feature.uses.used < feature.uses.max) {
      onFeatureUse?.(featureId);
    }
  };

  // Handle resetting a feature
  const handleResetFeature = (featureId: string) => {
    onFeatureReset?.(featureId);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">
              Features & Traits
            </h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {features.length} {features.length === 1 ? 'feature' : 'features'}
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {(['all', 'class', 'species', 'background', 'feat', 'custom'] as const).map(
            (sourceType) => (
              <button
                key={sourceType}
                type="button"
                onClick={() => setFilter(sourceType)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                  filter === sourceType
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                )}
              >
                {sourceType === 'all' ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    All ({counts.all})
                  </>
                ) : (
                  <>
                    {SOURCE_CONFIG[sourceType].icon}
                    <span className="capitalize">{sourceType}</span>
                    <span className="opacity-75">({counts[sourceType]})</span>
                  </>
                )}
              </button>
            )
          )}
        </div>

        {/* Features List */}
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {filter === 'all' ? 'No features yet' : `No ${filter} features`}
              </p>
              <p className="text-xs mt-1">Add features using the button below</p>
            </div>
          ) : (
            filteredFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onUse={handleUseFeature}
                onReset={handleResetFeature}
                onRemove={onRemoveFeature}
              />
            ))
          )}
        </div>

        {/* Add Feature Button */}
        <Button
          variant="outline"
          onClick={() => setShowAddDialog(true)}
          className="w-full border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Feature
        </Button>

        {/* Add Feature Dialog */}
        <AddFeatureDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={handleAddFeature}
        />
      </div>
    </TooltipProvider>
  );
}

export type { FeaturesPanelProps };
