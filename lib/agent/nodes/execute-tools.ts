// lib/agent/nodes/execute-tools.ts
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { saveLabResultsTool } from "../tools/database-tools";
import { convertLabUnits } from "../tools/lab-tools";

export const executeTools = new ToolNode([saveLabResultsTool, convertLabUnits]);
