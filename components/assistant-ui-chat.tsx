'use client';

import { useCallback, useMemo, useRef, useEffect } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useAgentContext } from "@/context/agent-context";
import { CustomMessageBubble } from "@/components/ui/assistant-ui/message-bubbles";
import { CustomComposer } from "@/components/ui/assistant-ui/composer";
import { ThreadWelcome } from "@/components/ui/assistant-ui/thread";
import { FollowUpSuggestions } from "@/components/ui/assistant-ui/follow-up-suggestions";
import { SelectionToolbar } from "@/components/ui/assistant-ui/selection-toolbar";
import { ReasoningIndicator } from "@/components/ui/assistant-ui/reasoning";
import { SuggestionsLoadingSkeleton } from "@/components/ui/assistant-ui/suggestions-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatThreadSkeleton } from "@/components/ui/chat-thread-skeleton";

export function AssistantUiChat() {
  const {
    messages,
    input,
    setInput,
    selectedFile,
    setSelectedFile,
    selectedText,
    setSelectedText,
    pdfUrl,
    currentChatId,
    isPending,
    isChatLoading,
    reasoningSteps,
    currentSuggestions,
    sendMessage,
    processFile,
    handleRetry,
    isSuggestionsLoading,
  } = useAgentContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { handleMouseUp, toolbar } = SelectionToolbar({
    onQuote: (text) => setSelectedText(text),
  });

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const textContent = message.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");

      if (textContent.trim()) {
        await sendMessage(textContent);
      }
    },
    [sendMessage],
  );

  const threadMessages: ThreadMessageLike[] = useMemo(() => {
    return messages.map((m, idx) => ({
      id: `msg-${idx}`,
      role: m.role === "user" ? "user" : "assistant",
      content: [{ type: "text", text: m.content }],
    }));
  }, [messages]);

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    onNew,
    isRunning: isPending,
    convertMessage: (m) => m,
  });

  const handleFormSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || selectedFile) {
      sendMessage(e);
    }
  };

  const handleSelectSuggestedPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const visibleMessages = messages.filter(
    (msg) => msg.role !== "system" && msg.role !== "tool",
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Auto-scroll to bottom when a chat thread is selected/rendered or messages update
  useEffect(() => {
    if (!isChatLoading && visibleMessages.length > 0) {
      // Immediate scroll to bottom on initial render/selection, smooth scroll on updates
      const timer = setTimeout(() => {
        scrollToBottom("smooth");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentChatId, visibleMessages.length, isChatLoading, scrollToBottom]);

  if (isChatLoading) {
    return <ChatThreadSkeleton />;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background">
        {toolbar}

        <ScrollArea className="flex-1">
          <main
            className="p-4 sm:p-6 scroll-smooth flex flex-col min-h-full"
            onMouseUp={handleMouseUp}
          >
              <div className="mx-auto max-w-3xl w-full flex-1 flex flex-col space-y-6">
                {visibleMessages.length === 0 ? (
                  <ThreadWelcome onSelectPrompt={handleSelectSuggestedPrompt} />
                ) : (
                  visibleMessages.map((msg, idx) => (
                    <CustomMessageBubble
                      key={idx}
                      role={msg.role === "user" ? "user" : "assistant"}
                      content={msg.content}
                      fileInfo={msg.fileInfo}
                      selectedText={msg.selectedText}
                      isError={msg.isError}
                      errorType={msg.errorType}
                      onRetry={handleRetry}
                    />
                  ))
                )}

                {/* Reasoning Trace Component */}
                <ReasoningIndicator steps={reasoningSteps} isActive={isPending} />

                {/* Follow-up Suggestions */}
                {isSuggestionsLoading && currentSuggestions.length === 0 && (
                  <div className="pt-2">
                    <SuggestionsLoadingSkeleton />
                  </div>
                )}
                {!isPending && !isSuggestionsLoading && currentSuggestions.length > 0 && (
                  <div className="pt-2">
                    <FollowUpSuggestions
                      suggestions={currentSuggestions}
                      onSelect={(prompt) => sendMessage(prompt)}
                      disabled={isPending}
                    />
                  </div>
                )}

                {/* Scroll Target Anchor */}
                <div ref={messagesEndRef} className="h-px w-full shrink-0" />
              </div>
            </main>
          </ScrollArea>

          <CustomComposer
            input={input}
            setInput={setInput}
            selectedText={selectedText}
            setSelectedText={setSelectedText}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            pdfUrl={pdfUrl}
            isPending={isPending}
            onSend={handleFormSend}
            onFileUpload={() => {}}
            onFileChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await processFile(file);
              }
            }}
          />
      </div>
    </AssistantRuntimeProvider>
  );
}
