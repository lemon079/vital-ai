'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Menu, MoreVertical } from 'lucide-react';
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
}

export default function AgentPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your Medical AI Assistant. Upload a lab report or ask me a health question.' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { mutate, isPending } = useAgent();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isPending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);

        mutate({ message: userMsg, history: newMessages }, {
            onSuccess: (data) => {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
            },
            onError: () => {
                setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the medical brain right now.' }]);
            }
        });
    };

    const handleFileUpload = () => {
        toast.info("File upload feature coming soon!");
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

                            <div
                                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-card text-card-foreground border rounded-tl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isPending && (
                        <div className="flex gap-4 justify-start">
                            <Avatar className="h-8 w-8 mt-1 border bg-card shadow-sm">
                                <AvatarFallback className="text-primary"><Bot size={16} /></AvatarFallback>
                            </Avatar>
                            <div className="bg-card border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                                <div className="space-y-2.5 w-[120px]">
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
                            disabled={isPending || !input.trim()}
                            className={`h-10 w-10 shrink-0 rounded-full transition-all ${!input.trim() ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                                }`}
                        >
                            <Send size={18} className={input.trim() ? "ml-0.5" : ""} />
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
