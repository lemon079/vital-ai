'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, Check, Loader2 } from 'lucide-react';

export interface ReasoningStep {
  node: string;
  label: string;
  status: 'running' | 'complete';
  startedAt: number;
  completedAt?: number;
}

interface ReasoningIndicatorProps {
  steps: ReasoningStep[];
  isActive: boolean;
}

export function ReasoningIndicator({ steps, isActive }: ReasoningIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track current timestamp via effect to keep render pure
  useEffect(() => {
    if (!isActive && steps.length === 0) return;

    if (isActive) {
      const currentNow = Date.now();
      setStartTime(steps[0]?.startedAt || currentNow);
      setNow(currentNow);
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, steps]);

  // Auto-expand while active, auto-collapse after completion
  useEffect(() => {
    if (isActive && steps.length > 0) {
      setIsExpanded(true);
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    } else if (!isActive && steps.length > 0) {
      collapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 1500);
    }
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [isActive, steps.length]);

  if (steps.length === 0 && !isActive) return null;

  const allComplete = steps.every((s) => s.status === 'complete');
  const firstStartedAt = steps[0]?.startedAt || 0;
  const lastCompletedAt = steps[steps.length - 1]?.completedAt || 0;

  const elapsed = startTime && now ? (now - startTime) / 1000 : 0;
  const totalTime = allComplete && lastCompletedAt && firstStartedAt
    ? (lastCompletedAt - firstStartedAt) / 1000
    : elapsed;

  return (
    <div className="flex gap-4 justify-start pl-12">
      <div className="bg-muted/30 border rounded-xl overflow-hidden shadow-sm w-full max-w-md">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <Brain size={14} className="text-primary animate-pulse" />
                <span>Thinking... ({totalTime.toFixed(1)}s)</span>
              </>
            ) : (
              <>
                <Brain size={14} className="text-primary" />
                <span>Thought for {totalTime.toFixed(1)}s</span>
              </>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-3 space-y-1.5 border-t border-border/50">
            {steps.map((step, idx) => {
              const stepTime = step.completedAt
                ? ((step.completedAt - step.startedAt) / 1000).toFixed(1)
                : now && step.startedAt
                ? ((now - step.startedAt) / 1000).toFixed(1)
                : '0.0';

              return (
                <div
                  key={`${step.node}-${idx}`}
                  className="flex items-center gap-2 py-1 first:pt-2.5"
                >
                  {step.status === 'complete' ? (
                    <Check size={12} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Loader2 size={12} className="text-primary animate-spin shrink-0" />
                  )}
                  <span className={`text-xs ${step.status === 'complete' ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto tabular-nums">
                    {stepTime}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
