import { StructuredLogger } from '@/lib/services/logger';

describe('Phase 7: Structured Logger (LOGGER-01)', () => {
  it('should format log entries as valid JSON strings with timestamps', () => {
    const loggerInstance = new StructuredLogger();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    loggerInstance.info('Test log message', { reportId: 'report-123' });

    expect(spy).toHaveBeenCalled();
    const logStr = spy.mock.calls[0][0];
    const parsed = JSON.parse(logStr);

    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Test log message');
    expect(parsed.reportId).toBe('report-123');
    expect(parsed.timestamp).toBeDefined();

    spy.mockRestore();
  });
});
