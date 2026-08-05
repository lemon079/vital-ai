import { chatModel } from '@/lib/ai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

export const MEDICAL_DISCLAIMER =
    '\n\n*Disclaimer: VitalSense AI provides general health information and reference range context. It does not issue formal medical diagnoses, treatment advice, or prescriptions. Always consult a licensed healthcare professional for medical decisions.*';

export const QNA_SYSTEM_PROMPT = `You are the VitalSense QnA Agent, a compassionate medical information AI assistant.
Your goal is to explain laboratory tests, blood work terminology, reference ranges, and physiological concepts to patients in clear, accessible language.

CRITICAL COMPLIANCE RULES:
1. NON-DIAGNOSTIC POLICY: Never issue a formal diagnosis (e.g. "You have diabetes", "I diagnose you with anemia"). Use observational, educational language ("An elevated WBC count often reflects a response to infection or inflammation", "Your result is above the standard reference range").
2. NO PRESCRIPTIONS: Never prescribe medications, suggest dosage adjustments, or recommend specific pharmaceutical treatments.
3. ALWAYS ENCOURAGE CLINICAL FOLLOW-UP: Advise patients to review their report with their primary care physician.`;

export async function processQnaQuery(userQuery: string, contextText: string = ''): Promise<string> {
    try {
        const messages = [
            new SystemMessage(QNA_SYSTEM_PROMPT),
            new HumanMessage(contextText ? `CONTEXT:\n${contextText}\n\nUSER QUESTION: ${userQuery}` : `USER QUESTION: ${userQuery}`),
        ];

        const response = await chatModel.invoke(messages);
        let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

        if (!content.includes('Disclaimer:')) {
            content += MEDICAL_DISCLAIMER;
        }

        return content;

    } catch (err) {
        console.warn('[QnaAgent] LLM call failed or offline, returning fallback answer:', err);
        return `Laboratory test values provide reference insights into your health markers. Values outside standard reference ranges are common and best interpreted by a physician in the context of your symptoms and medical history.${MEDICAL_DISCLAIMER}`;
    }
}
