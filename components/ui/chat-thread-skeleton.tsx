'use client';

import React from 'react';

export function ChatThreadSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background animate-pulse">
      {/* Header / Top bar shimmer */}
      <div className="p-4 sm:p-6 space-y-6 flex-1 max-w-3xl w-full mx-auto">
        {/* User Message Skeleton */}
        <div className="flex justify-end">
          <div className="bg-primary/20 h-14 w-2/3 rounded-2xl rounded-tr-xs" />
        </div>

        {/* Assistant Message Skeleton 1 */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="bg-muted h-5 w-1/3 rounded-md" />
            <div className="bg-muted h-16 w-full rounded-xl" />
            <div className="bg-muted h-10 w-4/5 rounded-xl" />
          </div>
        </div>

        {/* User Message Skeleton 2 */}
        <div className="flex justify-end pt-2">
          <div className="bg-primary/20 h-10 w-1/2 rounded-2xl rounded-tr-xs" />
        </div>

        {/* Assistant Message Skeleton 2 */}
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="bg-muted h-5 w-1/4 rounded-md" />
            <div className="bg-muted h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Input Composer Skeleton */}
      <div className="p-4 border-t border-border/50 max-w-3xl w-full mx-auto">
        <div className="bg-muted/40 h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
