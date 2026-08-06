import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "./nodes/models";

const suggestionModel = getModel(undefined, 0.4);

const SYSTEM_PROMPT = `You are a medical AI assistant. Based on the assistant's previous medical explanation to the patient, generate 3 short, natural, single-sentence follow-up questions that the patient might ask next.

Guidelines:
- Each question must be short (under 10 words).
- Questions should be specific to what was just discussed (e.g., "What causes high ALT?", "How can I lower my cholesterol?", "What should I ask my doctor?").
- Do NOT include numbering, quotes, bullet points, or markdown.
- Output ONLY valid JSON array of 3 strings. Example: ["What causes high ALT?", "Should I change my diet?", "What questions should I ask my doctor?"]`;

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
      "Summarize these findings for my doctor",
      "What lifestyle changes can help improve these levels?",
      "What questions should I ask my doctor at my next visit?"
    ];
  }

  return [
    "Can you explain this in simpler terms?",
    "What are the next steps I should take?",
    "What questions should I ask my doctor?"
  ];
}
