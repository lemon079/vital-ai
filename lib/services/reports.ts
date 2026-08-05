import { prisma } from '@/lib/db/client';

// ============================================================
// Report persistence helpers
// ============================================================

export interface CreateReportInput {
    userId: string;
    fileUri: string;
    sourceLabName?: string;
    sampleCollectedDate?: string; // ISO date string
}

/**
 * Creates a Report row in the database with status = "uploaded".
 */
export async function createReport(input: CreateReportInput) {
    const report = await prisma.report.create({
        data: {
            user_id: input.userId,
            file_uri: input.fileUri,
            status: 'uploaded',
            source_lab_name: input.sourceLabName ?? null,
            sample_collected_date: input.sampleCollectedDate
                ? new Date(input.sampleCollectedDate)
                : null,
        },
    });

    return report;
}

/**
 * Get a report by ID.
 */
export async function getReportById(reportId: string) {
    return prisma.report.findUnique({
        where: { id: reportId },
    });
}

/**
 * Update a report's status.
 */
export async function updateReportStatus(
    reportId: string,
    status: 'uploaded' | 'processing' | 'extracted' | 'pending_review' | 'analyzed' | 'failed'
) {
    return prisma.report.update({
        where: { id: reportId },
        data: { status },
    });
}

/**
 * Get all reports for a user.
 */
export async function getReportsByUserId(userId: string) {
    return prisma.report.findMany({
        where: { user_id: userId },
        orderBy: { uploaded_at: 'desc' },
    });
}
