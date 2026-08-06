'use client';

import { Bot, Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { useAgentContext } from '@/context/agent-context';

interface ChatHeaderProps {
  onOpenSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function ChatHeader({ onOpenSidebar, showSidebarToggle }: ChatHeaderProps) {
  const { pdfUrl, isPdfVisible, setIsPdfVisible } = useAgentContext();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        {showSidebarToggle && onOpenSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Open Chat History"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">VitalSense Agent</h1>
          <p className="text-xs text-muted-foreground font-medium">Always here to help</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pdfUrl && !isPdfVisible && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPdfVisible(true)}
            className="gap-1.5 text-xs"
            title="Reopen uploaded report"
          >
            <FileText className="h-3.5 w-3.5" />
            View Report
          </Button>
        )}
        <ModeToggle />
      </div>
    </header>
  );
}
