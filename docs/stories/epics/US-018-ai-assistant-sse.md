# US-018 — Trợ lý AI hội thoại multi-turn + quick prompts + SSE streaming

## Goal

Tạo lát cắt backend-first cho trợ lý AI hội thoại theo từng lá số: người dùng tạo cuộc trò chuyện, gửi câu hỏi tự nhập hoặc quick prompt key, nhận phản hồi qua SSE, và lịch sử hội thoại được lưu lại.

## Acceptance Criteria

- API có endpoint tạo/lấy cuộc trò chuyện theo lá số đã lưu của user hiện tại.
- API có endpoint `POST /conversations/:id/messages/stream` trả `text/event-stream` và vẫn dùng Bearer auth.
- Client chỉ gửi quick prompt key; prompt đầy đủ được map server-side.
- Hội thoại chỉ gửi tối đa 12 tin nhắn gần nhất vào prompt AI.
- `AI_CONVERSATION_ENABLED=false` chặn generation trước khi ghi message hoặc gọi provider.
- Có quota daily riêng cho message hội thoại.
- Web parse JSON/SSE bằng schema từ `@ziweiai/contracts`.
- UI copy tiếng Việt, không chứa chữ Hán/CJK.
- Không làm yếu gate luận giải AI hiện có.

## Technical Plan

1. Contracts:
   - Thêm schemas/types conversation record, message record, request/response, stream events.
2. Persistence:
   - Thêm migration `conversations` và `conversation_messages` với owner RLS.
   - Thêm gateway methods cho create/list/detail/message/count.
3. AI backend:
   - Thêm quick prompt registry server-side.
   - Thêm prompt builder hội thoại và provider router path cho conversation.
4. API module:
   - Thêm `ConversationsModule`, controller, service, SSE formatter.
5. Web:
   - Thêm api-client stream helper và assistant panel tối thiểu trên chi tiết lá số.
6. Validation:
   - Unit/integration tests cho contracts, quick prompts, quota, service, stream parser, no-Han.

## Verification

- `pnpm -F @ziweiai/contracts test`
- `pnpm -F @ziweiai/api test`
- `pnpm -F @ziweiai/web test`
- `pnpm -F @ziweiai/web check`
- `pnpm lint`
- `turbo typecheck`
