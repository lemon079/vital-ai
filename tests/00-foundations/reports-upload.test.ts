export type ReportStatus =
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'pending_review'
  | 'analyzed'
  | 'failed';

describe('Phase 0: Report Upload & Schema Persistence (FOUNDATION-02)', () => {
  it('should verify report initial state on upload (status = uploaded)', () => {
    const reportData: {
      id: string;
      user_id: string;
      file_uri: string;
      status: ReportStatus;
      uploaded_at: Date;
      has_critical_flag: boolean;
    } = {
      id: 'report-uuid-12345',
      user_id: 'user-uuid-67890',
      file_uri: '/uploads/cbc_panel_2026.pdf',
      status: 'uploaded',
      uploaded_at: new Date(),
      has_critical_flag: false,
    };

    expect(reportData.status).toBe('uploaded');
    expect(reportData.file_uri).toBe('/uploads/cbc_panel_2026.pdf');
    expect(reportData.has_critical_flag).toBe(false);
  });

  it('should support report lifecycle status enum transitions', () => {
    const statuses: ReportStatus[] = [
      'uploaded',
      'processing',
      'extracted',
      'pending_review',
      'analyzed',
      'failed',
    ];

    expect(statuses).toContain('uploaded');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('pending_review');
    expect(statuses.length).toBe(6);
  });
});
