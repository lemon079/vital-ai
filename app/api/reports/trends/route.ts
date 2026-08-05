import { NextRequest, NextResponse } from 'next/server';
import { getUserLabTrends } from '@/lib/services/longitudinal-trends';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const testCode = searchParams.get('testCode') || undefined;

        if (!userId) {
            return NextResponse.json({ error: 'Missing required query parameter: userId' }, { status: 400 });
        }

        const trends = await getUserLabTrends(userId, testCode);

        return NextResponse.json({
            success: true,
            count: trends.length,
            trends,
        });
    } catch (err) {
        console.error('[TrendsAPI] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
