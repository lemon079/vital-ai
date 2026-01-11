import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/chat/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;
    // Wait, params are actually passed as async promise in new Next.js, but let's stick to standard structure:
    // export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) 
    // And await it. But let's check current Next.js version or standard pattern if possible.
    // Given context (Next 13+ likely), params are awaitable in some versions.
    // However, since `params` argument is available directly in signature:

    if (!chatId) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const { messages, fileUrl } = await getChatMessages(client, chatId);
        return NextResponse.json({ messages, fileUrl });
    } catch (error) {
        console.error('Failed to get messages', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    } finally {
        client.release();
    }
}
