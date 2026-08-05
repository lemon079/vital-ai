import { logger } from './logger';

export interface PerformanceMetrics {
    operation: string;
    durationMs: number;
    success: boolean;
    meta?: Record<string, any>;
}

/**
 * Measures the execution latency of an async operation and logs structured performance metrics.
 */
export async function measureLatency<T>(
    operationName: string,
    asyncFn: () => Promise<T>,
    meta?: Record<string, any>
): Promise<{ result: T; durationMs: number }> {
    const startTime = performance.now();
    let success = true;

    try {
        const result = await asyncFn();
        const endTime = performance.now();
        const durationMs = Math.round((endTime - startTime) * 100) / 100;

        logger.info(`[Latency] ${operationName} completed in ${durationMs}ms`, {
            operation: operationName,
            durationMs,
            success: true,
            ...meta,
        });

        return { result, durationMs };
    } catch (err) {
        success = false;
        const endTime = performance.now();
        const durationMs = Math.round((endTime - startTime) * 100) / 100;

        logger.error(`[Latency] ${operationName} failed after ${durationMs}ms`, {
            operation: operationName,
            durationMs,
            success: false,
            error: err instanceof Error ? err.message : String(err),
            ...meta,
        });

        throw err;
    }
}
