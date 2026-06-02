# Coding Conventions

**Analysis Date:** 2026-06-02

## Naming Patterns

**Files:**
- kebab-case for all TS/JS files (e.g., `agent-client-page.tsx`, `clinical-summary.ts`, `database-tools.ts`).
- Lowercase special Next.js filenames (`layout.tsx`, `page.tsx`, `route.ts`).

**Functions:**
- camelCase for all logic functions (e.g., `routeStart`, `saveUploadedFile`, `submitOnboarding`).
- PascalCase for React Component definitions (e.g., `LandingPage`, `ModeToggle`, `PDFViewer`).

**Variables:**
- camelCase for local variables and parameters.
- UPPER_SNAKE_CASE for globally defined constants or configuration maps (e.g., `CONVERSION_RATES`, `LAB_ANALYSIS_PROMPT`).

**Types & Interfaces:**
- PascalCase for type definitions, interfaces, and classes (e.g., `LabResultData`, `SavedFile`, `AgentState`).
- PascalCase for schema enums (in TS client), lowercase snake_case for Prisma database enum names (`gender_enum`, `lab_flag`).

---

## Code Style

**Formatting:**
- **Indentation:** 2 spaces (consistent across JSX, TS, and JSON files).
- **Semicolons:** Required.
- **Quotes:** Double quotes preferred in standard TypeScript files, single quotes in database actions and configuration blocks.
- **Line Length:** Typically kept under 100-120 characters to maintain clean layout readability.

**Linting:**
- ESLint configuration specified in `eslint.config.mjs`.
- Run: `npm run lint` or `npx eslint`.

---

## Import Organization

**Order:**
1. Third-party library packages (React core, Next.js components, LangChain, Prisma).
2. Internal absolute imports using the `@/` path alias (e.g. `@/lib/db`, `@/components/ui/button`).
3. Relative folder imports (e.g. `./state`, `../tools/database-tools`).
4. Type-specific declarations (e.g. `import type { NextConfig } from "next"`).

**Grouping:**
- Clear blank lines separating external packages, alias references, and relative module imports.
- Alphabetical organization is generally followed within each import grouping block.

---

## Error Handling

**Patterns:**
- **Boundary Catches:** Robust try/catch blocks are mandatory inside API handlers and Server Actions to prevent uncaught system crash loops.
- **Connection Cleanup:** When making raw queries via `@neondatabase/serverless` pools, the client MUST be released inside a `finally` block to prevent connection leaks:
  ```typescript
  const client = await pool.connect();
  try {
      // Execute raw queries...
  } finally {
      client.release();
  }
  ```
- **Standardized Payloads:** Expected failures in APIs return clean JSON payloads describing the issue along with the matching HTTP status code:
  ```typescript
  return NextResponse.json(
    { error: "Failed to save lab results." },
    { status: 500 }
  );
  ```

---

## Logging

**Framework:**
- Uses the standard native Node.js `console` module (`console.log`, `console.warn`, `console.error`) with clear prefixes.

**Patterns:**
- Console statements track state transitions and payload limits:
  - Route activities: `[Route] Invoking graph...`
  - Router decisions: `[Router] PDF detected. Routing to lab_analysis...`
  - Node activities: `[Lab Analysis] Extracted 4200 characters from PDF...`
- Errors are logged to stderr (`console.error("Failed to parse", error)`) along with structural diagnostic stacks.

---

## JSDoc & Comments

**JSDoc:**
- Employed strategic structural blocks to declare routing policies, middleware chains, and Graph router functions:
  ```typescript
  /**
   * ROUTER LOGIC
   * Decides which agent to activate based on user input and state
   */
  ```

**Code Comments:**
- Placed to explain non-obvious design logic decisions (e.g., explaining why guest credentials bypass database logging, or why parallel report extraction is intentionally disabled).

---

*Convention analysis: 2026-06-02*
*Update when patterns change*
