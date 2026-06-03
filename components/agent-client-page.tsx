'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Paperclip, Bot, User, Menu, FileText, ImageIcon, Plus, X, Highlighter, WifiOff, AlertTriangle, RotateCcw, Pencil, Trash2, Check, LogOut } from 'lucide-react';
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
import { preprocessMessageContent } from '@/lib/utils';
import { logout } from '@/lib/services/actions';

function AgentClientInner({ userProfile }: { userProfile?: { name: string | null; age: number | null; gender: string | null } }) {
    const {
        messages,
        input,
        setInput,
        selectedFile,
        setSelectedFile,
        selectedText,
        setSelectedText,
        pdfUrl,
        isPdfVisible,
        setIsPdfVisible,
        currentChatId,
        chatHistory,
        isPending,
        isUploading,
        isFileUploading,
        showSlowWarning,
        retryCount,
        simulation,
        setSimulation,
        handleNewChat,
        loadChat,
        sendMessage,
        processFile,
        handleRetry,
        deleteChat,
        renameChat,
    } = useAgentContext();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState<string>('');
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

    const router = useRouter();
    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };
    
    useEffect(()=>{
        console.log("pdfURL: ", pdfUrl)
    },[pdfUrl])

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Floating tooltip for text selection
    const [pendingText, setPendingText] = useState<string>('');
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const handleHighlight = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 0) {
            const range = selection!.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setPendingText(text);
            setTooltipPos({
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
            });
        } else {
            setPendingText('');
            setTooltipPos(null);
        }
    }, []);

    const confirmSelection = useCallback(() => {
        setSelectedText(pendingText);
        setPendingText('');
        setTooltipPos(null);
        window.getSelection()?.removeAllRanges();
    }, [pendingText, setSelectedText]);

    // Dismiss tooltip on click elsewhere
    useEffect(() => {
        const dismiss = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-select-tooltip]')) {
                setPendingText('');
                setTooltipPos(null);
            }
        };
        document.addEventListener('mousedown', dismiss);
        return () => document.removeEventListener('mousedown', dismiss);
    }, []);

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
            {/* Floating "Select text" tooltip */}
            {tooltipPos && pendingText && (
                <div
                    data-select-tooltip
                    className="fixed z-100"
                    style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <button
                        onClick={confirmSelection}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium shadow-md hover:bg-foreground/90 transition-colors cursor-pointer"
                    >
                        <Highlighter size={12} />
                        Select text
                    </button>
                    <div className="flex justify-center -mt-px">
                        <div className="size-2.5 rotate-45 rounded-[2px] bg-foreground" />
                    </div>
                </div>
            )}

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
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[260px] sm:w-[280px] flex flex-col h-full">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" />
                                        VitalSense Agent
                                    </SheetTitle>
                                    <SheetDescription>
                                        Manage your health conversations
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-6 flex-1 flex flex-col overflow-hidden">
                                    <Button
                                        onClick={() => {
                                            handleNewChat();
                                            setIsSheetOpen(false);
                                        }}
                                        variant="outline"
                                        className="w-full gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors shrink-0"
                                    >
                                        <Plus className="h-4 w-4" />
                                        New Chat
                                    </Button>

                                    <div className="mt-8 flex-1 flex flex-col overflow-hidden">
                                        <h3 className="mb-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                                            Recent History
                                        </h3>
                                        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                                            {chatHistory.length === 0 ? (
                                                <div className="px-2 py-6 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-center">
                                                    <p className="font-semibold text-xs">No chats yet</p>
                                                    <p className="text-[10px] text-muted-foreground/80 mt-1">Start a conversation to see history</p>
                                                </div>
                                            ) : (
                                                chatHistory.map((chat) => {
                                                    const isActive = currentChatId === chat.id;
                                                    const isEditing = editingChatId === chat.id;
                                                    const isDeleting = deletingChatId === chat.id;

                                                    if (isEditing) {
                                                        return (
                                                            <div key={chat.id} className="flex items-center gap-1 w-full px-2 py-1 bg-muted/50 rounded-lg border border-border">
                                                                <Input
                                                                    value={editTitle}
                                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                                    className="h-7 text-xs flex-1 bg-background px-2"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            if (editTitle.trim()) {
                                                                                renameChat(chat.id, editTitle.trim());
                                                                                setEditingChatId(null);
                                                                            }
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingChatId(null);
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                                                    onClick={() => {
                                                                        if (editTitle.trim()) {
                                                                            renameChat(chat.id, editTitle.trim());
                                                                            setEditingChatId(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setEditingChatId(null)}
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    }

                                                    if (isDeleting) {
                                                        return (
                                                            <div key={chat.id} className="flex items-center justify-between w-full px-2 py-1 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-xs">
                                                                <span className="font-semibold px-1">Delete chat?</span>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                                                        onClick={() => {
                                                                            deleteChat(chat.id);
                                                                            setDeletingChatId(null);
                                                                        }}
                                                                        title="Confirm Delete"
                                                                    >
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                        onClick={() => setDeletingChatId(null)}
                                                                        title="Cancel Delete"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={chat.id}
                                                            className={`group flex items-center justify-between w-full rounded-lg text-left text-sm transition-all duration-200 ${
                                                                isActive
                                                                    ? 'bg-primary/5 text-primary border-l-2 border-l-primary font-semibold'
                                                                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    loadChat(chat.id);
                                                                    setIsSheetOpen(false);
                                                                }}
                                                                className="flex-1 px-3 py-2 truncate text-left cursor-pointer"
                                                                title={chat.title}
                                                            >
                                                                {chat.title}
                                                            </button>
                                                            <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingChatId(chat.id);
                                                                        setEditTitle(chat.title);
                                                                    }}
                                                                    title="Rename Chat"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeletingChatId(chat.id);
                                                                    }}
                                                                    title="Delete Chat"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Pinned User Profile & Sign Out Section */}
                                <div className="mt-auto border-t border-border pt-4 pb-2 flex items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <Avatar className="h-9 w-9 border border-border bg-primary/5 text-primary shrink-0 shadow-sm">
                                            <AvatarFallback className="font-semibold text-sm">
                                                {(userProfile?.name?.[0] || 'U').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col text-left overflow-hidden">
                                            <span className="text-sm font-semibold text-foreground truncate leading-tight">
                                                {userProfile?.name || 'User Profile'}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground truncate">
                                                {userProfile?.age ? `${userProfile?.age} yrs` : 'Signed In'}
                                                {userProfile?.gender && userProfile?.gender !== 'Not Specified' ? ` • ${userProfile.gender}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
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
                    <ModeToggle />
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden flex-col">
                <div className="flex flex-col h-full transition-all duration-300 w-full">
                    <main
                        className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth"
                        style={{ scrollbarGutter: 'stable' }}
                        onMouseUp={handleHighlight}
                    >
                        <div className="mx-auto max-w-3xl space-y-6">
                            {messages.filter(msg => msg.role !== 'system' && msg.role !== 'tool').map((msg, idx) => {
                                // Dynamically resolve file info from message content if missing from state (e.g. on database reload)
                                const uploadMatch = msg.content ? msg.content.match(/^\[Uploaded:\s*([^\]]+)\]/i) : null;
                                const derivedFileInfo = msg.fileInfo || (uploadMatch ? {
                                    name: uploadMatch[1],
                                    type: /\.pdf$/i.test(uploadMatch[1]) ? 'pdf' as const : 'image' as const
                                } : undefined);

                                // Clean message content to check if the user typed text themselves
                                const cleanedContent = msg.role === 'user'
                                    ? msg.content.replace(/^\[Uploaded:\s*([^\]]+)\]/i, '').replace(/\[SYSTEM:\s*[^\]]+\]/g, '').trim()
                                    : msg.content;

                                const shouldShowBubble = !msg.role || msg.role !== 'user' || cleanedContent.length > 0;

                                return (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar className={`h-8 w-8 mt-1 border shadow-sm ${msg.role === 'assistant' ? 'bg-card' : 'bg-primary/5'}`}>
                                            <AvatarFallback className={msg.role === 'assistant' ? 'text-primary' : 'text-muted-foreground'}>
                                                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                            {derivedFileInfo && (
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                                                        {derivedFileInfo.type === 'pdf' ? (
                                                            <FileText size={14} className="text-primary" />
                                                        ) : (
                                                            <ImageIcon size={14} className="text-primary" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium truncate max-w-[200px]">{derivedFileInfo.name}</span>
                                                </div>
                                            )}
                                            {msg.selectedText && (
                                                <div className="mb-2 pl-3 border-l-2 border-primary/30">
                                                    <p className="text-xs text-muted-foreground italic line-clamp-3">
                                                        "{msg.selectedText}"
                                                    </p>
                                                </div>
                                            )}
                                            {msg.isError ? (
                                                <div className="rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none flex flex-col gap-3 max-w-md">
                                                    <div className="flex items-start gap-2.5">
                                                        {msg.errorType === 'network' ? (
                                                            <WifiOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                                        ) : (
                                                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                                        )}
                                                        <p className="font-medium text-destructive/90">{msg.content}</p>
                                                    </div>
                                                    <Button 
                                                        onClick={handleRetry} 
                                                        type="button"
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="w-fit gap-1.5 border-destructive/30 hover:text-destructive text-destructive font-semibold bg-background hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Retry Request
                                                    </Button>
                                                </div>
                                            ) : (
                                                shouldShowBubble && (
                                                    <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground border rounded-tl-none'}`}>
                                                        <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-sm max-w-none wrap-break-word`}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {preprocessMessageContent(cleanedContent)}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isPending && (
                                <div className="flex gap-4 justify-start">
                                    <Avatar className="h-8 w-8 mt-1 border bg-card shadow-sm">
                                        <AvatarFallback className="text-primary"><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-card border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                                        <span className="text-sm font-medium text-muted-foreground animate-pulse">
                                            {retryCount > 0 
                                                ? `Connection issue. Retrying (Attempt ${retryCount} of 5)...` 
                                                : showSlowWarning 
                                                    ? "The medical brain is working on a complex response, please wait..." 
                                                    : "thinking..."
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </main>

                    <div className="border-t bg-background p-4 sm:p-6 pb-8">
                        <div className="mx-auto max-w-3xl">
                            {/* Selected Text Badge */}
                            {selectedText && (
                                <div className="mb-3 flex items-center justify-between gap-3 px-3 py-2 bg-muted/40 border border-border/50 rounded-md">
                                    <p className="text-xs text-muted-foreground italic truncate flex-1 pl-1 border-l-2 border-primary/30">
                                        "{selectedText}"
                                    </p>
                                    <button
                                        onClick={() => setSelectedText('')}
                                        className="h-6 w-6 rounded-full hover:bg-muted-foreground/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                                        title="Clear selection"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
                            <form onSubmit={sendMessage} className="relative flex items-center gap-3 bg-muted/30 p-2 rounded-full border border-border focus-within:border-gray-300 transition-all shadow-sm">
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

                                <Button type="submit" size="icon" disabled={isPending || (!input.trim() && !selectedFile)} className={`size-10 shrink-0 rounded-full ${(!input.trim() && !selectedFile) ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'}`}>
                                    <Send size={18} className={(input.trim() || selectedFile) ? "ml-0.5" : ""} />
                                </Button>
                            </form>
                            <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                AI assistance only • Consult a Doctor for diagnosis
                            </p>

                            {process.env.NODE_ENV === 'development' && (
                                <div className="mt-4 p-3 bg-muted/40 border rounded-lg text-xs flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                                        <span>Simulation Console</span>
                                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded text-center leading-none">DEV ONLY</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: 'Normal', value: 'none' },
                                            { label: 'Offline', value: 'offline' },
                                            { label: 'Slow Network (18s)', value: 'slow-response' },
                                            { label: 'Timeout (40s)', value: 'timeout' },
                                            { label: 'Rate Limit (429)', value: 'rate-limit' },
                                            { label: 'Server Error (500)', value: 'server' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setSimulation(opt.value)}
                                                className={`px-2.5 py-1 rounded transition-colors border font-medium ${
                                                    simulation === opt.value
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
    userProfile?: { name: string | null; age: number | null; gender: string | null };
}

export default function AgentClientPage({
    initialChatId,
    initialHistory,
    initialMessages,
    initialFileUrl,
    userId,
    userProfile
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
