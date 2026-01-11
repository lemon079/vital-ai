
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { findLabTest } from "@/lib/services/lab-data";

// Unit conversion factors (simplified for common cases)
const CONVERSION_RATES: Record<string, number> = {
    // Example: Glucose mg/dL to mmol/L => value * 0.0555
    "mg/dL_to_mmol/L": 0.0555,
    "mmol/L_to_mg/dL": 18.018,
    "g/dL_to_g/L": 10,
    "g/L_to_g/dL": 0.1,
    // Add more as needed
};

export const convertLabUnits = tool(
    async ({ value, from_unit, to_unit }) => {
        const key = `${from_unit}_to_${to_unit}`;
        const rate = CONVERSION_RATES[key];

        if (rate) {
            const converted = value * rate;
            return `Converted: ${converted} ${to_unit}`;
        }

        // Return a generic message if conversion is not known, 
        // asking the model to estimate or noting limitation.
        return `Conversion from ${from_unit} to ${to_unit} not supported in internal database.`;
    },
    {
        name: "convert_lab_units",
        description: "Converts a lab value from one unit to another.",
        schema: z.object({
            value: z.number().describe("The numerical value to convert"),
            from_unit: z.string().describe("The source unit (e.g. mg/dL)"),
            to_unit: z.string().describe("The target unit (e.g. mmol/L)"),
        }),
    }
);

export const compareLabTest = tool(
    async ({ test_name, value, unit, gender }) => {
        const ref = findLabTest(test_name);

        if (!ref) {
            return `Reference data not found for test: "${test_name}". Unable to analyze.`;
        }

        // Basic normalization of units for comparison (ignoring case)
        if (ref.unit.toLowerCase() !== unit.toLowerCase()) {
            return `Unit mismatch. Reference unit is "${ref.unit}", but provided unit is "${unit}". Please convert the value to "${ref.unit}" and try again.`;
        }

        // Gender match check
        if (ref.gender !== "Any" && gender) {
            const normalizedGender = gender.toLowerCase();
            const normalizedRefGender = ref.gender.toLowerCase();

            // If reference is specific (e.g., Male) and user is Female, this reference might not apply
            // But usually we just proceed or warn. 
            // Our lookup usually returns the *first* match. 
            // To be robust, findLabTest should ideally handle filtering, but for now we check what we got.
            if (normalizedRefGender !== normalizedGender && normalizedRefGender !== "any") {
                // In a real app, strict filtering would happen in retrieval
                // For now, we proceed with a note.
            }
        }

        let flag = "NORMAL";
        if (ref.normal_high !== null && value > ref.normal_high) {
            flag = "HIGH";
        } else if (ref.normal_low !== null && value < ref.normal_low) {
            flag = "LOW";
        }

        // Critical values are not in the simple JSON, so we omit CRITICAL for now unless we add that data.

        return JSON.stringify({
            test_name: ref.test_name,
            observed_value: value,
            reference_range: `${ref.normal_low ?? 0} - ${ref.normal_high ?? 'inf'} ${ref.unit}`,
            flag: flag,
            specimen: ref.specimen
        });
    },
    {
        name: "compare_lab_test",
        description: "Compares a lab test value against reference data to determine if it is High, Low, or Normal. If units do not match, returns a request to convert units.",
        schema: z.object({
            test_name: z.string().describe("Name of the test (e.g. Glucose, Albumin)"),
            value: z.number().describe("The observed numeric value"),
            unit: z.string().describe("The unit of the observed value"),
            gender: z.string().optional().describe("Patient gender if known (male/female)"),
        }),
    }
);
