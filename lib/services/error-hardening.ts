import { logger } from './logger';

export interface SanitizedErrorResponse {
    success: false;
    error: string;
    statusCode: number;
}

/**
 * Global error handler that sanitizes internal stack traces and database credentials before returning API responses.
 */
export function handleApiError(error: unknown, fallbackMessage: string = 'An unexpected server error occurred'): SanitizedErrorResponse {
    let statusCode = 500;
    let safeMessage = fallbackMessage;

    if (error instanceof Error) {
        logger.error(`API Exception: ${error.message}`, { stack: error.stack });

        // Known client validation errors
        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            statusCode = 400;
            safeMessage = error.message;
        } else if (error.message.includes('Unauthorized') || error.message.includes('Consent')) {
            statusCode = 401;
            safeMessage = error.message;
        }
    } else {
        logger.error(`API Exception (Unknown type): ${String(error)}`);
    }

    return {
        success: false,
        error: safeMessage,
        statusCode,
    };
}
