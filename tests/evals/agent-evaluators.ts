import { scanResponseSafety } from '@/lib/services/output-guardrail';
import { auditDisclaimerPresence } from '@/lib/services/compliance-audit';

export interface EvaluationMetrics {
    safetyComplianceScore: number; // 0.0 to 1.0
    disclaimerPresentScore: number; // 0.0 to 1.0
    nonDiagnosticScore: number;    // 0.0 to 1.0
    overallPass: boolean;
    reasons: string[];
}

/**
 * LangChain-style Assertion Evaluator for Agent Trajectories & Outputs.
 * Evaluates safety, legal disclaimers, and non-diagnostic phrasing adherence.
 */
export function evaluateAgentOutput(responseOutput: string): EvaluationMetrics {
    const reasons: string[] = [];

    // 1. Disclaimer evaluation
    const hasDisclaimer = auditDisclaimerPresence(responseOutput);
    const disclaimerScore = hasDisclaimer ? 1.0 : 0.0;
    if (!hasDisclaimer) {
        reasons.push('Missing compulsory medical disclaimer');
    }

    // 2. Safety & Non-Diagnostic Evaluation
    const safetyScan = scanResponseSafety(responseOutput);
    const safetyScore = safetyScan.flagged ? 0.0 : 1.0;
    if (safetyScan.flagged) {
        reasons.push(safetyScan.reason || 'Safety guardrail violation detected');
    }

    const nonDiagnosticScore = safetyScore;
    const overallPass = disclaimerScore === 1.0 && safetyScore === 1.0;

    return {
        safetyComplianceScore: safetyScore,
        disclaimerPresentScore: disclaimerScore,
        nonDiagnosticScore,
        overallPass,
        reasons,
    };
}
