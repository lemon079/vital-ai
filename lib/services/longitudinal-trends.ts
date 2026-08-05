import { prisma } from '@/lib/db/client';

export type Trajectory = 'improving' | 'worsening' | 'stable' | 'insufficient_data';

export interface TrendPoint {
    resultId: string;
    reportId: string;
    date: Date;
    value: number;
    unit: string | null;
    flag: string | null;
}

export interface TestTrendSeries {
    testCode: string;
    displayName?: string;
    unit?: string | null;
    points: TrendPoint[];
    latestValue: number;
    previousValue: number | null;
    deltaPercentage: number | null;
    trajectory: Trajectory;
}

/**
 * Calculates trajectory classification given previous value, latest value, and normal bounds.
 */
export function calculateTrajectory(
    previous: number,
    latest: number,
    normalLow?: number | null,
    normalHigh?: number | null
): Trajectory {
    if (previous === 0) {
        return 'stable';
    }

    const delta = ((latest - previous) / Math.abs(previous)) * 100;
    if (Math.abs(delta) <= 5.0) {
        return 'stable';
    }

    // If normal bounds provided, evaluate movement towards or away from bounds
    if (normalLow !== undefined && normalLow !== null && normalHigh !== undefined && normalHigh !== null) {
        const midPoint = (normalLow + normalHigh) / 2;
        const prevDist = Math.abs(previous - midPoint);
        const latestDist = Math.abs(latest - midPoint);

        if (latestDist < prevDist) {
            return 'improving';
        }
        if (latestDist > prevDist) {
            return 'worsening';
        }
    }

    // Fallback if no bounds: increasing value when elevated is worsening, etc.
    return delta > 0 ? 'worsening' : 'improving';
}

/**
 * Fetches historical lab result values for a user grouped by test_code and ordered chronologically.
 */
export async function getUserLabTrends(
    userId: string,
    testCodeFilter?: string
): Promise<TestTrendSeries[]> {
    try {
        const whereClause: any = { user_id: userId };
        if (testCodeFilter) {
            whereClause.test_code = testCodeFilter;
        }

        const rawResults = await prisma.labResultValue.findMany({
            where: whereClause,
            orderBy: { created_at: 'asc' },
            include: {
                canonical_test: true,
            },
        });

        // Group results by test_code
        const groupedMap = new Map<string, typeof rawResults>();
        for (const res of rawResults) {
            const list = groupedMap.get(res.test_code) || [];
            list.push(res);
            groupedMap.set(res.test_code, list);
        }

        const seriesList: TestTrendSeries[] = [];

        for (const [testCode, items] of groupedMap.entries()) {
            const validItems = items.filter((i) => i.value !== null && i.value !== undefined);
            if (validItems.length === 0) continue;

            const points: TrendPoint[] = validItems.map((item) => ({
                resultId: item.id,
                reportId: item.report_id,
                date: item.created_at,
                value: Number(item.value),
                unit: item.unit,
                flag: item.flag,
            }));

            const latest = points[points.length - 1].value;
            let previous: number | null = null;
            let deltaPercentage: number | null = null;
            let trajectory: Trajectory = 'insufficient_data';

            if (points.length >= 2) {
                previous = points[points.length - 2].value;
                if (previous !== 0) {
                    deltaPercentage = Math.round((((latest - previous) / Math.abs(previous)) * 100) * 10) / 10;
                }
                trajectory = calculateTrajectory(previous, latest);
            }

            seriesList.push({
                testCode,
                displayName: items[0]?.canonical_test?.display_name || testCode,
                unit: points[points.length - 1].unit,
                points,
                latestValue: latest,
                previousValue: previous,
                deltaPercentage,
                trajectory,
            });
        }

        return seriesList;
    } catch (err) {
        console.warn('[LongitudinalTrends] Error fetching user lab trends:', err);
        return [];
    }
}
