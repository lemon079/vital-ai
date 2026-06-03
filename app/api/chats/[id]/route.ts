import { NextResponse } from 'next/server';
import { getChatMessages, renameChat, deleteChat } from '@/lib/services/chat';

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;
    const { title } = await req.json();

    if (!chatId) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    try {
        await renameChat(chatId, title);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to rename chat', error);
        return NextResponse.json({ error: 'Failed to rename chat' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;

    if (!chatId) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    try {
        await deleteChat(chatId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete chat', error);
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}
