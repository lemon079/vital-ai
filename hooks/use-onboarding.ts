
import { submitOnboarding } from '@/lib/services/actions';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useOnboarding() {
    const router = useRouter();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await submitOnboarding(formData);
            if (!result.success) {
                throw new Error('Failed to submit onboarding data');
            }
            return result;
        },
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            router.push('/agent');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update profile');
        }
    });
}
