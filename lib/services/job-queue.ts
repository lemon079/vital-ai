import { updateReportStatus, getReportById } from './reports';
import { extractLabResultsFromPdf } from './extraction';
import { saveExtractedResults } from './lab-results';

// ============================================================
// Asynchronous Job Queue Pipeline (Phase 1 Integration)
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

const jobStore = new Map<string, JobEntry>();
let jobCounter = 0;

/**
 * Enqueues a report for background processing.
 * Updates Report.status to "processing" and kicks off extraction pipeline.
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

    // Fire-and-forget background extraction pipeline
    processReportAsync(reportId, jobId).catch((err) => {
        console.error(`[JobQueue] Extraction pipeline failed for report ${reportId}:`, err);
    });

    return entry;
}

/**
 * Gets current job status.
 */
export function getJobStatus(reportId: string): JobEntry | undefined {
    return jobStore.get(reportId);
}

/**
 * Background processing function executing Phase 1 extraction pipeline:
 * 1. Mark status = "processing"
 * 2. Load report & extract structured fields via LLM/heuristic parser
 * 3. Persist LabResultValue records & apply confidence threshold (0.85)
 * 4. Update Report status to "extracted" or "pending_review"
 */
async function processReportAsync(reportId: string, jobId: string): Promise<void> {
    const entry = jobStore.get(reportId);
    if (!entry) return;

    try {
        entry.status = 'processing';
        await updateReportStatus(reportId, 'processing');

        const report = await getReportById(reportId);
        if (!report || !report.file_uri) {
            throw new Error(`Report or file_uri not found for ID ${reportId}`);
        }

        // 1. Run LLM / heuristic extraction agent
        const extraction = await extractLabResultsFromPdf(report.file_uri, reportId);

        // 2. Persist extracted results and evaluate confidence threshold
        const summary = await saveExtractedResults(reportId, report.user_id, extraction.items);

        entry.status = 'completed';
        entry.completedAt = new Date();
        console.log(`[JobQueue] Report ${reportId} processed: ${summary.totalExtracted} extracted, ${summary.pendingReviewCount} pending review. Final status: ${summary.reportStatus}`);

    } catch (err) {
        entry.status = 'failed';
        entry.error = err instanceof Error ? err.message : 'Unknown error';
        await updateReportStatus(reportId, 'failed').catch(() => {});
    }
}

/**
 * Clears in-memory job store (for testing).
 */
export function clearJobStore(): void {
    jobStore.clear();
    jobCounter = 0;
}
