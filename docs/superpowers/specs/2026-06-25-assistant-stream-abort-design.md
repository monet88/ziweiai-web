# Assistant Stream Abort (Lifecycle-Safety) Design

Date: 2026-06-25
Story context: US-018 (multi-turn AI assistant + SSE), PR #16 follow-up
Status: approved (brainstorming), pending implementation plan

## Problem

`AssistantPanel` runs an SSE generation loop through `streamConversationMessage`
(an async generator) inside `assistant-model.svelte.ts`. The chart detail route
wraps the screen in `{#key chartId}`, so switching charts unmounts and remounts
`AssistantPanel`. Today, when the panel unmounts mid-generation, the in-flight
`fetch` and the `for await` loop are NOT cancelled: the request keeps running in
the background and resolves into a model instance whose state is already discarded.
The HTTP connection is also left dangling until the server closes it.

This is a correctness gap, not a crash. Severity is low today because the backend
streams fake chunks (full text generated server-side first, then split word-by-word
with a 5ms delay), so a stream completes in ~1-2 seconds. The gap becomes material
only when real provider streaming lands.

## Goal

When `AssistantPanel` is destroyed (chart switch via `{#key chartId}` remount, or
navigating away), any in-flight stream must be truly aborted — cancelling both the
`fetch` and the generator — so no background request writes into discarded state and
no HTTP connection is left hanging.

Non-goals (explicitly out of scope):
- No user-facing "Stop generating" button, no `stopped` status, no new UI.
- No silent inactivity timeout around `reader.read()` (backlog, see below).
- No retry-without-streaming or incomplete-markdown detection (backlog, see below).
- `dispose()` does NOT reset `messages`: the `{#key}` remount already creates a
  fresh model with `messages = []`, so resetting a soon-to-be-GC'd array is dead work.

## Chosen Approach

Approach A — real abort via `AbortSignal`. Thread an optional `AbortSignal` through
`streamConversationMessage` into `fetch`, own one `AbortController` per send in the
model, and call `controller.abort()` from the panel's `onDestroy`. This is the only
option that cancels the actual fetch (not just stops reading), and the `signal`
parameter is reused unchanged when real provider streaming lands later.

Rejected:
- Approach C (a `disposed` flag that only breaks the loop): does not cancel the
  fetch; leaves the HTTP connection open until the server closes. Tech debt under
  real streaming.

## Per-File Changes

### apps/web/src/lib/api-client/index.ts — streamConversationMessage
- Add an optional trailing parameter `signal?: AbortSignal` (no existing call-site
  breaks).
- Pass it into the underlying `fetch(..., { signal })`.
- Keep the existing `try/finally` with `reader.cancel()` + `reader.releaseLock()`.
  On abort, `reader.read()` rejects with `AbortError`; `finally` still cleans up.
- `collectAssistantStream` is untouched (not used by the panel flow).

### apps/web/src/lib/features/assistant/assistant-model.svelte.ts
- Hold a factory-closure-scope `let streamController: AbortController | null = null`
  inside `createAssistantModel` (alongside `messages` / `currentConversationId`), NOT
  module scope — module scope would share one controller across every model instance —
  and NOT `$state`, since it is an internal resource that is never rendered.
- In `appendUserAndStream`: create a fresh `AbortController` just before entering the
  stream and pass `streamController.signal` to `streamConversationMessage`. The
  existing `isGenerating` guard already ensures only one stream at a time.
- In `catch`: if the error is an `AbortError` (or `signal.aborted`), return silently —
  do NOT set `lastError`, do NOT roll back optimistic messages (the model is being
  destroyed; writing state is meaningless).
- In `finally`: clear `streamController` for the current run.
- Add `dispose()` to the returned object: calls `streamController?.abort()`. Abort-only,
  no `messages` reset.

### apps/web/src/lib/features/assistant/AssistantPanel.svelte
- `import { onDestroy } from 'svelte'` and `onDestroy(() => assistant.dispose())`.
- One line. Does not touch the (already-removed) `$effect`.

## Data Flow

onDestroy -> assistant.dispose() -> streamController.abort() -> signal fires ->
fetch aborts + reader.read() rejects AbortError -> generator `finally` cancels +
releases reader -> model `catch` swallows AbortError silently.

## Error Handling

- AbortError is the expected signal on dispose; it is swallowed silently in the model
  `catch` and must not surface as `lastError` or trigger optimistic rollback.
- All other errors keep their current behavior unchanged (typed error frames, rollback
  of optimistic turns when the placeholder is still streaming, `lastError` for display).
- Detecting AbortError: prefer `signal.aborted` on the captured controller over relying
  solely on `err.name === 'AbortError'`, since intermediate wrappers can rename errors.

## Testing

- No web component test library exists yet (backlog item #27), so unit coverage for the
  model is the practical tier.
- Add a focused test for `assistant-model`: start a generation against a stubbed
  `streamConversationMessage` that never resolves, call `dispose()`, assert the controller
  signal aborted and that `lastError` stays null (no error surfaced, no rollback side effect).
- If stubbing the generator proves awkward, fall back to asserting `dispose()` aborts the
  signal passed into the api-client call (spy on the injected fetch/stream boundary).
- Run `pnpm --filter @ziweiai/web check` (svelte-check) and lint on changed files.

## Backlog (Deferred — Activate With Real Provider Streaming)

These are only meaningful once the backend streams real provider tokens (not the current
fake word-split). File them with that activation condition:

1. Silent-inactivity timeout: wrap `reader.read()` in `Promise.race` against a timeout
   (~3 min default, like taibu's `chat-stream-manager`) so a provider that stops emitting
   bytes mid-stream does not hang the reader forever.
2. Retry-without-streaming + incomplete-markdown detection: port the ideas from xuanshu's
   `lib/ai/transport.ts` (`shouldRetryWithoutStreaming`, `hasIncompleteStructuredTail`) to
   recover from a dropped connection and to detect markdown truncated mid-structure.
3. Real provider streaming itself: replace `fullText.split(/\s+/)` fake chunking in
   `conversations.controller.ts` with provider `stream: true` reads mapped onto the existing
   `chunk` / `done` / `error` contract (pattern: zhouwenwang `masters/service.ts`). The
   client contract stays unchanged, so the `AbortSignal` added here is reused as-is.

## References (reviewed during brainstorming)

- taibu `src/lib/chat/chat-stream-manager.ts` — most complete reference (task registry,
  AbortController, inactivity timeout, persist-on-stop). Architecture inspiration only;
  not copied (it is a multi-conversation background-task daemon with billing).
- zhouwenwang `src/masters/service.ts` — clean provider-stream + non-stream fallback.
- xuanshu `lib/ai/transport.ts` — retry + truncation-detection helpers.
