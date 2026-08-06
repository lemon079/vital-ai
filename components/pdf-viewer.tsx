'use client';

import React, { useState } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
  url: string;
  onClose?: () => void;
}

export function PdfViewer({ url, onClose }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const isImage = /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(url);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const filename = url.split('/').pop()?.split('?')[0] || 'Uploaded_Document.pdf';

  return (
    <div className="flex flex-col h-full w-full bg-card border-r border-border overflow-hidden select-none">
      {/* Viewer Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border text-xs shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
            <FileText size={16} />
          </div>
          <span className="font-semibold text-foreground truncate max-w-xs">{filename}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Zoom Out"
            disabled={zoom <= 50}
          >
            <ZoomOut size={14} />
          </Button>

          <span className="text-[11px] font-mono text-muted-foreground px-1.5 w-11 text-center">
            {zoom}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Zoom In"
            disabled={zoom >= 200}
          >
            <ZoomIn size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Close PDF Viewer"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Viewer Content Area */}
      <div className="flex-1 bg-muted/10 overflow-auto p-4 flex items-center justify-center relative">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out w-full h-full flex items-center justify-center"
        >
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt="Report document"
              className="max-w-full max-h-full object-contain rounded border shadow-md"
            />
          ) : (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded border bg-background shadow-md min-h-125"
              title="PDF Report Document"
            />
          )}
        </div>
      </div>
    </div>
  );
}
