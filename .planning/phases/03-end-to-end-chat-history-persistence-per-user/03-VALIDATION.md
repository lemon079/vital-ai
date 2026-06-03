---
phase: 3
slug: end-to-end-chat-history-persistence-per-user
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Type check must pass successfully
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FLOW-07 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | FLOW-07 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 03-01-03 | 01 | 2 | FLOW-07 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. (Automated verification uses TypeScript compilation checking).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-user Chat Isolation | FLOW-07 | Requires active user session authentication | Log in as User A, create a chat. Log in as User B, verify User A's chat is not visible. |
| Chat Title Renaming | FLOW-07 | Requires interactive UI input | Click Edit icon on chat item, type new name, save. Verify name updates in sidebar and persists on reload. |
| Chat Session Deletion | FLOW-07 | Requires interactive UI click | Click Delete icon on chat item. Verify item is removed from sidebar and active URL redirects to /agent. |
| PDF Persistence Per Chat | FLOW-07 | Requires uploading files | Upload PDF in Chat 1. Verify it displays. Go to Chat 2, verify PDF does not display. Go back to Chat 1, verify PDF displays. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
