import { createReportShareToken } from '@/lib/services/share-token';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    reportShareToken: { create: jest.fn(), findUnique: jest.fn() },
  },
}));

describe('Phase 5: Shareable Guest Token API (SHARE-01)', () => {
  it('should generate a valid UUID share token with expiration timestamp', async () => {
    const result = await createReportShareToken('report-123', 48);

    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(10);
    expect(result.shareUrl).toBe(`/api/reports/share/${result.token}`);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
