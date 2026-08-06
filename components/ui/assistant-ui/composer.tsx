'use client';

import React, { useRef } from 'react';
import { Send, Paperclip, X, Square, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComposerQuotePreview } from '@/components/ui/assistant-ui/composer-quote-preview';

interface CustomComposerProps {
  input: string;
  setInput: (val: string) => void;
  selectedText?: string;
  setSelectedText?: (val: string) => void;
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
  pdfUrl?: string | null;
  isPending: boolean;
  onSend: (e: React.FormEvent) => void;
  onFileUpload: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStop?: () => void;
}

export function CustomComposer({
  input,
  setInput,
  selectedText,
  setSelectedText,
  selectedFile,
  setSelectedFile,
  pdfUrl,
  isPending,
  onSend,
  onFileUpload,
  onFileChange,
  onStop,
}: CustomComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    onFileUpload();
  };

  return (
    <div className="border-t bg-background p-4 sm:p-6 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Quote Preview */}
        {selectedText && setSelectedText && (
          <ComposerQuotePreview
            quotedText={selectedText}
            onClear={() => setSelectedText('')}
          />
        )}

        {/* Attachment Pending Upload Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center justify-between gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                {selectedFile.type === 'application/pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate text-foreground">{selectedFile.name}</span>
                <span className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to send</span>
              </div>
            </div>
            {setSelectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="h-6 w-6 rounded-full hover:bg-muted-foreground/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground shrink-0"
                title="Remove file"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          onChange={onFileChange}
          className="hidden"
        />

        <form
          onSubmit={onSend}
          className="relative flex items-center gap-3 bg-muted/30 p-2 rounded-full border border-border focus-within:border-gray-300 transition-all shadow-sm"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-background ${pdfUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAttachClick}
            title={pdfUrl ? "File already uploaded" : "Upload PDF or Image"}
            disabled={!!pdfUrl}
          >
            <Paperclip size={20} />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your health question..."
            className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground h-10"
          />

          {isPending ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="size-10 shrink-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
              title="Stop generation"
            >
              <Square size={16} fill="currentColor" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() && !selectedFile}
              className={`size-10 shrink-0 rounded-full ${(!input.trim() && !selectedFile) ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'}`}
            >
              <Send size={18} className={(input.trim() || selectedFile) ? "ml-0.5" : ""} />
            </Button>
          )}
        </form>
        <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          AI assistance only • Consult a Doctor for diagnosis
        </p>
      </div>
    </div>
  );
}
