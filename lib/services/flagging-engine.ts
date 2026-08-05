import { prisma } from '@/lib/db/client';
import { LabFlag, FlagBasis } from '@/lib/generated/prisma/client';
import { findBestReferenceRange, DemographicContext } from './reference-ranges';
import { convertUnit } from './unit-conversion';

export interface EvaluationResult {
    valueId: string;
    value: number;
    unit: string | null;
    flag: LabFlag;
    flagBasis: FlagBasis;
    isCritical: boolean;
    referenceLow: number | null;
    referenceHigh: number | null;
}

/**
 * Pure evaluation function for deterministic lab value flagging.
 */
export function computeLabFlag(
    value: number,
    bounds: {
        low: number;
        high: number;
        criticalLow?: number | null;
        criticalHigh?: number | null;
    }
): LabFlag {
    if (bounds.criticalLow !== null && bounds.criticalLow !== undefined && value < bounds.criticalLow) {
        return 'critical_low';
    }
    if (bounds.criticalHigh !== null && bounds.criticalHigh !== undefined && value > bounds.criticalHigh) {
        return 'critical_high';
    }
    if (value < bounds.low) {
        return 'low';
    }
    if (value > bounds.high) {
        return 'high';
    }
    return 'normal';
}

/**
 * Evaluates a single LabResultValue database row against printed or internal reference ranges.
 * Updates the DB record with flag and flag_basis.
 * If flagged critical, marks Report.has_critical_flag = true.
 */
export async function evaluateLabResultValue(valueId: string): Promise<EvaluationResult | null> {
    const item = await prisma.labResultValue.findUnique({
        where: { id: valueId },
        include: {
            user: true,
            report: true,
        },
    });

    if (!item || item.value === null || item.value === undefined) {
        return null;
    }

    const numValue = Number(item.value);
    const printedLow = item.report_stated_range_low ? Number(item.report_stated_range_low) : null;
    const printedHigh = item.report_stated_range_high ? Number(item.report_stated_range_high) : null;

    let flag: LabFlag = 'normal';
    let flagBasis: FlagBasis = 'report_printed_range';
    let refLow: number | null = printedLow;
    let refHigh: number | null = printedHigh;
    let criticalLow: number | null = null;
    let criticalHigh: number | null = null;

    // Rule 1: Use printed range if both low and high are provided on report
    if (printedLow !== null && printedHigh !== null) {
        flagBasis = 'report_printed_range';

        // Check if internal reference range provides critical bounds
        const internalRange = await findBestReferenceRange(item.test_code, {
            sex: item.user.sex,
            pregnancyStatus: item.user.pregnancy_status,
        });

        if (internalRange) {
            criticalLow = internalRange.criticalLow ?? null;
            criticalHigh = internalRange.criticalHigh ?? null;
        }

        flag = computeLabFlag(numValue, {
            low: printedLow,
            high: printedHigh,
            criticalLow,
            criticalHigh,
        });

    } else {
        // Rule 2: Fall back to internal reference database range
        flagBasis = 'internal_reference_db';

        const userDemographics: DemographicContext = {
            sex: item.user.sex,
            pregnancyStatus: item.user.pregnancy_status,
        };

        const internalRange = await findBestReferenceRange(item.test_code, userDemographics);

        if (internalRange) {
            // Check if unit conversion is needed
            let evalValue = numValue;
            if (item.unit && internalRange.unit && item.unit !== internalRange.unit) {
                const conv = await convertUnit(item.test_code, numValue, item.unit, internalRange.unit);
                evalValue = conv.value;
            }

            refLow = internalRange.low;
            refHigh = internalRange.high;
            criticalLow = internalRange.criticalLow ?? null;
            criticalHigh = internalRange.criticalHigh ?? null;

            flag = computeLabFlag(evalValue, {
                low: internalRange.low,
                high: internalRange.high,
                criticalLow,
                criticalHigh,
            });
        }
    }

    const isCritical = flag === 'critical_low' || flag === 'critical_high';

    // Update LabResultValue in database
    await prisma.labResultValue.update({
        where: { id: valueId },
        data: {
            flag: flag,
            flag_basis: flagBasis,
        },
    });

    // If critical, set Report.has_critical_flag = true
    if (isCritical && item.report_id) {
        await prisma.report.update({
            where: { id: item.report_id },
            data: { has_critical_flag: true },
        });
    }

    return {
        valueId,
        value: numValue,
        unit: item.unit,
        flag,
        flagBasis,
        isCritical,
        referenceLow: refLow,
        referenceHigh: refHigh,
    };
}

/**
 * Evaluates all LabResultValue items for a report.
 */
export async function evaluateAllReportResults(reportId: string): Promise<EvaluationResult[]> {
    const results = await prisma.labResultValue.findMany({
        where: { report_id: reportId },
        select: { id: true },
    });

    const evaluations: EvaluationResult[] = [];
    for (const res of results) {
        const evalRes = await evaluateLabResultValue(res.id);
        if (evalRes) {
            evaluations.push(evalRes);
        }
    }

    return evaluations;
}
