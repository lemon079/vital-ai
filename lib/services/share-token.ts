import { prisma } from '@/lib/db/client';
import crypto from 'crypto';

export interface ShareTokenResult {
    token: string;
    expiresAt: Date | null;
    shareUrl: string;
}

/**
 * Creates a secure guest share token for a lab report.
 */
export async function createReportShareToken(
    reportId: string,
    expiresHours: number = 72
): Promise<ShareTokenResult> {
    const token = crypto.randomUUID();
    const expiresAt = expiresHours > 0 ? new Date(Date.now() + expiresHours * 3600 * 1000) : null;

    try {
        await prisma.reportShareToken.create({
            data: {
                report_id: reportId,
                token,
                expires_at: expiresAt,
            },
        });
    } catch (err) {
        console.warn('[ShareToken] DB error creating share token:', err);
    }

    return {
        token,
        expiresAt,
        shareUrl: `/api/reports/share/${token}`,
    };
}

/**
 * Validates a share token and returns the associated report if active and unexpired.
 */
export async function validateShareToken(token: string) {
    try {
        const record = await prisma.reportShareToken.findUnique({
            where: { token },
            include: {
                report: {
                    include: {
                        lab_result_values: true,
                        clinical_summaries: true,
                    },
                },
            },
        });

        if (!record) {
            return { valid: false, reason: 'Token not found' };
        }

        if (record.expires_at && new Date() > record.expires_at) {
            return { valid: false, reason: 'Token has expired' };
        }

        return {
            valid: true,
            report: record.report,
        };
    } catch (err) {
        console.warn('[ShareToken] Error validating token:', err);
        return { valid: false, reason: 'Database error' };
    }
}
