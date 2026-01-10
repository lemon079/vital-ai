
import { pool } from '@/lib/db';
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Parse Payload
    // Format: { messages: [], chatId: string, userId: string, fileData?: { type: string, content: string } }
    // Note: userId should be securely derived from session in a real app, 
    // but here we accept it for simplicity/demo if validated.
        const { messages, chatId, userId, fileData } = await req.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid or missing messages array." }, { status: 400 });
        }

        let currentMessageContent = messages[messages.length - 1].content;
        let fileContext = '';
        
        // Process file if provided
        if (fileData) {
            try {
                if (fileData.type === 'pdf') {
                    // For PDF, extract text from base64
                    const pdfText = await extractTextFromPDF(fileData.content);
                    fileContext = `\n\n=== MEDICAL LAB REPORT (PDF) ===\n${pdfText}\n=== END OF REPORT ===\n\nPlease analyze this medical lab report thoroughly. Identify any abnormal values, provide explanations, and flag any concerning results that may require medical attention.`;
                } else if (fileData.type === 'image') {
                    // For images, decode base64 for context
                    fileContext = `\n\n=== MEDICAL IMAGE/REPORT ===\nAn image file has been uploaded. This appears to be a medical document or lab report image.\n=== END OF IMAGE ===\n\nNote: Image content analysis requires OCR or vision model integration. Please advise the user to upload a PDF version for detailed analysis, or describe the key values visible in the image.`;
                }
            } catch (error) {
                console.error('File processing error:', error);
                return NextResponse.json({ error: 'Failed to process uploaded file.' }, { status: 500 });
            }
        }

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

        // 2. Save User Message (with file context if present)
        const fullUserMessage = currentMessageContent + (fileContext ? fileContext : '');
        await client.query(
            'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
            [currentChatId, 'user', fullUserMessage]
        );

        // 3. Generate AI Response using LangChain
        const model = new ChatOllama({
            model: "gpt-oss:20b-cloud", // Using the robust model available
            temperature: 0,
        });

        // Build message history with file context appended to latest message
        const messageHistory = messages.map((m: any, index: number) => {
            const content = index === messages.length - 1 && fileContext 
                ? m.content + fileContext 
                : m.content;
            return m.role === 'user' ? new HumanMessage(content) : new AIMessage(content);
        });

        const stream = await model.stream(messageHistory);

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

// Helper function to extract text from PDF
async function extractTextFromPDF(base64Content: string): Promise<string> {
    try {
        // Decode base64 to buffer
        const buffer = Buffer.from(base64Content, 'base64');
        
        // Use pdf-parse to extract text
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        
        return data.text || '[No text found in PDF]';
    } catch (error) {
        console.error('PDF extraction error:', error);
        return '[Error extracting PDF text]';
    }
}
