
// state.ts
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { LabResultData } from "@/types/labs";
import { BaseMessage } from "@langchain/core/messages";

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

    // NEW: Store structured lab results
    labResults: Annotation<any[]>({
        reducer: (x, y) => y ?? x,
        default: () => [],
    }),

    // NEW: Store natural language summary of findings
    labAnalysisSummary: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
});
