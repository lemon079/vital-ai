import { SUMMARY_SYSTEM_PROMPT } from '@/lib/agent/nodes/summary-agent';
import { MEDICAL_DISCLAIMER } from '@/lib/agent/nodes/qna-agent';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    report: { findUnique: jest.fn() },
    clinicalSummary: { create: jest.fn() },
  },
}));

describe('Phase 5: Summary Agent (SUMMARY-01)', () => {
  it('should include 3 distinct sections in system prompt instructions', () => {
    expect(SUMMARY_SYSTEM_PROMPT).toContain('HIGH PRIORITY & ACTION ITEMS');
    expect(SUMMARY_SYSTEM_PROMPT).toContain('NORMAL PANEL HIGHLIGHTS');
    expect(SUMMARY_SYSTEM_PROMPT).toContain('DOCTOR DISCUSSION TOPICS');
  });

  it('should include standard medical disclaimer text', () => {
    expect(MEDICAL_DISCLAIMER).toContain('Disclaimer:');
  });
});
