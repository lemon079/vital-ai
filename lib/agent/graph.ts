import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentState } from "./state";
import { compareLabTest, convertLabUnits } from "./tools/lab-tools";
import { callModel } from "./nodes/model";
import { summarizeReport } from "./nodes/summarizer";
import { extractPdfData } from "./nodes/extractor";

// Define the tool node
const tools = [compareLabTest, convertLabUnits];
const toolNode = new ToolNode(tools);

// Define logic to determine if we should continue
function shouldContinue(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && (lastMessage as any).tool_calls?.length) {
        return "tools";
    }
    return END;
}

// Build the graph
const workflow = new StateGraph(AgentState)
    .addNode("extractor", extractPdfData)
    .addNode("summarizer", summarizeReport)
    .addNode("agent", callModel)

    .addNode("tools", toolNode)

    // Linear Flow: Start -> Extractor -> Summarizer -> Agent
    // The nodes themselves handle "skip" logic by returning empty updates if criteria aren't met.
    .addEdge(START, "extractor")
    .addEdge("extractor", "summarizer")
    .addEdge("summarizer", END)
    // .addEdge("summarizer", "agent") // Temporarily bypassed per user request

    // Agent flow
    .addConditionalEdges("agent", shouldContinue, {
        tools: "tools",
        [END]: END,
    })
    .addEdge("tools", "agent");

// Compile the graph
export const graph = workflow.compile();
