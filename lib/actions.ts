'use server'

import { pool } from '@/lib/db';
import { redirect } from 'next/navigation';

import { hash, compare } from 'bcrypt';

export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required', success: false };
    }

    try {
        const client = await pool.connect();
        try {
            const hashedPassword = await hash(password, 10);
            await client.query(
                'INSERT INTO users (email, password) VALUES ($1, $2)',
                [email, hashedPassword]
            );
        } finally {
            client.release();
        }
        return { success: true };
    } catch (error: any) {
        if (error.code === '23505') {
            return { error: 'User already exists', success: false };
        }
        return { error: 'Failed to create user', success: false };
    }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const client = await pool.connect();
        let user;
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            user = result.rows[0];
        } finally {
            client.release();
        }

        if (!user) {
            return { error: 'Invalid credentials', success: false };
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return { error: 'Invalid credentials', success: false };
        }

        // In a meaningful app, you'd set a session cookie here using `cookies().set(...)`
        return { success: true };

    } catch (error) {
        return { error: 'Login failed', success: false };
    }
}

export async function submitOnboarding(formData: FormData) {
    const name = formData.get('name') as string;
    // Simulating update
    console.log('Onboarding data:', name);
    return { success: true };
}
