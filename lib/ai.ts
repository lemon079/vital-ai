import { ChatOllama } from "@langchain/ollama";

export const chatModel = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default Ollama URL
    model: "gpt-oss:20b-cloud",
});
