'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";
import { useAgent } from '@/hooks/use-agent';
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
    const [pdfUrl, setPdfUrl] = useState<string | null>(initialFileUrl || null);
    const [isPdfVisible, setIsPdfVisible] = useState(!!initialFileUrl);
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null);
    const [chatHistory, setChatHistory] = useState<ChatSession[]>(initialHistory);

    const { mutate, isPending } = useAgent();
    const { uploadFile, isUploading: isFileUploading } = useUploadFile();
    const [isUploading, setIsUploading] = useState(false);

    // Auth removed, using hardcoded ID
    // const userId = CURRENT_USER_ID;

    const fetchHistory = useCallback(async () => {
        // History disabled for now
        /*
        try {
            const res = await fetch(`/api/chats?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setChatHistory(data.chats || []);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
        */
        setChatHistory([]);
    }, []);

    // Fetch history only if we don't have it (client side navigation)
    useEffect(() => {
        // Disabled history fetching
        // if (chatHistory.length === 0) {
        //     fetchHistory();
        // }
    }, [fetchHistory]); // Run once on mount if empty

    // Load initial chat if provided and different from current
    // We use a ref or check to avoid double loading
    useEffect(() => {
        if (initialChatId && initialChatId !== currentChatId) {
            // Avoid loading if we already have messages for this ID (simple cache check)
            // But actually we might want to refresh. 
            // Ideally `loadChat` handles the "am I already loading or loaded" check.
            loadChatInternal(initialChatId);
        }
    }, [initialChatId]);


    const loadChatInternal = useCallback(async (chatId: string) => {
        try {
            // Optimistic update
            setCurrentChatId(chatId);

            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages) {
                    const mapped = data.messages.map((m: any) => ({
                        role: m.role.toLowerCase(),
                        content: m.content
                    }));
                    setMessages(mapped);

                    if (data.fileUrl) {
                        setPdfUrl(data.fileUrl);
                        setIsPdfVisible(true);
                    } else {
                        setPdfUrl(null);
                        setIsPdfVisible(false);
                    }
                    // toast.success("Loaded chat history");
                }
            }
        } catch (e) {
            toast.error("Failed to load chat");
        }
    }, []);

    const loadChat = async (chatId: string) => {
        // If clicking on sidebar, we update URL and let the page effect handle the load?
        // OR we load directly and update URL shallowly.

        // Strategy: Load data first, then update URL to match.
        await loadChatInternal(chatId);

        // Push URL if needed
        if (pathname !== `/agent/${chatId}`) {
            router.push(`/agent/${chatId}`);
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

        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg, fileInfo }];
        setMessages(newMessages);
        setSelectedFile(null);

        const payload = {
            message: userMsg,
            history: newMessages,
            fileData,
            userId: userId,
            chatId: currentChatId || undefined
        };

        mutate(payload, {
            onSuccess: (data) => {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
                if (data.chatId && data.chatId !== currentChatId) {
                    setCurrentChatId(data.chatId);
                    // Update URL silently if it's new
                    window.history.replaceState(null, '', `/agent/${data.chatId}`);
                    // Refresh history list to show the new chat
                    fetchHistory();
                }
            },
            onError: () => {
                setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the medical brain right now.' }]);
            }
        });
    };

    const processFile = async (file: File) => {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            setSelectedFile(file);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Analyzing your report... Please wait.' }]);

            const result = await uploadFile(file);

            if (result && result.success) {
                toast.success('File uploaded successfully');

                if (file.type === 'application/pdf') {
                    const url = result.fileUrl || URL.createObjectURL(file);
                    setPdfUrl(url);
                    setIsPdfVisible(true);
                    setSelectedFile(null); // Clear the chip above input
                }

                const base64 = await fileToBase64(file);
                let fileData: { type: string; content: string } | null = null;

                if (file.type === 'application/pdf') {
                    fileData = { type: 'pdf', content: base64 };
                } else {
                    fileData = { type: 'image', content: base64 };
                }

                const autoMsg = "Please analyze this uploaded report.";

                const payload = {
                    message: autoMsg,
                    history: [],
                    fileData,
                    userId: userId,
                    chatId: currentChatId || undefined
                };

                mutate(payload, {
                    onSuccess: (data) => {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                        if (data.chatId) {
                            setCurrentChatId(data.chatId);
                            window.history.replaceState(null, '', `/agent/${data.chatId}`);
                            if (!currentChatId) {
                                fetchHistory();
                            }
                        }
                    },
                    onError: () => {
                        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I failed to analyze the report.' }]);
                    }
                });

            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Upload failed. Please try again.' }]);
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
