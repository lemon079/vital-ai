import { chatModel } from './ai';
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

// Define the function that processes messages
async function callModel(state: typeof MessagesAnnotation.State) {
    const { messages } = state;
    const systemMessage = new SystemMessage(
        "You are a helpful Medical AI Assistant. " +
        "You help users analyze lab reports and answer health questions. " +
        "Disclaimer: You are an AI, not a doctor. Always advise users to consult a professional."
    );

    const response = await chatModel.invoke([systemMessage, ...messages]);
    return { messages: [response] };
}

// Define the graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

export const graph = workflow.compile();
