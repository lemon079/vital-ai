import { useMutation } from '@tanstack/react-query';
import { signup, login } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useSignup() {
    const router = useRouter();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await signup(formData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success('Account created successfully!');
            router.push('/onboarding');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to sign up');
        }
    });
}

export function useSignin() {
    const router = useRouter();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await login(formData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success('Logged in successfully!');
            router.push('/agent');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to login');
        }
    });
}
