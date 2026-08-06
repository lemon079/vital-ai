import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./state";

import { conversationAgent } from "./nodes/conversation";
import { labAnalysisAgent } from "./nodes/lab-analysis";
import { clinicalSummaryAgent } from "./nodes/clinical-summary";
import { executeTools } from "./nodes/execute-tools";
import { guardrailsNode } from "./nodes/guardrails";
import { retrieverNode } from "./nodes/retriever";

/**
 * ROUTER LOGIC
 * Decides which agent node to activate based on user input and active state
 */
function routeStart(state: typeof AgentState.State) {
  const { filePath, messages, labResults } = state;
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage?.content === "string"
      ? lastMessage.content.toLowerCase()
      : "";

  // 1. If PDF is uploaded -> Lab Analysis Agent (only if not yet analyzed)
  if (filePath && (!labResults || labResults.length === 0)) {
    console.log("[Router] PDF detected (un-analyzed). Routing to lab_analysis");
    return "lab_analysis";
  }

  // 2. If summary requested -> Clinical Summary Agent
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

  // If tool calls present, route to tools execution node
  if ((lastMessage as any)?.tool_calls?.length) {
    console.log(
      `[Router] Lab Analysis made ${(lastMessage as any).tool_calls.length} tool calls. Routing to tools.`,
    );
    return "tools";
  }

  // Lab analysis complete -> END
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
    typeof lastMessage?.content === "string"
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

/**
 * GUARDRAILS ROUTING
 * Checks if safety guardrails blocked the message; otherwise routes through conditional retriever
 */
function routeGuardrails(state: typeof AgentState.State) {
  const { isblocked } = state;
  if (isblocked) {
    console.log("[Router] Guardrails blocked the message. Routing to END.");
    return END;
  }

  // Safe: proceed to retriever node first
  return "retriever";
}

/**
 * RETRIEVER ROUTING
 * Routes to the target agent node after document-centric retrieval completes
 */
function routeAfterRetriever(state: typeof AgentState.State) {
  return routeStart(state);
}

// Build the StateGraph
const workflow = new StateGraph(AgentState)
  .addNode("guardrails", guardrailsNode)
  .addNode("retriever", retrieverNode)
  .addNode("conversation", conversationAgent)
  .addNode("lab_analysis", labAnalysisAgent)
  .addNode("clinical_summary", clinicalSummaryAgent)
  .addNode("tools", executeTools)

  // Starting point routing - START always runs safety guardrails first
  .addEdge(START, "guardrails")

  // Guardrails Conditional Edges -> Retriever
  .addConditionalEdges("guardrails", routeGuardrails, {
    retriever: "retriever",
    [END]: END,
  })

  // Retriever Conditional Edges -> Destination Agent Node
  .addConditionalEdges("retriever", routeAfterRetriever, {
    conversation: "conversation",
    lab_analysis: "lab_analysis",
    clinical_summary: "clinical_summary",
  })

  // Lab Analysis Flow
  .addConditionalEdges("lab_analysis", routeLabAgent, {
    tools: "tools",
    [END]: END,
  })

  // Tools return to lab analysis
  .addEdge("tools", "lab_analysis")

  // Conversation Flow
  .addConditionalEdges("conversation", routeConversation, {
    clinical_summary: "clinical_summary",
    [END]: END,
  })

  // Clinical Summary Flow
  .addEdge("clinical_summary", END);

// MemorySaver checkpointer for stateful thread persistence
export const checkpointer = new MemorySaver();

// Compile graph with checkpointer
export const graph = workflow.compile({ checkpointer });
