'use client';

import React from 'react';

export function PdfViewerSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-card border-r border-border overflow-hidden select-none animate-pulse">
      {/* Header Shimmer */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-7 w-7 rounded bg-muted" />
          <div className="h-7 w-7 rounded bg-muted" />
          <div className="h-7 w-7 rounded bg-muted" />
        </div>
      </div>

      {/* Document Body Shimmer */}
      <div className="flex-1 bg-muted/10 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-lg h-full bg-muted/30 rounded-lg border border-border/50 p-6 space-y-4">
          <div className="h-6 bg-muted/50 rounded w-3/4" />
          <div className="h-4 bg-muted/40 rounded w-1/2" />
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-muted/30 rounded w-full" />
            <div className="h-3 bg-muted/30 rounded w-full" />
            <div className="h-3 bg-muted/30 rounded w-5/6" />
            <div className="h-3 bg-muted/30 rounded w-4/5" />
          </div>
          <div className="space-y-2 pt-6">
            <div className="h-3 bg-muted/30 rounded w-full" />
            <div className="h-3 bg-muted/30 rounded w-11/12" />
            <div className="h-3 bg-muted/30 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
