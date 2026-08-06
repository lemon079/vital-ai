import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "./nodes/models";

const suggestionModel = getModel('ollama', 0.4);

const SYSTEM_PROMPT = `You are a health assistant. Based on the assistant's previous response, generate 3 short follow-up questions that a normal person (not a doctor) would naturally ask next.

Guidelines:
- Each question must be under 8 words.
- Use simple everyday language — no medical terms.
- Questions should be things a regular person would wonder, like: "Is this something to worry about?", "What food should I eat?", "Do I need medicine for this?", "Should I see a doctor?"
- Do NOT include numbering, quotes, bullet points, or markdown.
- Output ONLY valid JSON array of 3 strings. Example: ["Is this serious?", "What food helps with this?", "Should I see a doctor?"]`;

export async function generateFollowUpSuggestions(
  aiResponse: string,
  userMessage?: string
): Promise<string[]> {
  if (!aiResponse || aiResponse.trim().length === 0) {
    return [];
  }

  try {
    const inputContent = `User asked: "${userMessage || 'Health query'}"\n\nAssistant responded: "${aiResponse.substring(0, 1000)}"`;

    const response = await suggestionModel.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(inputContent),
    ]);

    const content = typeof response.content === "string" ? response.content.trim() : "";

    // Extract JSON array from text
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4).map(s => String(s).replace(/^["']|["']$/g, '').trim());
      }
    }
  } catch (error) {
    console.error("[Suggestions] Error generating follow-up suggestions:", error);
  }

  // Smart context-aware fallback if LLM call fails
  const lower = aiResponse.toLowerCase();
  if (lower.includes("lab report") || lower.includes("table") || lower.includes("result")) {
    return [
      "Is any of this serious?",
      "What can I do to improve?",
      "What should I tell my doctor?"
    ];
  }

  return [
    "Can you explain this simpler?",
    "What should I do next?",
    "Should I see a doctor?"
  ];
}
