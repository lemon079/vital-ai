# Technical Research: End-to-End Chat History Persistence Per User

This research outlines the database schema, API updates, state management, and UI requirements for implementing isolated, persistent user-scoped chats.

## 1. Authentication & User-Scope

- **Active Sessions**: Authentication is already implemented using `bcrypt` and server actions in `lib/services/actions.ts`. Upon successful login/signup, a `userId` cookie is set in the client's browser.
- **Server Components Integration**: In `app/(root)/agent/page.tsx` and `app/(root)/agent/[id]/page.tsx`, we can retrieve the active user ID directly from `cookies()` and redirect to `/login` if it is missing. This replaces the hardcoded `guest-user` fallback.
- **API Security**: Secure `/api/chats` and `/api/chat` endpoints to use the authenticated user ID and prevent cross-user data leakage.

## 2. DB Schema & Models (Prisma)

- **Models**: The existing models `users`, `chats`, `messages`, and `reports` are already configured with correct relationships.
- **Chat Titles**: Since the `chats` table doesn't have a title field (titles were derived dynamically from the first message), we will add a `title String?` column to the `chats` table. This allows users to explicitly rename chats.
- **PDF Association**: Each chat points to a single `report_id`.
  - When a user uploads a new PDF report to an existing chat, if a report already exists for that chat, we update the existing `reports.file_path` to the new URL and delete all historical `lab_results` linked to that report, ensuring the chat resets its analysis state for the new report.
  - If no report exists, we create a new report and associate it.

## 3. API Actions & Endpoints

- **`/api/chats` (GET)**: Retrieve a list of chat summaries for the authenticated user, sorted by `created_at` descending.
- **`/api/chats/[id]` (GET)**: Fetch messages and the linked report PDF URL for a specific chat.
- **`/api/chats/[id]` (PATCH)**: Rename a chat's title.
- **`/api/chats/[id]` (DELETE)**: Delete a chat (and cascade delete messages).

## 4. UI/UX Chat Session Management

- **Sidebar History**: Replace the `Coming Soon` placeholder in the sidebar Sheet with the real list of user chats.
- **Session Actions**: Provide inline buttons for renaming (with inline text input) and deleting chat sessions.
- **Session Switching**: Click on any chat in the history to load and switch context.

## 5. Migration / Cleanup

- Any chats, messages, and reports stored under the dummy `guest-user` account can be kept as-is or discarded. We will focus purely on matching the authenticated user ID stored in the browser cookie.
