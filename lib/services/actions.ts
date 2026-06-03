'use server'

import { prisma } from '@/lib/db/client';
import { cookies } from 'next/headers';
import { hash, compare } from 'bcrypt';
import { createProfile } from './chat';

export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required', success: false };
    }

    try {
        const hashedPassword = await hash(password, 10);

        const newUser = await prisma.users.create({
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
        const user = await prisma.users.findUnique({
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
    const ageStr = formData.get('age') as string;

    // Validate Age
    const age = parseInt(ageStr);
    if (isNaN(age)) {
        console.error("Onboarding failed: Invalid age", ageStr);
        return { error: 'Invalid age provided', success: false };
    }

    // Get userId from cookie
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');
    const userId = userIdCookie?.value;

    if (!userId) {
        console.warn("Onboarding failed: No userId in cookie, skipping DB update.");
        return { success: true };
    }

    try {
        // Update user to onboarded
        await prisma.users.update({
            where: { id: userId },
            data: { is_onboarded: true }
        });

        const existing = await prisma.profiles.findFirst({ where: { user_id: userId } });

        if (existing) {
            await prisma.profiles.update({
                where: { id: existing.id },
                data: { name, age }
            });
        } else {
            await createProfile(userId, name, age, "Not Specified");
        }

        const cookieStore = await cookies();
        cookieStore.set('isOnboarded', 'true', { httpOnly: false, secure: true, sameSite: 'strict' });

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
