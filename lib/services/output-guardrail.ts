import { prisma } from '@/lib/db/client';
import { MEDICAL_DISCLAIMER } from '../agent/nodes/qna-agent';

export type AgentType = 'qna' | 'followup' | 'summary';

export interface GuardrailScanResult {
    flagged: boolean;
    flagReason?: string;
    originalResponse: string;
    finalResponseSent: string;
    logId?: string;
}

export const DIAGNOSTIC_PATTERNS = [
    /i\s+diagnose\s+you/i,
    /my\s+diagnosis\s+is/i,
    /you\s+definitely\s+have\s+([a-z\s]+)/i,
    /you\s+are\s+suffering\s+from\s+([a-z\s]+)\s+disease/i,
];

export const PRESCRIPTION_PATTERNS = [
    /i\s+prescribe/i,
    /take\s+\d+\s*(mg|g|ml|tablets?|capsules?)\s+of/i,
    /stop\s+taking\s+(your\s+)?medication/i,
    /increase\s+your\s+dosage\s+to/i,
];

export const SAFE_SANITIZED_FALLBACK =
    `Laboratory test values provide reference context regarding health markers and require professional evaluation. VitalSense AI does not issue formal medical diagnoses or prescribing instructions. Please consult a licensed physician to discuss your results and treatment options.${MEDICAL_DISCLAIMER}`;

/**
 * Scans an AI response for forbidden diagnostic or prescription phrasing.
 */
export function scanResponseSafety(response: string): { flagged: boolean; reason?: string } {
    if (!response || response.trim() === '') {
        return { flagged: false };
    }

    for (const pattern of DIAGNOSTIC_PATTERNS) {
        if (pattern.test(response)) {
            return {
                flagged: true,
                reason: `Diagnostic claim pattern matched: ${pattern.toString()}`,
            };
        }
    }

    for (const pattern of PRESCRIPTION_PATTERNS) {
        if (pattern.test(response)) {
            return {
                flagged: true,
                reason: `Prescription advice pattern matched: ${pattern.toString()}`,
            };
        }
    }

    return { flagged: false };
}

/**
 * Scans, sanitizes if necessary, and logs the response to ResponseGuardrailLog DB table.
 */
export async function scanAndLogResponse(
    conversationId: string,
    agentType: AgentType | string,
    rawResponse: string
): Promise<GuardrailScanResult> {
    const scan = scanResponseSafety(rawResponse);
    const finalResponseSent = scan.flagged ? SAFE_SANITIZED_FALLBACK : rawResponse;

    let logId: string | undefined = undefined;

    try {
        const log = await prisma.responseGuardrailLog.create({
            data: {
                conversation_id: conversationId,
                agent_type: (agentType as any) || 'qna',
                flagged: scan.flagged,
                flag_reason: scan.reason || null,
                final_response_sent: finalResponseSent,
            },
        });
        logId = log.id;
    } catch (err) {
        console.warn('[OutputGuardrail] Error logging guardrail evaluation to DB:', err);
    }

    return {
        flagged: scan.flagged,
        flagReason: scan.reason,
        originalResponse: rawResponse,
        finalResponseSent,
        logId,
    };
}
