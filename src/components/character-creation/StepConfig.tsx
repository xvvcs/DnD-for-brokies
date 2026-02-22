/**
 * Step 0: Configuration
 *
 * Document/rulebook selector, edition, campaign, HP method.
 * Triggers cache warming when documents are selected.
 */

'use client';

import { useEffect } from 'react';

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
import type { ValidationError } from '@/stores/characterCreationStore';

import { cn } from '@/lib/utils';

function inferGameSystem(key: string): string {
  if (key.includes('2024') || key.includes('5e-2024')) return '5e 2024';
  if (key.includes('2014') || key.includes('5e-2014') || key === 'wotc-srd') return '5e 2014';
  if (key.includes('a5e')) return 'A5E';
  return 'Other';
}

function groupDocumentsBySystem(
  documents: { key: string; name: string }[]
): Map<string, { key: string; name: string }[]> {
  const groups = new Map<string, { key: string; name: string }[]>();
  for (const doc of documents) {
    const system = inferGameSystem(doc.key);
    const list = groups.get(system) ?? [];
    list.push(doc);
    groups.set(system, list);
  }
  return groups;
}

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
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([system, docs]) => (
            <div key={system}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {system}
              </p>
              <div className="flex flex-wrap gap-4">
                {docs.map((doc) => (
                  <label
                    key={doc.key}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer rounded-lg border-2 px-4 py-3 transition-colors',
                      documentKeys.includes(doc.key)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox
                      checked={documentKeys.includes(doc.key)}
                      onCheckedChange={(checked) => handleDocumentToggle(doc.key, checked === true)}
                    />
                    <span className="text-sm font-medium">{doc.name}</span>
                  </label>
                ))}
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
        <Label htmlFor="edition" className="font-semibold text-foreground">
          Edition
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Choose 2014 (SRD 5.1) or 2024 (SRD 5.2) rules.
        </p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="edition"
              value="2014"
              checked={edition === '2014'}
              onChange={() => handleEditionChange('2014')}
              className="w-4 h-4"
            />
            <span>5e 2014</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="edition"
              value="2024"
              checked={edition === '2024'}
              onChange={() => handleEditionChange('2024')}
              className="w-4 h-4"
            />
            <span>5e 2024</span>
          </label>
        </div>
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
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hpMethod"
              value="fixed"
              checked={hpMethod === 'fixed'}
              onChange={() => handleHpMethodChange('fixed')}
              className="w-4 h-4"
            />
            <span>Fixed (average)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hpMethod"
              value="manual"
              checked={hpMethod === 'manual'}
              onChange={() => handleHpMethodChange('manual')}
              className="w-4 h-4"
            />
            <span>Manual (roll)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
