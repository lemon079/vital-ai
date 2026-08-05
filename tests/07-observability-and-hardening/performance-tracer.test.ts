import { measureLatency } from '@/lib/services/performance-tracer';

describe('Phase 7: Performance Latency Tracer (OBSERVE-01)', () => {
  it('should measure latency of async operations and return result with duration', async () => {
    const dummyTask = async () => {
      await new Promise((res) => setTimeout(res, 20));
      return 'task_complete';
    };

    const outcome = await measureLatency('dummy_task', dummyTask);

    expect(outcome.result).toBe('task_complete');
    expect(outcome.durationMs).toBeGreaterThanOrEqual(15);
  });
});
