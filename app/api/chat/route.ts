import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { graph } from "@/lib/agent/graph";
import { saveUploadedFile } from "@/lib/services/processing";
import {
  getOrCreateConversation,
  saveMessage,
  saveMessageAsync,
} from "@/lib/services/chat";
import { createReport } from "@/lib/services/reports";
import { enqueueReportProcessing } from "@/lib/services/job-queue";
import { prisma } from "@/lib/db/client";
import { generateFollowUpSuggestions } from "@/lib/agent/suggestions";
import { indexReportDocument } from "@/lib/agent/rag/vector-store";
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
    userId: payloadUserId,
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

  // Resolve userId dynamically from payload or cookie
  const cookieStore = await cookies();
  const userId = payloadUserId || cookieStore.get("userId")?.value;

  const currentMessageContent = messages[messages.length - 1].content;
  let fileContext = "";
  let fileUrl = clientFileUrl;
  let filePath = clientFilePath;

  // Process file if provided and not already uploaded
  if (fileData && !filePath) {
    try {
      // Try to get filename from message info
      const lastMsg = messages[messages.length - 1];
      const originalName = lastMsg.fileInfo ? lastMsg.fileInfo.name : undefined;

      const savedFile = await saveUploadedFile(fileData, originalName);
      fileContext = savedFile.description;
      filePath = savedFile.filePath;

      if (savedFile.fileUrl) {
        fileUrl = savedFile.fileUrl;
      }

      // Index PDF report for Document-Centric RAG (cached by reportId / filePath)
      if (filePath && filePath.endsWith('.pdf')) {
        indexReportDocument(filePath, filePath, userId || "default_user").catch((err) => {
          console.warn("[RAG] Background indexing error:", err);
        });
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
      if (filePath.endsWith('.pdf')) {
        indexReportDocument(filePath, filePath, userId || "default_user").catch((err) => {
          console.warn("[RAG] Background indexing error:", err);
        });
      }
    }
  }

  try {
    const safeUserId = userId;
    const isGuest = safeUserId === "guest-user" || !safeUserId;

    // 1. Create or Get Conversation
    let currentChatId = chatId;

    if (!isGuest) {
      currentChatId = await getOrCreateConversation(chatId, safeUserId);
    } else if (!currentChatId) {
      currentChatId = crypto.randomUUID();
    }

    // Fetch existing report if conversation exists (Turn 2+ state reconstruction)
    let dbReportId: string | undefined = undefined;
    let dbFilePath = filePath;

    if (currentChatId && !isGuest) {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: currentChatId },
          include: {
            report: true,
          }
        });
        if (conversation?.report) {
          dbReportId = conversation.report.id;
          dbFilePath = dbFilePath || conversation.report.file_uri || undefined;
          console.log(`[Route] Reconstructed report context from DB: reportId=${dbReportId}, filePath=${dbFilePath}`);
        }
      } catch (err) {
        console.error("Failed to load existing conversation report details:", err);
      }
    }

    // 2. Save User Message (skip for guest)
    const fullUserMessage =
      currentMessageContent + (fileContext ? fileContext : "");
    if (!isGuest) {
      await saveMessage(currentChatId, "user", fullUserMessage);
    }

    // 3. Create Report and enqueue processing if file exists (skip for guest)
    if (filePath && !isGuest && fileUrl) {
      if (!dbReportId) {
        try {
          const report = await createReport({
            userId: safeUserId,
            fileUri: fileUrl,
          });
          dbReportId = report.id;

          // Link report to conversation
          await prisma.conversation.update({
            where: { id: currentChatId },
            data: { report_id: dbReportId },
          });

          // Enqueue background processing
          await enqueueReportProcessing(dbReportId);

          console.log(`[Route] Created new report: reportId=${dbReportId}`);
        } catch (e) {
          console.error("Failed to create report", e);
        }
      }
    }

    // 4. Generate AI Response using LangGraph streaming
    const messageHistory = messages.map((m: any) => {
      return m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content);
    });

    console.log(
      `[Route] Streaming graph with filePath="${dbFilePath || ""}", reportId=${dbReportId}, selectedText="${(selectedText || "").substring(0, 30)}"`,
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
              labResults: [],
            },
            {
              version: "v2",
              configurable: { thread_id: currentChatId || "default_thread" }
            }
          );
          const NODE_LABELS: Record<string, string> = {
            guardrails: "Checking safety guardrails...",
            retriever: "Searching report sections...",
            conversation: "Generating response...",
            lab_analysis: "Analyzing lab results...",
            clinical_summary: "Creating clinical summary...",
            tools: "Running analysis tools...",
          };
          const activeNodes = new Set<string>();

          for await (const event of eventStream) {
            const nodeName = event.metadata?.langgraph_node;

            // Emit reasoning events for node transitions
            if (nodeName && NODE_LABELS[nodeName]) {
              if (event.event === "on_chain_start" && !activeNodes.has(nodeName)) {
                activeNodes.add(nodeName);
                const reasoningData = JSON.stringify({
                  type: "reasoning",
                  node: nodeName,
                  label: NODE_LABELS[nodeName],
                  status: "running",
                });
                controller.enqueue(encoder.encode(`data: ${reasoningData}\n\n`));
              } else if (event.event === "on_chain_end" && activeNodes.has(nodeName)) {
                activeNodes.delete(nodeName);
                const reasoningData = JSON.stringify({
                  type: "reasoning",
                  node: nodeName,
                  label: NODE_LABELS[nodeName],
                  status: "complete",
                });
                controller.enqueue(encoder.encode(`data: ${reasoningData}\n\n`));
              }
            }

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

          // Generate and emit dynamic follow-up suggestions
          if (fullAIResponse.trim()) {
            try {
              const suggestions = await generateFollowUpSuggestions(
                fullAIResponse,
                currentMessageContent
              );
              if (suggestions.length > 0) {
                const suggestionsData = JSON.stringify({
                  type: "suggestions",
                  suggestions,
                });
                controller.enqueue(encoder.encode(`data: ${suggestionsData}\n\n`));
              }
            } catch (err) {
              console.error("[Route] Error sending follow-up suggestions:", err);
            }
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
