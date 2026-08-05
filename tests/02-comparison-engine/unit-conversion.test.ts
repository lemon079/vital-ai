import { normalizeUnit, DEFAULT_UNIT_CONVERSIONS } from '@/lib/services/unit-conversion';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    unitConversion: { findFirst: jest.fn(), upsert: jest.fn() },
  },
}));

describe('Phase 2: Unit Conversion Engine (ENGINE-02)', () => {
  it('should normalize unit string properly', () => {
    expect(normalizeUnit(' g / dL ')).toBe('g/dl');
    expect(normalizeUnit('mmol / L')).toBe('mmol/l');
  });

  it('should perform unit conversions accurately with multiplication factors', () => {
    const convert = (testCode: string, value: number, from: string, to: string) => {
      const normFrom = normalizeUnit(from);
      const normTo = normalizeUnit(to);

      if (normFrom === normTo) return { value, converted: false };

      const rule = DEFAULT_UNIT_CONVERSIONS.find(
        (r) =>
          r.testCode === testCode &&
          normalizeUnit(r.fromUnit) === normFrom &&
          normalizeUnit(r.toUnit) === normTo
      );

      if (rule) {
        return { value: Math.round(value * rule.multiplyFactor * 1000) / 1000, converted: true };
      }
      return { value, converted: false };
    };

    // Hemoglobin g/dL -> g/L (x 10)
    expect(convert('hemoglobin', 14.2, 'g/dL', 'g/L')).toEqual({ value: 142, converted: true });
    // Hemoglobin g/L -> g/dL (x 0.1)
    expect(convert('hemoglobin', 142, 'g/L', 'g/dL')).toEqual({ value: 14.2, converted: true });

    // Glucose mmol/L -> mg/dL (x 18.018)
    expect(convert('glucose', 5.5, 'mmol/L', 'mg/dL')).toEqual({ value: 99.099, converted: true });

    // Same unit -> no conversion
    expect(convert('hemoglobin', 14.2, 'g/dL', 'g/dL')).toEqual({ value: 14.2, converted: false });
  });
});
