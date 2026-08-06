import { AgentState } from "../state";
import { shouldRetrieveReportContent } from "../rag/retriever-gate";
import { retrieveReportChunks, indexReportDocument } from "../rag/vector-store";

/**
 * retrieverNode
 * LangGraph node that conditionally retrieves document-centric semantic chunks
 * from the active lab report PDF if the user's question references report content.
 */
export async function retrieverNode(state: typeof AgentState.State) {
  console.log("--- Conditional Document Retriever Node Active ---");
  const { messages, reportId, filePath } = state;
  const lastMessage = messages[messages.length - 1];

  const query = typeof lastMessage?.content === "string" ? lastMessage.content : "";
  const activeReportId = reportId || filePath;

  const shouldRetrieve = shouldRetrieveReportContent(query, !!activeReportId);

  if (!shouldRetrieve || !activeReportId) {
    console.log("[Retriever] Query does not require document retrieval. Skipping.");
    return {
      retrievedChunks: [],
    };
  }

  // Ensure report document is indexed (idempotent / cached)
  if (filePath) {
    await indexReportDocument(filePath, activeReportId);
  }

  const chunks = await retrieveReportChunks(activeReportId, query, 4);

  console.log(
    `[Retriever] Retrieved ${chunks.length} chunks from active report ${activeReportId}.`
  );

  return {
    retrievedChunks: chunks,
  };
}
