import { verifyHealthDataConsent } from '@/lib/services/compliance-audit';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

describe('Phase 8: User Health Consent Auditor (COMPLY-01)', () => {
  it('should return hasConsent = false when user has no consent timestamp', async () => {
    const result = await verifyHealthDataConsent('unconsented-user-id');
    expect(result.hasConsent).toBe(false);
    expect(result.consentTimestamp).toBeNull();
  });
});
