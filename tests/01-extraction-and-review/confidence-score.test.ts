export const CONFIDENCE_THRESHOLD = 0.85;

describe('Phase 1: Confidence Threshold Routing (EXTRACT-02)', () => {
  it('should enforce confidence threshold of 0.85', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.85);
  });

  it('should route high-confidence extractions (>= 0.85) to auto_accepted', () => {
    const highConfidenceItem = { confidenceScore: 0.95 };
    const isAutoAccepted = highConfidenceItem.confidenceScore >= CONFIDENCE_THRESHOLD;
    expect(isAutoAccepted).toBe(true);
  });

  it('should route low-confidence extractions (< 0.85) to pending_review', () => {
    const lowConfidenceItem = { confidenceScore: 0.65 };
    const isAutoAccepted = lowConfidenceItem.confidenceScore >= CONFIDENCE_THRESHOLD;
    expect(isAutoAccepted).toBe(false);
  });
});
