import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserChats } from '@/lib/chat/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const chats = await getUserChats(client, userId);
        return NextResponse.json({ chats });
    } catch (error) {
        console.error('Failed to get chats', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    } finally {
        client.release();
    }
}
