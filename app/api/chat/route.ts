
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from 'next/server';
import { graph } from '@/lib/agent/graph';
import { saveUploadedFile } from '@/lib/services/processing';
import { getOrCreateChat, saveMessage, saveMessageAsync, createReport } from '@/lib/services/chat';
import { prisma } from "@/lib/db/client";

export async function POST(req: Request) {
    // Parse Payload
    const { messages, chatId, userId = "309ad8a9-7802-4acb-bf7e-678b8c84768a", fileData } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: "Invalid or missing messages array." }, { status: 400 });
    }

    if (!userId) {
        console.warn("Chat request received without userId.");
    }

    let currentMessageContent = messages[messages.length - 1].content;
    let fileContext = '';
    let extractedReportData = '';
    let fileUrl: string | undefined;
    let filePath: string | undefined;

    // Process file if provided
    if (fileData) {
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

    try {
        // Mock user ID for now if null for guest support
        const safeUserId = userId;
        const isGuest = safeUserId === 'guest-user' || !safeUserId;

        // 1. Create or Get Chat
        let currentChatId = chatId;

        if (!isGuest) {
            currentChatId = await getOrCreateChat(chatId, safeUserId);
        } else if (!currentChatId) {
            currentChatId = crypto.randomUUID();
        }

        // 2. Save User Message (skip for guest)
        const fullUserMessage = currentMessageContent + (fileContext ? fileContext : '');
        if (!isGuest) {
            await saveMessage(currentChatId, 'user', fullUserMessage);
        }

        // 3. Create Report (Early) if file exists (skip for guest)
        let reportId = undefined;
        if (filePath && !isGuest && fileUrl) {
            try {
                reportId = await createReport(safeUserId, undefined, undefined); // Pass undefined for gender/age initially
                // Update Chat with Report ID immediately
                await prisma.chats.update({
                    where: { id: currentChatId },
                    data: { report_id: reportId }
                });
            } catch (e) {
                console.error("Failed to create early report", e);
            }
        }

        // 4. Generate AI Response using LangGraph
        // Build message history
        const messageHistory = messages.map((m: any) => {
            return m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content);
        });

        // Pass reportData in state config
        const stream = await graph.stream({
            messages: messageHistory,
            filePath: filePath || "",
            reportId: reportId // Pass the reportId to the graph state
        });

        // 5. Stream Response and Save AI Message
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

                // Save AI Message after streaming (Skip for guest)
                if (fullAIResponse && !isGuest) {
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
    }
}
