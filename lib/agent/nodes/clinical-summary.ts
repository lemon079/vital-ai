
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { CLINICAL_SUMMARY_PROMPT } from "../prompts";
import { getModel } from "./models";

const model = getModel("gemini", 0.2);

export async function clinicalSummaryAgent(state: typeof AgentState.State) {
    const { messages, reportData } = state;

    // Prepend system message
    let systemMsgContent = CLINICAL_SUMMARY_PROMPT;

    if (reportData) {
        systemMsgContent += `\n\n[CONTEXT: Lab Data]\n${reportData}`;
    }

    const messagesWithSystem = [
        new SystemMessage(systemMsgContent),
        ...messages
    ];

    const response = await model.invoke(messagesWithSystem);

    return {
        messages: [response],
        clinicalSummary: response.content as string
    };
}
