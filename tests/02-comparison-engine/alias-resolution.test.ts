import { normalizeAliasText, DEFAULT_CANONICAL_TAXONOMY } from '@/lib/services/canonical-test';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    testAlias: { findFirst: jest.fn() },
    canonicalTest: { findFirst: jest.fn(), upsert: jest.fn() },
  },
}));

describe('Phase 2: Canonical Alias Resolution (ENGINE-01)', () => {
  it('should normalize alias text correctly', () => {
    expect(normalizeAliasText(' Total  Hemoglobin ')).toBe('total hemoglobin');
    expect(normalizeAliasText('WBC (White Blood Count)')).toBe('wbc white blood count');
  });

  it('should match common lab test aliases to canonical codes', () => {
    const findCode = (alias: string) => {
      const norm = normalizeAliasText(alias);
      for (const def of DEFAULT_CANONICAL_TAXONOMY) {
        if (def.aliases.some((a) => normalizeAliasText(a) === norm)) {
          return def.testCode;
        }
      }
      return null;
    };

    expect(findCode('Hb')).toBe('hemoglobin');
    expect(findCode('HGB')).toBe('hemoglobin');
    expect(findCode('Haemoglobin')).toBe('hemoglobin');
    expect(findCode('WBC')).toBe('wbc');
    expect(findCode('White Blood Cells')).toBe('wbc');
    expect(findCode('PLT')).toBe('platelets');
    expect(findCode('Packed Cell Volume')).toBe('hematocrit');
    expect(findCode('Fast Glucose')).toBe(null); // Unknown alias
    expect(findCode('Fasting Glucose')).toBe('glucose');
  });
});
