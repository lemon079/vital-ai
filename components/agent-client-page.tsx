'use client';

import { useState, useRef } from 'react';
import { AgentProvider, useAgentContext } from '@/context/agent-context';
import { AssistantUiChat } from '@/components/assistant-ui-chat';
import { ResizableSplitPanel } from '@/components/ui/resizable-split-panel';
import { PdfViewer } from '@/components/pdf-viewer';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { DevSimulationConsole } from '@/components/chat/dev-simulation-console';
import { ChatSession, Message } from '@/types/chat';
import { PdfViewerSkeleton } from '@/components/ui/pdf-viewer-skeleton';

function AgentClientInner({ userProfile }: { userProfile?: { name: string | null; age: number | null; gender: string | null } }) {
  const {
    pdfUrl,
    isPdfVisible,
    setIsPdfVisible,
    isChatLoading,
    simulation,
    setSimulation,
    processFile,
  } = useAgentContext();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pdfUrl) return;

    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pdfUrl) return;

    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && !pdfUrl) {
      await processFile(file);
    }
  };

  return (
    <div
      className="flex h-screen w-full flex-col bg-background relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {dragActive && !pdfUrl && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl transition-all duration-200 pointer-events-none">
          <div className="flex flex-col items-center gap-4 p-8 bg-background/80 rounded-2xl shadow-xl">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl animate-bounce">📄</span>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">Drop to Upload</p>
              <p className="text-sm text-muted-foreground mt-1">PDFs and Images supported</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <ChatHeader
        showSidebarToggle={true}
        onOpenSidebar={() => setIsSheetOpen(true)}
      />

      {/* Sidebar Drawer */}
      <ChatSidebar
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        userProfile={userProfile}
      />

      {/* Main Content Area: Single Column or Resizable Split Pane */}
      <div className="flex-1 flex overflow-hidden flex-col">
        <div className="flex flex-col h-full transition-all duration-300 w-full">
          {isPdfVisible && pdfUrl ? (
            <ResizableSplitPanel
              defaultLeftWidth={50}
              minLeftWidth={25}
              maxLeftWidth={75}
              leftContent={
                isChatLoading ? (
                  <PdfViewerSkeleton />
                ) : (
                  <PdfViewer url={pdfUrl} onClose={() => setIsPdfVisible(false)} />
                )
              }
              rightContent={
                <AssistantUiChat />
              }
            />
          ) : (
            <AssistantUiChat />
          )}

          {/* Dev Network Error & Latency Simulation Bar */}
          <DevSimulationConsole
            simulation={simulation}
            setSimulation={setSimulation}
          />
        </div>
      </div>
    </div>
  );
}

interface AgentClientPageProps {
  initialChatId?: string;
  initialHistory?: ChatSession[];
  initialMessages?: Message[];
  initialFileUrl?: string | null;
  userId: string;
  userProfile?: { name: string | null; age: number | null; gender: string | null };
}

export default function AgentClientPage({
  initialChatId,
  initialHistory,
  initialMessages,
  initialFileUrl,
  userId,
  userProfile,
}: AgentClientPageProps) {
  return (
    <AgentProvider
      initialChatId={initialChatId}
      initialHistory={initialHistory}
      initialMessages={initialMessages}
      initialFileUrl={initialFileUrl}
      userId={userId}
    >
      <AgentClientInner userProfile={userProfile} />
    </AgentProvider>
  );
}
