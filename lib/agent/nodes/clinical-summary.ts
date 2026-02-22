import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { CLINICAL_SUMMARY_PROMPT } from "../prompts";
import { getModel } from "./models";

const model = getModel("ollama", 0.2);

export async function clinicalSummaryAgent(state: typeof AgentState.State) {
  const { messages, reportData, selectedText } = state;

  // Prepend system message
  let systemMsgContent = CLINICAL_SUMMARY_PROMPT;

  if (reportData) {
    systemMsgContent += `\n\n[CONTEXT: Lab Data]\n${reportData}`;
  }

  if (selectedText) {
    systemMsgContent += `\n\n[CONTEXT: User Selected Text]\nThe user has highlighted this specific section, please ensure your summary addresses it if relevant:\n"${selectedText}"`;
  }

  const messagesWithSystem = [new SystemMessage(systemMsgContent), ...messages];

  const response = await model.invoke(messagesWithSystem);

  return {
    messages: [response],
    clinicalSummary: response.content as string,
  };
}
