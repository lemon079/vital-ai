import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { saveLabResultsAsync } from "@/lib/services/chat";

import { LabResultData } from "@/types/labs";

export const saveLabResultsTool = tool(
    async ({ results }) => {
        console.log("results", results);
        try {
            await saveLabResultsAsync(results as LabResultData[]);
            return `Successfully saved ${results.length} lab results to report.`;
        } catch (error) {
            console.error("Error saving lab results via tool:", error);
            return "Failed to save lab results. Please try again.";
        }
    },
    {
        name: "save_lab_results",
        description: "Save a list of abnormal lab results to the database.",
        schema: z.object({
            // report_id: z.string().describe("The UUID of the report being analyzed."), add later in db
            results: z.array(z.object({
                test_name: z.string(),
                value: z.coerce.number().describe("Numeric value of the result"),
                unit: z.string().describe("Unit of measurement"),
                flag: z.enum(['NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNDETERMINED']).or(z.string()).describe("Abnormality flag"),
                specimen: z.string().optional(),
                reference_low: z.coerce.number().optional().nullable(),
                reference_high: z.coerce.number().optional().nullable(),
                reference_unit: z.string().optional(),
                gender: z.enum(['male', 'female', 'any']).optional().describe("Patient gender if specified")
            })).describe("List of abnormal lab results to save.")
        })
    }
);
