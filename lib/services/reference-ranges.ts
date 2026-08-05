import { prisma } from '@/lib/db/client';

export type Sex = 'male' | 'female' | 'other';
export type PregnancyStatus =
  | 'not_pregnant'
  | 'first_trimester'
  | 'second_trimester'
  | 'third_trimester'
  | 'unknown';

export interface DemographicContext {
    sex?: Sex | string | null;
    age?: number | null;
    pregnancyStatus?: PregnancyStatus | string | null;
}

export interface ReferenceRangeDefinition {
    testCode: string;
    sex?: Sex | null;
    ageMin?: number | null;
    ageMax?: number | null;
    pregnancyTrimester?: PregnancyStatus | null;
    low: number;
    high: number;
    criticalLow?: number | null;
    criticalHigh?: number | null;
    unit?: string | null;
    sourceCitation?: string;
}

/**
 * Calculates specificity rank (number of active demographic constraints).
 */
export function calculateSpecificityRank(range: Partial<ReferenceRangeDefinition>): number {
    let rank = 0;
    if (range.sex !== null && range.sex !== undefined) rank++;
    if (range.ageMin !== null && range.ageMin !== undefined) rank++;
    if (range.ageMax !== null && range.ageMax !== undefined) rank++;
    if (range.pregnancyTrimester !== null && range.pregnancyTrimester !== undefined) rank++;
    return rank;
}

// Built-in seed data for clinical reference ranges
export const DEFAULT_REFERENCE_RANGES: ReferenceRangeDefinition[] = [
    // Hemoglobin - Adult Male (rank 1)
    {
        testCode: 'hemoglobin',
        sex: 'male',
        ageMin: 18,
        low: 13.8,
        high: 17.2,
        criticalLow: 7.0,
        criticalHigh: 20.0,
        unit: 'g/dL',
        sourceCitation: 'Harrison Medical Guidelines 2026',
    },
    // Hemoglobin - Adult Female (rank 1)
    {
        testCode: 'hemoglobin',
        sex: 'female',
        ageMin: 18,
        pregnancyTrimester: 'not_pregnant',
        low: 12.1,
        high: 15.1,
        criticalLow: 7.0,
        criticalHigh: 20.0,
        unit: 'g/dL',
        sourceCitation: 'Harrison Medical Guidelines 2026',
    },
    // Hemoglobin - Pregnant Female First Trimester (rank 2)
    {
        testCode: 'hemoglobin',
        sex: 'female',
        pregnancyTrimester: 'first_trimester',
        low: 11.0,
        high: 14.0,
        criticalLow: 6.5,
        criticalHigh: 18.0,
        unit: 'g/dL',
        sourceCitation: 'ACOG Guidelines',
    },
    // Hemoglobin - General (rank 0)
    {
        testCode: 'hemoglobin',
        low: 12.0,
        high: 16.0,
        criticalLow: 7.0,
        criticalHigh: 20.0,
        unit: 'g/dL',
        sourceCitation: 'Standard Laboratory Reference',
    },

    // WBC - General (rank 0)
    {
        testCode: 'wbc',
        low: 4.5,
        high: 11.0,
        criticalLow: 1.5,
        criticalHigh: 30.0,
        unit: 'x10^3/uL',
        sourceCitation: 'Standard Clinical Guidelines',
    },

    // Platelets - General (rank 0)
    {
        testCode: 'platelets',
        low: 150,
        high: 450,
        criticalLow: 20,
        criticalHigh: 1000,
        unit: 'x10^3/uL',
        sourceCitation: 'Standard Clinical Guidelines',
    },

    // Glucose - Fasting General (rank 0)
    {
        testCode: 'glucose',
        low: 70,
        high: 99,
        criticalLow: 40,
        criticalHigh: 400,
        unit: 'mg/dL',
        sourceCitation: 'ADA Guidelines',
    },

    // Potassium - General (rank 0)
    {
        testCode: 'potassium',
        low: 3.5,
        high: 5.0,
        criticalLow: 2.8,
        criticalHigh: 6.2,
        unit: 'mmol/L',
        sourceCitation: 'Standard Clinical Guidelines',
    },

    // Sodium - General (rank 0)
    {
        testCode: 'sodium',
        low: 135,
        high: 145,
        criticalLow: 120,
        criticalHigh: 160,
        unit: 'mmol/L',
        sourceCitation: 'Standard Clinical Guidelines',
    },

    // Creatinine - Male (rank 1)
    {
        testCode: 'creatinine',
        sex: 'male',
        low: 0.74,
        high: 1.35,
        criticalHigh: 5.0,
        unit: 'mg/dL',
        sourceCitation: 'KDIGO Guidelines',
    },
    // Creatinine - Female (rank 1)
    {
        testCode: 'creatinine',
        sex: 'female',
        low: 0.59,
        high: 1.04,
        criticalHigh: 5.0,
        unit: 'mg/dL',
        sourceCitation: 'KDIGO Guidelines',
    },
];

