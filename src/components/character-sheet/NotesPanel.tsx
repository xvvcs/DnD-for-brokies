/**
 * NotesPanel Component
 *
 * Character notes, backstory, and personality management:
 * - Personality Traits field (list with add/remove)
 * - Ideals field (list with add/remove)
 * - Bonds field (list with add/remove)
 * - Flaws field (list with add/remove)
 * - Backstory text area
 * - Appearance/description
 * - Session notes with timestamps
 */

'use client';

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BookOpen,
  User,
  Scale,
  Link2,
  AlertTriangle,
  Plus,
  X,
  Clock,
  MessageSquare,
  Users,
  Skull,
  Sparkles,
} from 'lucide-react';
import type { Personality, Appearance, SessionNote } from '@/types/game';

interface NotesPanelProps {
  personality: Personality;
  appearance: Appearance;
  sessionNotes?: SessionNote[];
  onPersonalityChange?: (personality: Personality) => void;
  onAppearanceChange?: (appearance: Appearance) => void;
  onSessionNotesChange?: (notes: SessionNote[]) => void;
  className?: string;
}

type TabType = 'personality' | 'backstory' | 'appearance' | 'allies' | 'notes';

interface TabConfig {
  key: TabType;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { key: 'personality', label: 'Personality', icon: <User className="w-4 h-4" /> },
  { key: 'backstory', label: 'Backstory', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'appearance', label: 'Appearance', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'allies', label: 'Allies & Enemies', icon: <Users className="w-4 h-4" /> },
  { key: 'notes', label: 'Session Notes', icon: <MessageSquare className="w-4 h-4" /> },
];

// String list editor for personality traits, ideals, bonds, flaws
function StringListEditor({
  items,
  onChange,
  placeholder,
  label,
  icon,
  colorClass,
  maxItems = 10,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  maxItems?: number;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && items.length < maxItems) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2 font-medium text-sm', colorClass)}>
        {icon}
        <span>{label}</span>
        <Badge variant="outline" className="text-[10px] h-4">
          {items.length}/{maxItems}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2 p-2 rounded bg-white border text-sm group',
              'border-gray-200 hover:border-amber-300 transition-colors'
            )}
          >
            <span className="flex-1 text-gray-700">{item}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-sm h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="h-9 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Personality Tab Content
function PersonalityTab({
  personality,
  onChange,
}: {
  personality: Personality;
  onChange?: (personality: Personality) => void;
}) {
  const handleTraitsChange = (traits: string[]) => {
    onChange?.({ ...personality, traits });
  };

  const handleIdealsChange = (ideals: string[]) => {
    onChange?.({ ...personality, ideals });
  };

  const handleBondsChange = (bonds: string[]) => {
    onChange?.({ ...personality, bonds });
  };

  const handleFlawsChange = (flaws: string[]) => {
    onChange?.({ ...personality, flaws });
  };

  return (
    <div className="space-y-4">
      <StringListEditor
        items={personality.traits}
        onChange={handleTraitsChange}
        placeholder="Add a personality trait..."
        label="Personality Traits"
        icon={<User className="w-4 h-4 text-blue-600" />}
        colorClass="text-blue-700"
        maxItems={10}
      />

      <StringListEditor
        items={personality.ideals}
        onChange={handleIdealsChange}
        placeholder="Add an ideal..."
        label="Ideals"
        icon={<Scale className="w-4 h-4 text-emerald-600" />}
        colorClass="text-emerald-700"
        maxItems={5}
      />

      <StringListEditor
        items={personality.bonds}
        onChange={handleBondsChange}
        placeholder="Add a bond..."
        label="Bonds"
        icon={<Link2 className="w-4 h-4 text-amber-600" />}
        colorClass="text-amber-700"
        maxItems={5}
      />

      <StringListEditor
        items={personality.flaws}
        onChange={handleFlawsChange}
        placeholder="Add a flaw..."
        label="Flaws"
        icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
        colorClass="text-red-700"
        maxItems={5}
      />
    </div>
  );
}

// Backstory Tab Content
function BackstoryTab({
  backstory,
  onChange,
}: {
  backstory: string;
  onChange?: (backstory: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-amber-600" />
        Character Backstory
      </label>
      <textarea
        value={backstory}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Tell the story of your character... Where did they come from? What drives them? What significant events shaped their life?"
        rows={12}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-gray-300 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'text-sm leading-relaxed text-gray-700',
          'placeholder:text-gray-400'
        )}
      />
      <p className="text-xs text-gray-500">{backstory.length} characters</p>
    </div>
  );
}

