import { updateReportStatus } from './reports';

// ============================================================
// In-process async job queue skeleton (Phase 0)
// Will be replaced by a proper queue (BullMQ, etc.) in Phase 7
// ============================================================

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobEntry {
    jobId: string;
    reportId: string;
    status: JobStatus;
    createdAt: Date;
    completedAt?: Date;
    error?: string;
}

// In-memory job store — acceptable for Phase 0 skeleton
const jobStore = new Map<string, JobEntry>();

let jobCounter = 0;

/**
 * Enqueues a report for background processing.
 * Updates Report.status to "processing" and kicks off async work.
 * Returns immediately with the job ID.
 */
export async function enqueueReportProcessing(reportId: string): Promise<JobEntry> {
    jobCounter++;
    const jobId = `job-${Date.now()}-${jobCounter}`;

    const entry: JobEntry = {
        jobId,
        reportId,
        status: 'queued',
        createdAt: new Date(),
    };

    jobStore.set(reportId, entry);

    // Fire-and-forget: kick off background processing
    processReportAsync(reportId, jobId).catch((err) => {
        console.error(`[JobQueue] Background processing failed for report ${reportId}:`, err);
    });

    return entry;
}

/**
 * Gets the current job status for a report.
 */
export function getJobStatus(reportId: string): JobEntry | undefined {
    return jobStore.get(reportId);
}

/**
 * Placeholder background processing function.
 * In Phase 1, this will be replaced by the real Extraction Agent pipeline.
 */
async function processReportAsync(reportId: string, jobId: string): Promise<void> {
    const entry = jobStore.get(reportId);
    if (!entry) return;

    try {
        // Mark as processing
        entry.status = 'processing';
        await updateReportStatus(reportId, 'processing');

        // TODO: Phase 1 — Replace with real extraction agent call
        // For now, simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Mark as completed (extracted) — in Phase 1 this will go through
        // extracted → pending_review → analyzed pipeline
        entry.status = 'completed';
        entry.completedAt = new Date();
        await updateReportStatus(reportId, 'extracted');

    } catch (err) {
        entry.status = 'failed';
        entry.error = err instanceof Error ? err.message : 'Unknown error';
        await updateReportStatus(reportId, 'failed').catch(() => {});
    }
}

/**
 * Clears the in-memory job store. Used for testing.
 */
export function clearJobStore(): void {
    jobStore.clear();
    jobCounter = 0;
}
