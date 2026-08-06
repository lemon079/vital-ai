import { prisma } from '@/lib/db/client';
import { MessageRole, AgentType } from '@/lib/generated/prisma/client';

export async function getUserProfile(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, date_of_birth: true, sex: true, pregnancy_status: true }
        });
        if (!user) return null;

        let age: number | null = null;
        if (user.date_of_birth) {
            const today = new Date();
            const birthDate = new Date(user.date_of_birth);
            age = today.getFullYear() - birthDate.getFullYear();
        }

        return {
            name: user.email ? user.email.split('@')[0] : null,
            age,
            gender: user.sex ? String(user.sex) : null,
            email: user.email,
            sex: user.sex,
            pregnancy_status: user.pregnancy_status,
            date_of_birth: user.date_of_birth,
        };
    } catch (e) {
        console.error("getUserProfile error:", e);
        return null;
    }
}

// --- Conversations & Messages ---

export async function getOrCreateConversation(conversationId: string | null, userId: string, reportId?: string): Promise<string> {
    if (conversationId) {
        return conversationId;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
        data: {
            user_id: userId,
            report_id: reportId || null,
        },
        select: { id: true }
    });
    return conversation.id;
}

export async function saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    agentType: 'qna' | 'followup' | 'summary' | 'system' = 'system'
) {
    await prisma.message.create({
        data: {
            conversation_id: conversationId,
            role: role as MessageRole,
            agent_type: agentType as AgentType,
            content
        }
    });
}

export async function saveMessageAsync(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    agentType: 'qna' | 'followup' | 'summary' | 'system' = 'system'
) {
    await saveMessage(conversationId, role, content, agentType);
}

export async function getUserConversations(userId: string): Promise<any[]> {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                created_at: true,
                messages: {
                    orderBy: { created_at: 'asc' },
                    take: 1,
                    select: { content: true }
                }
            }
        });

        return conversations.map(c => ({
            id: c.id,
            created_at: c.created_at,
            title: c.title || c.messages[0]?.content || "New Chat"
        }));
    } catch (e) {
        console.error("getUserConversations error:", e);
        return [];
    }
}

export async function renameConversation(conversationId: string, title: string) {
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { title }
    });
}

export async function deleteConversation(conversationId: string) {
    await prisma.conversation.delete({
        where: { id: conversationId }
    });
}

import { Message } from '@/types/chat';

export async function getConversationMessages(conversationId: string): Promise<{ messages: Message[], fileUrl?: string }> {
    const msgs = await prisma.message.findMany({
        where: { conversation_id: conversationId },
        orderBy: { created_at: 'asc' },
        select: {
            role: true,
            content: true,
            created_at: true
        }
    });

    // Get file path from report linked to conversation
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            report: {
                select: { file_uri: true }
            }
        }
    });

    const fileUrl = conversation?.report?.file_uri;

    // Convert role to lowercase for frontend compatibility
    const formattedMsgs: Message[] = msgs.map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
    }));

    return { messages: formattedMsgs, fileUrl: fileUrl || undefined };
}

// Legacy aliases for backward compatibility with existing agent code
export const getOrCreateChat = getOrCreateConversation;
export const getUserChats = getUserConversations;
export const renameChat = renameConversation;
export const deleteChat = deleteConversation;
export const getChatMessages = getConversationMessages;
