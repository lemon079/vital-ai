# Roadmap: Lab Report AI Assistant (VitalSense AI)

## Source of Truth

This roadmap directly reflects the architecture, data model, and implementation roadmap specified in [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md).

---

## Phases Overview

- [x] **Phase 0: Foundations** - Auth & user demographics schema, upload endpoint, file storage, base relational data model, background job queue skeleton.
- [x] **Phase 1: Extraction & Human-in-the-Loop Review** - Extraction LLM agent, field confidence scoring, human-in-the-loop review UI (`pending_review`).
- [ ] **Phase 2: Deterministic Comparison Engine** - `CanonicalTest`/`TestAlias`, seeded `ReferenceRange` table, `UnitConversion`, deterministic flagging with specificity resolution.
- [ ] **Phase 3: QnA Agent, Router Skeleton & Output Guardrail** - Always-on QnA agent, orchestrator with status-aware routing, critical-flag override, output guardrail scanner.
- [ ] **Phase 4: Follow-up Agent & Proactive Turn Injection** - `FollowUpSession`/`FollowUpQuestion` state machine, indirect question generation, proactive agent-initiated turns, interruption & skip handling.
- [ ] **Phase 5: Summary Agent & Clinical PDF Synthesis** - Structured `PatientReportedFact` memory extraction, template-grounded summary generation, clinical PDF synthesis.
- [ ] **Phase 6: Longitudinal Trends Engine** - Cross-report comparison by `user_id + test_code`, trend analysis surfacing in QnA & clinical summaries.
- [ ] **Phase 7: Observability, Rate Limiting & Hardening** - Structured telemetry tracing, automated evaluation regression gates, rate limiting, retries/circuit breakers.
- [ ] **Phase 8: Legal & Regulatory Launch Pass** - Consent management, data retention/deletion controls, jurisdiction compliance review, final red-team safety clearance.

---

## Phase Details

### Phase 0: Foundations
- **Goal**: Auth, upload endpoint, file storage, base schema (`User`, `Report`), job queue skeleton.
- **Depends on**: Nothing
- **Requirements**: `FOUNDATION-01`, `FOUNDATION-02`, `FOUNDATION-03`
- **Isolation Test**: Sign up, log in, upload a PDF, confirm a `Report` row lands with `status=uploaded`. No AI involved yet.
- **Plans**: 0 plans

---

### Phase 1: Extraction & Human-in-the-Loop Review
- **Goal**: LLM Extraction agent, field-level confidence scoring, human-in-the-loop review UI for low confidence extractions (`pending_review`).
- **Depends on**: Phase 0
- **Requirements**: `EXTRACT-01`, `EXTRACT-02`, `EXTRACT-03`
- **Isolation Test**: Feed a batch of varied real-world report PDFs; measure precision/recall against hand-labeled ground truth; confirm low-confidence items trigger review.
- **Plans**: 0 plans

---

### Phase 2: Deterministic Comparison Engine
- **Goal**: `CanonicalTest`/`TestAlias` taxonomy, seeded `ReferenceRange` data with demographic constraints, `UnitConversion`, pure code deterministic flagging.
- **Depends on**: Phase 1
- **Requirements**: `ENGINE-01`, `ENGINE-02`, `ENGINE-03`
- **Isolation Test**: Pure unit tests — known value/demographic/test combos, assert exact flag output (`normal`, `high`, `low`, `critical_high`, `critical_low`). 100% deterministic and 100% passing; no LLM needed.
- **Plans**: 0 plans

---

### Phase 3: QnA Agent, Router Skeleton & Output Guardrail
- **Goal**: Always-on QnA agent, orchestrator with status-aware routing, critical-flag override wired to Phase 2 output, output guardrail scanner.
- **Depends on**: Phase 2
- **Requirements**: `ROUTER-01`, `ROUTER-02`, `GUARD-01`
- **Isolation Test**: Chat pre-upload, mid-processing, post-analysis; confirm status questions answer from real job state; run safety red-team set against guardrail.
- **Plans**: 0 plans

---

### Phase 4: Follow-up Agent & Proactive Turn Injection
- **Goal**: `FollowUpSession`/`FollowUpQuestion` tracking, indirect non-diagnostic question generation, proactive agent turn push, intent-based topic switching and skip handling.
- **Depends on**: Phase 3
- **Requirements**: `FOLLOWUP-01`, `FOLLOWUP-02`, `FOLLOWUP-03`, `FOLLOWUP-04`
- **Isolation Test**: Simulate different flag scenarios, verify indirect non-diagnostic phrasing; test going off-topic mid-session and resuming; test "skip" path; run red-team set against this agent specifically.
- **Plans**: 0 plans

---

### Phase 5: Summary Agent & Clinical PDF Synthesis
- **Goal**: Structured memory extraction (`PatientReportedFact`), summary drafting strictly from DB facts, clinical summary PDF generation.
- **Depends on**: Phase 4
- **Requirements**: `SUMMARY-01`, `SUMMARY-02`, `SUMMARY-03`
- **Isolation Test**: Factual-consistency eval — every claim traces to an actual DB row, zero invented values. Confirm medical disclaimer is always present.
- **Plans**: 0 plans

---

### Phase 6: Longitudinal Trends Engine
- **Goal**: Cross-report trend calculation by `user_id + test_code`, historical trend surfacing in QnA and clinical summary.
- **Depends on**: Phase 5
- **Requirements**: `TREND-01`, `TREND-02`
- **Isolation Test**: Seed a test user with two historical reports; verify trend statements are accurate and correctly caveated.
- **Plans**: 0 plans

---

### Phase 7: Observability, Rate Limiting & Hardening
- **Goal**: Structured tracing per agent call (tokens, latency, cost, model), automated evaluation regression gate suite, rate limiting, retries & circuit breakers.
- **Depends on**: Phase 6
- **Requirements**: `OBS-01`, `OBS-02`, `OBS-03`
- **Isolation Test**: Chaos-test an OCR/LLM timeout and confirm graceful degradation; confirm rate limits actually enforce.
- **Plans**: 0 plans

---

### Phase 8: Legal & Regulatory Launch Pass
- **Goal**: Health data consent management, user data retention/deletion policy, jurisdiction-specific non-diagnostic compliance review, final red-team safety clearance.
- **Depends on**: Phase 7
- **Requirements**: `LEGAL-01`, `LEGAL-02`
- **Isolation Test**: Final regulatory compliance audit & safety clearance before production launch.
- **Plans**: 0 plans

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| Phase 0: Foundations | 0/0 | Not started | - |
| Phase 1: Extraction & Human-in-the-Loop Review | 0/0 | Not started | - |
| Phase 2: Deterministic Comparison Engine | 0/0 | Not started | - |
| Phase 3: QnA Agent, Router Skeleton & Output Guardrail | 0/0 | Not started | - |
| Phase 4: Follow-up Agent & Proactive Turn Injection | 0/0 | Not started | - |
| Phase 5: Summary Agent & Clinical PDF Synthesis | 0/0 | Not started | - |
| Phase 6: Longitudinal Trends Engine | 0/0 | Not started | - |
| Phase 7: Observability, Rate Limiting & Hardening | 0/0 | Not started | - |
| Phase 8: Legal & Regulatory Launch Pass | 0/0 | Not started | - |
