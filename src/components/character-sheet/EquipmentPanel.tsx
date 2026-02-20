/**
 * EquipmentPanel Component
 *
 * Comprehensive equipment and inventory management interface:
 * - Equipped items section (weapon, armor, shield)
 * - Equip/unequip toggle
 * - Backpack/inventory list
 * - Add item from Open5E database (searchable dropdown)
 * - Display item descriptions from Open5E
 * - Add custom item form
 * - Minimalistic embedded currency tracker (CP, SP, EP, GP, PP)
 * - Magic item attunement tracking
 * - Optional encumbrance display
 */

'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { useWeapons, useArmor, useItems, useMagicItems, useEquipment } from '@/hooks/api/useOpen5e';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Backpack,
  Sword,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Coins,
  Weight,
  Sparkles,
  Check,
} from 'lucide-react';
import type { EquipmentItem, Currency } from '@/types/game';
import type { Open5eItem, Open5eWeapon, Open5eArmor } from '@/types/open5e';

/** Open5E v2 API may return { name, key, url } objects instead of strings. Extract display string. */
function toDisplayString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'name' in val)
    return String((val as { name: string }).name);
  return '';
}

function getPropertyName(prop: unknown): string {
  if (typeof prop === 'string') return prop;
  if (prop && typeof prop === 'object') {
    if ('property' in prop) {
      const inner = (prop as Record<string, unknown>).property;
      if (inner && typeof inner === 'object' && 'name' in inner) {
        return String(inner.name);
      }
    }
    if ('name' in prop) return String((prop as Record<string, unknown>).name);
  }
  return '';
}

