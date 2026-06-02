import { NextResponse } from 'next/server';
import { createUser } from '@/lib/services/users';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = registerSchema.parse(body);

        const user = await createUser(email, password);

        // Ideally update profile table with name if provided (skipped for MVP simplicity or add later)

        return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }
        if (error.message === 'User already exists') {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
