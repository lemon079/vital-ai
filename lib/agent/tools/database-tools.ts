import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { saveLabResults, saveLabResultsAsync } from "@/lib/services/chat";

import { LabResultData } from "@/types/labs";

export const saveLabResultsTool = tool(
    async (args: any) => {
        console.log("[save_lab_results] Received args:", JSON.stringify(args, null, 2));
        
        let resultsList: any[] = [];
        
        if (args && typeof args === "object") {
            if (Array.isArray(args.results)) {
                resultsList = args.results;
            } else if (Array.isArray(args)) {
                resultsList = args;
            } else if (args.test_name) {
                resultsList = [args];
            } else {
                // Try to find any array field in the object
                for (const key of Object.keys(args)) {
                    if (Array.isArray(args[key])) {
                        resultsList = args[key];
                        break;
                    }
                }
            }
        }
        
        if (resultsList.length === 0) {
            console.warn("[save_lab_results] No results list resolved from args");
            return "No abnormal lab results found to save.";
        }

        // Clean and coerce values safely
        const parsedResults = resultsList.map((r: any) => ({
            test_name: String(r.test_name || r.name || "Unknown Test"),
            value: Number(r.value !== undefined ? r.value : (r.result || 0)),
            unit: String(r.unit || ""),
            flag: String(r.flag || "HIGH"),
            specimen: r.specimen ? String(r.specimen) : undefined,
            reference_low: r.reference_low !== undefined && r.reference_low !== null ? Number(r.reference_low) : null,
            reference_high: r.reference_high !== undefined && r.reference_high !== null ? Number(r.reference_high) : null,
            reference_unit: r.reference_unit ? String(r.reference_unit) : undefined,
            gender: r.gender ? String(r.gender) : undefined
        }));

        const reportId = args?.reportId || args?.report_id;

        try {
            if (reportId) {
                await saveLabResults(reportId, parsedResults as LabResultData[]);
            } else {
                await saveLabResultsAsync(parsedResults as LabResultData[]);
            }
            return `Successfully saved ${parsedResults.length} lab results to report.`;
        } catch (error) {
            console.error("Error saving lab results via tool:", error);
            return "Failed to save lab results. Please try again.";
        }
    },
    {
        name: "save_lab_results",
        description: "Save a list of abnormal lab results to the database. The argument must be an object containing a 'results' array of abnormal findings.",
        schema: z.object({
            results: z.array(z.any()).optional().describe("Array of abnormal lab result objects.")
        }).passthrough()
    }
);
