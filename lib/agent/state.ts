import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    summary: Annotation<string>({
        reducer: (x, y) => y ?? x, // Replace with new summary
        default: () => "",
    }),
    reportData: Annotation<string>({
        reducer: (x, y) => y ?? x, // Replace with new data
        default: () => "",
    }),
    filePath: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
});
