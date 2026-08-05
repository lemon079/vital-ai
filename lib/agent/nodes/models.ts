import { ChatOllama } from "@langchain/ollama";

export type ModelProvider = "ollama";

export const getModel = (
  provider: ModelProvider = "ollama",
  temperature: number = 0,
) => {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const modelName = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

  return new ChatOllama({
    baseUrl,
    model: modelName,
    temperature,
  });
};
