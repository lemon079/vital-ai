import { auditDisclaimerPresence } from '@/lib/services/compliance-audit';
import { MEDICAL_DISCLAIMER } from '@/lib/agent/nodes/qna-agent';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

describe('Phase 8: Legal Disclaimer Compliance Auditor (LEGAL-01)', () => {
  it('should detect mandatory disclaimer in formatted response strings', () => {
    const textWithDisclaimer = `Here is your result breakdown.${MEDICAL_DISCLAIMER}`;
    expect(auditDisclaimerPresence(textWithDisclaimer)).toBe(true);
  });

  it('should fail compliance audit when disclaimer is missing', () => {
    const rawText = 'Here is your result breakdown without any disclaimer.';
    expect(auditDisclaimerPresence(rawText)).toBe(false);
  });
});
