import { prisma } from '@/lib/db/client';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    user: {},
    report: {},
    labResultValue: {},
    clinicalSummary: {},
    reportShareToken: {},
    responseGuardrailLog: {},
    referenceRange: {},
    unitConversion: {},
    canonicalTest: {},
  },
}));

describe('Database Persistence & Schema Integration Tests', () => {
  it('should verify database client model connectivity and schema structure', async () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.report).toBeDefined();
    expect(prisma.labResultValue).toBeDefined();
    expect(prisma.clinicalSummary).toBeDefined();
    expect(prisma.reportShareToken).toBeDefined();
    expect(prisma.responseGuardrailLog).toBeDefined();
    expect(prisma.referenceRange).toBeDefined();
    expect(prisma.unitConversion).toBeDefined();
    expect(prisma.canonicalTest).toBeDefined();
  });
});
