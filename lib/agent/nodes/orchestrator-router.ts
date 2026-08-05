import { processQnaQuery } from './qna-agent';

export type ReportStatus =
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'pending_review'
  | 'analyzed'
  | 'failed';

export const CRITICAL_SAFETY_ALERT =
    '⚠️ URGENT SAFETY NOTICE: One or more lab result values in your report exceed critical clinical safety thresholds. Please seek prompt medical evaluation or contact your healthcare provider immediately.';

export interface RouterContext {
    reportId?: string | null;
    reportStatus?: ReportStatus | string | null;
    hasCriticalFlag?: boolean;
    criticalAckAt?: Date | null;
    userQuery: string;
}

export interface RouterOutput {
    action: 'status_response' | 'pending_review_redirect' | 'qna_agent' | 'critical_override';
    response: string;
    isCriticalAlertInjected: boolean;
}

/**
 * Evaluates the report lifecycle status and critical flags to route user queries safely.
 */
export async function routeUserMessage(context: RouterContext): Promise<RouterOutput> {
    let responseHeader = '';
    let isCriticalAlertInjected = false;

    // 1. Critical Flag Safety Override
    if (context.hasCriticalFlag && !context.criticalAckAt) {
        responseHeader = `${CRITICAL_SAFETY_ALERT}\n\n`;
        isCriticalAlertInjected = true;
    }

    // 2. Status-Aware State Machine Routing
    const status = context.reportStatus;

    if (status === 'processing') {
        return {
            action: 'status_response',
            response: `${responseHeader}Your lab report is currently being extracted and analyzed by our system. Please wait a moment while processing completes.`,
            isCriticalAlertInjected,
        };
    }

    if (status === 'pending_review') {
        return {
            action: 'pending_review_redirect',
            response: `${responseHeader}Certain extracted lab test values have low confidence scores and require your confirmation before analysis. Please visit your report review page to confirm or correct these items.`,
            isCriticalAlertInjected,
        };
    }

    if (status === 'failed') {
        return {
            action: 'status_response',
            response: `${responseHeader}We encountered an issue reading your lab report PDF. Please try uploading a clearer file or contact support.`,
            isCriticalAlertInjected,
        };
    }

    // Default: Route to QnA Agent
    const qnaAnswer = await processQnaQuery(context.userQuery);
    return {
        action: isCriticalAlertInjected ? 'critical_override' : 'qna_agent',
        response: `${responseHeader}${qnaAnswer}`,
        isCriticalAlertInjected,
    };
}
