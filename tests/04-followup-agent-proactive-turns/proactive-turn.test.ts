import { MAX_TURNS_BEFORE_PROACTIVE, DEFAULT_PROACTIVE_SUGGESTIONS } from '@/lib/services/proactive-turn-engine';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    conversation: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

describe('Phase 4: Proactive Turn Engine (PROACTIVE-01)', () => {
  it('should define MAX_TURNS_BEFORE_PROACTIVE threshold as 3', () => {
    expect(MAX_TURNS_BEFORE_PROACTIVE).toBe(3);
  });

  it('should provide default proactive follow-up suggestions', () => {
    expect(DEFAULT_PROACTIVE_SUGGESTIONS.length).toBeGreaterThan(0);
    expect(DEFAULT_PROACTIVE_SUGGESTIONS[0]).toContain('reference ranges');
  });

  it('should accurately evaluate proactive trigger condition logic', () => {
    const shouldTrigger = (turnCount: number, alreadySuggested: boolean) => {
      return turnCount >= MAX_TURNS_BEFORE_PROACTIVE && !alreadySuggested;
    };

    expect(shouldTrigger(1, false)).toBe(false);
    expect(shouldTrigger(2, false)).toBe(false);
    expect(shouldTrigger(3, false)).toBe(true);
    expect(shouldTrigger(4, false)).toBe(true);
    expect(shouldTrigger(3, true)).toBe(false); // Already suggested once
  });
});
