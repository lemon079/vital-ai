'use client';

import React, { useState } from 'react';
import { Bot, User, Copy, Check, RotateCcw, FileText, ImageIcon, AlertTriangle, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { preprocessMessageContent } from '@/lib/utils';
import { toast } from 'sonner';
import { DownloadButton } from '@/components/ui/assistant-ui/file-download';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  fileInfo?: { name: string; type: 'pdf' | 'image' };
  selectedText?: string;
  isError?: boolean;
  errorType?: 'slow-network' | 'timeout' | 'network' | 'rate-limit' | 'server' | 'unknown';
  onRetry?: () => void;
  onRegenerate?: () => void;
}

export function CustomMessageBubble({
  role,
  content,
  fileInfo,
  selectedText,
  isError,
  errorType,
  onRetry,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadMatch = content ? content.match(/^\[Uploaded:\s*([^\]]+)\]/i) : null;
  const derivedFileInfo = fileInfo || (uploadMatch ? {
    name: uploadMatch[1],
    type: /\.pdf$/i.test(uploadMatch[1]) ? 'pdf' as const : 'image' as const
  } : undefined);

  const cleanedContent = role === 'user'
    ? content.replace(/^\[Uploaded:\s*([^\]]+)\]/i, '').replace(/\[SYSTEM:\s*[^\]]+\]/g, '').trim()
    : content;

  const shouldShowBubble = role !== 'user' || cleanedContent.length > 0;

  return (
    <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
      <Avatar className={`h-8 w-8 mt-1 border shadow-sm ${role === 'assistant' ? 'bg-card' : 'bg-primary/5'}`}>
        <AvatarFallback className={role === 'assistant' ? 'text-primary' : 'text-muted-foreground'}>
          {role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[80%] ${role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {derivedFileInfo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
              {derivedFileInfo.type === 'pdf' ? (
                <FileText size={14} className="text-primary" />
              ) : (
                <ImageIcon size={14} className="text-primary" />
              )}
            </div>
            <span className="font-medium truncate max-w-50">{derivedFileInfo.name}</span>
          </div>
        )}

        {selectedText && (
          <div className="mb-1 pl-3 border-l-2 border-primary/30">
            <p className="text-xs text-muted-foreground italic line-clamp-3">
              "{selectedText}"
            </p>
          </div>
        )}

        {isError ? (
          <div className="rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none flex flex-col gap-3 max-w-md">
            <div className="flex items-start gap-2.5">
              {errorType === 'network' ? (
                <WifiOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              )}
              <p className="font-medium text-destructive/90">{content}</p>
            </div>
            {onRetry && (
              <Button
                onClick={onRetry}
                type="button"
                size="sm"
                variant="outline"
                className="w-fit gap-1.5 border-destructive/30 hover:text-destructive text-destructive font-semibold bg-background hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry Request
              </Button>
            )}
          </div>
        ) : (
          shouldShowBubble && (
            <div className="relative group/msg">
              <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground border rounded-tl-none'}`}>
                <div className={`prose ${role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-sm max-w-none wrap-break-word`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {preprocessMessageContent(cleanedContent)}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Message Actions */}
              <div className={`absolute top-2 ${role === 'user' ? '-left-16' : '-right-20'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-xs`}>
                <button
                  onClick={handleCopy}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Copy message"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
                {role === 'assistant' && (
                  <DownloadButton content={cleanedContent} />
                )}
                {role === 'assistant' && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
