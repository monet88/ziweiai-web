# 0013 AI conversation channel

Date: 2026-06-18

## Status

Accepted

## Context

US-018 adds a multi-turn AI assistant that streams answers while preserving the existing security model: client-only Supabase Auth, server-side AI providers, no prompt templates in the browser, and no weakening of the premium AI gate from decision 0010.

Native `EventSource` cannot attach an `Authorization: Bearer` header, while every non-health backend endpoint in this project is authenticated with Bearer tokens. Passing tokens in query strings would leak credentials through URLs, logs, and caches.

## Decision

Use authenticated `fetch()` with `POST /conversations/:id/messages/stream` and a `ReadableStream` parser on the web instead of native `EventSource`.

The browser sends the Supabase access token in the `Authorization` header and the message request in a JSON body. The API responds with `text/event-stream` frames. The web validates each frame with `conversationStreamEventSchema` from `@ziweiai/contracts`.

Quick prompts are represented on the client only as keys and Vietnamese UI labels. The server owns the quick-prompt registry and maps keys to full prompt text before calling any AI provider.

## Alternatives Considered

1. Native `EventSource` with access token in query params.
   - Rejected because it exposes bearer tokens in URLs and weakens the auth boundary.
2. Native `EventSource` with cookie auth.
   - Rejected because the current product uses Supabase bearer tokens and does not have a cookie session layer.
3. Non-streaming JSON response only.
   - Rejected because US-018 explicitly requires SSE streaming.

## Consequences

Positive:

- Keeps existing Bearer auth invariant for protected endpoints.
- Avoids token leakage through URLs.
- Allows request bodies, quick prompt keys, and provider preferences to be validated with Zod.
- Keeps server-side prompt mapping auditable and testable.

Tradeoffs:

- The web needs a small SSE frame parser for `ReadableStream` instead of relying on native `EventSource`.
- The first slice may stream server-emitted chunks from a full provider result when a provider lacks native token streaming.

## Follow-Up

- Add native provider token streaming later if needed without changing the public SSE contract.
- Keep all assistant UI copy and quick prompt labels in Vietnamese and covered by the no-Han scan.
