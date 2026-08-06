'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableSplitPanelProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  defaultLeftWidth?: number; // percentage (20 to 80)
  minLeftWidth?: number; // percentage min
  maxLeftWidth?: number; // percentage max
  className?: string;
}

export function ResizableSplitPanel({
  leftContent,
  rightContent,
  defaultLeftWidth = 50,
  minLeftWidth = 25,
  maxLeftWidth = 75,
  className = '',
}: ResizableSplitPanelProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const newLeftWidth = (pointerX / rect.width) * 100;
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isResizing, minLeftWidth, maxLeftWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full overflow-hidden ${isResizing ? 'select-none' : ''} ${className}`}
    >
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="h-full overflow-hidden relative shrink-0"
      >
        {leftContent}
      </div>

      {/* Resizer Handle Separator */}
      <div
        onPointerDown={startResizing}
        className={`
          relative z-30 flex w-2.5 items-center justify-center cursor-col-resize shrink-0
          bg-border/60 hover:bg-primary/50 transition-colors group select-none touch-none
          ${isResizing ? 'bg-primary' : ''}
        `}
        role="separator"
        aria-valuenow={leftWidth}
      >
        <div
          className={`
            w-1 h-8 rounded-full transition-colors
            ${isResizing ? 'bg-primary-foreground' : 'bg-muted-foreground/40 group-hover:bg-primary'}
          `}
        />
      </div>

      {/* Right Panel */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full overflow-hidden flex-1 flex flex-col"
      >
        {rightContent}
      </div>

      {/* Transparent Overlay during resize to prevent iframe pointer events hijacking */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize bg-transparent select-none" />
      )}
    </div>
  );
}
