export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    correlationId?: string;
    reportId?: string;
    userId?: string;
    meta?: Record<string, any>;
}

export class StructuredLogger {
    private formatLog(level: LogLevel, message: string, meta?: Record<string, any>): string {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta,
        };
        return JSON.stringify(entry);
    }

    info(message: string, meta?: Record<string, any>): void {
        console.log(this.formatLog('info', message, meta));
    }

    warn(message: string, meta?: Record<string, any>): void {
        console.warn(this.formatLog('warn', message, meta));
    }

    error(message: string, meta?: Record<string, any>): void {
        console.error(this.formatLog('error', message, meta));
    }
}

export const logger = new StructuredLogger();
