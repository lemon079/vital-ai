---
phase: 1
slug: agentic-diagnosis-guardrails-logic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual API routing tests |
| **Config file** | None |
| **Quick run command** | `node C:\Users\laptopwala\.gemini\antigravity\get-shit-done\bin\gsd-tools.cjs state load` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run TypeScript checks (`npx tsc --noEmit`)
- **After every plan wave:** Start Next.js and run direct postman/curl queries to verify endpoint responses
- **Before `/gsd-verify-work`:** Full type verification must pass

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FLOW-04 | manual | API endpoint POST verify | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | FLOW-03 | manual | API endpoint Q&A verify | ✅ | ⬜ pending |
| 01-02-01 | 02 | 2 | FLOW-05 | manual | Safety block input verify | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | FLOW-06 | manual | Disclaimer check verify | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (test runners to be set up in Phase 5).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clinical conclusion synthesis | FLOW-04 | Requires subjective LLM conversational flow check | Trigger chat session with mock abnormal results, ask for conclusion, assert synthesized answer. |
| Diagnostic evidence citation | FLOW-05 | Requires visual review of cited references | Verify that final response contains cited values from the PDF (e.g. `Lab ALT = 52 U/L`). |
| Active medical disclaimer | FLOW-06 | Requires text search in output | Validate that response output contains the prominent clinical assistant warning message. |

---

## Validation Sign-Off

- [ ] All tasks have verify plans
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
