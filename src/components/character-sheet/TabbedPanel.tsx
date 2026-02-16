/**
 * TabbedPanel Component
 *
 * A reusable tabbed panel with compact tab buttons in a single row
 */

'use client';

import React, { useState, type ReactNode } from 'react';

import { CharacterSheetSection } from './CharacterSheetLayout';

export interface TabDefinition {
  key: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface TabbedPanelProps {
  title: string;
  tabs: TabDefinition[];
  defaultTab?: string;
}

export function TabbedPanel({ title, tabs, defaultTab }: TabbedPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');

  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <CharacterSheetSection title={title}>
      {/* Compact Tab Buttons in Single Row */}
      <div className="flex gap-1 mb-4 border-b border-amber-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t transition-colors
              ${
                activeTab === tab.key
                  ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:bg-amber-50 hover:text-amber-800'
              }
            `}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>{activeTabContent}</div>
    </CharacterSheetSection>
  );
}
