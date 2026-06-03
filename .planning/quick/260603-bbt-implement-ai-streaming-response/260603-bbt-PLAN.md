# Quick Plan: Implement AI Streaming Response

This quick plan implements token streaming (STREAM-01) using LangGraph's `streamEvents` and Next.js ReadableStreams.

## Tasks

- [ ] **Task 1: Backend Route Stream Handler**
  - Modify `app/api/chat/route.ts` to use `graph.streamEvents` instead of `graph.invoke`.
  - Filter streamed tokens to only include tokens generated from the active agent nodes (`conversation`, `lab_analysis`, `clinical_summary`), excluding internal classification checks (`guardrails`).
  - Stream tokens in Server-Sent Events (SSE) format, sending metadata (`chatId`, `fileUrl`) and tokens (`token`).
  - Accumulate the full AI response in memory during streaming and save the completed message to the database once the stream ends.
  
- [ ] **Task 2: Frontend Streaming Context Client**
  - Update `context/agent-context.tsx` to handle ReadableStream chunk parsing.
  - Incrementally append streamed tokens to the active user message block, updating client state in real time.
  - Strip the loading/streaming flag once the stream completes.

- [ ] **Task 3: Verification**
  - Run `npx tsc --noEmit` to verify type safety.
  - Verify real-time token generation in the UI.
