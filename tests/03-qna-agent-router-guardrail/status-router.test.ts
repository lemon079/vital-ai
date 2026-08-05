import { routeUserMessage } from '@/lib/agent/nodes/orchestrator-router';

// Mock QnA agent call to isolate router tests
jest.mock('@/lib/agent/nodes/qna-agent', () => ({
  processQnaQuery: jest.fn().mockResolvedValue('Here is educational information about Hemoglobin.'),
  MEDICAL_DISCLAIMER: 'Disclaimer: Test disclaimer.',
}));

describe('Phase 3: Status-Aware Orchestrator Router (ROUTER-01)', () => {
  it('should route processing status to processing message', async () => {
    const result = await routeUserMessage({
      reportStatus: 'processing',
      userQuery: 'What is my result?',
    });

    expect(result.action).toBe('status_response');
    expect(result.response).toContain('processing');
  });

  it('should route pending_review status to review redirect message', async () => {
    const result = await routeUserMessage({
      reportStatus: 'pending_review',
      userQuery: 'Is my report ready?',
    });

    expect(result.action).toBe('pending_review_redirect');
    expect(result.response).toContain('review page');
  });

  it('should route analyzed status to QnA agent', async () => {
    const result = await routeUserMessage({
      reportStatus: 'analyzed',
      userQuery: 'Explain my Hemoglobin result.',
    });

    expect(result.action).toBe('qna_agent');
    expect(result.response).toContain('educational information');
  });
});
