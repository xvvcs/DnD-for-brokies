/**
 * HPTracker Component
 *
 * Comprehensive HP management interface:
 * - Large HP display (current/max)
 * - Temp HP display
 * - Visual HP bar with color coding (green >50%, yellow 25-50%, red <25%)
 * - Quick +/- buttons for common values (1, 5, 10)
 * - Custom damage/heal input
 * - Death save mode UI (when HP = 0)
 * - Recent HP changes log (last 5 changes)
 */

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Shield, Skull, Plus, Minus, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface HPChange {
  id: string;
  amount: number;
  type: 'damage' | 'healing' | 'temp';
  timestamp: Date;
  reason?: string;
}

interface HPTrackerProps {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onHpChange?: (current: number, temp: number) => void;
  onDamage?: (amount: number) => void;
  onHeal?: (amount: number) => void;
  onTempHpChange?: (amount: number) => void;
  className?: string;
}

/**
 * Main HP Tracker Component
 */
export function HPTracker({
  currentHp,
  maxHp,
  tempHp,
  onHpChange,
  onDamage,
  onHeal,
  onTempHpChange,
  className,
}: HPTrackerProps) {
  const [customInput, setCustomInput] = useState('');
  const [tempHpInput, setTempHpInput] = useState('');
  const [hpChangeLog, setHpChangeLog] = useState<HPChange[]>([]);
  const [changeCounter, setChangeCounter] = useState(0);
  const [showRecentChanges, setShowRecentChanges] = useState(true);

  // Calculate HP percentage for color coding
  const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
  const totalHp = currentHp + tempHp;

  // Determine HP bar color based on percentage
  const getHpBarColor = (): string => {
    if (hpPercentage > 50) return 'bg-emerald-500';
    if (hpPercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle damage application
  const applyDamage = (amount: number) => {
    if (amount <= 0) return;

    let remainingDamage = amount;
    let newTempHp = tempHp;
    let newCurrentHp = currentHp;

    // Apply to temp HP first
    if (tempHp > 0) {
      if (tempHp >= remainingDamage) {
        newTempHp = tempHp - remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= tempHp;
        newTempHp = 0;
      }
    }

    // Apply remaining damage to current HP
    if (remainingDamage > 0) {
      newCurrentHp = Math.max(0, currentHp - remainingDamage);
    }

    onHpChange?.(newCurrentHp, newTempHp);
    onDamage?.(amount);

    // Log the change
    setChangeCounter((prev) => prev + 1);
    addHpChangeLog({
      id: `change-${changeCounter}`,
      amount: -amount,
      type: 'damage',
      timestamp: new Date(),
    });
  };

  // Handle healing application
  const applyHealing = (amount: number) => {
    if (amount <= 0) return;

    const newCurrentHp = Math.min(maxHp, currentHp + amount);
    onHpChange?.(newCurrentHp, tempHp);
    onHeal?.(amount);

    // Log the change
    setChangeCounter((prev) => prev + 1);
    addHpChangeLog({
      id: `change-${changeCounter}`,
      amount: +amount,
      type: 'healing',
      timestamp: new Date(),
    });
  };

  // Handle temp HP
  const applyTempHp = (amount: number) => {
    if (amount <= 0) return;

    // Temp HP doesn't stack - take higher value
    const newTempHp = Math.max(tempHp, amount);
    onTempHpChange?.(newTempHp);

    // Log the change
    setChangeCounter((prev) => prev + 1);
    addHpChangeLog({
      id: `change-${changeCounter}`,
      amount: newTempHp - tempHp,
      type: 'temp',
      timestamp: new Date(),
    });
  };

  // Add to HP change log (keep last 5)
  const addHpChangeLog = (change: HPChange) => {
    setHpChangeLog((prev) => [change, ...prev].slice(0, 5));
  };

  // Handle custom input submission
  const handleCustomSubmit = (isDamage: boolean) => {
    const value = parseInt(customInput, 10);
    if (isNaN(value) || value <= 0) return;

    if (isDamage) {
      applyDamage(value);
    } else {
      applyHealing(value);
    }

    setCustomInput('');
  };

  // Handle temp HP input submission
  const handleTempHpSubmit = () => {
    const value = parseInt(tempHpInput, 10);
    if (isNaN(value) || value <= 0) return;

    applyTempHp(value);
    setTempHpInput('');
  };

  return (
    <div
      className={cn('bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">Hit Points</h3>
        </div>
        <div className="text-sm font-medium text-amber-700">
          {totalHp} / {maxHp}
        </div>
      </div>

      {/* Large HP Display */}
      <div className="mb-4 p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-bold text-red-900">{currentHp}</span>
          <span className="text-2xl text-gray-500">/</span>
          <span className="text-3xl font-bold text-gray-700">{maxHp}</span>
        </div>
        {tempHp > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
            <Shield className="w-5 h-5" />
            <span className="text-lg font-bold">+{tempHp} Temp HP</span>
          </div>
        )}
      </div>

      {/* HP Bar */}
      <div className="relative h-10 bg-gray-200 rounded-full overflow-hidden mb-4 shadow-inner">
        {/* Current HP */}
        <div
          className={cn('absolute h-full transition-all duration-300', getHpBarColor())}
          style={{
            width: `${Math.min(100, hpPercentage)}%`,
          }}
        />
        {/* Temp HP */}
        {tempHp > 0 && (
          <div
            className="absolute h-full bg-blue-400 transition-all duration-300"
            style={{
              left: `${Math.min(100, hpPercentage)}%`,
              width: `${Math.min(100 - hpPercentage, (tempHp / maxHp) * 100)}%`,
            }}
          />
        )}
        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            {hpPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Quick +1/-1 Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyDamage(1)}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
        >
          <Minus className="w-4 h-4 mr-1" />1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyHealing(1)}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
        >
          <Plus className="w-4 h-4 mr-1" />1
        </Button>
      </div>

      {/* Custom Damage/Heal Input */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomSubmit(true);
              }
            }}
            placeholder="Amount..."
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={() => handleCustomSubmit(true)}
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
            disabled={!customInput}
          >
            <Minus className="w-4 h-4 mr-1" />
            Damage
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCustomSubmit(false)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
            disabled={!customInput}
          >
            <Plus className="w-4 h-4 mr-1" />
            Heal
          </Button>
        </div>

        {/* Temp HP Input */}
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={tempHpInput}
            onChange={(e) => setTempHpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTempHpSubmit();
              }
            }}
            placeholder="Temp HP amount..."
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleTempHpSubmit}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
            disabled={!tempHpInput}
          >
            <Shield className="w-4 h-4 mr-1" />
            Add Temp
          </Button>
        </div>
      </div>

      {/* Death Mode Warning */}
      {currentHp === 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-600 rounded-lg text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 text-white">
            <Skull className="w-6 h-6" />
            <span className="font-bold text-lg uppercase">Unconscious - Making Death Saves</span>
            <Skull className="w-6 h-6" />
          </div>
          <p className="text-xs text-red-200 mt-1">See Death Saves section in Combat Stats above</p>
        </div>
      )}

      {/* Recent HP Changes Log */}
      {hpChangeLog.length > 0 && (
        <div className="pt-3 border-t border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-700" />
              <h4 className="font-bold text-amber-900 uppercase text-xs">Recent Changes</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowRecentChanges(!showRecentChanges)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded',
                'text-[10px] font-medium uppercase tracking-wider',
                'transition-colors',
                showRecentChanges
                  ? 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              )}
              title={showRecentChanges ? 'Hide recent changes' : 'Show recent changes'}
            >
              {showRecentChanges ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          {showRecentChanges && (
            <div className="space-y-1 max-h-32 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
              {hpChangeLog.map((change) => (
                <div
                  key={change.id}
                  className={cn(
                    'flex items-center justify-between px-2 py-1 rounded text-xs',
                    change.type === 'damage' && 'bg-red-50 text-red-900',
                    change.type === 'healing' && 'bg-emerald-50 text-emerald-900',
                    change.type === 'temp' && 'bg-blue-50 text-blue-900'
                  )}
                >
                  <span className="font-medium">
                    {change.type === 'damage' && 'Took damage'}
                    {change.type === 'healing' && 'Healed'}
                    {change.type === 'temp' && 'Gained temp HP'}
                  </span>
                  <span className="font-bold">
                    {change.amount > 0 ? '+' : ''}
                    {change.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
