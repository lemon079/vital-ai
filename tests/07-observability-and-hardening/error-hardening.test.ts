import { handleApiError } from '@/lib/services/error-hardening';

describe('Phase 7: Error Hardening & Sanitization (HARDEN-01)', () => {
  it('should sanitize uncaught errors and prevent leaking stack traces', () => {
    const rawError = new Error('Database connection failed to postgresql://user:secret@localhost:5432/db');

    const result = handleApiError(rawError, 'Internal server error');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.error).toBe('Internal server error');
    expect(result.error).not.toContain('postgresql://');
  });

  it('should preserve safe client validation messages', () => {
    const validationError = new Error('Report not found');

    const result = handleApiError(validationError);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.error).toBe('Report not found');
  });
});
