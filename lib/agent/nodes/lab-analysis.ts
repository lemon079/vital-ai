// lib/agent/nodes/lab-analysis.ts
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { AgentState } from "../state";
import { LAB_ANALYSIS_PROMPT } from "../prompts";
import { saveLabResultsTool } from "../tools/database-tools";
import { convertLabUnits } from "../tools/lab-tools";
import { LabResultData } from "@/types/labs";
import { getModel } from "./models";

const tools = [saveLabResultsTool, convertLabUnits];

const model = getModel("ollama", 0).bindTools(tools);

export async function labAnalysisAgent(state: typeof AgentState.State) {
  console.log("--- Lab Analysis Agent Active ---");
  console.log(`Messages in state: ${state.messages.length}`);

  const { filePath, messages, selectedText } = state;

  // Extract PDF if needed
  let extractedText = state.reportData;
  if (!extractedText && filePath) {
    try {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      extractedText = docs.map((doc: any) => doc.pageContent).join("\n\n");
      console.log(
        `[Lab Analysis] Extracted ${extractedText.length} characters from PDF`,
      );
    } catch (error) {
      console.error("Failed to extract PDF:", error);
      return {
        messages: [
          {
            role: "assistant",
            content:
              "I encountered an error reading the PDF file. Please try uploading it again.",
          },
        ],
      };
    }
  }

  if (!extractedText) {
    return {
      messages: [
        {
          role: "assistant",
          content: "No PDF content found to analyze.",
        },
      ],
    };
  }

  // Build system prompt
  let systemPrompt = LAB_ANALYSIS_PROMPT;
  if (state?.reportId) {
    systemPrompt += `\n\n### REPORT ID: ${state.reportId}\nYou MUST use this ID when calling the save_lab_results tool.`;
  }

  // Add selected text context
  if (selectedText) {
    console.log(
      `[Lab Analysis] User highlighted text: "${selectedText.substring(0, 50)}..."`,
    );
    systemPrompt += `\n\n### USER HIGHLIGHTED TEXT:\nThe user has highlighted the following section of the document:\n"${selectedText}"\n\nPrioritize analyzing this specific section if relevant to the user's query.`;
  }

  // GUARDRAIL: Check if tool was already called
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const toolAlreadyCalled = lastMsg?._getType() === "tool";

  if (toolAlreadyCalled) {
    console.log(
      "[Lab Analysis] Tool already executed. Adding stop instruction to system prompt.",
    );
    systemPrompt +=
      "\n\nSYSTEM NOTIFICATION: The lab results have been successfully saved to the database. " +
      "Do NOT call the save_lab_results tool again. " +
      "Proceed immediately to generating the friendly natural language conversation response for the patient.";
  }

  // Build messages - filter out any non-human messages from initial state
  // The frontend may send a greeting AIMessage which would confuse the model
  const humanMessages = messages.filter((msg: any) => {
    const msgType =
      typeof msg._getType === "function" ? msg._getType() : msg.role;
    return msgType === "human";
  });

  let messagesWithSystem;
  if (humanMessages.length === 0) {
    // First run - just system + PDF content (ignore any greeting AIMessages)
    messagesWithSystem = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`LAB REPORT CONTENT:\n${extractedText}`),
    ];
    console.log(`[Lab Analysis] First run - sending PDF content`);
  } else {
    // Follow-up run (tool calls returned) - include tool call/response messages
    const compatibleMessages = messages.map((msg: any) => {
      const msgType = msg._getType();

      if (msgType === "ai") {
        return new AIMessage({
          content: msg.content || "",
          tool_calls: msg.tool_calls || [],
        });
      }

      if (msgType === "tool") {
        return new ToolMessage({
          content:
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content),
          tool_call_id: msg.tool_call_id || msg.id || "unknown",
        });
      }

      if (msgType === "human") {
        return new HumanMessage(msg.content || "");
      }

      console.warn(`[Lab Analysis] Unknown message type: ${msgType}`);
      return msg;
    });

    messagesWithSystem = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`LAB REPORT CONTENT:\n${extractedText}`),
      ...compatibleMessages,
    ];
    console.log(
      `[Lab Analysis] Follow-up run with ${compatibleMessages.length} converted messages`,
    );
  }

  try {
    console.log(
      `[Lab Analysis] Invoking model with ${messagesWithSystem.length} messages`,
    );
    console.log(`[Lab Analysis] System prompt length: ${systemPrompt.length}`);

    // Debug: Log message types
    console.log(
      `[Lab Analysis] Message types: ${messagesWithSystem.map((m: any) => m._getType()).join(", ")}`,
    );

    const response = (await Promise.race([
      model.invoke(messagesWithSystem),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Model invocation timeout")), 60000),
      ),
    ])) as any;

    const toolCallsCount = response.tool_calls?.length || 0;
    console.log(
      `[Lab Analysis] Response generated with ${toolCallsCount} tool calls`,
    );

    // Extract lab results from tool calls and response
    let labResults: LabResultData[] = state.labResults || [];
    let labSummary = state.labAnalysisSummary || "";

    // If this is the final response (no tool calls), extract summary
    if (toolCallsCount === 0 && response.content) {
      labSummary = response.content as string;
      console.log(`[Lab Analysis] Extracted summary for state`);
    }

    // If we called save_lab_results, extract the data
    if (response.tool_calls) {
      for (const toolCall of response.tool_calls) {
        if (toolCall.name === "save_lab_results" && toolCall.args.results) {
          labResults = toolCall.args.results as LabResultData[];
          console.log(
            `[Lab Analysis] Extracted ${labResults.length} lab results for state`,
          );
        }
      }
    }

    return {
      messages: [response],
      reportData: extractedText,
      labResults: labResults.length > 0 ? labResults : state.labResults,
      labAnalysisSummary: labSummary || state.labAnalysisSummary,
    };
  } catch (error: any) {
    console.error("Error invoking model in Lab Analysis Agent:", error);

    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    console.error("Error detailed message:", error.message);
    console.error("Error stack:", error.stack);

    if (
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("fetch failed")
    ) {
      return {
        messages: [
          {
            role: "assistant",
            content:
              "Cannot connect to model server. Please ensure it is running.",
          },
        ],
      };
    }

    return {
      messages: [
        {
          role: "assistant",
          content: `I encountered an error analyzing the lab report: ${error.message}. Please check the console logs for details.`,
        },
      ],
    };
  }
}
