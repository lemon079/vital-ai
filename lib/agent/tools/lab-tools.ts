import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const processLabReference = tool(
    async (input) => {
        // Logic to process the lab reference input
        // For now, we'll just return it to confirm it was received and validated
        // This can be expanded to save to DB, compare with other data, etc.
        console.log("Processing lab reference:", input);
        return `Processed lab reference for test: ${input.test_name}`;
    },
    {
        name: "process_lab_reference",
        description: "Process a lab reference with detailed specifications including normal range and units.",
        schema: z.object({
            test_name: z.string().describe("The name of the lab test"),
            specimen: z.string().describe("The type of specimen (e.g., Serum, Plasma)"),
            gender: z.string().describe("The gender applicability (e.g., Male, Female, Any)"),
            normal_low: z.number().nullable().describe("The lower bound of the normal range"),
            normal_high: z.number().nullable().describe("The upper bound of the normal range"),
            unit: z.string().describe("The unit of measurement"),
        }),
    }
);
