'use client';

import React from 'react';
import { X, Highlighter } from 'lucide-react';

interface ComposerQuotePreviewProps {
  quotedText: string;
  onClear: () => void;
}

export function ComposerQuotePreview({ quotedText, onClear }: ComposerQuotePreviewProps) {
  if (!quotedText) return null;

  return (
    <div className="mb-3 flex items-start justify-between gap-3 px-3 py-2.5 bg-muted/40 border border-border/50 rounded-lg">
      <div className="flex items-start gap-2 overflow-hidden flex-1">
        <Highlighter size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground italic line-clamp-3 leading-relaxed">
          {quotedText}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="h-5 w-5 rounded-full hover:bg-muted-foreground/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
        title="Remove selection"
      >
        <X size={12} />
      </button>
    </div>
  );
}