/** Extract brief essentials from an Open5E item for list display. */
function getItemEssentials(item: Open5eItem): string {
  const parts: string[] = [];
  const weapon = item as Open5eWeapon;
  const armor = item as Open5eArmor;

  if (weapon.damage_dice && weapon.damage_type) {
    parts.push(`${weapon.damage_dice} ${toDisplayString(weapon.damage_type)}`);
  }
  if (armor.armor_class != null) {
    parts.push(`AC ${armor.armor_class}`);
  }
  if (item.properties && item.properties.length > 0) {
    parts.push(item.properties.map(getPropertyName).filter(Boolean).slice(0, 3).join(', '));
  }
  if (parts.length > 0) return parts.join(' • ');

  // Fallback: first sentence of description, max ~80 chars
  const descRaw = (item as unknown as Record<string, unknown>).desc || item.description || '';
  const desc = String(descRaw).trim();
  if (!desc) return '';
  const firstSentence = desc.split(/[.!?]/)[0]?.trim() ?? '';
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}...` : firstSentence;
}

// Extended EquipmentItem with additional fields for the UI
interface ExtendedEquipmentItem extends EquipmentItem {
  description?: string;
  weight?: string;
  cost?: string;
  isMagicItem?: boolean;
  requiresAttunement?: boolean;
  attuned?: boolean;
  category?: string;
  damageDice?: string;
  damageType?: string;
  armorClass?: number;
  armorCategory?: string;
  properties?: string[];
}

interface EquipmentPanelProps {
  inventory: ExtendedEquipmentItem[];
  currency: Currency;
  documentKeys: string[];
  onInventoryChange?: (inventory: ExtendedEquipmentItem[]) => void;
  onCurrencyChange?: (currency: Currency) => void;
  showEncumbrance?: boolean;
  strengthScore?: number;
  className?: string;
}

// Currency display component
function CurrencyTracker({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange?: (currency: Currency) => void;
}) {
  const [localCurrency, setLocalCurrency] = useState<Currency>(currency);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (type: keyof Currency, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const newCurrency = { ...localCurrency, [type]: Math.max(0, numValue) };
    setLocalCurrency(newCurrency);
  };

  const handleSave = () => {
    onChange?.(localCurrency);
    setIsEditing(false);
  };

  const currencyTypes: { key: keyof Currency; label: string; color: string }[] = [
    { key: 'cp', label: 'CP', color: 'text-amber-600' },
    { key: 'sp', label: 'SP', color: 'text-gray-500' },
    { key: 'ep', label: 'EP', color: 'text-amber-500' },
    { key: 'gp', label: 'GP', color: 'text-yellow-500' },
    { key: 'pp', label: 'PP', color: 'text-slate-400' },
  ];

  const totalGP =
    currency.cp / 100 + currency.sp / 10 + currency.ep / 2 + currency.gp + currency.pp * 10;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-600" />
          <h4 className="font-bold text-amber-900 uppercase text-xs">Currency</h4>
        </div>
        <span className="text-xs text-amber-700">≈ {totalGP.toFixed(2)} gp</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1">
            {currencyTypes.map(({ key, label }) => (
              <div key={key} className="text-center">
                <label className="text-[10px] font-bold text-amber-700 block mb-1">{label}</label>
                <Input
                  type="number"
                  min="0"
                  value={localCurrency[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="h-7 text-center text-sm p-1"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1 h-7 text-xs"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="flex-1 h-7 text-xs">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setLocalCurrency(currency);
            setIsEditing(true);
          }}
          className="w-full grid grid-cols-5 gap-1 hover:bg-amber-100/50 rounded transition-colors p-1"
        >
          {currencyTypes.map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <span className="text-[10px] font-bold text-amber-700 block">{label}</span>
              <span className={cn('text-sm font-bold', color)}>{currency[key]}</span>
            </div>
          ))}
        </button>
      )}
    </div>
  );
}

// Item card component
function ItemCard({
  item,
  onToggleEquipped,
  onToggleAttuned,
  onRemove,
  onUpdateQuantity,
}: {
  item: ExtendedEquipmentItem;
  onToggleEquipped?: (id: string) => void;
  onToggleAttuned?: (id: string) => void;
  onRemove?: (id: string) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getItemIcon = () => {
    const cat = toDisplayString(item.category);
    if (cat.toLowerCase().includes('weapon')) return <Sword className="w-4 h-4" />;
    if (cat.toLowerCase().includes('armor') || cat.toLowerCase().includes('shield')) {
      return <Shield className="w-4 h-4" />;
    }
    return <Backpack className="w-4 h-4" />;
  };

  const getItemColor = () => {
    if (item.isMagicItem)
      return 'text-purple-600 border-purple-300 bg-gradient-to-b from-purple-50 to-white';
    if (item.equipped)
      return 'text-emerald-700 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white';
    return 'text-amber-700 border-amber-300 bg-gradient-to-b from-amber-50 to-white';
  };

  return (
    <div className={cn('border-2 rounded-lg p-3', getItemColor())}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {getItemIcon()}
            <h4
              className={cn(
                'font-bold truncate',
                item.isMagicItem ? 'text-purple-900' : 'text-amber-900'
              )}
            >
              {item.name}
            </h4>
            {item.isMagicItem && <Sparkles className="w-3 h-3 text-purple-500" />}
          </div>

          {/* Item Details */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {toDisplayString(item.category) && (
              <Badge variant="outline" className="text-[10px] h-5">
                {toDisplayString(item.category)}
              </Badge>
            )}
            {item.damageDice && (
              <Badge variant="outline" className="text-[10px] h-5 bg-red-50">
                {item.damageDice} {toDisplayString(item.damageType)}
              </Badge>
            )}
            {item.armorClass && (
              <Badge variant="outline" className="text-[10px] h-5 bg-blue-50">
                AC {item.armorClass}
              </Badge>
            )}
            {item.weight && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Weight className="w-3 h-3" />
                {item.weight}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              type="button"
              onClick={() => onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
            >
              -
            </button>
            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
            >
              +
            </button>
          </div>

          {/* Equip Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggleEquipped?.(item.id)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    item.equipped
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'hover:bg-gray-200 text-gray-400'
                  )}
                >
                  <Check className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.equipped ? 'Equipped' : 'Not equipped'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Attunement Toggle */}
          {item.requiresAttunement && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onToggleAttuned?.(item.id)}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      item.attuned
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'hover:bg-gray-200 text-gray-400'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.attuned ? 'Attuned' : 'Requires attunement'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => onRemove?.(item.id)}
            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Expand Button */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
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
      {expanded && item.description && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
          {item.properties && item.properties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.properties.map((prop, idx) => {
                const propStr = getPropertyName(prop);
                if (!propStr) return null;
                return (
                  <Badge key={`${propStr}-${idx}`} variant="secondary" className="text-[10px]">
                    {propStr}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type EquipmentTab = 'weapons' | 'armor' | 'items' | 'magicItems' | 'custom';

// Add item dialog component
function AddItemDialog({
  open,
  onOpenChange,
  onAddItem,
  documentKeys,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: Partial<ExtendedEquipmentItem>) => void;
  documentKeys: string[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Open5eItem | null>(null);
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    category: 'Adventuring Gear',
    weight: '',
  });
  const [activeTab, setActiveTab] = useState<EquipmentTab>('weapons');
  const [visibleCount, setVisibleCount] = useState(50);

  // We handle search term and tab resets without useEffect to avoid cascading renders
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedItem(null);
    setVisibleCount(50);
  };

  const handleTabChange = (tab: EquipmentTab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    setSearchTerm('');
    setVisibleCount(50);
  };

  const weaponsQuery = useWeapons(documentKeys, {
    enabled: open && activeTab === 'weapons' && documentKeys.length > 0,
  });
  const armorQuery = useArmor(documentKeys, {
    enabled: open && activeTab === 'armor' && documentKeys.length > 0,
  });
  const itemsQuery = useItems(documentKeys, {
    enabled: open && activeTab === 'items' && documentKeys.length > 0,
  });
  const magicItemsQuery = useMagicItems(documentKeys, {
    enabled: open && activeTab === 'magicItems' && documentKeys.length > 0,
  });

  const currentQuery = (() => {
    switch (activeTab) {
      case 'weapons':
        return weaponsQuery;
      case 'armor':
        return armorQuery;
      case 'items':
        return itemsQuery;
      case 'magicItems':
        return magicItemsQuery;
      default:
        return {
          data: [] as Open5eItem[],
          isLoading: false,
          isError: false,
          error: null,
          refetch: () => Promise.resolve(),
        };
    }
  })();
  const availableItems = useMemo(() => {
    const data = (currentQuery.data ?? []) as Open5eItem[];
    const seen = new Set<string>();
    return data.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }, [currentQuery.data]);
  const {
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    error: errorCurrent,
    refetch: refetchCurrent,
  } = currentQuery;

  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems;
    const term = searchTerm.toLowerCase();
    return availableItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        toDisplayString(item.type).toLowerCase().includes(term) ||
        toDisplayString(item.category).toLowerCase().includes(term)
    );
  }, [searchTerm, availableItems]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        setVisibleCount((prev) => {
          if (prev < filteredItems.length) {
            return Math.min(prev + 50, filteredItems.length);
          }
          return prev;
        });
      }
    },
    [filteredItems.length]
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

  const handleAddFromDatabase = () => {
    if (!selectedItem) return;

    const descRaw =
      (selectedItem as unknown as Record<string, unknown>).desc || selectedItem.description || '';
    const description = String(descRaw).trim();
    const properties = selectedItem.properties
      ? selectedItem.properties.map(getPropertyName).filter(Boolean)
      : [];

    const newItem: Partial<ExtendedEquipmentItem> = {
      name: selectedItem.name,
      quantity: 1,
      equipped: false,
      itemKey: selectedItem.key,
      description: description,
      weight: selectedItem.weight || undefined,
      cost: selectedItem.cost,
      category: toDisplayString(selectedItem.category || selectedItem.type) || undefined,
      isMagicItem: toDisplayString(selectedItem.type).toLowerCase().includes('magic'),
      requiresAttunement: description.toLowerCase().includes('requires attunement'),
      damageDice: (selectedItem as Open5eWeapon).damage_dice || undefined,
      damageType: toDisplayString((selectedItem as Open5eWeapon).damage_type) || undefined,
      armorClass: (selectedItem as Open5eArmor).armor_class ?? undefined,
      armorCategory: toDisplayString((selectedItem as Open5eArmor).armor_category) || undefined,
      properties,
    };

    onAddItem(newItem);
    setSelectedItem(null);
    setSearchTerm('');
    onOpenChange(false);
  };

  const handleAddCustom = () => {
    if (!customItem.name.trim()) return;

    const newItem: Partial<ExtendedEquipmentItem> = {
      name: customItem.name,
      quantity: 1,
      equipped: false,
      description: customItem.description,
      weight: customItem.weight || undefined,
      category: customItem.category,
    };

    onAddItem(newItem);
    setCustomItem({ name: '', description: '', category: 'Adventuring Gear', weight: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Item to Inventory
          </DialogTitle>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['weapons', 'armor', 'items', 'magicItems', 'custom'] as const).map((tab) => {
            const tabLabel: Record<EquipmentTab, string> = {
              weapons: 'Weapons',
              armor: 'Armor',
              items: 'Items',
              magicItems: 'Magic Items',
              custom: 'Custom Item',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  'py-2 px-3 rounded-lg font-medium text-sm transition-colors',
                  activeTab === tab
                    ? 'bg-amber-100 text-amber-900 border-2 border-amber-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tabLabel[tab]}
              </button>
            );
          })}
        </div>

        {activeTab !== 'custom' ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={handleSearchTermChange}
                placeholder="Search items by name, type, or category..."
                className="pl-9"
              />
            </div>

            {/* Error state */}
            {isErrorCurrent && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-3">
                Failed to load {activeTab}. {errorCurrent?.message}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => refetchCurrent()}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Results */}
            <Command className="flex-1 border rounded-lg overflow-hidden">
              <CommandList className="max-h-none">
                <CommandEmpty>
                  {isLoadingCurrent ? 'Loading items...' : 'No items found.'}
                </CommandEmpty>
                <CommandGroup>
                  {visibleItems.map((item) => {
                    const essentials = getItemEssentials(item);
                    return (
                      <CommandItem
                        key={item.key}
                        value={item.key}
                        onSelect={() => setSelectedItem(item)}
                        className={cn(
                          'cursor-pointer py-2',
                          selectedItem?.key === item.key && 'bg-amber-100'
                        )}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-gray-500">
                                {toDisplayString(item.category) || toDisplayString(item.type)}
                              </span>
                            </div>
                            {essentials && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                {essentials}
                              </p>
                            )}
                          </div>
                          {selectedItem?.key === item.key && (
                            <Check className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                  {/* Invisible div for intersection observer to trigger loading more items */}
                  {visibleCount < filteredItems.length && (
                    <div ref={observerTarget} className="h-4 w-full" />
                  )}
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Selected Item Preview */}
            {selectedItem && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                <h4 className="font-bold text-amber-900">{selectedItem.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                  {String(
                    (selectedItem as unknown as Record<string, unknown>).desc ||
                      selectedItem.description ||
                      ''
                  ).trim()}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  {selectedItem.cost && <span>Cost: {selectedItem.cost}</span>}
                  {selectedItem.weight && <span>Weight: {selectedItem.weight}</span>}
                </div>
              </div>
            )}

            {/* Add Button */}
            <Button
              onClick={handleAddFromDatabase}
              disabled={!selectedItem}
              className="mt-3 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Inventory
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Item Name *</label>
              <Input
                value={customItem.name}
                onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                placeholder="Enter item name..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Input
                value={customItem.category}
                onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                placeholder="e.g., Adventuring Gear, Tool, etc."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Weight</label>
              <Input
                value={customItem.weight}
                onChange={(e) => setCustomItem({ ...customItem, weight: e.target.value })}
                placeholder="e.g., 2 lb."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={customItem.description}
                onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                placeholder="Enter item description..."
                rows={4}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <Button onClick={handleAddCustom} disabled={!customItem.name.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Item
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Encumbrance calculator
function calculateEncumbrance(inventory: ExtendedEquipmentItem[], strengthScore: number = 10) {
  const totalWeight = inventory.reduce((sum, item) => {
    const weightMatch = item.weight?.match(/(\d+(?:\.\d+)?)/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    return sum + weight * item.quantity;
  }, 0);

  const carryingCapacity = strengthScore * 15;
  const encumbered = strengthScore * 5;
  const heavilyEncumbered = strengthScore * 10;

  let status: 'light' | 'encumbered' | 'heavily' | 'exceeded' = 'light';
  if (totalWeight > carryingCapacity) {
    status = 'exceeded';
  } else if (totalWeight > heavilyEncumbered) {
    status = 'heavily';
  } else if (totalWeight > encumbered) {
    status = 'encumbered';
  }

  return {
    totalWeight: Math.round(totalWeight * 10) / 10,
    carryingCapacity,
    encumbered,
    heavilyEncumbered,
    status,
  };
}

// Encumbrance display
function EncumbranceDisplay({
  inventory,
  strengthScore,
}: {
  inventory: ExtendedEquipmentItem[];
  strengthScore: number;
}) {
  const encumbrance = calculateEncumbrance(inventory, strengthScore);

  const statusColors = {
    light: 'text-emerald-600 bg-emerald-50 border-emerald-300',
    encumbered: 'text-yellow-600 bg-yellow-50 border-yellow-300',
    heavily: 'text-orange-600 bg-orange-50 border-orange-300',
    exceeded: 'text-red-600 bg-red-50 border-red-300',
  };

  const statusLabels = {
    light: 'Unencumbered',
    encumbered: 'Encumbered',
    heavily: 'Heavily Encumbered',
    exceeded: 'Over Capacity',
  };

  const percentage = Math.min(100, (encumbrance.totalWeight / encumbrance.carryingCapacity) * 100);

  return (
    <div className={cn('border-2 rounded-lg p-3', statusColors[encumbrance.status])}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Weight className="w-4 h-4" />
          <h4 className="font-bold uppercase text-xs">Encumbrance</h4>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {statusLabels[encumbrance.status]}
        </Badge>
      </div>

      {/* Weight Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'absolute h-full transition-all duration-300',
            encumbrance.status === 'light' && 'bg-emerald-500',
            encumbrance.status === 'encumbered' && 'bg-yellow-500',
            encumbrance.status === 'heavily' && 'bg-orange-500',
            encumbrance.status === 'exceeded' && 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Weight Details */}
      <div className="flex justify-between text-xs">
        <span>
          {encumbrance.totalWeight} / {encumbrance.carryingCapacity} lb.
        </span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// Equipped items section
function EquippedItemsSection({
  equippedItems,
  onUnequip,
}: {
  equippedItems: ExtendedEquipmentItem[];
  onUnequip?: (id: string) => void;
}) {
  if (equippedItems.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <Sword className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No items equipped</p>
        <p className="text-xs mt-1">Equip items from your backpack</p>
      </div>
    );
  }

  // Helper to render description with bold important info
  const renderDescription = (item: ExtendedEquipmentItem) => {
    if (!item.description) return null;

    // Build a summary line with key stats
    const parts: string[] = [];

    if (item.damageDice) {
      const dt = toDisplayString(item.damageType);
      parts.push(`${item.damageDice}${dt ? ` ${dt}` : ''}`);
    }
    if (item.armorClass) {
      parts.push(`AC ${item.armorClass}`);
    }
    if (item.properties && item.properties.length > 0) {
      parts.push(item.properties.map(getPropertyName).filter(Boolean).join(', '));
    }

    return (
      <div className="mt-1 text-[10px] leading-tight text-emerald-800/80 max-h-16 overflow-y-auto">
        {parts.length > 0 && (
          <div className="font-bold text-emerald-900 mb-0.5">{parts.join(' • ')}</div>
        )}
        <p className="text-emerald-700/70 italic">{item.description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {equippedItems.map((item) => (
        <div key={item.id} className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {toDisplayString(item.category).toLowerCase().includes('weapon') ? (
                <Sword className="w-4 h-4 text-emerald-600" />
              ) : toDisplayString(item.category).toLowerCase().includes('armor') ||
                toDisplayString(item.category).toLowerCase().includes('shield') ? (
                <Shield className="w-4 h-4 text-emerald-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600" />
              )}
              <span className="font-bold text-emerald-900">{item.name}</span>
              {item.isMagicItem && <Sparkles className="w-3 h-3 text-purple-500" />}
            </div>
            <button
              type="button"
              onClick={() => onUnequip?.(item.id)}
              className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline px-2 py-1"
            >
              Unequip
            </button>
          </div>
          {renderDescription(item)}
        </div>
      ))}
    </div>
  );
}

// Main EquipmentPanel Component
export function EquipmentPanel({
  inventory,
  currency,
  documentKeys,
  onInventoryChange,
  onCurrencyChange,
  showEncumbrance = false,
  strengthScore = 10,
  className,
}: EquipmentPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    equipped: true,
    inventory: true,
  });

  // Prefetch all equipment in the background to warm up IndexedDB cache
  // This makes opening the Add Item dialog feel instantaneous for subsequent uses
  useEquipment(documentKeys, {
    enabled: documentKeys.length > 0,
    staleTime: 60 * 60 * 1000,
  });

  const equippedItems = inventory.filter((item) => item.equipped);
  const backpackItems = inventory.filter((item) => !item.equipped);

  const handleAddItem = (newItem: Partial<ExtendedEquipmentItem>) => {
    const item: ExtendedEquipmentItem = {
      ...newItem,
      id: crypto.randomUUID(),
      name: newItem.name || 'Unknown Item',
      quantity: newItem.quantity || 1,
      equipped: newItem.equipped || false,
    };

    onInventoryChange?.([...inventory, item]);
  };

  const handleToggleEquipped = (id: string) => {
    const updated = inventory.map((item) =>
      item.id === id ? { ...item, equipped: !item.equipped } : item
    );
    onInventoryChange?.(updated);
  };

  const handleToggleAttuned = (id: string) => {
    const updated = inventory.map((item) =>
      item.id === id ? { ...item, attuned: !item.attuned } : item
    );
    onInventoryChange?.(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = inventory.filter((item) => item.id !== id);
    onInventoryChange?.(updated);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const updated = inventory.map((item) => (item.id === id ? { ...item, quantity } : item));
    onInventoryChange?.(updated);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
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
            <Backpack className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">Equipment</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {inventory.length} {inventory.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {/* Currency Tracker */}
        <div className="mb-4">
          <CurrencyTracker currency={currency} onChange={onCurrencyChange} />
        </div>

        {/* Encumbrance (optional) */}
        {showEncumbrance && (
          <div className="mb-4">
            <EncumbranceDisplay inventory={inventory} strengthScore={strengthScore} />
          </div>
        )}

        {/* Equipped Items Section */}
        <div className="mb-4 border-2 border-amber-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('equipped')}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-emerald-700" />
              <h4 className="font-bold text-emerald-900 uppercase text-sm">Equipped</h4>
              <Badge variant="outline" className="text-[10px] bg-emerald-200">
                {equippedItems.length}
              </Badge>
            </div>
            {expandedSections.equipped ? (
              <ChevronUp className="w-5 h-5 text-emerald-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-emerald-700" />
            )}
          </button>

          {expandedSections.equipped && (
            <div className="p-3">
              <EquippedItemsSection
                equippedItems={equippedItems}
                onUnequip={handleToggleEquipped}
              />
            </div>
          )}
        </div>

        {/* Backpack/Inventory Section */}
        <div className="mb-4 border-2 border-amber-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('inventory')}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Backpack className="w-5 h-5 text-amber-700" />
              <h4 className="font-bold text-amber-900 uppercase text-sm">Backpack</h4>
              <Badge variant="outline" className="text-[10px] bg-amber-200">
                {backpackItems.length}
              </Badge>
            </div>
            {expandedSections.inventory ? (
              <ChevronUp className="w-5 h-5 text-amber-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-700" />
            )}
          </button>

          {expandedSections.inventory && (
            <div className="p-3 space-y-2">
              {backpackItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Backpack className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Your backpack is empty</p>
                  <p className="text-xs mt-1">Add items using the button below</p>
                </div>
              ) : (
                backpackItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleEquipped={handleToggleEquipped}
                    onToggleAttuned={handleToggleAttuned}
                    onRemove={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Item Button */}
        <Button
          variant="outline"
          onClick={() => setShowAddDialog(true)}
          className="w-full border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>

        {/* Add Item Dialog - only mount when open to avoid lag from query hooks */}
        {showAddDialog && (
          <AddItemDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAddItem={handleAddItem}
            documentKeys={documentKeys}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export type { ExtendedEquipmentItem };
export { CurrencyTracker, calculateEncumbrance };
