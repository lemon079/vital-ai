import { ChatOllama } from "@langchain/ollama";
import { AgentState } from "../state";
import { processLabReference } from "../tools/lab-tools";

// Define the tools
const tools = [processLabReference];

// Define the model
// Using the robust model defined in previous context
const model = new ChatOllama({
    model: "gpt-oss:20b-cloud",
    temperature: 0,
}).bindTools(tools);

export async function callModel(state: typeof AgentState.State) {
    const messages = state.messages;
    const response = await model.invoke(messages);
    return { messages: [response] };
}
