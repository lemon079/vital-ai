import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { SUMMARIZER_PROMPT } from "../prompts";

// Use the same model or a lighter one if preferred/available. 
// Using the same for consistency.
const model = new ChatOllama({
    model: "gpt-oss:20b-cloud",
    temperature: 0,
});

export async function summarizeReport(state: typeof AgentState.State) {
    const { reportData, summary } = state;

    // If there's no new report data, or if we already have a summary and no new data came in 
    // (logic handled by graph conditional, but safety check here), just return.
    if (!reportData) {
        return {};
    }

    // If we already have a summary, we might want to skip or update. 
    // For now, if reportData is present, we assume it's new context to be summarized.

    const response = await model.invoke([
        new SystemMessage(SUMMARIZER_PROMPT),
        new HumanMessage(`Raw Report Text:\n\n${reportData}`)
    ]);

    return {
        summary: response.content as string,
        messages: [response] // Return the AIMessage so it shows up in the chat UI
    };
}
