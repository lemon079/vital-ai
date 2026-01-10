'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Menu, MoreVertical, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgent } from '@/hooks/use-agent';
import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import { ModeToggle } from '@/components/mode-toggle';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    fileInfo?: {
        name: string;
        type: 'pdf' | 'image';
    };
}

export default function AgentPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your Medical AI Assistant. Upload a lab report or ask me a health question.' }
    ]);
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate, isPending } = useAgent();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isPending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !selectedFile) return;

        const userMsg = input || (selectedFile ? `[Uploaded: ${selectedFile.name}]` : '');
        setInput('');
        
        let fileData: { type: string; content: string } | null = null;
        let fileInfo: { name: string; type: 'pdf' | 'image' } | undefined = undefined;
        
        // Process file if selected
        if (selectedFile) {
            try {
                if (selectedFile.type === 'application/pdf') {
                    // For PDF, we'll send the file as base64 and process on server
                    const base64 = await fileToBase64(selectedFile);
                    fileData = { type: 'pdf', content: base64 };
                    fileInfo = { name: selectedFile.name, type: 'pdf' };
                } else if (selectedFile.type.startsWith('image/')) {
                    // For images, send as base64
                    const base64 = await fileToBase64(selectedFile);
                    fileData = { type: 'image', content: base64 };
                    fileInfo = { name: selectedFile.name, type: 'image' };
                }
            } catch (error) {
                toast.error('Failed to process file. Please try again.');
                return;
            }
        }

        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg, fileInfo }];
        setMessages(newMessages);
        setSelectedFile(null);

        mutate({ message: userMsg, history: newMessages, fileData }, {
            onSuccess: (data) => {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
            },
            onError: () => {
                setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the medical brain right now.' }]);
            }
        });
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
        });
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                setSelectedFile(file);
                toast.success(`File "${file.name}" selected`);
            } else {
                toast.error('Please upload a PDF or image file');
            }
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between border-b bg-background px-6 py-4 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground leading-tight">Medical Guardian</h1>
                        <p className="text-xs text-muted-foreground font-medium">Always here to help</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreVertical size={20} />
                    </Button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
                <div className="mx-auto max-w-3xl space-y-6">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
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
                                <div
                                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-card text-card-foreground border rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
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
                                <div className="space-y-2.5 w-30">
                                    <Skeleton className="h-2 w-full" />
                                    <Skeleton className="h-2 w-[70%]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <div className="border-t bg-background p-4 sm:p-6 pb-8">
                <div className="mx-auto max-w-3xl">
                    {selectedFile && (
                        <div className="mb-3 flex items-center gap-3 bg-muted/50 border rounded-lg px-4 py-2.5 text-sm">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                {selectedFile.type === 'application/pdf' ? (
                                    <FileText size={18} className="text-primary" />
                                ) : (
                                    <ImageIcon size={18} className="text-primary" />
                                )}
                            </div>
                            <span className="flex-1 truncate font-medium">{selectedFile.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                                className="h-6 px-2 text-muted-foreground hover:text-destructive"
                            >
                                ✕
                            </Button>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <form onSubmit={handleSubmit} className="relative flex items-center gap-3 bg-muted/30 p-2 rounded-full border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-background"
                            onClick={handleFileUpload}
                            title="Upload PDF or Image"
                        >
                            <Paperclip size={20} />
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your health question..."
                            className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground h-10"
                        />

                        <Button
                            type="submit"
                            size="icon"
                            disabled={isPending || (!input.trim() && !selectedFile)}
                            className={`h-10 w-10 shrink-0 rounded-full transition-all ${(!input.trim() && !selectedFile) ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                                }`}
                        >
                            <Send size={18} className={(input.trim() || selectedFile) ? "ml-0.5" : ""} />
                        </Button>
                    </form>
                    <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        AI assistance only • Consult a Doctor for diagnosis
                    </p>
                </div>
            </div>
        </div>
    );
}
