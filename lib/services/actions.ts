'use server'

import { prisma } from '@/lib/db/client';
import { cookies } from 'next/headers';
import { hash, compare } from 'bcrypt';

export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required', success: false };
    }

    try {
        const hashedPassword = await hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            },
            select: { id: true }
        });

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('userId', newUser.id, { httpOnly: true, secure: true, sameSite: 'strict' });
        cookieStore.set('isOnboarded', 'false', { httpOnly: false, secure: true, sameSite: 'strict' });

        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') { // Prisma unique constraint error code
            return { error: 'User already exists', success: false };
        }
        console.error("Signup error:", error);
        return { error: 'Failed to create user', success: false };
    }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return { error: 'Invalid credentials', success: false };
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return { error: 'Invalid credentials', success: false };
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('userId', user.id, { httpOnly: true, secure: true, sameSite: 'strict' });
        cookieStore.set('isOnboarded', user.is_onboarded ? 'true' : 'false', { httpOnly: false, secure: true, sameSite: 'strict' });

        return { success: true };

    } catch (error) {
        console.error("Login error:", error);
        return { error: 'Login failed', success: false };
    }
}

export async function submitOnboarding(formData: FormData) {
    const name = formData.get('name') as string;
    const dobStr = formData.get('date_of_birth') as string;
    const sex = formData.get('sex') as string;

    // Get userId from cookie
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');
    const userId = userIdCookie?.value;

    if (!userId) {
        console.warn("Onboarding failed: No userId in cookie, skipping DB update.");
        return { success: true };
    }

    try {
        // Update user with demographic data and mark as onboarded
        await prisma.user.update({
            where: { id: userId },
            data: {
                is_onboarded: true,
                date_of_birth: dobStr ? new Date(dobStr) : undefined,
                sex: sex === 'male' || sex === 'female' || sex === 'other' ? sex : undefined,
                consent_health_data_at: new Date(),
            }
        });

        const updatedCookieStore = await cookies();
        updatedCookieStore.set('isOnboarded', 'true', { httpOnly: false, secure: true, sameSite: 'strict' });

        return { success: true };
    } catch (e) {
        console.error("Onboarding failed", e);
        return { error: 'Failed to save profile', success: false };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('userId');
    cookieStore.delete('isOnboarded');
    return { success: true };
}
