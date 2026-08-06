'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useTransition, useOptimistic } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from "sonner";
import { useUploadFile } from '@/hooks/use-upload-file';

// Types
import { Message, ChatSession, AgentContextType, ReasoningStep } from '@/types/chat';

type ChatHistoryAction =
    | { type: 'delete'; chatId: string }
    | { type: 'rename'; chatId: string; title: string };

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
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Retry and Simulation States
    const [lastRequestPayload, setLastRequestPayload] = useState<any | null>(null);
    const [lastRequestIsFileAnalysis, setLastRequestIsFileAnalysis] = useState<boolean>(false);
    const [showSlowWarning, setShowSlowWarning] = useState(false);
    const [simulation, setSimulation] = useState<string>('none');
    const [retryCount, setRetryCount] = useState<number>(0);
    const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [, startTransition] = useTransition();

    // Optimistic UI updates for chat history (dimming container while deleting or editing titles)
    const [optimisticChatHistory, setOptimisticChatHistory] = useOptimistic<
        ChatSession[],
        ChatHistoryAction
    >(
        chatHistory,
        (currentHistory, action) => {
            if (action.type === 'delete') {
                return currentHistory.map((chat) =>
                    chat.id === action.chatId ? { ...chat, isPending: true, pendingAction: 'delete' } : chat
                );
            }
            if (action.type === 'rename') {
                return currentHistory.map((chat) =>
                    chat.id === action.chatId ? { ...chat, title: action.title, isPending: true, pendingAction: 'rename' } : chat
                );
            }
            return currentHistory;
        }
    );

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/chats?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setChatHistory(data.chats || []);
            }
        } catch (e) {
            console.error("Failed to fetch history:", e);
        }
    }, [userId]);

    useEffect(() => {
        fetchHistory();
    }, [userId, fetchHistory]);

    useEffect(() => {
        if (initialChatId && initialChatId !== currentChatId) {
            setCurrentChatId(initialChatId);
        }
    }, [initialChatId, currentChatId]);

    const deleteChat = async (chatId: string) => {
        startTransition(async () => {
            setOptimisticChatHistory({ type: 'delete', chatId });
            try {
                const res = await fetch(`/api/chats/${chatId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    toast.success('Chat deleted successfully');
                    await fetchHistory();
                    if (currentChatId === chatId) {
                        handleNewChat();
                    }
                } else {
                    toast.error('Failed to delete chat');
                    await fetchHistory();
                }
            } catch (e) {
                console.error('Delete chat error:', e);
                toast.error('Failed to delete chat');
                await fetchHistory();
            }
        });
    };

    const renameChat = async (chatId: string, title: string) => {
        startTransition(async () => {
            setOptimisticChatHistory({ type: 'rename', chatId, title });
            try {
                const res = await fetch(`/api/chats/${chatId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title }),
                });
                if (res.ok) {
                    toast.success('Chat renamed successfully');
                    await fetchHistory();
                } else {
                    toast.error('Failed to rename chat');
                    await fetchHistory();
                }
            } catch (e) {
                console.error('Rename chat error:', e);
                toast.error('Failed to rename chat');
                await fetchHistory();
            }
        });
    };

    const loadChat = async (chatId: string) => {
        if (!chatId) return;
        setIsChatLoading(true);
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
                
                const resolvedFileUrl = chat.fileUrl || chat.file_url;
                if (resolvedFileUrl) {
                    setPdfUrl(resolvedFileUrl);
                    setIsPdfVisible(true);
                } else {
                    setPdfUrl(null);
                    setIsPdfVisible(false);
                }
            }
            if (!pathname.includes(chatId)) {
                router.push(`/chat/${chatId}`);
            }
        } catch (e) {
            toast.error("Failed to load chat");
        } finally {
            setIsChatLoading(false);
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

        if (pathname !== '/chat') {
            router.push('/chat');
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

    const makeChatRequest = async (payload: any, isFileAnalysis: boolean) => {
        setLastRequestPayload(payload);
        setLastRequestIsFileAnalysis(isFileAnalysis);

        setIsLoading(true);
        setShowSlowWarning(false);
        setRetryCount(0);
        setReasoningSteps([]);
        setCurrentSuggestions([]);
        setIsSuggestionsLoading(false);

        let finalError: any = null;

        for (let attempt = 0; attempt <= 5; attempt++) {
            if (attempt > 0) {
                setRetryCount(attempt);
                console.log(`[Auto-Retry] Starting attempt ${attempt}/5`);
                // Wait 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Abort any active request first
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const slowTimer = setTimeout(() => {
                setShowSlowWarning(true);
            }, 15000);

            const hardTimer = setTimeout(() => {
                controller.abort();
            }, 35000);

            try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                
                if (simulation === 'offline') {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    throw new TypeError('Failed to fetch');
                } else if (simulation === 'slow-response') {
                    headers['x-simulate-latency'] = '18000';
                } else if (simulation === 'timeout') {
                    headers['x-simulate-latency'] = '40000';
                } else if (simulation === 'rate-limit') {
                    headers['x-simulate-error'] = 'rate-limit';
                } else if (simulation === 'server') {
                    headers['x-simulate-error'] = '500';
                }

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(slowTimer);
                clearTimeout(hardTimer);

                if (!res.ok) {
                    let errorMessage = 'We encountered an unexpected issue connecting to the medical brain. Please try again.';
                    let errorType: 'rate-limit' | 'server' = 'server';
                    
                    if (res.status === 429) {
                        errorMessage = 'Model capacity or token limit exceeded. Please try simplifying your prompt or wait a moment before retrying.';
                        errorType = 'rate-limit';
                    }
                    
                    throw { isApiError: true, message: errorMessage, errorType, status: res.status };
                }

                const reader = res.body?.getReader();
                const decoder = new TextDecoder('utf-8');
                if (!reader) {
                    throw new Error('Failed to read response stream.');
                }

                let done = false;
                let buffer = '';
                let responseChatId = currentChatId;
                let responseFileUrl = null;

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) {
                        buffer += decoder.decode(value, { stream: !done });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('data: ')) {
                                const jsonStr = trimmed.substring(6).trim();
                                if (jsonStr) {
                                    try {
                                        const eventData = JSON.parse(jsonStr);
                                        if (eventData.type === 'metadata') {
                                            responseChatId = eventData.chatId || responseChatId;
                                            responseFileUrl = eventData.fileUrl || responseFileUrl;
                                        } else if (eventData.type === 'token') {
                                            const token = eventData.content;
                                            
                                            setMessages(prev => {
                                                const newMsgs = [...prev];
                                                if (isFileAnalysis) {
                                                    const idx = newMsgs.findIndex(m => m.role === 'assistant' && (m.content === 'Analyzing your report... Please wait.' || m.isStreaming));
                                                    if (idx !== -1) {
                                                        const currentContent = newMsgs[idx].content === 'Analyzing your report... Please wait.' ? '' : newMsgs[idx].content;
                                                        newMsgs[idx] = {
                                                            role: 'assistant',
                                                            content: currentContent + token,
                                                            isStreaming: true
                                                        };
                                                    } else {
                                                        newMsgs.push({
                                                            role: 'assistant',
                                                            content: token,
                                                            isStreaming: true
                                                        });
                                                    }
                                                } else {
                                                    const lastMsg = newMsgs[newMsgs.length - 1];
                                                    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                                                        newMsgs[newMsgs.length - 1] = {
                                                            ...lastMsg,
                                                            content: lastMsg.content + token
                                                        };
                                                    } else {
                                                        newMsgs.push({
                                                            role: 'assistant',
                                                            content: token,
                                                            isStreaming: true
                                                        });
                                                    }
                                                }
                                                return newMsgs;
                                            });
                                        } else if (eventData.type === 'reasoning') {
                                            const { node, label, status } = eventData;
                                            setReasoningSteps(prev => {
                                                const existingIdx = prev.findIndex(s => s.node === node);
                                                if (existingIdx !== -1) {
                                                    const updated = [...prev];
                                                    updated[existingIdx] = {
                                                        ...updated[existingIdx],
                                                        status,
                                                        completedAt: status === 'complete' ? Date.now() : undefined
                                                    };
                                                    return updated;
                                                } else {
                                                    return [...prev, {
                                                        node,
                                                        label,
                                                        status,
                                                        startedAt: Date.now(),
                                                        completedAt: status === 'complete' ? Date.now() : undefined
                                                    }];
                                                }
                                            });
                                         } else if (eventData.type === 'suggestions_loading') {
                                             setIsSuggestionsLoading(true);
                                         } else if (eventData.type === 'suggestions') {
                                             setIsSuggestionsLoading(false);
                                             if (Array.isArray(eventData.suggestions)) {
                                                 setCurrentSuggestions(eventData.suggestions);
                                             }
                                         } else if (eventData.type === 'error') {
                                            throw { isApiError: true, message: eventData.message, errorType: 'server' };
                                        }
                                    } catch (err) {
                                        console.error('Error parsing stream line:', err, trimmed);
                                    }
                                }
                            }
                        }
                    }
                }

                // Finalize messages by stripping isStreaming flag
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
                        newMsgs[newMsgs.length - 1] = {
                            role: 'assistant',
                            content: lastMsg.content
                        };
                    }
                    return newMsgs;
                });

                if (responseChatId && responseChatId !== currentChatId) {
                    setCurrentChatId(responseChatId);
                    window.history.replaceState(null, '', `/chat/${responseChatId}`);
                    fetchHistory();
                }

                // Succeeded, cleanup states and return
                setIsLoading(false);
                setShowSlowWarning(false);
                setRetryCount(0);
                abortControllerRef.current = null;
                return;

            } catch (error: any) {
                clearTimeout(slowTimer);
                clearTimeout(hardTimer);

                console.error(`Attempt ${attempt} failed:`, error);
                finalError = error;

                if (attempt < 5) {
                    // Reset slow response notice for next attempt
                    setShowSlowWarning(false);
                    continue;
                }
            }
        }

        // If we get here, all attempts failed
        console.error('All 5 retry attempts failed.');
        
        let errorMessage = 'We encountered an unexpected issue connecting to the medical brain. Please try again.';
        let errorType: 'timeout' | 'network' | 'rate-limit' | 'server' = 'server';

        if (finalError.name === 'AbortError') {
            errorMessage = 'The medical brain took too long to respond (timeout). Please try again.';
            errorType = 'timeout';
        } else if (finalError instanceof TypeError && finalError.message === 'Failed to fetch') {
            errorMessage = 'Network connection lost. Please verify your internet connection and try again.';
            errorType = 'network';
        } else if (finalError.isApiError) {
            errorMessage = finalError.message;
            errorType = finalError.errorType;
        }

        // Display error bubble
        if (isFileAnalysis) {
            setMessages(prev => {
                const placeholderIndex = prev.findIndex(m => m.role === 'assistant' && m.content === 'Analyzing your report... Please wait.');
                if (placeholderIndex !== -1) {
                    const newMsgs = [...prev];
                    newMsgs[placeholderIndex] = {
                        role: 'assistant',
                        content: errorMessage,
                        isError: true,
                        errorType
                    };
                    return newMsgs;
                }
                return [...prev, {
                    role: 'assistant',
                    content: errorMessage,
                    isError: true,
                    errorType
                }];
            });
        } else {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage,
                isError: true,
                errorType
            }]);
        }

        toast.error('Failed to get response after 5 retries');
        setIsLoading(false);
        setShowSlowWarning(false);
        setRetryCount(0);
        abortControllerRef.current = null;
    };

    const handleRetry = async () => {
        if (!lastRequestPayload) return;

        // Remove the error message from messages
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isError) {
                return prev.slice(0, -1);
            }
            return prev;
        });

        if (lastRequestIsFileAnalysis) {
            // Restore placeholder message
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Analyzing your report... Please wait.' }
            ]);
        }

        await makeChatRequest(lastRequestPayload, lastRequestIsFileAnalysis);
    };

    const sendMessage = async (e?: React.FormEvent | string, textOverride?: string) => {
        let textPrompt = input;
        if (typeof e === 'string') {
            textPrompt = e;
        } else if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        if (textOverride) {
            textPrompt = textOverride;
        }

        if (!textPrompt.trim() && !selectedFile) return;

        const userMsg = textPrompt || (selectedFile ? `[Uploaded: ${selectedFile.name}]` : '');
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

        const payload = {
            messages: newMessages,
            fileData,
            userId: userId,
            chatId: currentChatId || undefined,
            selectedText: selectedText || undefined
        };

        await makeChatRequest(payload, false);
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
                    filePath: result.filePath,
                    fileUrl: result.fileUrl,
                    userId: userId,
                    chatId: currentChatId || undefined
                };

                await makeChatRequest(payload, true);

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
            chatHistory: optimisticChatHistory,
            isPending: isLoading,
            isChatLoading,
            isUploading,
            isFileUploading,
            showSlowWarning,
            retryCount,
            simulation,
            setSimulation,
            reasoningSteps,
            currentSuggestions,
            isSuggestionsLoading,
            handleNewChat,
            loadChat,
            sendMessage,
            processFile,
            fileToBase64,
            handleRetry,
            deleteChat,
            renameChat
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
