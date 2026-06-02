import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { CLINICAL_SUMMARY_PROMPT } from "../prompts";
import { getModel } from "./models";
import { MEDICAL_DISCLAIMER } from "./guardrails";

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

  // Detect if we have lab report data AND patient messages
  const hasLabData = !!reportData && reportData.trim().length > 0;
  const patientMessages = messages.filter(m => {
    const type = typeof m._getType === "function" ? m._getType() : (m as any).role;
    return type === "human";
  });
  const hasSymptoms = patientMessages.length > 0;

  if (hasLabData && hasSymptoms) {
    systemMsgContent += `\n\n### CLINICAL SYNTHESIS TASK:\nYou MUST perform a clinical reasoning synthesis:
1. Synthesize abnormal values from the lab report with patient symptoms/Chief Complaint.
2. Consolidate these findings to explain "why it is happening" in a professional, clear manner for their healthcare provider.
3. Explicitly format diagnostic conclusions securely, drawing traces and citing specific facts or statements from the active chat context.
4. Strictly cite only concrete, factual lab results from the active session. Do NOT invent, speculate, or generalize without concrete evidence.`;
  }

  const messagesWithSystem = [new SystemMessage(systemMsgContent), ...messages];

  const response = await model.invoke(messagesWithSystem);
  const summaryContent = (response.content as string) + MEDICAL_DISCLAIMER;
  response.content = summaryContent;

  return {
    messages: [response],
    clinicalSummary: summaryContent,
  };
}
