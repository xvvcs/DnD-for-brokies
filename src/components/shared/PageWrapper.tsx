'use client';

import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function PageWrapper({ children, className = '', title }: PageWrapperProps) {
  return (
    <div className={`min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {title && (
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-foreground mb-6">
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
}
