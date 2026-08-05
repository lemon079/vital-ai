import { getReportById } from '@/lib/services/reports';
import { getJobStatus } from '@/lib/services/job-queue';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const reportId = req.nextUrl.searchParams.get('reportId');

        if (!reportId) {
            return NextResponse.json({ error: "reportId is required." }, { status: 400 });
        }

        const report = await getReportById(reportId);

        if (!report) {
            return NextResponse.json({ error: "Report not found." }, { status: 404 });
        }

        const job = getJobStatus(reportId);

        return NextResponse.json({
            reportId: report.id,
            status: report.status,
            hasCriticalFlag: report.has_critical_flag,
            uploadedAt: report.uploaded_at,
            jobStatus: job?.status ?? null,
        });

    } catch (error) {
        console.error('Report status API Error:', error);
        return NextResponse.json({ error: 'Failed to get report status.' }, { status: 500 });
    }
}
