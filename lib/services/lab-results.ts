import { prisma } from '@/lib/db/client';
import { ExtractedLabItem } from './extraction';
import { ReviewStatus, ReportStatus } from '@/lib/generated/prisma/client';

export const CONFIDENCE_THRESHOLD = 0.85;

export interface SaveResultsSummary {
    reportId: string;
    totalExtracted: number;
    autoAcceptedCount: number;
    pendingReviewCount: number;
    reportStatus: ReportStatus;
    reviewRequired: boolean;
}

/**
 * Ensures that a CanonicalTest row exists for the testCode before creating LabResultValue rows.
 */
async function ensureCanonicalTestExists(testCode: string, displayName: string, unit?: string | null) {
    try {
        const existing = await prisma.canonicalTest.findUnique({
            where: { test_code: testCode },
        });

        if (!existing) {
            await prisma.canonicalTest.create({
                data: {
                    test_code: testCode,
                    display_name: displayName,
                    default_unit: unit || null,
                },
            });
        }
    } catch (err) {
        console.warn(`[LabResults] Could not ensure CanonicalTest '${testCode}':`, err);
    }
}

/**
 * Saves extracted lab items into LabResultValue database records and applies the confidence threshold logic.
 *
 * Rules:
 * - If item.confidenceScore >= 0.85 -> review_status = "auto_accepted"
 * - If item.confidenceScore < 0.85  -> review_status = "pending_review"
 *
 * If ANY item requires review -> Report.status = "pending_review"
 * If ALL items auto-accepted  -> Report.status = "extracted"
 */
export async function saveExtractedResults(
    reportId: string,
    userId: string,
    items: ExtractedLabItem[]
): Promise<SaveResultsSummary> {
    let autoAcceptedCount = 0;
    let pendingReviewCount = 0;

    for (const item of items) {
        // Ensure parent CanonicalTest exists
        await ensureCanonicalTestExists(item.testCode, item.testName, item.unit);

        const isAutoAccepted = item.confidenceScore >= CONFIDENCE_THRESHOLD;
        const reviewStatus: ReviewStatus = isAutoAccepted ? 'auto_accepted' : 'pending_review';

        if (isAutoAccepted) {
            autoAcceptedCount++;
        } else {
            pendingReviewCount++;
        }

        await prisma.labResultValue.create({
            data: {
                report_id: reportId,
                user_id: userId,
                test_code: item.testCode,
                extracted_value_raw: item.extractedValueRaw,
                confidence_score: item.confidenceScore,
                review_status: reviewStatus,
                value: item.value,
                unit: item.unit,
                report_stated_range_low: item.reportStatedRangeLow,
                report_stated_range_high: item.reportStatedRangeHigh,
            },
        });
    }

    const reviewRequired = pendingReviewCount > 0;
    const finalReportStatus: ReportStatus = reviewRequired ? 'pending_review' : 'extracted';

    // Update Report status
    await prisma.report.update({
        where: { id: reportId },
        data: { status: finalReportStatus },
    });

    return {
        reportId,
        totalExtracted: items.length,
        autoAcceptedCount,
        pendingReviewCount,
        reportStatus: finalReportStatus,
        reviewRequired,
    };
}

/**
 * Retrieves all LabResultValue items for a report.
 */
export async function getLabResultsByReportId(reportId: string) {
    return prisma.labResultValue.findMany({
        where: { report_id: reportId },
        include: {
            canonical_test: true,
        },
        orderBy: { created_at: 'asc' },
    });
}

/**
 * Confirms or corrects a single LabResultValue item during Human-in-the-Loop review.
 */
export async function reviewLabResultValue(
    resultId: string,
    correction: {
        confirmed: boolean; // true = user_confirmed, false = user_corrected
        value?: number | null;
        unit?: string | null;
    }
) {
    const reviewStatus: ReviewStatus = correction.confirmed ? 'user_confirmed' : 'user_corrected';

    const updated = await prisma.labResultValue.update({
        where: { id: resultId },
        data: {
            review_status: reviewStatus,
            value: correction.value !== undefined ? correction.value : undefined,
            unit: correction.unit !== undefined ? correction.unit : undefined,
        },
    });

    // Check if all items for this report are now resolved (no remaining pending_review items)
    const pendingRemaining = await prisma.labResultValue.count({
        where: {
            report_id: updated.report_id,
            review_status: 'pending_review',
        },
    });

    // If no items remain pending, advance Report.status to "extracted"
    if (pendingRemaining === 0) {
        await prisma.report.update({
            where: { id: updated.report_id },
            data: { status: 'extracted' },
        });
    }

    return updated;
}
