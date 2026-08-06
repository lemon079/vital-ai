import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * VitalSense AI LangGraph Agent State Definition
 * Aligns strictly with @langchain/langgraph Annotation.Root specifications
 */
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  reportData: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  filePath: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  reportId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  isFollowUpActive: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  clinicalSummary: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  labResults: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  labAnalysisSummary: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  isblocked: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  selectedText: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  turnCount: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  retrievedChunks: Annotation<Array<{ pageContent: string; pageNumber: number }>>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});
