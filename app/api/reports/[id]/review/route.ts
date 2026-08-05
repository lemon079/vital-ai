import { getReportById } from '@/lib/services/reports';
import { getLabResultsByReportId, reviewLabResultValue } from '@/lib/services/lab-results';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await context.params;

        if (!reportId) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        const report = await getReportById(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const items = await getLabResultsByReportId(reportId);

        return NextResponse.json({
            reportId: report.id,
            status: report.status,
            uploadedAt: report.uploaded_at,
            totalItems: items.length,
            pendingReviewCount: items.filter(i => i.review_status === 'pending_review').length,
            items: items.map(item => ({
                id: item.id,
                testCode: item.test_code,
                displayName: item.canonical_test?.display_name || item.test_code,
                extractedValueRaw: item.extracted_value_raw,
                confidenceScore: item.confidence_score,
                reviewStatus: item.review_status,
                value: item.value,
                unit: item.unit,
                reportStatedRangeLow: item.report_stated_range_low,
                reportStatedRangeHigh: item.report_stated_range_high,
                flag: item.flag,
            })),
        });

    } catch (error) {
        console.error('Review API GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch review items' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await context.params;
        const body = await req.json();

        if (!reportId) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        const report = await getReportById(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Handle single item or array of review submissions
        const reviewItems: Array<{
            resultId: string;
            confirmed: boolean;
            value?: number | null;
            unit?: string | null;
        }> = Array.isArray(body.reviews) ? body.reviews : [body];

        const updatedResults = [];
        for (const review of reviewItems) {
            if (!review.resultId) continue;
            const updated = await reviewLabResultValue(review.resultId, {
                confirmed: review.confirmed,
                value: review.value,
                unit: review.unit,
            });
            updatedResults.push(updated);
        }

        // Fetch fresh report status after reviews applied
        const updatedReport = await getReportById(reportId);

        return NextResponse.json({
            success: true,
            reportId,
            updatedCount: updatedResults.length,
            reportStatus: updatedReport?.status,
        });

    } catch (error) {
        console.error('Review API POST Error:', error);
        return NextResponse.json({ error: 'Failed to process review submission' }, { status: 500 });
    }
}
