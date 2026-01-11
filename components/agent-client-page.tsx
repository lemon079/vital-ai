'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Bot, User, Menu, FileText, ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/mode-toggle';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { AgentProvider, useAgentContext } from '@/context/agent-context';

function AgentClientInner() {
    const {
        messages,
        input,
        setInput,
        selectedFile,
        setSelectedFile,
        pdfUrl,
        isPdfVisible,
        setIsPdfVisible,
        currentChatId,
        chatHistory,
        isPending,
        isUploading,
        isFileUploading,
        handleNewChat,
        loadChat,
        sendMessage,
        processFile,
    } = useAgentContext();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isPending]);


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const [dragActive, setDragActive] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setDragActive(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !pdfUrl) {
            await processFile(file);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (pdfUrl) return;
        const file = e.target.files?.[0];
        if (file) {
            await processFile(file);
        }
    };

    return (
        <div
            className="flex h-screen w-full flex-col bg-background relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {dragActive && !pdfUrl && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl transition-all duration-200 pointer-events-none">
                    <div className="flex flex-col items-center gap-4 p-8 bg-background/80 rounded-2xl shadow-xl">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-primary animate-bounce" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-primary">Drop to Upload</p>
                            <p className="text-sm text-muted-foreground mt-1">PDFs and Images supported</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {(isUploading || isFileUploading) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-lg font-medium text-foreground">Uploading Report...</p>
                    </div>
                </div>
            )}

            <header className="flex items-center justify-between border-b bg-background px-6 py-4 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {mounted ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" />
                                        VitalSense Agent
                                    </SheetTitle>
                                    <SheetDescription>
                                        Manage your health conversations
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-6">
                                    <Button onClick={handleNewChat} className="w-full justify-start gap-2" size="lg">
                                        <Plus className="h-5 w-5" />
                                        New Chat
                                    </Button>

                                    <div className="mt-8">
                                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Recent History
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="px-2 py-4 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-center">
                                                <p>Chat History</p>
                                                <p className="text-xs font-semibold mt-1">Coming Soon</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="w-10 h-10 -ml-2 mr-2" />
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
                    {pdfUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPdfVisible(!isPdfVisible)}
                            className="hidden sm:flex items-center gap-2 text-xs"
                        >
                            <FileText size={14} />
                            {isPdfVisible ? 'Hide PDF' : 'Show PDF'}
                        </Button>
                    )}
                    <ModeToggle />
                </div>
            </header>

            <div className={`flex-1 flex overflow-hidden ${pdfUrl && isPdfVisible ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                {pdfUrl && isPdfVisible && (
                    <div className="w-full lg:w-1/2 border-r bg-muted/20 p-4 animation-fade-in flex-1 lg:flex-none h-1/2 lg:h-full">
                        <div className="h-full w-full rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center shrink-0">
                                <span className="text-xs font-medium text-muted-foreground">PDF Preview</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsPdfVisible(false)}>
                                    <Menu size={14} />
                                </Button>
                            </div>
                            <iframe
                                src={pdfUrl}
                                className="w-full flex-1"
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                )}

                <div className={`flex flex-col h-full transition-all duration-300 ${pdfUrl && isPdfVisible ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full'}`}>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
                        <div className="mx-auto max-w-3xl space-y-6">
                            {messages.filter(msg => msg.role !== 'system' && msg.role !== 'tool').map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <Avatar className={`h-8 w-8 mt-1 border shadow-sm ${msg.role === 'assistant' ? 'bg-card' : 'bg-primary/5'}`}>
                                        <AvatarFallback className={msg.role === 'assistant' ? 'text-primary' : 'text-muted-foreground'}>
                                            {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                        {msg.fileInfo && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
                                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                                                    {msg.fileInfo.type === 'pdf' ? (
                                                        <FileText size={14} className="text-primary" />
                                                    ) : (
                                                        <ImageIcon size={14} className="text-primary" />
                                                    )}
                                                </div>
                                                <span className="font-medium truncate max-w-[200px]">{msg.fileInfo.name}</span>
                                            </div>
                                        )}
                                        <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground border rounded-tl-none'}`}>
                                            <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-sm max-w-none wrap-break-word`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isPending && (
                                <div className="flex gap-4 justify-start">
                                    <Avatar className="h-8 w-8 mt-1 border bg-card shadow-sm">
                                        <AvatarFallback className="text-primary"><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-card border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                                        <span className="text-sm font-medium text-muted-foreground animate-pulse">thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </main>

                    <div className="border-t bg-background p-4 sm:p-6 pb-8">
                        <div className="mx-auto max-w-3xl">
                            <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
                            <form onSubmit={sendMessage} className="relative flex items-center gap-3 bg-muted/30 p-2 rounded-full border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={`h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-background ${pdfUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleFileUpload}
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

                                <Button type="submit" size="icon" disabled={isPending || (!input.trim() && !selectedFile)} className={`h-10 w-10 shrink-0 rounded-full transition-all ${(!input.trim() && !selectedFile) ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'}`}>
                                    <Send size={18} className={(input.trim() || selectedFile) ? "ml-0.5" : ""} />
                                </Button>
                            </form>
                            <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                AI assistance only • Consult a Doctor for diagnosis
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { ChatSession, Message } from '@/types/chat';

interface AgentClientPageProps {
    initialChatId?: string;
    initialHistory?: ChatSession[];
    initialMessages?: Message[];
    initialFileUrl?: string | null;
    userId: string;
}

export default function AgentClientPage({
    initialChatId,
    initialHistory,
    initialMessages,
    initialFileUrl,
    userId
}: AgentClientPageProps) {
    return (
        <AgentProvider
            initialChatId={initialChatId}
            initialHistory={initialHistory}
            initialMessages={initialMessages}
            initialFileUrl={initialFileUrl}
            userId={userId}
        >
            <AgentClientInner />
        </AgentProvider>
    );
}
