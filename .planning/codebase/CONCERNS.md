# Codebase Concerns

**Analysis Date:** 2026-06-02

## Tech Debt

**Inconsistent Database Access Layers:**
- **Issue:** Dual database query approaches. The codebase utilizes Prisma ORM in `lib/db/client.ts` and `lib/services/actions.ts` alongside raw, direct PostgreSQL query connections in `lib/db.ts` and `lib/actions.ts`.
- **Files:** `lib/db.ts`, `lib/db/client.ts`, `lib/actions.ts`, `lib/services/actions.ts`
- **Why:** Legacy query routines from earlier hacks were left intact when Prisma was introduced.
- **Impact:** Developer confusion, double connection pools wasting database resources, and high risk of schema desynchronization.
- **Fix approach:** Migrate all legacy SQL queries in `lib/actions.ts` to type-safe Prisma commands in `lib/services/actions.ts`, then fully delete `lib/db.ts` and `lib/actions.ts`.

**Duplicate Server Actions:**
- **Issue:** Two separate files define duplicate `signup`, `login`, and `submitOnboarding` actions.
- **Files:** `lib/actions.ts` and `lib/services/actions.ts`
- **Why:** Migration to Prisma was left incomplete.
- **Impact:** Unused code blocks obscuring the active implementation paths and increasing the bundle size.
- **Fix approach:** Consolidate references into a single server actions directory and clean up imports.

---

## Known Bugs & Weaknesses

**Hardcoded Fallback User ID:**
- **Symptoms:** Chat API uses a static fallback UUID when requests do not provide user IDs.
- **Trigger:** Any API request payload omitting the `userId` field defaults to `"309ad8a9-7802-4acb-bf7e-678b8c84768a"`.
- **File:** `app/api/chat/route.ts` (line 18)
- **Workaround:** None (reloads session records under a single static mock profile).
- **Root cause:** Hardcoded string value implemented for testing guest functionality.
- **Fix:** Properly implement guest session generation using ephemeral anonymous UUIDs rather than a single hardcoded database record.

**Ollama Offline Dependency Failure:**
- **Symptoms:** Complete chat system crash if Ollama is unreachable.
- **Trigger:** Invoking the chat endpoint when the local/remote Ollama server running `gpt-oss:120b-cloud` is down.
- **File:** `lib/agent/nodes/lab-analysis.ts` (lines 196-229)
- **Root cause:** Lack of a secondary fallback model provider configuration in case the primary connection fails.
- **Fix:** Add a fallback chain using Google Gen AI as a dynamic secondary backup model provider if Ollama throws connection errors.

---

## Security Considerations

**Secrets Committed to Source Control:**
- **Risk:** Sensitive database URLs and LLM credentials are directly committed inside the repository.
- **Files:** `.env` (lines 1-2)
- **Current mitigation:** None.
- **Recommendations:** Immediately rotate Neon DB credentials and the Google API Key. Remove `.env` from git tracking and rely exclusively on `.env.local` or environment overrides.

**Unsigned Session Cookies:**
- **Risk:** Simple cookie manipulation vulnerabilities. The server issues a raw `userId` cookie string without signature verification or encryption.
- **File:** `lib/services/actions.ts` (line 29: `cookieStore.set('userId', newUser.id)`)
- **Current mitigation:** Marked as `httpOnly` and `secure`.
- **Recommendations:** Implement a robust session validator using standard library handlers like NextAuth.js or JWT-signed session tokens.

---

## Performance Bottlenecks

**Serial PDF Processing in Agent Loop:**
- **Problem:** Synchronous reading of PDF streams. The `PDFLoader` reads the entire file synchronously on every `labAnalysisAgent` node execution.
- **File:** `lib/agent/nodes/lab-analysis.ts` (lines 28-48)
- **Cause:** PDF contents are not cached or stored permanently within the graph state after the initial extraction.
- **Improvement path:** Cache extracted text inside the `reportData` graph state or database entity to completely bypass repeated disk load operations.

**Lack of Token Streaming:**
- **Problem:** Patients experience several seconds of lag before the chat dashboard prints responses.
- **File:** `app/api/chat/route.ts`
- **Cause:** Using `graph.invoke()` wait loops instead of streaming generator channels.
- **Improvement path:** Migrate the chat API endpoint to return a server-sent events stream using `graph.stream()` to output individual tokens as they generate.

---

## Fragile Areas

**Keyword-Based Agent Routing:**
- **File:** `lib/agent/graph.ts` (lines 29-37, 78-87)
- **Why fragile:** Router relies on brittle, manual string checking (`content.includes("summary for doctor")`) to determine node directions.
- **Common failures:** Simple variations (e.g. "Brief my physician" or "generate analysis log") fail to trigger the clinical summary nodes.
- **Safe modification:** Integrate a lightweight routing chain utilizing semantic embeddings or zero-shot LLM classifiers to classify intentions.

**Hardcoded 60s Model Timeout:**
- **File:** `lib/agent/nodes/lab-analysis.ts` (line 159)
- **Why fragile:** CPU-based model runs often exceed 60 seconds on complex documents, leading to sudden, premature timeouts.
- **Fix:** Make the timeout duration configurable via environment parameters and implement a graceful warning message.

---

## Scaling Limits

**Local Ephemeral Filesystem Uploads:**
- **Current capacity:** Limited by local container disk space.
- **Limit:** Breaks completely on cloud serverless runtimes (like Vercel).
- **Symptoms at limit:** Standard serverless runs throw read-only filesystem exceptions or erase uploaded reports upon instance cold starts.
- **Scaling path:** Integrate an S3-compatible cloud bucket (e.g., AWS S3 or Neon Storage) for permanent document storage.

---

## Missing Critical Features

**Image Analysis Support:**
- **Problem:** Patients uploading PNG/JPG report snapshots receive a "not supported" system message.
- **File:** `lib/services/processing.ts` (lines 47-53)
- **Blocks:** Mobile users who take photos of physical reports instead of uploading digital PDFs.
- **Implementation complexity:** Medium (requires binding a multimodal vision model to the agent).

---

*Concerns audit: 2026-06-02*
*Update as issues are fixed or new ones discovered*
