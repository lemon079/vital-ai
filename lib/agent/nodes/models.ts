import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

type ModelProvider = "gemini" | "ollama";

export const getModel = (provider: ModelProvider = "gemini", temperature: number = 0) => {
    if (provider === "gemini") {
        return new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GOOGLE_API_KEY,
            temperature: temperature,
        });
    }

    if (provider === "ollama") {
        return new ChatOllama({
            model: "gpt-oss:120b-cloud",
            temperature: temperature,
        });
    }

    throw new Error(`Unknown model provider: ${provider}`);
};
