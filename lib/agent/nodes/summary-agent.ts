import { prisma } from '@/lib/db/client';
import { chatModel } from '@/lib/ai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { MEDICAL_DISCLAIMER } from './qna-agent';

export const SUMMARY_SYSTEM_PROMPT = `You are the VitalSense Summary Agent.
Generate a clear, structured Executive Summary of the patient's lab report formatted into 3 distinct sections:

1. 🚨 HIGH PRIORITY & ACTION ITEMS: Flagged results outside normal bounds or critical values requiring attention.
2. ✅ NORMAL PANEL HIGHLIGHTS: Standard markers within expected reference bounds.
3. 🩺 DOCTOR DISCUSSION TOPICS: Key questions for the patient to ask their physician.

CRITICAL RULES:
- Use clear non-diagnostic language.
- Include standard medical disclaimer at the end.`;

export interface ExecutiveSummaryOutput {
    summaryText: string;
    highPriorityCount: number;
    normalCount: number;
    dbSummaryId?: string;
}

export async function generateExecutiveSummary(reportId: string): Promise<ExecutiveSummaryOutput> {
    try {
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                user: true,
                lab_result_values: true,
            },
        });

        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }

        const results = report.lab_result_values || [];
        const highPriority = results.filter(
            (r) => r.flag && ['high', 'low', 'critical_high', 'critical_low'].includes(r.flag)
        );
        const normal = results.filter((r) => r.flag === 'normal' || !r.flag);

        const resultsSummary = results
            .map((r) => `- ${r.test_code}: ${r.value ?? r.extracted_value_raw ?? 'N/A'} ${r.unit || ''} (Flag: ${r.flag || 'normal'})`)
            .join('\n');

        const userContext = `Patient Sex: ${report.user.sex || 'Not specified'}, Pregnancy: ${report.user.pregnancy_status || 'not_pregnant'}`;

        const messages = [
            new SystemMessage(SUMMARY_SYSTEM_PROMPT),
            new HumanMessage(`PATIENT METRICS:\n${userContext}\n\nLAB RESULTS:\n${resultsSummary || 'No items extracted'}`),
        ];

        let summaryText = '';
        try {
            const response = await chatModel.invoke(messages);
            summaryText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        } catch {
            summaryText = `### Executive Summary\n\n🚨 **HIGH PRIORITY ITEMS (${highPriority.length})**\n- Results outside standard range detected.\n\n✅ **NORMAL HIGHLIGHTS (${normal.length})**\n- Tests within standard reference bounds.\n\n🩺 **DOCTOR DISCUSSION TOPICS**\n- Review report values with your physician.`;
        }

        if (!summaryText.includes('Disclaimer:')) {
            summaryText += MEDICAL_DISCLAIMER;
        }

        // Save to ClinicalSummary DB table
        const dbSummary = await prisma.clinicalSummary.create({
            data: {
                report_id: reportId,
                content: summaryText,
            },
        }).catch(() => null);

        return {
            summaryText,
            highPriorityCount: highPriority.length,
            normalCount: normal.length,
            dbSummaryId: dbSummary?.id,
        };
    } catch (err) {
        console.warn('[SummaryAgent] Error generating executive summary:', err);
        return {
            summaryText: `Executive summary unavailable. Please consult your physician for report interpretation.${MEDICAL_DISCLAIMER}`,
            highPriorityCount: 0,
            normalCount: 0,
        };
    }
}
