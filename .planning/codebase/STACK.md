# Technology Stack

**Analysis Date:** 2026-06-02

## Languages

**Primary:**
- TypeScript 5.x - All application code, backend services, API routes, database models, and components.

**Secondary:**
- JavaScript (ES Modules/mjs) - Build configurations, PostCSS settings, and ESLint rule setups.

## Runtime

**Environment:**
- Node.js 20.x+ - Server-side rendering (SSR), API route handlers, and database interactions.
- Browser - Client-side state management, React rendering, dynamic layouts, and UI transitions.

**Package Manager:**
- npm - Dependency management with `package-lock.json` present.

## Frameworks

**Core:**
- Next.js 16.1.1 (App Router) - Full-stack React framework featuring server-side rendering, routing groups, client-side rendering, and server actions.
- React 19.2.3 - Core UI library.

**Agentic & AI Graph:**
- LangGraph (`@langchain/langgraph` v1.0.15) - Orchestrating the stateful multi-agent decision and routing graph.
- LangChain Core & Community (`@langchain/core` v1.1.12, `@langchain/community` v1.1.3, `langchain` v1.2.7) - Framework for LLM prompts, chains, tools, and message formats.
- Google Gen AI (`@langchain/google-genai` v2.1.7) & Ollama (`@langchain/ollama` v1.1.0) - Model adapters for LLM logic execution.

**Database & ORM:**
- Prisma ORM 7.2.0 - Database schema management, migration tools, type generation, and client querying.
- Neon Database Serverless (`@neondatabase/serverless` v1.0.2 & `@prisma/adapter-neon` v7.2.0) - Cloud PostgreSQL hosting with connection pooling.

**Build/Dev:**
- TypeScript 5.x - Static typing and compilation.
- Tailwind CSS 4.x & PostCSS - Utility-first styling framework with modern compiler plugins.

## Key Dependencies

**Critical:**
- `@langchain/langgraph` (1.0.15) - Enables stateful clinical agent loops and multi-step reasoning.
- `@prisma/client` (7.2.0) - Eagerly querying users, chats, messages, and lab results.
- `pdf-parse` (1.1.1) - Parsing medical lab PDF reports server-side into string text.
- `react-pdf` (10.3.0) - Rendering visual PDFs inside the web interface split-panel client-side.
- `@tanstack/react-query` (5.90.16) - Optimistic client-side cache and server state sync.
- `bcrypt` (6.0.0) - Secure hashing of passwords for authentication.
- `ws` (8.19.0) - Real-time WebSocket connection utilities.

**Infrastructure/UI:**
- Radix UI (`@radix-ui/react-*` and `radix-ui` v1.4.3) - Unstyled, accessible UI primitives (Avatar, Dialog, Dropdown, Label, Slot).
- `lucide-react` (0.562.0) - Vector icons.
- `sonner` (2.0.7) - Client toast notifications.
- `class-variance-authority` & `clsx` & `tailwind-merge` - Dynamic CSS class joining.

## Configuration

**Environment:**
- `.env` & `.env.local` - Manages `DATABASE_URL` (Neon Connection Pooler) and `GOOGLE_API_KEY`.

**Build:**
- `tsconfig.json` - Custom compiler options with path mapping (e.g., `@/*` maps to `./*`).
- `next.config.ts` - Next.js compilation settings.
- `prisma.config.ts` - Custom configuration file loading migrations path and database URL via `dotenv`.
- `postcss.config.mjs` - PostCSS runner plugins configuration.
- `eslint.config.mjs` - Linter presets.

## Platform Requirements

**Development:**
- Cross-platform support (macOS, Windows, Linux) with Node.js installed.
- Active internet connection is mandatory to access the remote Neon PostgreSQL instance and the external LLM providers (e.g. ChatOllama server running `gpt-oss:120b-cloud` or Google Gen AI endpoint).

**Production:**
- Optimized deployment on Vercel (recommended for Next.js App Router integrations).
- Neon Database serverless instance for PostgreSQL hosting.

---

*Stack analysis: 2026-06-02*
*Update after major dependency changes*
