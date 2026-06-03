---
status: testing
phase: 03-end-to-end-chat-history-persistence-per-user
source: [03-01-SUMMARY.md]
started: 2026-06-03T12:35:00.000Z
updated: 2026-06-03T12:35:50.000Z
---

## Current Test

number: 2
name: Sidebar Chat History & Switching
expected: |
  Log in using an existing account. Open the sidebar sheet. You should see a list of your previous chat sessions. Click on any historical chat session; it should load its message history, and if a PDF report was associated with that chat, it should display the PDF report in the split screen panel.
awaiting: user response

## Tests

### 1. User Authentication and Route Guarding
expected: |
  Clear your browser's cookies (specifically `userId`) or open a new incognito window. Navigate to `/agent` or `/agent/[some-id]`. The application should immediately redirect you to the `/login` page.
result: pass

### 2. Sidebar Chat History & Switching
expected: |
  Log in using an existing account. Open the sidebar sheet. You should see a list of your previous chat sessions. Click on any historical chat session; it should load its message history, and if a PDF report was associated with that chat, it should display the PDF report in the split screen panel.
result: [pending]

### 3. Single PDF Report Overwrite
expected: |
  In an existing chat where a PDF report is already loaded, upload a different PDF report. The new PDF should replace the old one, the parsed lab results in the sidebar should reset/clear, and the database should overwrite the file path on the existing report rather than creating a duplicate report row.
result: [pending]

### 4. Inline Chat Renaming
expected: |
  In the sidebar, hover over a chat item and click the Pencil/Edit icon. The text should turn into an input box. Type a new name and press Enter (or click the green checkmark icon). The chat title should update in the sidebar immediately.
result: [pending]

### 5. Chat Session Deletion
expected: |
  In the sidebar, click the Trash/Delete icon next to any chat session. It should show an inline confirmation ("Delete chat? Yes/No"). Click "Yes". The chat session should be removed from the sidebar, and if it was the currently active chat, the view should reset to a blank "New Chat" state.
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0

## Gaps

[none yet]
