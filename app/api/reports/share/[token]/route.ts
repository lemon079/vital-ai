import { NextRequest, NextResponse } from 'next/server';
import { validateShareToken } from '@/lib/services/share-token';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const validation = await validateShareToken(token);

        if (!validation.valid || !validation.report) {
            return NextResponse.json(
                { error: validation.reason || 'Invalid or expired share token' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            report: {
                id: validation.report.id,
                status: validation.report.status,
                uploadedAt: validation.report.uploaded_at,
                hasCriticalFlag: validation.report.has_critical_flag,
                labResults: validation.report.lab_result_values,
                summaries: validation.report.clinical_summaries,
            },
        });
    } catch (err) {
        console.error('[ShareTokenAPI] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
