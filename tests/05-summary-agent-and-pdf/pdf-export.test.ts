import { generateReportPdfBuffer } from '@/lib/services/pdf-export';

describe('Phase 5: PDF Export Engine (PDF-01)', () => {
  it('should generate a valid non-empty PDF document buffer', async () => {
    const data = {
      reportTitle: 'Complete Blood Count Panel',
      patientName: 'Jane Doe',
      collectedDate: '2026-08-01',
      summaryText: 'Executive summary content.',
      labResults: [
        { testName: 'Hemoglobin', value: 14.2, unit: 'g/dL', range: '12.0 - 16.0', flag: 'normal' },
        { testName: 'WBC', value: 12.5, unit: 'x10^3/uL', range: '4.5 - 11.0', flag: 'high' },
      ],
    };

    const buffer = await generateReportPdfBuffer(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const text = buffer.toString('utf-8');
    expect(text).toContain('VITALSENSE AI - CLINICAL REPORT SUMMARY');
    expect(text).toContain('Hemoglobin');
    expect(text).toContain('14.2');
  });
});
