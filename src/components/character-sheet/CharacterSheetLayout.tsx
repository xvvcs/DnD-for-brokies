/**
 * Character Sheet Layout
 *
 * Responsive grid layout for character sheet panels
 * 3-column desktop, 2-column tablet, 1-column mobile
 * Fantasy-themed with parchment background
 */

import React from 'react';

import { cn } from '@/lib/utils';

interface CharacterSheetLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main character sheet container with fantasy theme
 */
export function CharacterSheetLayout({ children, className }: CharacterSheetLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-[#f5e6c8] bg-opacity-90',
        'print:bg-white print:min-h-0',
        className
      )}
    >
      {/* Parchment texture overlay */}
      <div
        className={cn(
          'fixed inset-0 pointer-events-none opacity-10',
          "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxmaWx0ZXIgaWQ9Im5vaXNlIj4KICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgo8L2ZpbHRlcj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC40IiAvPgo8L3N2Zz4=')]",
          'print:hidden'
        )}
      />

      {/* Content container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface CharacterSheetGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive grid for character sheet panels
 * Desktop: 3 columns | Tablet: 2 columns | Mobile: 1 column
 */
export function CharacterSheetGrid({ children, className }: CharacterSheetGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 p-4',
        // Mobile: 1 column
        'grid-cols-1',
        // Tablet: 2 columns
        'sm:grid-cols-2',
        // Desktop: 3 columns
        'lg:grid-cols-3',
        // Print: 2 columns to fit on page
        'print:grid-cols-2 print:gap-2 print:p-2',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CharacterSheetSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

/**
 * Individual panel section with fantasy card styling
 */
export function CharacterSheetSection({
  title,
  children,
  className,
  action,
}: CharacterSheetSectionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border-2 border-amber-800 shadow-md',
        'bg-gradient-to-br from-amber-50 to-orange-50',
        'print:shadow-none print:border-gray-300 print:break-inside-avoid',
        className
      )}
    >
      {/* Section header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-gradient-to-r from-amber-800 to-amber-700',
          'border-b-2 border-amber-900',
          'print:bg-gray-100 print:border-gray-300'
        )}
      >
        <h3 className={cn('font-serif font-bold text-amber-100 text-lg', 'print:text-gray-900')}>
          {title}
        </h3>
        {action && <div className="print:hidden">{action}</div>}
      </div>

      {/* Section content */}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface CharacterSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-width header for character identity/info
 */
export function CharacterSheetHeader({ children, className }: CharacterSheetHeaderProps) {
  return (
    <div className={cn('w-full px-4 py-4 mb-4', 'print:mb-2 print:px-2 print:py-2', className)}>
      {children}
    </div>
  );
}

interface CharacterSheetColumnProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Single column container for stacking panels
 */
export function CharacterSheetColumn({ children, className }: CharacterSheetColumnProps) {
  return <div className={cn('flex flex-col gap-4', 'print:gap-2', className)}>{children}</div>;
}
