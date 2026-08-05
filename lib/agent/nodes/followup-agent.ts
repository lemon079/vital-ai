import { chatModel } from '@/lib/ai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { MEDICAL_DISCLAIMER } from './qna-agent';

export const FOLLOWUP_SYSTEM_PROMPT = `You are the VitalSense Follow-up Agent.
Your goal is to answer deep-dive follow-up questions from patients regarding their laboratory report findings, potential lifestyle connections, and clinical discussion topics.

CRITICAL COMPLIANCE RULES:
1. NON-DIAGNOSTIC POLICY: Never issue a formal diagnosis. Frame insights around standard reference bounds and physiological mechanisms.
2. NO PRESCRIPTIONS: Do not recommend specific prescription drugs or dosages.
3. CONTEXTUAL ACCURACY: Base your answers on the user's laboratory findings and demographic profile when available.`;

export async function processFollowupQuery(
    userQuery: string,
    labContext: string = '',
    userProfile: string = ''
): Promise<string> {
    try {
        const messages = [
            new SystemMessage(FOLLOWUP_SYSTEM_PROMPT),
            new HumanMessage(
                `PATIENT PROFILE:\n${userProfile || 'Demographics: Standard Adult'}\n\nLAB RESULTS CONTEXT:\n${labContext || 'No specific lab values provided'}\n\nFOLLOW-UP QUESTION:\n${userQuery}`
            ),
        ];

        const response = await chatModel.invoke(messages);
        let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

        if (!content.includes('Disclaimer:')) {
            content += MEDICAL_DISCLAIMER;
        }

        return content;

    } catch (err) {
        console.warn('[FollowupAgent] LLM call failed or offline, returning fallback answer:', err);
        return `Regarding your follow-up query: Laboratory trends are best interpreted in conjunction with your clinical history. We recommend sharing these specific questions with your primary care provider.${MEDICAL_DISCLAIMER}`;
    }
}
