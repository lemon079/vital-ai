'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";
import { useUploadFile } from '@/hooks/use-upload-file';

// Types
import { Message, ChatSession, AgentContextType } from '@/types/chat';

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
    children: ReactNode;
    initialChatId?: string;
    initialHistory?: ChatSession[];
    initialMessages?: any[];
    initialFileUrl?: string | null;
    userId: string;
}

export function AgentProvider({
    children,
    initialChatId,
    initialHistory = [],
    initialMessages = [],
    initialFileUrl,
    userId
}: AgentProviderProps) {
    const router = useRouter();
    const pathname = usePathname();

    // Map initial messages if provided
    const initialMappedMessages: Message[] = initialMessages.length > 0
        ? initialMessages.map((m: any) => ({
            role: m.role.toLowerCase(),
            content: m.content,
            // Add fileInfo mapping if needed from DB
        }))
        : [
            { role: 'assistant', content: 'Hello! I am your Medical AI Assistant. Upload a lab report or ask me a health question.' }
        ];

    const [messages, setMessages] = useState<Message[]>(initialMappedMessages);
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedText, setSelectedText] = useState<string>('');
    const [pdfUrl, setPdfUrl] = useState<string | null>(initialFileUrl || null);
    const [isPdfVisible, setIsPdfVisible] = useState(!!initialFileUrl);
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null);
    const [chatHistory, setChatHistory] = useState<ChatSession[]>(initialHistory);

    const { uploadFile, isUploading: isFileUploading } = useUploadFile();
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        setChatHistory([]);
    }, []);

    useEffect(() => {
        if (initialChatId && initialChatId !== currentChatId) {
            setCurrentChatId(initialChatId);
        }
    }, [initialChatId]);

    const loadChat = async (chatId: string) => {
        if (!chatId) return;
        try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const chat = await res.json();
                const mappedMessages = chat.messages?.map((m: any) => ({
                    role: m.role.toLowerCase(),
                    content: m.content
                })) || [];
                setMessages(mappedMessages);
                setCurrentChatId(chat.id);
                if (chat.file_url) {
                    setPdfUrl(chat.file_url);
                    setIsPdfVisible(true);
                } else {
                    setPdfUrl(null);
                    setIsPdfVisible(false);
                }
            }
            if (!pathname.includes(chatId)) {
                router.push(`/agent/${chatId}`);
            }
        } catch (e) {
            toast.error("Failed to load chat");
        }
    };

    const handleNewChat = () => {
        setMessages([
            { role: 'assistant', content: 'Hello! I am your Medical AI Assistant. Upload a lab report or ask me a health question.' }
        ]);
        setInput('');
        setSelectedFile(null);
        setPdfUrl(null);
        setIsPdfVisible(false);
        setCurrentChatId(null);

        if (pathname !== '/agent') {
            router.push('/agent');
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
        });
    };

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() && !selectedFile) return;

        const userMsg = input || (selectedFile ? `[Uploaded: ${selectedFile.name}]` : '');
        setInput('');

        let fileData: { type: string; content: string } | null = null;
        let fileInfo: { name: string; type: 'pdf' | 'image' } | undefined = undefined;

        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                const base64 = await fileToBase64(selectedFile);
                fileData = { type: 'pdf', content: base64 };
                fileInfo = { name: selectedFile.name, type: 'pdf' };
            } else if (selectedFile.type.startsWith('image/')) {
                const base64 = await fileToBase64(selectedFile);
                fileData = { type: 'image', content: base64 };
                fileInfo = { name: selectedFile.name, type: 'image' };
            }
        }

        const newMessages: Message[] = [
            ...messages,
            {
                role: 'user',
                content: userMsg,
                fileInfo,
                selectedText: selectedText || undefined
            }
        ];
        setMessages(newMessages);
        setSelectedFile(null);
        setSelectedText(''); // Clear selection after sending

        setIsLoading(true);

        try {
            const payload = {
                messages: newMessages,
                fileData,
                userId: userId,
                chatId: currentChatId || undefined,
                selectedText: selectedText || undefined
            };

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            // Add AI response to messages
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);

            // Update chatId if needed
            if (data.chatId && data.chatId !== currentChatId) {
                setCurrentChatId(data.chatId);
                window.history.replaceState(null, '', `/agent/${data.chatId}`);
                fetchHistory(); // Refresh history to show new chat
            }

        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I am having trouble connecting to the medical brain right now.'
            }]);
            toast.error('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const processFile = async (file: File) => {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            setSelectedFile(file);
            
            // Build the user upload message representation
            const userUploadMsg = {
                role: 'user' as const,
                content: `[Uploaded: ${file.name}]`,
                fileInfo: { name: file.name, type: (file.type === 'application/pdf' ? 'pdf' : 'image') as any }
            };

            // Set message state to show user uploaded message + analyzing placeholder
            setMessages(prev => [
                ...prev,
                userUploadMsg,
                { role: 'assistant', content: 'Analyzing your report... Please wait.' }
            ]);

            const result = await uploadFile(file);

            if (result && result.success) {
                toast.success('File uploaded successfully');

                if (file.type === 'application/pdf') {
                    const url = result.fileUrl || URL.createObjectURL(file);
                    setPdfUrl(url);
                    setIsPdfVisible(true);
                    setSelectedFile(null);
                }

                const base64 = await fileToBase64(file);
                
                // Build updated messages array to send to the API (including the user upload message)
                const updatedMessages = [
                    ...messages,
                    userUploadMsg
                ];

                const payload = {
                    messages: updatedMessages,
                    fileData: {
                        type: file.type === 'application/pdf' ? 'pdf' : 'image',
                        content: base64
                    },
                    userId: userId,
                    chatId: currentChatId || undefined
                };

                setIsLoading(true);

                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to analyze report');
                    }

                    // Remove placeholder and add real response
                    setMessages(prev => {
                        const placeholderIndex = prev.findIndex(m => m.role === 'assistant' && m.content === 'Analyzing your report... Please wait.');
                        if (placeholderIndex !== -1) {
                            const newMsgs = [...prev];
                            newMsgs[placeholderIndex] = {
                                role: 'assistant',
                                content: data.response
                            };
                            return newMsgs;
                        }
                        return [...prev, { role: 'assistant', content: data.response }];
                    });

                    // Update chatId if needed
                    if (data.chatId && !currentChatId) {
                        setCurrentChatId(data.chatId);
                        window.history.replaceState(null, '', `/agent/${data.chatId}`);
                        fetchHistory();
                    }

                } catch (error: any) {
                    console.error('File processing error:', error);
                    setMessages(prev => {
                        const placeholderIndex = prev.findIndex(m => m.role === 'assistant' && m.content === 'Analyzing your report... Please wait.');
                        if (placeholderIndex !== -1) {
                            const newMsgs = [...prev];
                            newMsgs[placeholderIndex] = {
                                role: 'assistant',
                                content: 'Sorry, I failed to analyze the report.'
                            };
                            return newMsgs;
                        }
                        return [...prev, { role: 'assistant', content: 'Sorry, I failed to analyze the report.' }];
                    });
                    toast.error(error.message || 'Failed to analyze report');
                } finally {
                    setIsLoading(false);
                }

            } else {
                setMessages(prev => {
                    const placeholderIndex = prev.findIndex(m => m.role === 'assistant' && m.content === 'Analyzing your report... Please wait.');
                    if (placeholderIndex !== -1) {
                        const newMsgs = [...prev];
                        newMsgs[placeholderIndex] = {
                            role: 'assistant',
                            content: 'Upload failed. Please try again.'
                        };
                        return newMsgs;
                    }
                    return [...prev, { role: 'assistant', content: 'Upload failed. Please try again.' }];
                });
                setSelectedFile(null);
            }

        } else {
            toast.error('Please upload a PDF or image file');
        }
    };

    return (
        <AgentContext.Provider value={{
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
            isPending: isLoading,
            isUploading,
            isFileUploading,
            handleNewChat,
            loadChat,
            sendMessage,
            processFile,
            fileToBase64
        }}>
            {children}
        </AgentContext.Provider>
    );
}

export const useAgentContext = () => {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error('useAgentContext must be used within an AgentProvider');
    }
    return context;
};
