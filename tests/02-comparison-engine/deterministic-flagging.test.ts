import { computeLabFlag } from '@/lib/services/flagging-engine';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    labResultValue: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    report: { update: jest.fn() },
  },
}));

describe('Phase 2: Deterministic Lab Value Flagging Engine (ENGINE-04)', () => {
  const bounds = {
    low: 12.0,
    high: 16.0,
    criticalLow: 7.0,
    criticalHigh: 20.0,
  };

  it('should flag normal values within range as "normal"', () => {
    expect(computeLabFlag(14.2, bounds)).toBe('normal');
    expect(computeLabFlag(12.0, bounds)).toBe('normal');
    expect(computeLabFlag(16.0, bounds)).toBe('normal');
  });

  it('should flag values below low threshold as "low"', () => {
    expect(computeLabFlag(10.5, bounds)).toBe('low');
    expect(computeLabFlag(7.1, bounds)).toBe('low');
  });

  it('should flag values above high threshold as "high"', () => {
    expect(computeLabFlag(17.5, bounds)).toBe('high');
    expect(computeLabFlag(19.9, bounds)).toBe('high');
  });

  it('should flag values below critical low threshold as "critical_low"', () => {
    expect(computeLabFlag(6.8, bounds)).toBe('critical_low');
    expect(computeLabFlag(4.0, bounds)).toBe('critical_low');
  });

  it('should flag values above critical high threshold as "critical_high"', () => {
    expect(computeLabFlag(21.5, bounds)).toBe('critical_high');
    expect(computeLabFlag(25.0, bounds)).toBe('critical_high');
  });
});
