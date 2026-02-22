import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";

import { conversationAgent } from "./nodes/conversation";
import { labAnalysisAgent } from "./nodes/lab-analysis";
import { clinicalSummaryAgent } from "./nodes/clinical-summary";
import { executeTools } from "./nodes/execute-tools";

/**
 * ROUTER LOGIC
 * Decides which agent to activate based on user input and state
 */
function routeStart(state: typeof AgentState.State) {
  const { filePath, messages } = state;
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage.content === "string"
      ? lastMessage.content.toLowerCase()
      : "";

  // 1. If PDF is uploaded -> Lab Analysis Agent
  if (filePath) {
    console.log("[Router] PDF detected. Routing to lab_analysis");
    return "lab_analysis";
  }

  // 2. If summary requested -> Clinical Summary Agent
  // Triggers: "summary for doctor", "create summary", "appointment tomorrow"
  if (
    content.includes("summary for doctor") ||
    content.includes("create summary") ||
    content.includes("appointment tomorrow") ||
    content.includes("generate summary")
  ) {
    console.log("[Router] Summary requested. Routing to clinical_summary");
    return "clinical_summary";
  }

  // 3. Default -> Conversation Agent
  console.log("[Router] Default routing to conversation");
  return "conversation";
}

/**
 * LAB AGENT ROUTING
 * Checks if tool called or finished
 */
function routeLabAgent(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // If tool calls present, go to tools
  if ((lastMessage as any).tool_calls?.length) {
    console.log(
      `[Router] Lab Analysis made ${(lastMessage as any).tool_calls.length} tool calls. Routing to tools.`,
    );
    return "tools";
  }

  // Lab analysis complete - go directly to END (skip redundant conversation call)
  console.log("[Router] Lab Analysis complete. Routing to END.");
  return END;
}

/**
 * CONVERSATION ROUTING
 * Checks if conversation should continue or if summary is needed
 */
function routeConversation(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage.content === "string"
      ? lastMessage.content.toLowerCase()
      : "";

  // Check if user is requesting summary
  if (
    content.includes("summary for doctor") ||
    content.includes("create summary") ||
    content.includes("appointment tomorrow") ||
    content.includes("generate summary")
  ) {
    console.log(
      "[Router] Summary requested from conversation. Routing to clinical_summary",
    );
    return "clinical_summary";
  }

  // Otherwise end the conversation
  console.log("[Router] Conversation complete. Routing to END.");
  return END;
}

// Build the Graph
const workflow = new StateGraph(AgentState)
  // Nodes
  .addNode("conversation", conversationAgent)
  .addNode("lab_analysis", labAnalysisAgent)
  .addNode("clinical_summary", clinicalSummaryAgent)
  .addNode("tools", executeTools)

  // Starting point routing - directly to router
  .addConditionalEdges(START, routeStart, {
    conversation: "conversation",
    lab_analysis: "lab_analysis",
    clinical_summary: "clinical_summary",
  })

  // Lab Analysis Flow
  .addConditionalEdges("lab_analysis", routeLabAgent, {
    tools: "tools",
    [END]: END,
  })

  // Tools always return to lab analysis
  .addEdge("tools", "lab_analysis")

  // Conversation Flow - can go to summary or end
  .addConditionalEdges("conversation", routeConversation, {
    clinical_summary: "clinical_summary",
    [END]: END,
  })

  // Clinical Summary Flow
  .addEdge("clinical_summary", END);

// Compile with safety limits
export const graph = workflow.compile();
