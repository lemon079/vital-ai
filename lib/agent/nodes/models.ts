import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type ModelProvider = "google" | "ollama";

export const getModel = (
  provider?: ModelProvider,
  temperature: number = 0,
) => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const activeProvider = provider || (apiKey ? "google" : "ollama");

  if (activeProvider === "google" && apiKey) {
    const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: modelName,
      temperature,
    });
  }

  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const modelName = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

  return new ChatOllama({
    baseUrl,
    model: modelName,
    temperature,
  });
};