// Appearance Tab Content
function AppearanceTab({
  appearance,
  personalityAppearance,
  onAppearanceChange,
  onPersonalityAppearanceChange,
}: {
  appearance: Appearance;
  personalityAppearance: string;
  onAppearanceChange?: (appearance: Appearance) => void;
  onPersonalityAppearanceChange?: (appearance: string) => void;
}) {
  const handleChange = (field: keyof Appearance, value: string) => {
    onAppearanceChange?.({ ...appearance, [field]: value });
  };

  const fields: { key: keyof Appearance; label: string; placeholder: string }[] = [
    { key: 'age', label: 'Age', placeholder: 'e.g., 25 years' },
    { key: 'height', label: 'Height', placeholder: 'e.g., 5\'10"' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g., 170 lbs' },
    { key: 'eyes', label: 'Eyes', placeholder: 'e.g., Deep blue' },
    { key: 'skin', label: 'Skin', placeholder: 'e.g., Olive' },
    { key: 'hair', label: 'Hair', placeholder: 'e.g., Dark brown, shoulder-length' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{field.label}</label>
            <Input
              value={appearance[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm h-9"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Other Distinguishing Features
        </label>
        <Input
          value={appearance.other}
          onChange={(e) => handleChange('other', e.target.value)}
          placeholder="e.g., Scar on left cheek, missing finger"
          className="text-sm h-9"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Detailed Description
        </label>
        <textarea
          value={personalityAppearance}
          onChange={(e) => onPersonalityAppearanceChange?.(e.target.value)}
          placeholder="Describe your character's appearance in detail... How do they carry themselves? What do they wear? Any notable mannerisms?"
          rows={6}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-gray-300 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
            'text-sm leading-relaxed text-gray-700',
            'placeholder:text-gray-400'
          )}
        />
      </div>
    </div>
  );
}

// Allies & Enemies Tab Content
function AlliesTab({
  allies,
  enemies,
  onAlliesChange,
  onEnemiesChange,
}: {
  allies: string;
  enemies: string;
  onAlliesChange?: (allies: string) => void;
  onEnemiesChange?: (enemies: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-emerald-700 flex items-center gap-2 mb-2">
          <Users className="w-4 h-4" />
          Allies & Organizations
        </label>
        <textarea
          value={allies}
          onChange={(e) => onAlliesChange?.(e.target.value)}
          placeholder="List your character's allies, friends, and affiliated organizations..."
          rows={6}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-gray-300 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'text-sm leading-relaxed text-gray-700',
            'placeholder:text-gray-400'
          )}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-red-700 flex items-center gap-2 mb-2">
          <Skull className="w-4 h-4" />
          Enemies & Rivals
        </label>
        <textarea
          value={enemies}
          onChange={(e) => onEnemiesChange?.(e.target.value)}
          placeholder="List your character's enemies, rivals, and hostile organizations..."
          rows={6}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-gray-300 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
            'text-sm leading-relaxed text-gray-700',
            'placeholder:text-gray-400'
          )}
        />
      </div>
    </div>
  );
}

// Session Notes Tab Content
function SessionNotesTab({
  notes,
  onChange,
}: {
  notes: SessionNote[];
  onChange?: (notes: SessionNote[]) => void;
}) {
  const [newNote, setNewNote] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notes]);

  const handleAdd = () => {
    if (newNote.trim()) {
      const note: SessionNote = {
        id: `note-${Date.now()}`,
        content: newNote.trim(),
        timestamp: new Date(),
        sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : undefined,
      };
      onChange?.([note, ...notes]);
      setNewNote('');
      setSessionNumber('');
    }
  };

  const handleDelete = (id: string) => {
    onChange?.(notes.filter((n) => n.id !== id));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-3">
      {/* Add new note */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
            placeholder="Session #"
            className="w-24 text-sm h-9"
          />
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a session note..."
            className="flex-1 text-sm h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newNote.trim()}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No session notes yet</p>
              <p className="text-xs mt-1">Add notes to track your adventures</p>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  'p-3 rounded-lg border bg-white group',
                  'border-gray-200 hover:border-amber-300 transition-colors'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {note.sessionNumber && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          Session {note.sessionNumber}
                        </Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 cursor-help">
                            <Clock className="w-3 h-3" />
                            {formatDate(note.timestamp)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">{note.timestamp.toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded transition-all shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function NotesPanel({
  personality,
  appearance,
  sessionNotes = [],
  onPersonalityChange,
  onAppearanceChange,
  onSessionNotesChange,
  className,
}: NotesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('personality');

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
      <div
        className={cn(
          'bg-gradient-to-b from-amber-50 to-white rounded-lg shadow-lg p-4',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide">
            Notes & Backstory
          </h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'personality' && (
            <PersonalityTab personality={personality} onChange={onPersonalityChange} />
          )}

          {activeTab === 'backstory' && (
            <BackstoryTab
              backstory={personality.backstory}
              onChange={(backstory) => onPersonalityChange?.({ ...personality, backstory })}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab
              appearance={appearance}
              personalityAppearance={personality.appearance}
              onAppearanceChange={onAppearanceChange}
              onPersonalityAppearanceChange={(appearance) =>
                onPersonalityChange?.({ ...personality, appearance })
              }
            />
          )}

          {activeTab === 'allies' && (
            <AlliesTab
              allies={personality.allies}
              enemies={personality.enemies}
              onAlliesChange={(allies) => onPersonalityChange?.({ ...personality, allies })}
              onEnemiesChange={(enemies) => onPersonalityChange?.({ ...personality, enemies })}
            />
          )}

          {activeTab === 'notes' && (
            <SessionNotesTab notes={sessionNotes} onChange={onSessionNotesChange} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { NotesPanelProps };
