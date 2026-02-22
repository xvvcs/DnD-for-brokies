/**
 * Step 0: Configuration
 *
 * Document/rulebook selector, edition, campaign, HP method.
 * Triggers cache warming when documents are selected.
 */

'use client';

import { useEffect, type KeyboardEvent } from 'react';

import { useDocuments, useClasses, useSpecies, useBackgrounds } from '@/hooks/api/useOpen5e';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Edition } from '@/types/game';
import type { Open5eDocument } from '@/types/open5e';
import type { ValidationError } from '@/stores/characterCreationStore';

import { cn } from '@/lib/utils';

function inferGameSystem(key: string): string {
  if (key.includes('2024') || key.includes('5e-2024')) return '5e 2024';
  if (key.includes('2014') || key.includes('5e-2014') || key === 'wotc-srd') return '5e 2014';
  if (key.includes('a5e')) return 'A5E';
  return 'Other';
}

function groupDocumentsBySystem(documents: Open5eDocument[]): Map<string, Open5eDocument[]> {
  const groups = new Map<string, Open5eDocument[]>();
  for (const doc of documents) {
    const system = inferGameSystem(doc.key);
    const list = groups.get(system) ?? [];
    list.push(doc);
    groups.set(system, list);
  }
  return groups;
}

function compactDescription(desc?: string): string | null {
  const text = desc?.trim();
  if (!text) return null;
  if (text.length <= 140) return text;
  return `${text.slice(0, 137).trimEnd()}...`;
}

interface DocumentPickMeta {
  label: 'Core Rule' | 'Popular Pick';
  tone: 'core' | 'popular';
}

