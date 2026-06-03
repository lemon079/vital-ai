# Phase 3: End-to-End Chat History Persistence Per User - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Source:** User Request

<domain>
## Phase Boundary

Implement a complete, production-ready chat history system where each authenticated user has their own isolated chat sessions, replacing the current `guest_user` placeholder.

</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- **User Isolation**: Each user account must have its own independent chat history, fully isolated from other users. User A cannot see or access User B's chats under any circumstance.
- **Single PDF per Chat**: Each chat session supports a single PDF upload, which is persisted and associated with that specific chat (used to store report details). Uploading a PDF in Chat 1 does not affect Chat 2.
- **Persistence**: Chat history must persist across sessions, page refreshes, and device changes.
- **Real Identifiers**: All previous `guest_user` references must be replaced with real authenticated user identifiers.

### Scope of Work
- **User-Scoped Chat Storage**: Store and retrieve chats keyed by authenticated user ID.
- **Chat Session Management**: Create, rename, delete, and switch between chats per user.
- **PDF Persistence per Chat**: Each chat stores exactly one uploaded PDF; re-uploading replaces the previous one.
- **Chat List UI**: Sidebar or panel showing all chats for the logged-in user with timestamps and titles.
- **Session Continuity**: Resuming a chat restores full message history and its associated PDF.
- **Migration**: Handle or discard any data stored under `guest_user`.

</decisions>

<canonical_refs>
## Canonical References

### Frontend UI & State
- `context/agent-context.tsx` — Handles messages, chat list selection, and session creation/deletion logic.
- `components/agent-client-page.tsx` — Renders the main chat workspace and sidebar/panel for history.

### Backend Routing & Services
- `app/api/chat/route.ts` — Receives and executes chat prompts.
- `app/api/chats/route.ts` — Handles listing, creating, and deleting user chat sessions.
- `lib/services/chat.ts` — Database operations for saving and retrieving chats, messages, and reports.

</canonical_refs>

<specifics>
## Specific Ideas
- Integrate with existing authentication context (or setup auth if not yet present) to obtain the authenticated user's ID.
- Remove all static `guest-user` or hardcoded dummy user IDs from `route.ts`, `agent-context.tsx`, etc.
- Support renaming and deleting chat sessions from the UI sidebar.

</specifics>

<deferred>
## Deferred Ideas
- Offline caching of messages.
</deferred>

---

*Phase: 03-end-to-end-chat-history-persistence-per-user*
*Context gathered: 2026-06-03*
