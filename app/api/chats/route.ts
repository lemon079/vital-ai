import { NextResponse } from 'next/server';
import { getUserChats } from '@/lib/services/chat';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const chats = await getUserChats(userId);
        return NextResponse.json({ chats });
    } catch (error) {
        console.error('Failed to get chats', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}
