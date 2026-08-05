import { calculateTrajectory } from '@/lib/services/longitudinal-trends';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    labResultValue: { findMany: jest.fn() },
  },
}));

describe('Phase 6: Longitudinal Trajectory Calculation (TREND-02)', () => {
  it('should classify changes within 5% as "stable"', () => {
    expect(calculateTrajectory(100, 103)).toBe('stable');
    expect(calculateTrajectory(100, 97)).toBe('stable');
  });

  it('should classify movement towards normal range midpoint as "improving"', () => {
    // Normal bounds 70 - 100 (midpoint 85). Previous 150 (dist 65), Latest 110 (dist 25) -> improving
    expect(calculateTrajectory(150, 110, 70, 100)).toBe('improving');
  });

  it('should classify movement further away from normal range midpoint as "worsening"', () => {
    // Normal bounds 70 - 100 (midpoint 85). Previous 110 (dist 25), Latest 160 (dist 75) -> worsening
    expect(calculateTrajectory(110, 160, 70, 100)).toBe('worsening');
  });
});
