# Codebase Structure

**Analysis Date:** 2026-06-02

## Directory Layout

```
vital-ai/
├── app/                           # Next.js App Router (Views and API routes)
│   ├── (auth)/                    # Route Group for Authentication flows
│   │   ├── login/                 # User login page
│   │   └── register/              # User registration page
│   ├── (root)/                    # Route Group for App Core views
│   │   └── agent/                 # Clinical/conversational chat workspace
│   │       ├── [id]/              # Individual historical chat session page
│   │       └── page.tsx           # Redirect / initialization page
│   ├── api/                       # API Endpoint Route Handlers
│   │   ├── chat/                  # Entry point invoking the LangGraph agent
│   │   ├── chats/                 # Retrieves user chat lists and metadata
│   │   ├── register/              # Backend registration validations
│   │   └── upload/                # Independent file upload utility
│   ├── globals.css                # Core Tailwind CSS v4 variables & styles
│   ├── layout.tsx                 # Core HTML viewport structure
│   └── page.tsx                   # Product landing/hero page
├── components/                    # Core UI components
│   ├── ui/                        # Accessible UI primitives (Shadcn/Radix)
│   ├── providers/                 # Client React-Query & Theme provider configurations
│   ├── agent-client-page.tsx      # Multi-panel clinical console dashboard
│   ├── mode-toggle.tsx            # Dark/light theme selector
│   └── pdf-viewer.tsx             # Interactive split-screen client-side PDF visualizer
├── context/                       # Global React Context providers
├── hooks/                         # Client React custom hook hooks
├── lib/                           # Core utilities, database models, and AI engine
│   ├── agent/                     # LangGraph multi-agent schemas & workflow config
│   │   ├── nodes/                 # Stateful agent processing nodes (lab, convo, etc.)
│   │   ├── tools/                 # Graph capability tools (database and unit adapters)
│   │   ├── graph.ts               # StateGraph compiler and conditional routing
│   │   ├── prompts.ts             # Medical analysis system prompts
│   │   └── state.ts               # Schema defining AgentState transitions
│   ├── db/                        # Database ORM client bindings
│   │   └── client.ts              # Serverless PrismaClient configuration
│   ├── generated/                 # Auto-generated Prisma TypeScript client bindings
│   ├── services/                  # Business service files and server actions
│   │   ├── actions.ts             # Account/onboarding Next.js Server Actions (Prisma)
│   │   ├── chat.ts                # Database actions mapping user sessions
│   │   ├── processing.ts          # PDF/image upload file system storage
│   │   └── users.ts               # Auxiliary database user lookups
│   ├── actions.ts                 # Legacy authentication Server Actions (raw PG Pool)
│   ├── db.ts                      # Legacy raw PostgreSQL connection pool
│   └── utils.ts                   # Standard style utility joiners
├── prisma/                        # Database migration scripts and configurations
│   └── schema.prisma              # Relational models and database enums
├── public/                        # Static application assets
│   └── uploads/                   # Local uploads directory storing PDFs/Images
├── tsconfig.json                  # TypeScript compilation rules
├── package.json                   # Project runtime libraries list
└── next.config.ts                 # Next.js configurations
```

---

## Directory Purposes

**app/**
- Purpose: Application routing, views, and serverless API endpoints.
- Contains: `page.tsx` landing layouts, route-specific components, and backend HTTP routes (`route.ts`).
- Key files:
  - `app/page.tsx` - Initial entry point landing dashboard.
  - `app/api/chat/route.ts` - REST API processing the chat and graph iterations.

**components/**
- Purpose: Modally reusable React components separated by layout scopes.
- Contains: Layout elements and user dashboard cards.
- Key files:
  - `components/agent-client-page.tsx` - Interactive chat workspace with double split layout panel for PDF viewer.
  - `components/pdf-viewer.tsx` - Visualizes active lab reports using canvas layers.

**lib/agent/**
- Purpose: Multi-agent system engine.
- Contains: Logic coordinating decisions and model configurations.
- Key files:
  - `lib/agent/graph.ts` - Dictates node transitions and clinical state machine bounds.
  - `lib/agent/nodes/lab-analysis.ts` - Core clinical analysis executor handling file streams.

**lib/services/**
- Purpose: Backend transactions, validations, actions, and disk writes.
- Contains: File saving routines and database updates.
- Key files:
  - `lib/services/processing.ts` - Disk writes to public storage.
  - `lib/services/actions.ts` - Onboarding updates and server actions.

---

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Client landing page entrance.
- `app/api/chat/route.ts` - Service gateway to LangGraph processes.

**Configuration:**
- `package.json` - Dependencies and start scripts.
- `prisma.config.ts` - Prisma configurations.
- `tsconfig.json` - Compiler directives and paths.

**Core Logic:**
- `lib/agent/graph.ts` - LangGraph coordinator.
- `lib/services/processing.ts` - Local filesystem writer.

---

## Naming Conventions

**Files:**
- `kebab-case.ts` / `kebab-case.tsx` - Regular files, helpers, and hooks (`agent-client-page.tsx`, `lab-analysis.ts`).
- `PascalCase.tsx` - Standard React UI primitives (`DropdownMenu.tsx` / `Button.tsx`).
- `page.tsx` / `layout.tsx` / `route.ts` - Next.js routing definitions (always lowercase).

**Directories:**
- `kebab-case` - Standard directory organization.
- `(parenthesis-wrapped)` - Next.js routing groups.
- `[brackets-wrapped]` - Dynamic route segments.

---

## Where to Add New Code

**New Multi-Agent Graph Node:**
- Implementation: `lib/agent/nodes/{node-name}.ts`
- Binding: Register in `lib/agent/graph.ts` inside `addNode` and add routing edges.

**New Agent Tool:**
- Implementation: `lib/agent/tools/{tool-name}.ts`
- Binding: Export and push to `tools` arrays in the target Node files.

**New API Endpoint:**
- Implementation: Create folder `app/api/{endpoint-name}/route.ts` containing the request handlers (e.g. `POST`, `GET`).

**New DB Model:**
- Implementation: Append table model definitions to `prisma/schema.prisma` and run `npx prisma migrate dev` to generate types.

---

## Special Directories

**public/uploads/**
- Purpose: Storing uploaded patient reports and images.
- Source: Written dynamically by the server processing services.
- Committed: No (specifically gitignored to ensure local test documents are not checked into source control).

**lib/generated/**
- Purpose: Holds generated type-safe database schemas.
- Source: Automatically re-compiled by the prisma CLI compiler.
- Committed: Yes (ensures build configurations load type references successfully).

---

*Structure analysis: 2026-06-02*
*Update when directory structure changes*
