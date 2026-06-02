# Phase 2: Conversation & Graph Flow Improvements - Technical Research

**Date:** 2026-06-02

## 1. Conversational Transitions & State Tracking

In Phase 2, we implement standard Q&A and post-upload symptom flow routing:
- **General Health Chat:** When the user does not provide `state.filePath`, the graph must activate `"conversation"` node directly. The conversation node evaluates state queries and provides warm, accessible educational guides.
- **Upload Analysis Transition:** When the user uploads a report, the Next.js API route binds the document, stores it locally, initiates a relational `reports` entry, links it, and triggers `graph.invoke()` with `state.filePath`.
- **Progressive follow-ups:** The lab agent and conversation agents must carry active dialogue history across steps, requesting details systematically.

---

## 2. Lab Results Markdown Table Structuring

We must ensure that the `labAnalysisAgent` (`lib/agent/nodes/lab-analysis.ts`) strictly outputs parsed abnormalities in a structured markdown table with these exact columns:

| Test | Your Value | Normal Range | Status |
|------|-----------|--------------|--------|
| ALT | 52 U/L | 0-41 U/L | ⚠️ High |

We will verify this format during prompt generation and node formatting.

---

## 3. Validation Strategy

Validation for Phase 2:
- **General Conversation Check:** Asserting that general queries (e.g. "what is standard sleep recommendations?") generate clean conversational answers without triggering report-specific summaries.
- **Table Formatting Verification:** Validating that PDF analysis outputs contain proper markdown table dividers (`| Test | Your Value |`).

---

*Research complete: .planning/phases/02-conversation-graph-flow-improvements/02-RESEARCH.md*
