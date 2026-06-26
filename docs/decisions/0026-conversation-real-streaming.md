# 0026 Streaming hoi thoai that (provider stream:true) thay chunk-gia

Date: 2026-06-26

## Status

Accepted

## Context

ADR 0019 hoan hardening streaming hoi thoai (abort/timeout/retry) voi ly do
kien truc backend con la "chunk-gia": conversations.controller.ts goi
appendMessageAndGenerate sinh TOAN BO text + persist assistant message TRUOC,
roi moi flushHeaders + fullText.split phat tung tu voi delay 5ms. Duoi kien
truc do, abort/timeout/retry phia client gan nhu vo gia tri (token da tieu, du
lieu da luu).

Nguoi dung quyet dinh kich hoat backlog #28 NGAY: lam streaming that. Day la
dieu kien kich hoat ma ADR 0019 da neu (backend chuyen sang provider
stream:true), nen ADR 0019 chuyen sang Superseded.

## Decision

Chuyen duong hoi thoai sang streaming that, dau-cuoi:

1. Provider (OpenAiCompatibleExplanationProvider): them duong
   generateConversationStream tra AsyncIterable<string> (delta token) bang
   stream:true + doc SSE cua upstream OpenAI-compatible (data: {...} + [DONE]).
   Giu nguyen duong non-stream cu cho cac caller khac. CJK guard ap tren text
   tich luy truoc khi commit assistant message.
2. Service (ConversationsService.appendMessageAndGenerateStream): gate
   entitlement (402) + quota (429) TRUOC khi mo stream y het duong non-stream;
   persist user message truoc; stream delta ra controller; sau khi stream xong
   moi persist assistant message voi full text + provider metadata. Neu provider
   loi giua chung -> khong persist assistant, phat SSE error frame.
3. Controller (/conversations/:id/messages/stream): thay vong fullText.split
   bang vong for await (const delta of ...stream). Giu nguyen thu tu flush
   header sau khi pass gate, va xu ly res.destroyed (client disconnect) bang
   AbortController truyen xuong provider de huy fetch upstream (tiet kiem token
   that). Giu nguyen contract conversationStreamEventSchema (chunk/done/error).
4. Client web (streamConversationMessage + assistant-model.svelte.ts): them
   AbortSignal huy stream khi unmount/doi la so, timeout im lang quanh
   reader.read(), va retry non-stream khi stream dut giua chung. Day la 3 manh
   hardening ADR 0019 hoan, gio kich hoat dong thoi.

## Alternatives Considered

1. Giu chunk-gia (ADR 0019). Bi nguoi dung bac: muon streaming UX that.
2. Streaming that nhung KHONG huy fetch upstream khi client disconnect. Loai:
   bo lo dung loi chinh cua streaming that (tiet kiem token khi user bo ngang).

## Consequences

Positive:

- Token provider phat dan, UX hoi thoai muot, huy giua chung tiet kiem cost that.
- 3 manh hardening cua ADR 0019 cuoi cung co dat dung (stream that moi treo duoc).

Tradeoffs:

- Cham vao provider boundary + controller + web stream client cung luc (rui ro
  cao hon prompt-only). Can test gia lap SSE upstream + e2e live.
- Provider khong ho tro stream phai fallback non-stream (giu duong cu).

## Follow-Up

- Backlog #28 dong khi e2e live xanh.
- Neu them provider streaming khac (gemini/deepseek), tai dung interface
  generateConversationStream.