/**
 * Finds the most specific reference range matching patient demographics.
 * Higher specificity_rank wins.
 */
export async function findBestReferenceRange(
    testCode: string,
    demographics: DemographicContext
): Promise<ReferenceRangeDefinition | null> {
    try {
        const ranges = await prisma.referenceRange.findMany({
            where: { test_code: testCode },
            orderBy: { specificity_rank: 'desc' },
        });

        for (const range of ranges) {
            // Check sex constraint
            if (range.sex && range.sex !== demographics.sex) {
                continue;
            }

            // Check age constraint
            if (demographics.age !== undefined && demographics.age !== null) {
                if (range.age_min !== null && demographics.age < range.age_min) continue;
                if (range.age_max !== null && demographics.age > range.age_max) continue;
            }

            // Check pregnancy constraint
            if (range.pregnancy_trimester && range.pregnancy_trimester !== demographics.pregnancyStatus) {
                continue;
            }

            return {
                testCode: range.test_code,
                sex: range.sex,
                ageMin: range.age_min,
                ageMax: range.age_max,
                pregnancyTrimester: range.pregnancy_trimester,
                low: Number(range.low),
                high: Number(range.high),
                criticalLow: range.critical_low ? Number(range.critical_low) : null,
                criticalHigh: range.critical_high ? Number(range.critical_high) : null,
                unit: range.unit,
                sourceCitation: range.source_citation || undefined,
            };
        }
    } catch (err) {
        console.warn(`[ReferenceRange] Error fetching DB ranges for ${testCode}:`, err);
    }

    // Fall back to static ranges matched by specificity
    const staticCandidates = DEFAULT_REFERENCE_RANGES.filter((r) => r.testCode === testCode);

    staticCandidates.sort((a, b) => calculateSpecificityRank(b) - calculateSpecificityRank(a));

    for (const range of staticCandidates) {
        if (range.sex && range.sex !== demographics.sex) continue;
        if (demographics.age !== undefined && demographics.age !== null) {
            if (range.ageMin !== null && range.ageMin !== undefined && demographics.age < range.ageMin) continue;
            if (range.ageMax !== null && range.ageMax !== undefined && demographics.age > range.ageMax) continue;
        }
        if (range.pregnancyTrimester && range.pregnancyTrimester !== demographics.pregnancyStatus) continue;

        return range;
    }

    return null;
}

/**
 * Seeds clinical reference ranges into the database with specificity ranks.
 */
export async function seedReferenceRanges(): Promise<void> {
    for (const def of DEFAULT_REFERENCE_RANGES) {
        const rank = calculateSpecificityRank(def);

        await prisma.referenceRange.create({
            data: {
                test_code: def.testCode,
                sex: (def.sex as any) || null,
                age_min: def.ageMin || null,
                age_max: def.ageMax || null,
                pregnancy_trimester: (def.pregnancyTrimester as any) || null,
                low: def.low,
                high: def.high,
                critical_low: def.criticalLow || null,
                critical_high: def.criticalHigh || null,
                unit: def.unit || null,
                specificity_rank: rank,
                source_citation: def.sourceCitation || null,
            },
        }).catch(() => {});
    }
}
