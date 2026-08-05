# Requirements: Lab Report AI Assistant (VitalSense AI)

**Source of Truth:** [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md)

## v1 Requirements

### Phase 0: Foundations
- [ ] **FOUNDATION-01**: User authentication & demographic profile persistence (`User` schema with DOB, sex, pregnancy status, health consent timestamp).
- [ ] **FOUNDATION-02**: File storage & report upload API endpoint with Prisma `Report` model (`status = uploaded`).
- [ ] **FOUNDATION-03**: Async background job queue skeleton for processing PDF reports while user chats.

### Phase 1: Extraction & Human-in-the-Loop Review
- [ ] **EXTRACT-01**: LLM Extraction Agent structuring raw PDF content into test/value/unit JSON with field-level confidence scores.
- [ ] **EXTRACT-02**: Human-in-the-loop review UI displaying low-confidence values to user for verification.
- [ ] **EXTRACT-03**: Persistence of user confirmation / corrections (`auto_accepted`, `user_confirmed`, `user_corrected`).

### Phase 2: Deterministic Comparison Engine
- `ENGINE-01`: Seeded canonical test taxonomy (`CanonicalTest` LOINC codes, `TestAlias`), `UnitConversion`, and demographic `ReferenceRange` tables.
- `ENGINE-02`: Range resolution algorithm prioritizing report-printed ranges over internal DB and computing `specificity_rank`.
- `ENGINE-03`: Pure deterministic flagging code assigning `normal`, `high`, `low`, `critical_high`, `critical_low` and `flag_basis`.

### Phase 3: QnA Agent, Router Skeleton & Guardrail Scanner
- [ ] **ROUTER-01**: Always-on QnA Agent handling pre-upload, mid-processing, and post-analysis user conversations.
- [ ] **ROUTER-02**: Orchestrator / Router enforcing deterministic critical flag overrides and intent classification.
- [ ] **GUARD-01**: Output Guardrail Scanner detecting diagnostic/prescriptive phrasing before message dispatch, logging to `ResponseGuardrailLog`.

### Phase 4: Follow-up Agent & Proactive Turn Injection
- [ ] **FOLLOWUP-01**: `FollowUpSession` & `FollowUpQuestion` state tracking for abnormal values.
- [ ] **FOLLOWUP-02**: Follow-up Agent generating indirect, non-diagnostic questions about symptoms.
- [ ] **FOLLOWUP-03**: Push notification / polling mechanism to inject agent turns into idle conversations upon report completion.
- [ ] **FOLLOWUP-04**: Topic-switching & pause/resume handling via intent classifier, plus "skip" command support.

### Phase 5: Summary Agent & Clinical PDF Synthesis
- [ ] **SUMMARY-01**: Extraction of conversational symptom facts into structured `PatientReportedFact` rows.
- [ ] **SUMMARY-02**: Clinical Summary Agent building grounded summaries strictly from DB facts with prominent medical disclaimer.
- [ ] **SUMMARY-03**: High-fidelity downloadable Clinical Summary PDF generation.

### Phase 6: Longitudinal Trends Engine
- [ ] **TREND-01**: Cross-report query pipeline matching `user_id + test_code + sample_collected_date`.
- [ ] **TREND-02**: Historical trend visualization and analytical commentary in QnA agent and clinical summary.

### Phase 7: Observability, Rate Limiting & Hardening
- [ ] **OBS-01**: Telemetry & structured tracing per agent call (tokens, latency, cost, model).
- [ ] **OBS-02**: Automated evaluation gates for extraction accuracy, factual consistency, and red-team safety.
- [ ] **OBS-03**: Rate limiting, request timeouts, retries, and circuit breakers for external AI/OCR endpoints.

### Phase 8: Regulatory & Legal Pass
- [ ] **LEGAL-01**: User health data consent flows, data retention policy, and account deletion functionality.
- [ ] **LEGAL-02**: Regulatory compliance audit & final red-team safety verification pass.

## Traceability Matrix

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUNDATION-01, FOUNDATION-02, FOUNDATION-03 | Phase 0 | Pending |
| EXTRACT-01, EXTRACT-02, EXTRACT-03 | Phase 1 | Pending |
| ENGINE-01, ENGINE-02, ENGINE-03 | Phase 2 | Pending |
| ROUTER-01, ROUTER-02, GUARD-01 | Phase 3 | Pending |
| FOLLOWUP-01, FOLLOWUP-02, FOLLOWUP-03, FOLLOWUP-04 | Phase 4 | Pending |
| SUMMARY-01, SUMMARY-02, SUMMARY-03 | Phase 5 | Pending |
| TREND-01, TREND-02 | Phase 6 | Pending |
| OBS-01, OBS-02, OBS-03 | Phase 7 | Pending |
| LEGAL-01, LEGAL-02 | Phase 8 | Pending |
