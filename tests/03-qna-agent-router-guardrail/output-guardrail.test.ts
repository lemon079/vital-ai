import { scanResponseSafety, SAFE_SANITIZED_FALLBACK } from '@/lib/services/output-guardrail';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    responseGuardrailLog: { create: jest.fn() },
  },
}));

describe('Phase 3: Output Guardrail Scanner (GUARDRAIL-01)', () => {
  it('should pass clean educational responses without flagging', () => {
    const cleanResponse =
      'Hemoglobin carries oxygen in red blood cells. Your result of 14.2 g/dL falls within standard adult reference bounds.';

    const result = scanResponseSafety(cleanResponse);
    expect(result.flagged).toBe(false);
  });

  it('should detect and flag formal diagnostic claims', () => {
    const diagnosticResponse = 'Based on your glucose of 220 mg/dL, I diagnose you with Type 2 Diabetes.';

    const result = scanResponseSafety(diagnosticResponse);
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain('Diagnostic claim pattern matched');
  });

  it('should detect and flag prescription advice', () => {
    const prescriptionResponse = 'You should take 50mg of Metformin twice daily with meals.';

    const result = scanResponseSafety(prescriptionResponse);
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain('Prescription advice pattern matched');
  });

  it('should contain compulsory disclaimer in sanitized fallback', () => {
    expect(SAFE_SANITIZED_FALLBACK).toContain('VitalSense AI does not issue formal medical diagnoses');
    expect(SAFE_SANITIZED_FALLBACK).toContain('Disclaimer:');
  });
});
