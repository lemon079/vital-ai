import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentState } from "./state";
import { processLabReference } from "./tools/lab-tools";
import { callModel } from "./nodes/model";

// Define the tool node
const tools = [processLabReference];
const toolNode = new ToolNode(tools);

// Define logic to determine if we should continue
function shouldContinue(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.tool_calls?.length) {
        return "tools";
    }
    return END;
}

// Build the graph
const workflow = new StateGraph(AgentState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
        tools: "tools",
        [END]: END,
    })
    .addEdge("tools", "agent");

// Compile the graph
export const graph = workflow.compile();
