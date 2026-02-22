import { ChatOllama } from "@langchain/ollama";

type ModelProvider = "ollama";

export const getModel = (
  provider: ModelProvider = "ollama",
  temperature: number = 0,
) => {
  return new ChatOllama({
    model: "gpt-oss:120b-cloud",
    temperature: temperature,
  });
};
