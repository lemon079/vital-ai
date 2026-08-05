import { prisma } from '@/lib/db/client';

export interface StaticConversionRule {
    testCode: string;
    fromUnit: string;
    toUnit: string;
    multiplyFactor: number;
}

export const DEFAULT_UNIT_CONVERSIONS: StaticConversionRule[] = [
    // Hemoglobin
    { testCode: 'hemoglobin', fromUnit: 'g/dl', toUnit: 'g/l', multiplyFactor: 10.0 },
    { testCode: 'hemoglobin', fromUnit: 'g/l', toUnit: 'g/dl', multiplyFactor: 0.1 },

    // Glucose
    { testCode: 'glucose', fromUnit: 'mmol/l', toUnit: 'mg/dl', multiplyFactor: 18.018 },
    { testCode: 'glucose', fromUnit: 'mg/dl', toUnit: 'mmol/l', multiplyFactor: 0.0555 },

    // Creatinine
    { testCode: 'creatinine', fromUnit: 'mg/dl', toUnit: 'umol/l', multiplyFactor: 88.4 },
    { testCode: 'creatinine', fromUnit: 'umol/l', toUnit: 'mg/dl', multiplyFactor: 0.0113 },
];

/**
 * Normalizes unit string for matching (e.g., "g/dL" -> "g/dl").
 */
export function normalizeUnit(unit: string): string {
    return unit.toLowerCase().trim().replace(/\s+/g, '');
}

/**
 * Converts a numeric value from one unit to another for a specified test code.
 */
export async function convertUnit(
    testCode: string,
    value: number,
    fromUnit: string | null | undefined,
    toUnit: string | null | undefined
): Promise<{ value: number; converted: boolean }> {
    if (!fromUnit || !toUnit || value === null || value === undefined) {
        return { value, converted: false };
    }

    const normFrom = normalizeUnit(fromUnit);
    const normTo = normalizeUnit(toUnit);

    if (normFrom === normTo) {
        return { value, converted: false };
    }

    try {
        // 1. Query UnitConversion DB table
        const dbRule = await prisma.unitConversion.findFirst({
            where: {
                test_code: testCode,
                from_unit: { equals: fromUnit, mode: 'insensitive' },
                to_unit: { equals: toUnit, mode: 'insensitive' },
            },
        });

        if (dbRule && dbRule.multiply_factor) {
            const factor = Number(dbRule.multiply_factor);
            return { value: Math.round(value * factor * 1000) / 1000, converted: true };
        }
    } catch (err) {
        console.warn(`[UnitConversion] Error querying conversion rule for ${testCode}:`, err);
    }

    // 2. Fall back to static built-in conversions
    const staticRule = DEFAULT_UNIT_CONVERSIONS.find(
        (r) =>
            r.testCode === testCode &&
            normalizeUnit(r.fromUnit) === normFrom &&
            normalizeUnit(r.toUnit) === normTo
    );

    if (staticRule) {
        return { value: Math.round(value * staticRule.multiplyFactor * 1000) / 1000, converted: true };
    }

    return { value, converted: false };
}

/**
 * Seeds static unit conversion rules into database.
 */
export async function seedUnitConversions(): Promise<void> {
    for (const rule of DEFAULT_UNIT_CONVERSIONS) {
        await prisma.unitConversion.upsert({
            where: {
                test_code_from_unit_to_unit: {
                    test_code: rule.testCode,
                    from_unit: rule.fromUnit,
                    to_unit: rule.toUnit,
                },
            },
            update: { multiply_factor: rule.multiplyFactor },
            create: {
                test_code: rule.testCode,
                from_unit: rule.fromUnit,
                to_unit: rule.toUnit,
                multiply_factor: rule.multiplyFactor,
            },
        }).catch(() => {});
    }
}
