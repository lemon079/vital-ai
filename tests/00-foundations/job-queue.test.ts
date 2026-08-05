import { enqueueReportProcessing, getJobStatus, clearJobStore } from '@/lib/services/job-queue';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    report: { update: jest.fn(), findUnique: jest.fn() },
    labResultValue: { create: jest.fn() },
    canonicalTest: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/services/reports', () => ({
  updateReportStatus: jest.fn().mockResolvedValue({ id: 'test-report-123', status: 'processing' }),
  getReportById: jest.fn().mockResolvedValue({ id: 'test-report-123', file_uri: '/tmp/report.pdf', user_id: 'user-001' }),
}));

jest.mock('@/lib/services/extraction', () => ({
  extractLabResultsFromPdf: jest.fn().mockResolvedValue({ reportId: 'test-report-123', items: [], rawText: '' }),
}));

jest.mock('@/lib/services/lab-results', () => ({
  saveExtractedResults: jest.fn().mockResolvedValue({ reportId: 'test-report-123', totalExtracted: 0, pendingReviewCount: 0, reportStatus: 'extracted' }),
}));

describe('Phase 0: Asynchronous Job Queue Skeleton', () => {
  beforeEach(() => {
    clearJobStore();
  });

  it('should enqueue a job with status queued and track it by reportId', async () => {
    const reportId = 'report-uuid-001';
    const job = await enqueueReportProcessing(reportId);

    expect(job.jobId).toBeDefined();
    expect(job.reportId).toBe(reportId);
    expect(job.status).toMatch(/^(queued|processing|completed)$/);

    const fetchedJob = getJobStatus(reportId);
    expect(fetchedJob).toBeDefined();
    expect(fetchedJob?.reportId).toBe(reportId);
  });

  it('should allow clearing the job store', async () => {
    const reportId = 'report-uuid-002';
    await enqueueReportProcessing(reportId);
    expect(getJobStatus(reportId)).toBeDefined();

    clearJobStore();
    expect(getJobStatus(reportId)).toBeUndefined();
  });
});
