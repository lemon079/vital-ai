/**
 * Conditional Retriever Gate
 * Determines whether to execute document retrieval based on query intent and active report state.
 */

// Intent patterns that should NOT trigger document retrieval
const NON_RETRIEVAL_PATTERNS = [
  /^\s*(hi|hello|hey|good morning|good evening|greetings)\b/i,
  /^\s*(thanks|thank you|thx|cheers|bye|goodbye)\b/i,
  /^\s*(create summary|generate summary|summary for doctor|download summary|export summary)\b/i,
  /^\s*(retry|cancel|stop|close)\b/i,
];

// Patterns that specifically indicate report content or lab value inquiries
const REPORT_INQUIRY_PATTERNS = [
  /\b(report|lab|test|result|page|value|level|range|finding|abnormal|high|low|critical)\b/i,
  /\b(page\s*\d+|section|highlighted|above|below|reference)\b/i,
  /\b(hemoglobin|bilirubin|alt|ast|cholesterol|potassium|sodium|wbc|rbc|platelet|creatinine|urea|glucose|tsh|vitamin)\b/i,
  /\b(why|what|explain|compare|mean|show|check|find)\b/i,
];

/**
 * Determines whether the user query requires document RAG retrieval.
 *
 * @param userQuery - The incoming message string from the user.
 * @param hasReport - Whether an active lab report PDF is uploaded or selected.
 * @returns true if RAG retrieval should execute, false otherwise.
 */
export function shouldRetrieveReportContent(userQuery: string, hasReport: boolean): boolean {
  if (!hasReport || !userQuery || userQuery.trim().length === 0) {
    return false;
  }

  const queryLower = userQuery.trim().toLowerCase();

  // 1. Skip retrieval for explicit non-retrieval intents (greetings, UI actions, summary creation)
  for (const pattern of NON_RETRIEVAL_PATTERNS) {
    if (pattern.test(queryLower)) {
      return false;
    }
  }

  // 2. Trigger retrieval if query matches report inquiry keywords or is substantial health question
  for (const pattern of REPORT_INQUIRY_PATTERNS) {
    if (pattern.test(queryLower)) {
      return true;
    }
  }

  // 3. For any query longer than 15 chars when a report is active, default to retrieval for comprehensive context
  return queryLower.length >= 15;
}
