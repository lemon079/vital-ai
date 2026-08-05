import { routeUserMessage } from '@/lib/agent/nodes/orchestrator-router';
import { scanAndLogResponse } from '@/lib/services/output-guardrail';
import { measureLatency } from '@/lib/services/performance-tracer';

jest.mock('@/lib/db/client', () => ({
  prisma: {
    responseGuardrailLog: { create: jest.fn() },
    conversation: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/lib/agent/nodes/qna-agent', () => ({
  processQnaQuery: jest.fn().mockResolvedValue(
    'Hemoglobin is the protein in red blood cells that transports oxygen.\n\n*Disclaimer: VitalSense AI provides general health information.*'
  ),
  MEDICAL_DISCLAIMER: '*Disclaimer: VitalSense AI provides general health information.*',
}));

describe('LangChain Integration Testing Suite (INTEGRATION)', () => {
  it('should route message, scan output guardrails, and track latency end-to-end', async () => {
    const pipelineTask = async () => {
      // 1. Route message
      const routerRes = await routeUserMessage({
        reportStatus: 'analyzed',
        userQuery: 'What is Hemoglobin?',
      });

      // 2. Scan guardrails
      const guardrailRes = await scanAndLogResponse(
        'conv-uuid-123',
        'qna',
        routerRes.response
      );

      return guardrailRes;
    };

    const { result, durationMs } = await measureLatency('agent_integration_pipeline', pipelineTask);

    expect(result.flagged).toBe(false);
    expect(result.finalResponseSent).toContain('Hemoglobin');
    expect(result.finalResponseSent).toContain('Disclaimer:');
    expect(durationMs).toBeLessThan(5000);
  });
});
