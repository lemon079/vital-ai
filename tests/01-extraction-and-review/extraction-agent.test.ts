import { calculateFieldConfidence, parseRawTextHeuristically } from '@/lib/services/extraction';

describe('Phase 1: Extraction Agent & Confidence Scoring (EXTRACT-01)', () => {
  it('should calculate confidence score correctly for complete numeric item', () => {
    const item = {
      testCode: 'hemoglobin',
      testName: 'Hemoglobin',
      extractedValueRaw: '14.2',
      value: 14.2,
      unit: 'g/dL',
      reportStatedRangeLow: 12.0,
      reportStatedRangeHigh: 16.0,
    };

    const score = calculateFieldConfidence(item);
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it('should penalize confidence score for missing numeric parsing on numeric text', () => {
    const item = {
      testCode: 'hemoglobin',
      testName: 'Hemoglobin',
      extractedValueRaw: '14.2 g/dL',
      value: null,
      unit: 'g/dL',
    };

    const score = calculateFieldConfidence(item);
    expect(score).toBeLessThan(0.85);
  });

  it('should parse raw report text heuristically when fallback is triggered', () => {
    const sampleText = `
PATIENT LABORATORY REPORT
Hemoglobin 14.2 g/dL (12.0 - 16.0)
WBC 7.5 x10^3/uL (4.5 - 11.0)
Glucose 105 mg/dL (70 - 99)
    `;

    const items = parseRawTextHeuristically(sampleText);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0].testName).toBe('Hemoglobin');
    expect(items[0].value).toBe(14.2);
    expect(items[0].unit).toBe('g/dL');
    expect(items[0].reportStatedRangeLow).toBe(12.0);
    expect(items[0].reportStatedRangeHigh).toBe(16.0);
  });
});
