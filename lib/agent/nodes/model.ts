import { ChatOllama } from "@langchain/ollama";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { compareLabTest, convertLabUnits } from "../tools/lab-tools";
import { SYSTEM_PROMPT } from "../prompts";

// Define the tools
const tools = [compareLabTest, convertLabUnits];

// Define the model
const model = new ChatOllama({
  model: "gpt-oss:20b-cloud",
  temperature: 0,
}).bindTools(tools);


export async function callModel(state: typeof AgentState.State) {
  const { messages, summary } = state;

  // Prepend system message and summary context
  const systemMsgContent = summary
    ? `${SYSTEM_PROMPT}\n\n### Current Patient Report Summary:\n${summary}`
    : SYSTEM_PROMPT;

  const messagesWithSystem = [
    new SystemMessage(systemMsgContent),
    ...messages
  ];

  const response = await model.invoke(messagesWithSystem);
  return { messages: [response] };
}
