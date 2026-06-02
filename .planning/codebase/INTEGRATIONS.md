# External Integrations

**Analysis Date:** 2026-06-02

## APIs & External Services

**Large Language Models (LLM):**
- **ChatOllama (Local/Cloud Serverless)** - Powers the agent graph reasoning, PDF parsing, clinical summaries, and patient dialogue.
  - **SDK/Client:** `@langchain/ollama` v1.1.0 (used in `lib/agent/nodes/models.ts`)
  - **Model:** `gpt-oss:120b-cloud`
  - **Auth:** Defaults to local/internal network connection to Ollama client without keys, or uses standard Ollama server host configurations.
- **Google Gen AI API** - Available for Google model inference when required.
  - **SDK/Client:** `@langchain/google-genai` v2.1.7
  - **Auth:** API Key defined in `GOOGLE_API_KEY` environment variable.

## Data Storage

**Databases:**
- **Neon PostgreSQL** - High-performance serverless cloud PostgreSQL database.
  - **Connection:** Via `DATABASE_URL` env variable.
  - **Prisma Client:** `PrismaClient` with `PrismaNeon` adapter (in `lib/db/client.ts`) for serverless connection pooling.
  - **Raw DB Connection:** A direct connection pool via `@neondatabase/serverless` is instantiated in `lib/db.ts` to execute raw SQL queries.
  - **Migrations:** Managed through Prisma Migration CLI (`prisma migrate`) with schema defined in `prisma/schema.prisma`.

**File Storage:**
- **Local Server Storage** - Uploaded files are written directly to the local filesystem.
  - **Client:** Node.js custom async file system utilities (`fs/promises` in `lib/services/processing.ts`).
  - **Storage Directory:** `public/uploads` inside the workspace root (e.g., `d:\Work\Next\vital-ai\public\uploads`).
  - **Static Serving:** Served publicly by Next.js static asset handler on the `/uploads/*` route.
  - **File formats supported:** PDF (automatically parsed for clinical information) and Images (stored locally, analysis not yet supported).

## Authentication & Identity

**Custom Authentication:**
- **Local DB Credentials System** - Uses email and password hashing for secure authentication.
  - **Hashing:** Server-side encryption via `bcrypt` (10 rounds).
  - **Token / Session storage:** The server issues an `httpOnly`, `secure` session cookie named `userId` containing the user's UUID upon successful login or signup (`lib/services/actions.ts`).
  - **Access control:** Verification of the `userId` cookie inside Server Actions.

## CI/CD & Deployment

**Hosting:**
- **Vercel** (Target) - App router hosting, database connection environment configurations, and static file endpoints mapping.
- **Environment variables:** Placed inside `.env` or `.env.local` for development, and configured directly in the cloud hosting console for production.

## Environment Configuration

**Development:**
- Required environment variables:
  - `DATABASE_URL` - Neon PostgreSQL connection URL.
  - `GOOGLE_API_KEY` - API credentials for Google Gemini / Gen AI.
- Secrets location: `.env.local` (properly ignored in `.gitignore`).

---

*Integration audit: 2026-06-02*
*Update when adding/removing external services*
