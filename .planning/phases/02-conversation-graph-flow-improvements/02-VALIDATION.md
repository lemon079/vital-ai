---
phase: 2
slug: conversation-graph-flow-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 2 — Validation Strategy

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
| 02-01-01 | 01 | 1 | FLOW-01 | manual | API endpoint POST verify | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | FLOW-02 | manual | PDF upload table verify | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (test runners to be set up in Phase 5).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| General Q&A Conversation flow | FLOW-01 | Requires subjective conversation flow verification | Send casual health queries (e.g. sleep guidance) without document parameters. Assert warm, clean, conversational output. |
| PDF upload and table generation | FLOW-02 | Requires manual document upload and layout verification | Upload test_report.pdf and assert that extracted values are rendered inside a properly formatted markdown table in the chatbot logs. |

---

## Validation Sign-Off

- [ ] All tasks have verify plans
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