function getDocumentPickMeta(doc: Open5eDocument, edition: Edition): DocumentPickMeta | null {
  const normalized = `${doc.key} ${doc.name}`.toLowerCase();
  const isSrd2014 = normalized.includes('wotc-srd') || normalized.includes('srd 5.1');
  const isSrd2024 = normalized.includes('srd-2024') || normalized.includes('srd 5.2');
  const isA5e = normalized.includes('a5e') || normalized.includes('advanced 5th edition');

  if ((edition === '2014' && isSrd2014) || (edition === '2024' && isSrd2024)) {
    return { label: 'Core Rule', tone: 'core' };
  }

  if (isSrd2014 || isSrd2024 || isA5e) {
    return { label: 'Popular Pick', tone: 'popular' };
  }

  return null;
}

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: readonly ToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedToggleProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const optionWidth = 100 / options.length;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (activeIndex + direction + options.length) % options.length;
    const next = options[nextIndex];
    if (next) {
      onChange(next.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="relative rounded-xl border border-border bg-muted/70 p-1"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-primary shadow-sm transition-all duration-300 ease-out"
        style={{
          width: `calc(${optionWidth}% - 0.25rem)`,
          left: `calc(${activeIndex * optionWidth}% + 0.125rem)`,
        }}
      />
      <div
        className="relative z-10 grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'h-10 rounded-lg px-3 text-sm font-medium transition-colors duration-300',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const EDITION_OPTIONS = [
  { value: '2014', label: '5e 2014' },
  { value: '2024', label: '5e 2024' },
] as const;

const HP_METHOD_OPTIONS = [
  { value: 'fixed', label: 'Fixed (average)' },
  { value: 'manual', label: 'Manual (roll)' },
] as const;

export interface StepConfigProps {
  documentKeys: string[];
  edition: Edition;
  campaignId?: string;
  hpMethod: 'fixed' | 'manual';
  onUpdate: (config: {
    documentKeys: string[];
    edition: Edition;
    campaignId?: string;
    hpMethod: 'fixed' | 'manual';
  }) => void;
  onValidationChange: (errors: ValidationError[]) => void;
}

export function StepConfig({
  documentKeys,
  edition,
  campaignId,
  hpMethod,
  onUpdate,
  onValidationChange,
}: StepConfigProps) {
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: campaigns } = useCampaigns();

  const classesQuery = useClasses(documentKeys);
  const speciesQuery = useSpecies(documentKeys);
  const backgroundsQuery = useBackgrounds(documentKeys);

  const cacheQueries = [classesQuery, speciesQuery, backgroundsQuery];
  const cacheLabels = ['Classes', 'Species', 'Backgrounds'];
  const cacheLoading = documentKeys.length > 0 && cacheQueries.some((q) => q.isFetching);
  const cacheLoaded = cacheQueries.filter((q) => q.isSuccess).length;
  const cacheTotal = documentKeys.length > 0 ? cacheQueries.length : 0;

  useEffect(() => {
    const errors: ValidationError[] = [];
    if (documentKeys.length === 0) {
      errors.push({ field: 'documents', message: 'Select at least one rulebook source.' });
    }
    onValidationChange(errors);
  }, [documentKeys.length, onValidationChange]);

  const handleDocumentToggle = (key: string, checked: boolean) => {
    if (checked) {
      onUpdate({ documentKeys: [...documentKeys, key], edition, campaignId, hpMethod });
    } else {
      onUpdate({
        documentKeys: documentKeys.filter((k) => k !== key),
        edition,
        campaignId,
        hpMethod,
      });
    }
  };

  const handleEditionChange = (value: Edition) => {
    onUpdate({ documentKeys, edition: value, campaignId, hpMethod });
  };

  const handleCampaignChange = (value: string) => {
    onUpdate({
      documentKeys,
      edition,
      campaignId: value === '__none__' ? undefined : value,
      hpMethod,
    });
  };

  const handleHpMethodChange = (value: 'fixed' | 'manual') => {
    onUpdate({ documentKeys, edition, campaignId, hpMethod: value });
  };

  if (documentsLoading || !documents) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground animate-pulse">Loading rulebooks…</p>
      </div>
    );
  }

  const groups = groupDocumentsBySystem(documents);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-foreground mb-3">Rulebook Sources</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which rulebooks to use for classes, species, spells, and equipment.
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Outlined cards are common starter picks; the core rule follows your selected edition.
        </p>
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([system, docs]) => (
            <div key={system}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {system}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((doc) => {
                  const shortDesc = compactDescription(doc.desc);
                  const isSelected = documentKeys.includes(doc.key);
                  const pickMeta = getDocumentPickMeta(doc, edition);

                  return (
                    <label
                      key={doc.key}
                      className={cn(
                        'group cursor-pointer rounded-xl border p-3 transition-all',
                        'bg-card/60 hover:bg-card',
                        pickMeta &&
                          (pickMeta.tone === 'core'
                            ? 'ring-2 ring-primary/50'
                            : 'ring-1 ring-accent/60'),
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40'
                      )}
                      title={doc.desc ?? undefined}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleDocumentToggle(doc.key, checked === true)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {doc.name}
                            </p>
                            {pickMeta && (
                              <span
                                className={cn(
                                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                  pickMeta.tone === 'core'
                                    ? 'border-primary/70 bg-primary text-primary-foreground shadow-sm'
                                    : 'border-accent/70 bg-accent text-accent-foreground shadow-sm'
                                )}
                              >
                                {pickMeta.label}
                              </span>
                            )}
                          </div>
                          {shortDesc && (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {shortDesc}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 pl-6 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                        {system}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {cacheLoading && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Loading reference data… {cacheLoaded}/{cacheTotal} complete
            </p>
            <Progress value={(cacheLoaded / cacheTotal) * 100} className="h-2" />
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {cacheLabels.map((label, i) => (
                <li key={label} className="flex items-center gap-1.5">
                  {cacheQueries[i].isSuccess ? (
                    <span className="text-primary">✓</span>
                  ) : cacheQueries[i].isFetching ? (
                    <span className="animate-pulse">…</span>
                  ) : (
                    <span>○</span>
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <Label className="font-semibold text-foreground">Edition</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Choose 2014 (SRD 5.1) or 2024 (SRD 5.2) rules.
        </p>
        <SegmentedToggle
          value={edition}
          options={EDITION_OPTIONS}
          onChange={handleEditionChange}
          ariaLabel="Edition selection"
        />
      </div>

      <div>
        <Label htmlFor="campaign" className="font-semibold text-foreground">
          Campaign (optional)
        </Label>
        <p className="text-sm text-muted-foreground mb-2">Assign this character to a campaign.</p>
        <Select value={campaignId ?? '__none__'} onValueChange={handleCampaignChange}>
          <SelectTrigger id="campaign" className="w-full max-w-xs">
            <SelectValue placeholder="No campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No campaign</SelectItem>
            {campaigns?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="font-semibold text-foreground">HP Method</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Fixed: use average hit die roll. Manual: roll for each level.
        </p>
        <SegmentedToggle
          value={hpMethod}
          options={HP_METHOD_OPTIONS}
          onChange={handleHpMethodChange}
          ariaLabel="HP method selection"
        />
      </div>
    </div>
  );
}
