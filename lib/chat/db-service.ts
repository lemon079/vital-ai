import { pool } from '@/lib/db';
import { PoolClient } from '@neondatabase/serverless';

export async function getOrCreateChat(client: PoolClient, chatId: string | null, userId: string | null): Promise<string> {
    if (chatId) return chatId;

    const chatResult = await client.query(
        'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, 'New Conversation']
    );
    return chatResult.rows[0].id;
}

export async function saveMessage(client: PoolClient, chatId: string, role: 'user' | 'assistant', content: string) {
    await client.query(
        'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
        [chatId, role, content]
    );
}

// Wrapper to save message using the pool directly if no specific client is needed/available for short ops
// useful for the async streaming save
export async function saveMessageAsync(chatId: string, role: 'user' | 'assistant', content: string) {
    // Assuming pool can handle this concurrent request
    await pool.query(
        'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
        [chatId, role, content]
    );
}
