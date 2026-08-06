import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { CLINICAL_SUMMARY_PROMPT } from "../prompts";
import { getModel } from "./models";

export async function summarizeReport(state: typeof AgentState.State) {
    const { reportData } = state;

    if (!reportData) {
        return {};
    }

    const model = getModel();
    const response = await model.invoke([
        new SystemMessage(CLINICAL_SUMMARY_PROMPT),
        new HumanMessage(`Raw Report Text:\n\n${reportData}`)
    ]);

    return {
        summary: response.content as string,
        messages: [response]
    };
}
