import { prisma } from '@/lib/db/client';

export interface ConsentVerificationResult {
    hasConsent: boolean;
    consentTimestamp: Date | null;
}

/**
 * Verifies if user has provided active health data consent (consent_health_data_at).
 */
export async function verifyHealthDataConsent(userId: string): Promise<ConsentVerificationResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { consent_health_data_at: true },
        });

        if (!user || !user.consent_health_data_at) {
            return {
                hasConsent: false,
                consentTimestamp: null,
            };
        }

        return {
            hasConsent: true,
            consentTimestamp: user.consent_health_data_at,
        };
    } catch (err) {
        console.warn('[ComplianceAudit] Error verifying health consent:', err);
        return {
            hasConsent: false,
            consentTimestamp: null,
        };
    }
}

/**
 * Audits AI output text to ensure mandatory legal disclaimer is present.
 */
export function auditDisclaimerPresence(responseText: string): boolean {
    if (!responseText) return false;
    return responseText.toLowerCase().includes('disclaimer:');
}
