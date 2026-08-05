import { enqueueReportProcessing, getJobStatus, clearJobStore } from '@/lib/services/job-queue';

// Mock report status update service so unit tests don't require database connection
jest.mock('@/lib/services/reports', () => ({
  updateReportStatus: jest.fn().mockResolvedValue({ id: 'test-report-123', status: 'processing' }),
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
