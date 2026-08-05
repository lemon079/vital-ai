import { prisma } from '@/lib/db/client';

export const MAX_TURNS_BEFORE_PROACTIVE = 3;

export interface ProactiveCheckResult {
    turnCount: number;
    shouldSuggestProactive: boolean;
    suggestedQuestions: string[];
}

export const DEFAULT_PROACTIVE_SUGGESTIONS = [
    'Would you like to know how your lab results compare against typical reference ranges?',
    'Should we explore potential lifestyle or dietary factors related to these markers?',
    'Would you like a list of recommended discussion topics for your doctor visit?',
];

/**
 * Increments conversation turn count and evaluates if proactive suggestions should trigger.
 */
export async function evaluateProactiveTurn(conversationId: string): Promise<ProactiveCheckResult> {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return {
                turnCount: 1,
                shouldSuggestProactive: false,
                suggestedQuestions: [],
            };
        }

        const newTurnCount = conversation.turn_count + 1;
        const alreadySuggested = conversation.proactive_suggested_at !== null;
        const shouldSuggest = newTurnCount >= MAX_TURNS_BEFORE_PROACTIVE && !alreadySuggested;

        // Update database turn count and proactive timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                turn_count: newTurnCount,
                proactive_suggested_at: shouldSuggest ? new Date() : conversation.proactive_suggested_at,
            },
        });

        return {
            turnCount: newTurnCount,
            shouldSuggestProactive: shouldSuggest,
            suggestedQuestions: shouldSuggest ? DEFAULT_PROACTIVE_SUGGESTIONS : [],
        };
    } catch (err) {
        console.warn('[ProactiveTurnEngine] DB error evaluating turn count:', err);
        return {
            turnCount: 1,
            shouldSuggestProactive: false,
            suggestedQuestions: [],
        };
    }
}
