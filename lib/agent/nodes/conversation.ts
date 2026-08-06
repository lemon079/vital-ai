/**
 * ============================================================================
 *                         CONVERSATION AGENT NODE
 * ============================================================================
 * This agent node manages general health concerns and casual medical dialogue 
 * Q&A when no active PDF lab reports are present, transitioning naturally.
 */

// 1. External Library Imports
import { SystemMessage } from "@langchain/core/messages";

// 2. Internal Project Imports
import { AgentState } from "../state";
import { CONVERSATION_PROMPT } from "../prompts";
import { getModel } from "./models";

// Initialize the conversation model instance (higher temperature for friendly, warm responses)
const model = getModel('ollama', 0.7);

/**
 * conversationAgent
 * 
 * Directs active conversations about patient concerns, answering general medical Q&A 
 * and requesting symptom details systematically.
 * 
 * @param state - The active LangGraph AgentState containing messages and contexts.
 * @returns State updates including the generated assistant response message.
 */
export async function conversationAgent(state: typeof AgentState.State) {
  console.log("--- Conversation Agent Active ---");
  const {
    messages,
    summary,
    reportData,
    labResults,
    labAnalysisSummary,
    selectedText,
  } = state;

  // Start with base conversation prompt
  let systemMsgContent = CONVERSATION_PROMPT;

  // Add selected text context if user highlighted text from PDF
  if (selectedText) {
    console.log(
      `[Conversation] User highlighted text from PDF: "${selectedText.substring(0, 50)}..."`,
    );
    systemMsgContent += `\n\n### USER HIGHLIGHTED TEXT FROM REPORT:
The user has selected/highlighted the following text from their lab report:
"${selectedText}"

**IMPORTANT**: The user is asking a question specifically about this highlighted portion. Focus your answer on this specific section of their report.`;
  }

  // Add lab results context if available (PRIORITY: Use structured data)
  if (labResults && labResults.length > 0) {
    console.log(
      `[Conversation] Adding ${labResults.length} lab results to context`,
    );

    systemMsgContent += `\n\n### YOUR CURRENT LAB RESULTS DATA:
You have access to the following abnormal lab results from the patient's recent report. Use this information when answering questions:

`;
    labResults.forEach((result, idx) => {
      systemMsgContent += `${idx + 1}. **${result.test_name}**
   - Value: ${result.value} ${result.unit}
   - Status: ${result.flag}
   - Reference Range: ${result.reference_low ?? "N/A"} - ${result.reference_high ?? "N/A"} ${result.reference_unit ?? result.unit}
   - Specimen: ${result.specimen || "Blood"}
   ${result.gender ? `- Gender-specific: ${result.gender}` : ""}
   
`;
    });

    systemMsgContent += `All other tests in the report were within normal ranges.

**CRITICAL**: When the user asks "What were my results?" or "What did my lab show?", you MUST present these findings clearly. Don't say you don't have access - you have the complete data above.`;
  }

  // Add natural language summary from lab analysis if available
  if (labAnalysisSummary && !labResults) {
    // Fallback: If we don't have structured data but have a summary
    console.log(`[Conversation] Adding lab analysis summary to context`);
    systemMsgContent += `\n\n### LAB ANALYSIS SUMMARY:
${labAnalysisSummary}

Use this summary when discussing the patient's lab results.`;
  }

  // Add raw report data only if no structured data available
  // (less useful for conversation, but better than nothing)
  if (!labResults && !labAnalysisSummary && reportData) {
    console.log(`[Conversation] Adding raw report data to context (fallback)`);
    systemMsgContent += `\n\n### RAW LAB REPORT CONTEXT:
A lab report has been uploaded. The raw content is below. Try to identify key findings:

${reportData.substring(0, 2000)}${reportData.length > 2000 ? "...(truncated)" : ""}

Note: This is raw text. Extract relevant values carefully when answering questions.`;
  }

  // Add clinical summary if exists
  if (summary) {
    systemMsgContent += `\n\n### CONVERSATION SUMMARY SO FAR:
${summary}`;
  }

  // Add retrieved document chunks if available via Document RAG
  const retrievedChunks = state.retrievedChunks;
  if (retrievedChunks && retrievedChunks.length > 0) {
    console.log(`[Conversation] Injecting ${retrievedChunks.length} retrieved document chunks into prompt`);
    systemMsgContent += `\n\n### RETRIEVED REPORT SECTIONS (DOCUMENT RAG):
The following relevant sections were retrieved directly from the patient's uploaded PDF report:

`;
    retrievedChunks.forEach((chunk, idx) => {
      systemMsgContent += `--- SECTION ${idx + 1} (Page ${chunk.pageNumber}) ---\n"${chunk.pageContent}"\n\n`;
    });

    systemMsgContent += `**PAGE CITATION RULE**:
Whenever you refer to information found in the retrieved sections above, cite the specific page number in your response (for example: "According to Page ${retrievedChunks[0].pageNumber} of your report...").
DO NOT invent or fabricate page numbers.`;
  }

  const messagesWithSystem = [new SystemMessage(systemMsgContent), ...messages];

  console.log(
    `[Conversation] System prompt length: ${systemMsgContent.length} characters`,
  );
  console.log(
    `[Conversation] Has lab results: ${!!(labResults && labResults.length > 0)}`,
  );
  console.log(`[Conversation] Has lab summary: ${!!labAnalysisSummary}`);
  console.log(`[Conversation] Has raw report: ${!!reportData}`);
  console.log(`[Conversation] lab results: ${labResults}`);

  try {
    const response = await model.invoke(messagesWithSystem);

    return {
      messages: [response],
    };
  } catch (error: any) {
    console.error("[Conversation] Error invoking model:", error);
    return {
      messages: [
        {
          role: "assistant",
          content:
            "I encountered an error processing your message. Please try again.",
        },
      ],
    };
  }
}
