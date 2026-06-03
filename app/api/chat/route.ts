import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { graph } from "@/lib/agent/graph";
import { saveUploadedFile } from "@/lib/services/processing";
import {
  getOrCreateChat,
  saveMessage,
  saveMessageAsync,
  createReport,
} from "@/lib/services/chat";
import { prisma } from "@/lib/db/client";
import path from "path";

export async function POST(req: Request) {
  // Read simulation headers
  const simulateLatency = req.headers.get("x-simulate-latency");
  const simulateError = req.headers.get("x-simulate-error");

  if (simulateLatency) {
    const delay = parseInt(simulateLatency, 10);
    if (!isNaN(delay)) {
      console.log(`[Simulation] Delaying response by ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (simulateError === "rate-limit") {
    console.log("[Simulation] Emulating 429 Rate Limit error");
    return NextResponse.json(
      { error: "Model capacity or token limit exceeded." },
      { status: 429 }
    );
  } else if (simulateError === "500") {
    console.log("[Simulation] Emulating 500 Internal Server error");
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }

  // Parse Payload
  const {
    messages,
    chatId,
    userId = "309ad8a9-7802-4acb-bf7e-678b8c84768a",
    fileData,
    selectedText,
    filePath: clientFilePath,
    fileUrl: clientFileUrl,
  } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Invalid or missing messages array." },
      { status: 400 },
    );
  }

  if (!userId) {
    console.warn("Chat request received without userId.");
  }

  const currentMessageContent = messages[messages.length - 1].content;
  let fileContext = "";
  let extractedReportData = "";
  let fileUrl = clientFileUrl;
  let filePath = clientFilePath;

  // Process file if provided and not already uploaded
  if (fileData && !filePath) {
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
      return NextResponse.json(
        { error: "Failed to process uploaded file." },
        { status: 500 },
      );
    }
  } else if (filePath) {
    const filename = path.basename(filePath);
    const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(filename);
    if (isImage) {
      fileContext = `[SYSTEM: An image file has been uploaded to ${filePath}. (Image analysis not yet supported via tool, but file is saved.)]`;
    } else {
      fileContext = `[SYSTEM: User uploaded a PDF: ${filename}. View it in the split panel.]`;
    }
  }

  try {
    // Mock user ID for now if null for guest support
    const safeUserId = userId;
    const isGuest = safeUserId === "guest-user" || !safeUserId;

    // 1. Create or Get Chat
    let currentChatId = chatId;

    if (!isGuest) {
      currentChatId = await getOrCreateChat(chatId, safeUserId);
    } else if (!currentChatId) {
      currentChatId = crypto.randomUUID();
    }

    // Fetch existing report and lab results if chat exists (Turn 2+ state reconstruction)
    let dbReportId = undefined;
    let dbFilePath = filePath;
    let dbLabResults: any[] = [];

    if (currentChatId && !isGuest) {
      try {
        const chat = await prisma.chats.findUnique({
          where: { id: currentChatId },
          include: {
            reports: {
              include: {
                lab_results: true
              }
            }
          }
        });
        if (chat?.reports) {
          dbReportId = chat.reports.id;
          dbFilePath = dbFilePath || chat.reports.file_path || undefined;
          dbLabResults = chat.reports.lab_results || [];
          console.log(`[Route] Reconstructed report context from DB: reportId=${dbReportId}, filePath=${dbFilePath}, labResultsCount=${dbLabResults.length}`);
        }
      } catch (err) {
        console.error("Failed to load existing chat report details:", err);
      }
    }

    // 2. Save User Message (skip for guest)
    const fullUserMessage =
      currentMessageContent + (fileContext ? fileContext : "");
    if (!isGuest) {
      await saveMessage(currentChatId, "user", fullUserMessage);
    }

    // 3. Create or Update Report if file exists (skip for guest)
    if (filePath && !isGuest && fileUrl) {
      if (!dbReportId) {
        try {
          dbReportId = await createReport(safeUserId, undefined, undefined, fileUrl); // Pass fileUrl as path/URL to store in reports.file_path
          // Update Chat with Report ID immediately
          await prisma.chats.update({
            where: { id: currentChatId },
            data: { report_id: dbReportId },
          });
          console.log(`[Route] Created new early report: reportId=${dbReportId}`);
        } catch (e) {
          console.error("Failed to create early report", e);
        }
      } else {
        // Report already exists for the chat. Check if a new file is being uploaded to replace it.
        const chat = await prisma.chats.findUnique({
          where: { id: currentChatId },
          select: {
            reports: {
              select: { file_path: true }
            }
          }
        });
        const existingFilePath = chat?.reports?.file_path;

        if (fileData || (existingFilePath && existingFilePath !== fileUrl)) {
          try {
            await prisma.reports.update({
              where: { id: dbReportId },
              data: {
                file_path: fileUrl,
                analyzed_at: new Date(),
                patient_gender: null,
                patient_age: null,
              }
            });
            // Delete existing lab results to prevent duplicates and reset analysis state
            await prisma.lab_results.deleteMany({
              where: { report_id: dbReportId }
            });
            dbLabResults = [];
            dbFilePath = filePath;
            console.log(`[Route] Overwrote existing report: reportId=${dbReportId}, file_path=${fileUrl}. Cleared old lab results.`);
          } catch (e) {
            console.error("Failed to overwrite existing report or clear lab results", e);
          }
        }
      }
    }

    // 4. Generate AI Response using LangGraph (NO STREAMING)
    // Build message history
    const messageHistory = messages.map((m: any) => {
      return m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content);
    });

    // Use graph.invoke() to get complete response
    console.log(
      `[Route] Invoking graph with filePath="${dbFilePath || ""}", reportId=${dbReportId}, selectedText="${(selectedText || "").substring(0, 30)}", labResultsCount=${dbLabResults.length}`,
    );
    // Use graph.streamEvents() to stream response chunks
    console.log(
      `[Route] Streaming graph with filePath="${dbFilePath || ""}", reportId=${dbReportId}, selectedText="${(selectedText || "").substring(0, 30)}", labResultsCount=${dbLabResults.length}`,
    );

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let fullAIResponse = "";
        
        try {
          // Send metadata at the very beginning
          const initialMetadata = JSON.stringify({
            type: "metadata",
            chatId: currentChatId,
            fileUrl: fileUrl || null,
          });
          controller.enqueue(encoder.encode(`data: ${initialMetadata}\n\n`));

          // Run streamEvents
          const eventStream = graph.streamEvents(
            {
              messages: messageHistory,
              filePath: dbFilePath || "",
              reportId: dbReportId,
              selectedText: selectedText || "",
              labResults: dbLabResults,
            },
            { version: "v2" }
          );

          for await (const event of eventStream) {
            const nodeName = event.metadata?.langgraph_node;
            const isAgentNode = ["conversation", "lab_analysis", "clinical_summary"].includes(nodeName);
            
            if (event.event === "on_chat_model_stream" && isAgentNode) {
              const chunk = event.data.chunk;
              const content = chunk.content;
              if (content) {
                fullAIResponse += content;
                const tokenData = JSON.stringify({
                  type: "token",
                  content: content,
                });
                controller.enqueue(encoder.encode(`data: ${tokenData}\n\n`));
              }
            }
          }

          // Save AI Message at the end of streaming (Skip for guest)
          if (!isGuest && fullAIResponse.trim()) {
            await saveMessageAsync(currentChatId, "assistant", fullAIResponse);
          }

          controller.close();
        } catch (error: any) {
          console.error("[Route] Stream error:", error);
          const errorMsg = JSON.stringify({
            type: "error",
            message: error.message || "Failed to generate stream response",
          });
          controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
