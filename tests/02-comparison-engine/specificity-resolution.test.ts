import { calculateSpecificityRank, DEFAULT_REFERENCE_RANGES, Sex, PregnancyStatus } from '@/lib/services/reference-ranges';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    referenceRange: { findMany: jest.fn(), create: jest.fn() },
  },
}));

describe('Phase 2: Demographic Specificity Resolution (ENGINE-03)', () => {
  it('should calculate specificity rank based on constraint count', () => {
    // General adult (0 constraints)
    expect(calculateSpecificityRank({ low: 12, high: 16 })).toBe(0);

    // Sex constraint (1 constraint)
    expect(calculateSpecificityRank({ sex: 'male', low: 13.8, high: 17.2 })).toBe(1);

    // Sex + Pregnancy constraint (2 constraints)
    expect(
      calculateSpecificityRank({
        sex: 'female',
        pregnancyTrimester: 'first_trimester',
        low: 11.0,
        high: 14.0,
      })
    ).toBe(2);
  });

  it('should prioritize higher specificity rank ranges when matching demographics', () => {
    const getBestRange = (testCode: string, sex?: Sex, pregnancyStatus?: PregnancyStatus) => {
      const candidates = DEFAULT_REFERENCE_RANGES.filter((r) => r.testCode === testCode);
      candidates.sort((a, b) => calculateSpecificityRank(b) - calculateSpecificityRank(a));

      for (const range of candidates) {
        if (range.sex && range.sex !== sex) continue;
        if (range.pregnancyTrimester && range.pregnancyTrimester !== pregnancyStatus) continue;
        return range;
      }
      return null;
    };

    // Adult male Hemoglobin -> should select male specific range (13.8 - 17.2)
    const maleHb = getBestRange('hemoglobin', 'male');
    expect(maleHb?.low).toBe(13.8);
    expect(maleHb?.high).toBe(17.2);

    // Pregnant female (first trimester) Hemoglobin -> should select pregnant range (11.0 - 14.0)
    const pregnantHb = getBestRange('hemoglobin', 'female', 'first_trimester');
    expect(pregnantHb?.low).toBe(11.0);
    expect(pregnantHb?.high).toBe(14.0);

    // Unknown demographic Hemoglobin -> should fall back to general range (12.0 - 16.0)
    const generalHb = getBestRange('hemoglobin');
    expect(generalHb?.low).toBe(12.0);
    expect(generalHb?.high).toBe(16.0);
  });
});
