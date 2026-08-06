'use client';

import React, { useCallback } from 'react';
import { Highlighter } from 'lucide-react';

interface SelectionToolbarProps {
  onQuote: (text: string) => void;
}

export function SelectionToolbar({ onQuote }: SelectionToolbarProps) {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = React.useState('');

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectedText('');
      setPosition(null);
    }
  }, []);

  const handleQuoteClick = useCallback(() => {
    if (selectedText) {
      onQuote(selectedText);
      setSelectedText('');
      setPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, onQuote]);

  // Dismiss on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-toolbar]')) {
        // Delay to allow the quote button click to register
        setTimeout(() => {
          const selection = window.getSelection();
          const text = selection?.toString().trim();
          if (!text) {
            setSelectedText('');
            setPosition(null);
          }
        }, 100);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    handleMouseUp,
    toolbar: position && selectedText ? (
      <div
        data-selection-toolbar
        className="fixed z-100"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="flex items-center gap-1 rounded-lg border bg-popover px-1 py-1 shadow-md">
          <button
            onClick={handleQuoteClick}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-popover-foreground text-xs font-medium hover:bg-accent transition-colors cursor-pointer"
          >
            <Highlighter className="size-3.5" />
            Select
          </button>
        </div>
        <div className="flex justify-center -mt-px">
          <div className="size-2.5 rotate-45 rounded-[2px] bg-popover border-b border-r" />
        </div>
      </div>
    ) : null,
  };
}
