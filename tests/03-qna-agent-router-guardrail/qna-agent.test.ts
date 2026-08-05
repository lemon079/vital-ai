import { MEDICAL_DISCLAIMER, QNA_SYSTEM_PROMPT } from '@/lib/agent/nodes/qna-agent';

describe('Phase 3: QnA Agent (QNA-01)', () => {
  it('should include compulsory medical disclaimer text', () => {
    expect(MEDICAL_DISCLAIMER).toContain('Disclaimer:');
    expect(MEDICAL_DISCLAIMER).toContain('does not issue formal medical diagnoses');
  });

  it('should enforce non-diagnostic policy in system prompt', () => {
    expect(QNA_SYSTEM_PROMPT).toContain('NON-DIAGNOSTIC POLICY');
    expect(QNA_SYSTEM_PROMPT).toContain('NO PRESCRIPTIONS');
  });
});
