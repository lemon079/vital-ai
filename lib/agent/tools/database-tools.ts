import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Placeholder for the old saveLabResults tool.
 * In the new data model, lab results are created by the Extraction Agent (Phase 1)
 * and persisted as LabResultValue rows. This tool stub exists for backward
 * compatibility with the existing LangGraph graph until it's rewritten in Phase 1-2.
 */
export const saveLabResultsTool = tool(
    async (args: any) => {
        console.log("[save_lab_results] Received args:", JSON.stringify(args, null, 2));
        console.warn("[save_lab_results] This is a Phase 0 stub. Lab result persistence will be implemented in Phase 1.");

        // Count the results for the response message
        let count = 0;
        if (args && typeof args === "object") {
            if (Array.isArray(args.results)) {
                count = args.results.length;
            } else if (Array.isArray(args)) {
                count = args.length;
            } else if (args.test_name) {
                count = 1;
            }
        }

        return count > 0
            ? `Acknowledged ${count} lab result(s). (Phase 0 stub — full persistence in Phase 1)`
            : "No lab results provided.";
    },
    {
        name: "save_lab_results",
        description: "Save a list of abnormal lab results to the database. The argument must be an object containing a 'results' array of abnormal findings.",
        schema: z.object({
            results: z.array(z.any()).optional().describe("Array of abnormal lab result objects.")
        }).passthrough()
    }
);
