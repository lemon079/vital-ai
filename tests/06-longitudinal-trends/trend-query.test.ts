import { getUserLabTrends } from '@/lib/services/longitudinal-trends';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    labResultValue: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

describe('Phase 6: Longitudinal Trend Query Engine (TREND-01)', () => {
  it('should return empty trend series array when no matching results exist', async () => {
    const trends = await getUserLabTrends('user-123');
    expect(Array.isArray(trends)).toBe(true);
    expect(trends.length).toBe(0);
  });
});
