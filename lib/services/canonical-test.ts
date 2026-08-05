import { prisma } from '@/lib/db/client';

export interface CanonicalTestDefinition {
    testCode: string; // e.g. "LOINC-718-7" or "hemoglobin"
    displayName: string;
    defaultUnit?: string | null;
    aliases: string[];
}

// Built-in seed data for standard CBC and BMP panels
export const DEFAULT_CANONICAL_TAXONOMY: CanonicalTestDefinition[] = [
    {
        testCode: 'hemoglobin',
        displayName: 'Hemoglobin',
        defaultUnit: 'g/dL',
        aliases: ['hb', 'hgb', 'hemoglobin', 'haemoglobin', 'total hemoglobin'],
    },
    {
        testCode: 'wbc',
        displayName: 'White Blood Count (WBC)',
        defaultUnit: 'x10^3/uL',
        aliases: ['wbc', 'white blood cells', 'leukocytes', 'white blood count'],
    },
    {
        testCode: 'platelets',
        displayName: 'Platelet Count',
        defaultUnit: 'x10^3/uL',
        aliases: ['platelets', 'plt', 'platelet count', 'thrombocytes'],
    },
    {
        testCode: 'hematocrit',
        displayName: 'Hematocrit',
        defaultUnit: '%',
        aliases: ['hct', 'hematocrit', 'haematocrit', 'packed cell volume', 'pcv'],
    },
    {
        testCode: 'glucose',
        displayName: 'Glucose',
        defaultUnit: 'mg/dL',
        aliases: ['glucose', 'glu', 'blood sugar', 'fasting glucose', 'serum glucose'],
    },
    {
        testCode: 'potassium',
        displayName: 'Potassium',
        defaultUnit: 'mmol/L',
        aliases: ['potassium', 'k', 'k+', 'serum potassium'],
    },
    {
        testCode: 'sodium',
        displayName: 'Sodium',
        defaultUnit: 'mmol/L',
        aliases: ['sodium', 'na', 'na+', 'serum sodium'],
    },
    {
        testCode: 'creatinine',
        displayName: 'Creatinine',
        defaultUnit: 'mg/dL',
        aliases: ['creatinine', 'creat', 'cr', 'serum creatinine'],
    },
];

/**
 * Normalizes an alias string for fuzzy matching.
 */
export function normalizeAliasText(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Resolves a raw test name/alias to a canonical test code.
 * Searches database TestAlias table first, then CanonicalTest, and falls back to normalized slug.
 */
export async function resolveCanonicalTest(aliasText: string): Promise<string> {
    if (!aliasText || aliasText.trim() === '') {
        return 'unknown';
    }

    const normalized = normalizeAliasText(aliasText);
    const slug = normalized.replace(/\s+/g, '_');

    try {
        // 1. Check TestAlias table
        const aliasRecord = await prisma.testAlias.findFirst({
            where: {
                OR: [
                    { alias_text: { equals: aliasText, mode: 'insensitive' } },
                    { alias_text: { equals: normalized, mode: 'insensitive' } },
                ],
            },
            include: { canonical_test: true },
        });

        if (aliasRecord) {
            return aliasRecord.test_code;
        }

        // 2. Check CanonicalTest table directly by test_code or display_name
        const canonical = await prisma.canonicalTest.findFirst({
            where: {
                OR: [
                    { test_code: { equals: slug, mode: 'insensitive' } },
                    { display_name: { equals: aliasText, mode: 'insensitive' } },
                ],
            },
        });

        if (canonical) {
            return canonical.test_code;
        }
    } catch (err) {
        console.warn(`[CanonicalTest] Error resolving alias '${aliasText}':`, err);
    }

    // 3. Fallback: match against built-in taxonomy definition
    for (const def of DEFAULT_CANONICAL_TAXONOMY) {
        if (def.aliases.some((a) => normalizeAliasText(a) === normalized)) {
            return def.testCode;
        }
    }

    return slug;
}

/**
 * Seeds canonical test taxonomy and aliases into the database.
 */
export async function seedCanonicalTaxonomy(): Promise<void> {
    for (const def of DEFAULT_CANONICAL_TAXONOMY) {
        // Upsert CanonicalTest
        await prisma.canonicalTest.upsert({
            where: { test_code: def.testCode },
            update: { display_name: def.displayName, default_unit: def.defaultUnit },
            create: {
                test_code: def.testCode,
                display_name: def.displayName,
                default_unit: def.defaultUnit,
            },
        });

        // Create aliases
        for (const alias of def.aliases) {
            await prisma.testAlias.upsert({
                where: { alias_text: alias.toLowerCase() },
                update: { test_code: def.testCode },
                create: {
                    alias_text: alias.toLowerCase(),
                    test_code: def.testCode,
                },
            }).catch(() => {});
        }
    }
}
