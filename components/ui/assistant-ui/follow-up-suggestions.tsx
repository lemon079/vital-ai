'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface FollowUpSuggestionsProps {
  suggestions?: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function FollowUpSuggestions({ suggestions, onSelect, disabled }: FollowUpSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap pl-12">
      {suggestions.map((promptText, idx) => (
        <button
          key={`${promptText}-${idx}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(promptText)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border bg-card text-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          <Sparkles size={12} className="text-primary shrink-0" />
          <span>{promptText}</span>
        </button>
      ))}
    </div>
  );
}
