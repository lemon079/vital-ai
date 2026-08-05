import { routeUserMessage, CRITICAL_SAFETY_ALERT } from '@/lib/agent/nodes/orchestrator-router';

jest.mock('@/lib/agent/nodes/qna-agent', () => ({
  processQnaQuery: jest.fn().mockResolvedValue('QnA response body.'),
}));

describe('Phase 3: Critical Flag Safety Override (ROUTER-01)', () => {
  it('should inject critical safety alert when hasCriticalFlag = true and unacknowledged', async () => {
    const result = await routeUserMessage({
      reportStatus: 'analyzed',
      hasCriticalFlag: true,
      criticalAckAt: null,
      userQuery: 'What does my WBC mean?',
    });

    expect(result.isCriticalAlertInjected).toBe(true);
    expect(result.response).toContain(CRITICAL_SAFETY_ALERT);
    expect(result.action).toBe('critical_override');
  });

  it('should not inject critical safety alert when criticalAckAt is already set', async () => {
    const result = await routeUserMessage({
      reportStatus: 'analyzed',
      hasCriticalFlag: true,
      criticalAckAt: new Date(),
      userQuery: 'What does my WBC mean?',
    });

    expect(result.isCriticalAlertInjected).toBe(false);
    expect(result.response).not.toContain(CRITICAL_SAFETY_ALERT);
    expect(result.action).toBe('qna_agent');
  });
});
