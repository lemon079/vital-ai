import { pool } from '@/lib/db';
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from 'next/server';
import { graph } from '@/lib/agent/graph';
import { saveUploadedFile } from '@/lib/chat/file-processor';
import { getOrCreateChat, saveMessage, saveMessageAsync } from '@/lib/chat/db-service';

export async function POST(req: Request) {
    // Parse Payload
    const { messages, chatId, userId, fileData } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: "Invalid or missing messages array." }, { status: 400 });
    }

    let currentMessageContent = messages[messages.length - 1].content;
    let fileContext = '';
    let extractedReportData = '';
    let fileUrl: string | undefined;
    let filePath: string | undefined;

    // Process file if provided
    if (fileData) {
        console.log(fileData)
        try {
            // Try to get filename from message info
            const lastMsg = messages[messages.length - 1];
            const originalName = lastMsg.fileInfo ? lastMsg.fileInfo.name : undefined;

            const savedFile = await saveUploadedFile(fileData, originalName);
            // If it's a PDF, file-processor returns description
            fileContext = savedFile.description;
            filePath = savedFile.filePath; // Store filePath for graph

            // Note: Parallel extraction removed as per user request.
            extractedReportData = "";

            if (savedFile.fileUrl) {
                fileUrl = savedFile.fileUrl;
            }
        } catch (error) {
            return NextResponse.json({ error: 'Failed to process uploaded file.' }, { status: 500 });
        }
    }

    const client = await pool.connect();

    try {
        let user_id = userId || null;

        // 1. Create or Get Chat
        const currentChatId = await getOrCreateChat(client, chatId, user_id);

        // 2. Save User Message (we save the full context string for history, but graph gets clean input + state)
        const fullUserMessage = currentMessageContent + (fileContext ? fileContext : '');
        await saveMessage(client, currentChatId, 'user', fullUserMessage);

        // 3. Generate AI Response using LangGraph
        // Build message history
        const messageHistory = messages.map((m: any) => {
            return m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content);
        });

        // Pass reportData in state config
        const stream = await graph.stream({
            messages: messageHistory,
            filePath: filePath || ""
        });

        // 4. Stream Response and Save AI Message
        const encoder = new TextEncoder();
        let fullAIResponse = "";


        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    // Logic to handle graph chunk updates
                    for (const nodeName in chunk) {
                        const nodeState = (chunk as any)[nodeName];
                        if (nodeState.messages && nodeState.messages.length > 0) {
                            const lastMsg = nodeState.messages[nodeState.messages.length - 1];

                            if (lastMsg.content && typeof lastMsg.content === 'string') {
                                const text = lastMsg.content;
                                fullAIResponse = text; // Capturing the final response from the agent node
                                controller.enqueue(encoder.encode(text));
                            }
                        }
                    }
                }

                // Save AI Message after streaming
                if (fullAIResponse) {
                    await saveMessageAsync(currentChatId, 'assistant', fullAIResponse);
                }

                controller.close();
            },
        });

        const headers: Record<string, string> = {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Chat-Id': currentChatId.toString()
        };

        if (fileUrl) {
            headers['X-File-Url'] = fileUrl;
        }

        return new Response(readableStream, {
            headers,
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    } finally {
        client.release();
    }
}
