'use client';

import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    url: string;
    onHighlight: () => void;
}

export function PdfViewer({ url, onHighlight }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const containerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));
    const zoomIn = () => setScale(prev => Math.min(2.0, prev + 0.15));
    const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.15));

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 shrink-0">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevPage} disabled={currentPage <= 1}>
                        <ChevronLeft size={14} />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground min-w-[60px] text-center">
                        {currentPage} / {numPages}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextPage} disabled={currentPage >= numPages}>
                        <ChevronRight size={14} />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground mr-1">
                        <Highlighter size={12} className="text-primary" />
                        <span>Select text to chat</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
                        <ZoomOut size={14} />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground min-w-[36px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
                        <ZoomIn size={14} />
                    </Button>
                </div>
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto pdf-viewer-container"
                onMouseUp={onHighlight}
            >
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground animate-pulse">Loading PDF...</span>
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center h-full">
                            <span className="text-sm text-destructive">Failed to load PDF</span>
                        </div>
                    }
                >
                    <Page
                        pageNumber={currentPage}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="mx-auto"
                    />
                </Document>
            </div>
        </div>
    );
}
