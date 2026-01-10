import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export function useAgent() {
    return useMutation({
        mutationFn: async ({ message, history }: { message: string, history: any[] }) => {
            const { data } = await axios.post('/api/chat', { message, history });
            return data;
        },
        onError: () => {
            toast.error('Failed to send message. Please try again.');
        }
    });
}
