
import { pool } from '@/lib/db';
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Parse Payload
    // Format: { messages: [], chatId: string, userId: string }
    // Note: userId should be securely derived from session in a real app, 
    // but here we accept it for simplicity/demo if validated.
    const { messages, chatId, userId } = await req.json();

    const currentMessageContent = messages[messages.length - 1].content;

    const client = await pool.connect();

    try {
        let user_id = null;
        if (userId) {
            // If userId is provided (authenticated), ensure it's a valid UUID
            // For now, we assume the userId from session is a valid UUID string
            user_id = userId;
        }

        // 1. Create or Get Chat
        let currentChatId = chatId;

        if (!currentChatId) {
            const chatResult = await client.query(
                'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id',
                [user_id, 'New Conversation']
            );
            currentChatId = chatResult.rows[0].id; // id is now UUID string
        }

        // 2. Save User Message
        await client.query(
            'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
            [currentChatId, 'user', currentMessageContent]
        );

        // 3. Generate AI Response using LangChain
        const model = new ChatOllama({
            model: "gpt-oss:20b-cloud", // Using the robust model available
            temperature: 0,
        });

        const stream = await model.stream(messages.map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        ));

        // 4. Stream Response and Save AI Message (Simulated here for streaming, actual save would need aggregation)
        const encoder = new TextEncoder();

        // For saving the FULL AI response, we need to aggregate the stream or save after.
        // Since this is a stream response, we'll spawn a "fire and forget" save or simple aggregation
        // NOTE: In a real edge runtime, you'd use `waitUntil` or save chunks. 
        // Here we will just stream for UI and assume client state is enough for now, 
        // OR ideally, we collect the full text to save to DB.

        // Let's collect full response to save
        let fullAIResponse = "";

        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = chunk.content as string;
                    if (text) {
                        fullAIResponse += text;
                        controller.enqueue(encoder.encode(text));
                    }
                }

                // Save AI Message after streaming
                // Note: We need a new client connection or reuse if meaningful for non-blocking
                // For simplicity in this demo, we'll do a quick separate query or just assume it happened
                await pool.query( // Using pool directly for quick non-transactional save
                    'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
                    [currentChatId, 'assistant', fullAIResponse]
                );

                controller.close();
            },
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Chat-Id': currentChatId.toString() },
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        client.release();
    }
}
