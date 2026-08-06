'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function SuggestionsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 pl-12">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles size={12} className="text-primary animate-pulse" />
        <span className="animate-pulse">Generating follow-ups...</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7.5 rounded-full border bg-muted/40 animate-pulse"
            style={{ width: `${80 + i * 28}px` }}
          />
        ))}
      </div>
    </div>
  );
}
