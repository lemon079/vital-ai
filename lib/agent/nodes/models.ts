import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type ModelProvider = "google" | "gemini" | "ollama";

export const getModel = (
  provider: ModelProvider = "google",
  temperature: number = 0,
) => {
  if (provider === "google" || provider === "gemini") {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
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
