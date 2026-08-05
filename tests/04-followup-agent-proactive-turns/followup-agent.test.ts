import { FOLLOWUP_SYSTEM_PROMPT } from '@/lib/agent/nodes/followup-agent';
import { MEDICAL_DISCLAIMER } from '@/lib/agent/nodes/qna-agent';

describe('Phase 4: Follow-up Agent (FOLLOWUP-01)', () => {
  it('should enforce non-diagnostic policy in system prompt', () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toContain('NON-DIAGNOSTIC POLICY');
    expect(FOLLOWUP_SYSTEM_PROMPT).toContain('NO PRESCRIPTIONS');
  });

  it('should include medical disclaimer constant', () => {
    expect(MEDICAL_DISCLAIMER).toContain('Disclaimer:');
  });
});
