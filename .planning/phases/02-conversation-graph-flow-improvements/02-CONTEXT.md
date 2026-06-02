# Phase 2: Conversation & Graph Flow Improvements - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** Conversational alignment

<domain>
## Phase Boundary

Refining the standard conversation routing nodes, prompts, and lab analysis processors to guide patients smoothly between basic conversational medical Q&A and active post-upload follow-up gathering.

</domain>

<decisions>
## Implementation Decisions

### Conversational health concerns flow (FLOW-01)
- **Mechanism:** If no lab report is uploaded (`state.filePath` is null), the chatbot must support a warm, casual medical conversation, answering questions using empathetic language and offering clean follow-up questions.
- **Verification Rule:** Direct Q&A should not trigger clinical summaries or conclusion panels unnecessarily.

### PDF upload lab analysis flow (FLOW-02)
- **Mechanism:** Once a PDF report is uploaded, the agent must extract results and list abnormal findings in a clean markdown table matching the `LAB_ANALYSIS_PROMPT` schema.
- **Verification Rule:** The table must strictly contain Test Name, Value, Reference Range, and Status columns.

### the agent's Discretion
- Choice of specific wording in prompts, message schemas mapping, and database record checks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### System & Codebase Reference
- `.planning/PROJECT.md` — Core value and active scopes.
- `.planning/codebase/STACK.md` — Active frameworks (React 19, LangGraph v1.0.15).
- `.planning/codebase/STRUCTURE.md` — Source folder paths.

</canonical_refs>

<specifics>
## Specific Ideas

- Ensure conversation transitions between general chat and PDF analysis chat are seamless and keep message state consistent.

</specifics>

<deferred>
## Deferred Ideas

- None — Phase 2 covers standard user conversational bounds.

</deferred>

---

*Phase: 02-conversation-graph-flow-improvements*
*Context gathered: 2026-06-02*
