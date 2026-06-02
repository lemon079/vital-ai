import { NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/services/chat';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;

    if (!chatId) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    try {
        const { messages, fileUrl } = await getChatMessages(chatId);
        return NextResponse.json({ messages, fileUrl });
    } catch (error) {
        console.error('Failed to get messages', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
