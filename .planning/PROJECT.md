# VitalSense AI

## What This Is

A Next.js full-stack medical assistant platform that decodes clinical laboratory reports and responds to general patient health concerns. It extracts unstructured medical findings from uploaded PDF documents, coordinates follow-up dialogues using a stateful LangGraph backend agent, synthesizes conversational patient inputs with parsed lab values, and builds highly accurate summaries and diagnostic conclusions while adhering to strict factual evidence guardrails.

## Core Value

Empowering patients with warm, accessible, and clinically grounded explanations of their lab reports and health symptoms to prepare them for productive doctor consultations.

## Requirements

### Validated

- ✓ [PDF Value Extraction] — Server-side text parsing from uploaded PDF lab reports via `pdf-parse`.
- ✓ [Stateful Agentic Routing] — Multi-agent state machine managing `conversation`, `lab_analysis`, and `clinical_summary` loops.
- ✓ [Persistent Clinical Model] — Prisma PostgreSQL relational schema mapping profiles, chats, reports, and messages.
- ✓ [Credentialed Authentication] — Secure user registration, signups, and custom onboarding profiles.
- ✓ [Consolidated Data Layer] — Type-safe database queries unified under Prisma Client (legacy raw SQL pools purged).
- ✓ [Clinical Conclusion Synthesis] — Core clinical reasoning to synthesize symptoms and abnormal lab results to explain "why it is happening". (Validated in Phase 1)
- ✓ [Factual Clinical Guardrails] — Safety guardrails ensuring disclaimers and concrete factual citations. (Validated in Phase 1)

### Active

- [ ] [Clean Dashboard State Management] — Refactoring client-side React state queries, mutation bindings, and visual panels to prevent race conditions during upload or prompt transitions.
- [ ] [Smooth UI Visual Animations] — Enhancing the split-panel chatbot dashboard with rich micro-animations, loading skeletons, and interactive state feedback.

### Out of Scope

- [Direct Medical Prescription & Diagnosis] — The application will never issue official drug prescriptions, diagnostic signatures, or treat itself as a replacement for real physicians due to legal and safety concerns.
- [EPUB / Visual Image OCR] — Ephemeral vision-based file processing (PNG/JPG photos) is deferred to favor high-fidelity structured digital PDF analysis.

## Context

- **Codebase Foundation:** This is a brownfield Next.js 16 (React 19) codebase that leverages LangGraph for conversational multi-agent routing and Neon Serverless PostgreSQL for data persistence.
- **Technical Debt Addressed:** We successfully resolved all legacy direct SQL connection pools and duplicate actions by refactoring the system entirely to utilize type-safe Prisma bindings.
- **Identified Fragilities:** Brittle keyword-based routing inside `lib/agent/graph.ts` and file upload persistence constraints on serverless platforms.

## Constraints

- **Tech Stack Consistency**: Must build strictly upon Next.js App Router, Tailwind CSS v4, and Prisma ORM client rules.
- **Clinical Safety**: The agent must always output a disclaimer noting it does not diagnose, and must strictly cite factual evidence for any analysis.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Consolidated Prisma Layer | Replaced raw SQL queries with unified Prisma client queries to prevent database connection leaks. | ✓ Good |
| Stateful LangGraph Loop | Stateful routing through conversation and clinical agents ensures modular, specialized prompt focuses. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-02 after Phase 1 completion*
