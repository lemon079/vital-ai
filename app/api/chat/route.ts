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

export async function POST(req: Request) {
  // Parse Payload
  const {
    messages,
    chatId,
    userId = "309ad8a9-7802-4acb-bf7e-678b8c84768a",
    fileData,
    selectedText,
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

  let currentMessageContent = messages[messages.length - 1].content;
  let fileContext = "";
  let extractedReportData = "";
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
      return NextResponse.json(
        { error: "Failed to process uploaded file." },
        { status: 500 },
      );
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

    // 2. Save User Message (skip for guest)
    const fullUserMessage =
      currentMessageContent + (fileContext ? fileContext : "");
    if (!isGuest) {
      await saveMessage(currentChatId, "user", fullUserMessage);
    }

    // 3. Create Report (Early) if file exists (skip for guest)
    let reportId = undefined;
    if (filePath && !isGuest && fileUrl) {
      try {
        reportId = await createReport(safeUserId, undefined, undefined); // Pass undefined for gender/age initially
        // Update Chat with Report ID immediately
        await prisma.chats.update({
          where: { id: currentChatId },
          data: { report_id: reportId },
        });
      } catch (e) {
        console.error("Failed to create early report", e);
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
      `[Route] Invoking graph with filePath="${filePath || ""}", reportId=${reportId}, selectedText="${(selectedText || "").substring(0, 30)}"`,
    );
    const result = await graph.invoke({
      messages: messageHistory,
      filePath: filePath || "",
      reportId: reportId,
      selectedText: selectedText || "",
    });

    // Extract AI response from result - handle both LangChain messages and plain objects
    console.log(`[Route] Total messages in result: ${result.messages.length}`);
    result.messages.forEach((m: any, i: number) => {
      const type = typeof m._getType === "function" ? m._getType() : m.role;
      const hasToolCalls = !!m.tool_calls?.length;
      const contentPreview =
        typeof m.content === "string"
          ? m.content.substring(0, 80)
          : Array.isArray(m.content)
            ? "[array]"
            : "[empty]";
      console.log(
        `[Route] Message ${i}: type=${type}, hasToolCalls=${hasToolCalls}, content="${contentPreview}"`,
      );
    });

    // Find AI messages with actual text content (not just tool calls)
    const aiMessages = result.messages.filter((m: any) => {
      const isAI =
        typeof m._getType === "function"
          ? m._getType() === "ai"
          : m.role === "assistant";
      if (!isAI) return false;
      // Skip AI messages that only have tool calls but no text content
      const hasContent =
        m.content &&
        (typeof m.content === "string" ? m.content.trim().length > 0 : true);
      return hasContent;
    });

    let fullAIResponse = "I apologize, but I couldn't generate a response.";
    if (aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      const content = lastMessage.content;

      if (typeof content === "string" && content.trim()) {
        fullAIResponse = content;
      } else if (Array.isArray(content)) {
        fullAIResponse = content
          .map((block: any) =>
            typeof block === "string" ? block : block.text || "",
          )
          .join("");
      }
    }

    console.log(`[Route] Final response length: ${fullAIResponse.length}`);

    // Save AI Message (Skip for guest)
    if (!isGuest) {
      await saveMessageAsync(currentChatId, "assistant", fullAIResponse);
    }

    // Return complete response as JSON
    return NextResponse.json({
      response: fullAIResponse,
      chatId: currentChatId,
      fileUrl: fileUrl || null,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
