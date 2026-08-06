'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  content: string;
  className?: string;
}

export function DownloadButton({ content, className }: DownloadButtonProps) {
  const handleDownload = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `VitalSense_Summary_${dateStr}.txt`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className={`p-1 text-muted-foreground hover:text-foreground rounded transition-colors ${className || ''}`}
      title="Download as text file"
    >
      <Download size={13} />
    </button>
  );
}
