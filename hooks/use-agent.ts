import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export function useAgent() {
    return useMutation({
        mutationFn: async ({ message, history, chatId, userId, fileData }: { message: string, history: any[], chatId?: string, userId?: string, fileData?: { type: string; content: string } | null }) => {
            // Combine history and latest message into messages array
            const messages = [...history, { role: "user", content: message }];
            const payload: any = { messages };
            if (chatId) payload.chatId = chatId;
            if (userId) payload.userId = userId;
            if (fileData) payload.fileData = fileData;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            let aiResponse = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                aiResponse += decoder.decode(value);
            }

            return { response: aiResponse };
        },
        onError: () => {
            toast.error('Failed to send message. Please try again.');
        }
    });
}
