import { tool } from "@langchain/core/tools";
import { z } from "zod";

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
  async ({
    value,
    from_unit,
    to_unit,
  }: {
    value: number;
    from_unit: string;
    to_unit: string;
  }) => {
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
  },
);
