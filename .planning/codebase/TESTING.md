# Testing Patterns

**Analysis Date:** 2026-06-02

> [!WARNING]
> **No Automated Test Suites Configured**
> This codebase currently has **0% automated test coverage**. There are no unit, integration, or E2E test suites configured in the project.

---

## Current Verification Strategy

Since automated tests are missing, the project relies completely on manual testing methods:

### 1. Local Development Sandbox
- **Command:** `npm run dev`
- **Goal:** Spin up the Next.js development server locally at `http://localhost:3000`.
- **Method:** Triggering flows through the interactive UI dashboard, uploading sample lab PDFs (e.g. `test_report.pdf`), highlighting text elements, and verifying the multi-agent chat response.

### 2. Server Terminal Console Logging
- **Goal:** Validating model routing, token parse parameters, and database query executions.
- **Method:** Analyzing standard stdout outputs printed by routes (`[Route]`, `[Router]`) and graph nodes (`[Lab Analysis]`) inside the terminal console.

### 3. Database State Auditing
- **Goal:** Verifying Prisma query updates and transaction persistence.
- **Method:** Visualizing Neon PostgreSQL rows directly via database tools or custom query checks.

---

## Critical Test Gaps

1. **Multi-Agent Decisions:** No regression tests verifying if LangGraph correctly routes messages (e.g., matching clinical queries to the correct worker node or routing to END).
2. **PDF Parser Extractors:** No automated checks checking that `pdf-parse` extracts text accurately under distinct encoding layouts.
3. **Database Client Pool:** No integration tests checking server actions under database exceptions or verifying connection releases in raw PostgreSQL pools.
4. **Auth State Guardrails:** No tests validating session cookies, onboarding state transitions, or guest-user route exclusions.

---

## Future Testing Roadmap

To establish a resilient testing culture, the following setup is highly recommended:

### Phase 1: Unit Testing with Vitest
- **Target:** Testing pure logic utilities, unit converters (`lib/agent/tools/lab-tools.ts`), and file processing routines (`lib/services/processing.ts`).
- **Runner Choice:** **Vitest** (extremely fast ESM integration, works perfectly with Next.js).
- **Proposed Command:** `npm run test:unit`

### Phase 2: Agent Graph Integration Testing
- **Target:** Testing LangGraph (`lib/agent/graph.ts`) flows and state transitions.
- **Method:** Mocking the LLM provider (`ChatOllama`) using LangChain's mock callbacks to return predefined tool calls or AIMessages, verifying that the graph outputs the correct state without running live external model servers.

### Phase 3: End-to-End Testing with Playwright
- **Target:** Simulating actual user interactions.
- **Scenario:** Loading landing, registering a user, submitting onboarding details, uploading `test_report.pdf`, verifying PDF layout visualizers, and asserting live chat messaging.
- **Proposed Command:** `npm run test:e2e`

---

*Testing analysis: 2026-06-02*
*Update when test patterns change*
