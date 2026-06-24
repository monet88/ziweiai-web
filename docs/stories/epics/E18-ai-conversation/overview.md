# Overview

## Current Behavior

`ziweiai-web` hiện chỉ có AI dạng "1 lượt markdown tĩnh":

- `POST /explanations` (`apps/api/src/modules/explanations/services/explanations.service.ts`)
  nhận `{ chartSnapshotId, explanationKind, palaceScope? }` → gọi 1 LLM call → trả
  `renderedMarkdown` đầy đủ một lần, **không streaming**, **không lưu lượt sau**.
- Mỗi lần user muốn hỏi tiếp = lập lại `POST /explanations` với input khác.
  Backend KHÔNG biết các lượt liên quan, KHÔNG ghi nhớ "chúng ta đang nói về cung
  Mệnh trong lá số X" → câu trả lời lượt sau không có context lượt trước.
- Không có panel chat overlay; UI luận giải là khối markdown đặt trong
  `ChartDetailScreen`.
- Không có "quick prompts" gợi ý; user phải tự nghĩ câu hỏi.

Hạ tầng đã có (sẽ tái dùng):

- Auth: Supabase anonymous + email (decision 0009).
- Gate AI: `assertCanUseAiExplanation` + cờ `AI_EXPLANATION_FREE_FOR_ALL`
  (decision 0010, US-010).
- Quota daily-per-user (DB count) + daily-per-IP (in-memory; chuyển Redis ở US-013).
- Provider router LLM ở `apps/api/src/providers/ai/explanation-provider-router.ts`
  (DeepSeek / Gemini / OpenAI-compat).

## Target Behavior

Mở panel "Trợ lý AI" overlay bên phải `ChartDetailScreen` (hoặc dashboard).
Người dùng:

1. Bấm nút "Hỏi AI" → tạo `Conversation` mới gắn với `chartId` đang xem (hoặc
   không gắn — hỏi chung).
2. Gõ câu hỏi vào ô input HOẶC chọn 1 trong các "Quick prompt" gợi ý sẵn (ví dụ
   "Tổng quan vận mệnh", "Sự nghiệp năm nay", "Tình duyên hiện tại").
3. Bấm gửi → câu hỏi xuất hiện ở message list dạng bubble user; bubble assistant
   xuất hiện trống và **stream từng token** từ LLM, hiển thị real-time.
4. LLM stream xong → message được lưu DB, panel sẵn sàng nhận lượt tiếp theo.
5. Đổi câu hỏi tiếp theo → server build prompt với 12 message gần nhất (6 lượt
   qua-lại) làm context, không cần snapshot lá số đầy đủ ở mỗi lượt.

Trạng thái mong muốn sau US-018 đóng:

- 2 bảng mới `public.conversations` + `public.conversation_messages` ở Supabase,
  RLS owner-only.
- 3 endpoint mới: `POST /conversations`, `GET /conversations/:id`,
  `POST /conversations/:id/messages` (SSE streaming).
- Module `apps/api/src/modules/conversations/` + provider
  `apps/api/src/providers/ai/conversation-prompts.ts` chứa quick-prompt registry
  server-side (key → template Việt).
- Feature module web `apps/web/src/lib/features/conversation/` với panel UI
  overlay + transport SSE bằng `fetch` native.
- 2 cờ env `AI_CONVERSATION_ENABLED` + 2 quota mới
  (`API_CONVERSATION_MESSAGES_PER_DAY_PER_USER`,
  `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP`).
- Reload trang → panel khôi phục lịch sử qua `GET /conversations/:id`. Đổi thiết
  bị (cùng user) → cũng thấy lịch sử nhờ DB + RLS.

## Affected Users

- **Người dùng đã đăng nhập (email)**: dùng được hội thoại với quota
  `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER` mỗi ngày. Khi billing thật bật,
  bị gate `AI_EXPLANATION_FREE_FOR_ALL` chung.
- **Người dùng ẩn danh (anon-session)**: vẫn dùng được nhưng quota nhỏ hơn
  (`API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP`). Lịch sử lưu DB → mất khi đổi
  thiết bị (anon JWT khác). Có CTA gợi ý đăng ký để giữ lịch sử.
- **Operator**: 2 cờ feature riêng (`AI_CONVERSATION_ENABLED` mặc định `false`)
  + quota tách bạch khỏi `/explanations` để bật/giảm tải độc lập.

## Affected Product Docs

- `docs/product/api-contract.md` — thêm 3 endpoint conversation + format SSE
  (P4).
- `docs/product/invariants.md` — bổ sung quy tắc: chat bubble + system prompt
  mặc định + quick prompt label đều Việt; KHÔNG cấu hình LLM ở client; quick
  prompt key là enum đóng (chống prompt injection).
- `SPEC.md` — cập nhật roadmap: Phase US-018 (E18 trợ lý AI hội thoại).
- `docs/decisions/0013-ai-conversation-channel.md` — đã accepted 2026-06-17,
  story này hiện thực.

## Non-Goals

- **KHÔNG port toàn bộ `.ref/xuanshu/components/ai/`**: cụ thể KHÔNG port
  `AISettingsPanel.tsx` — model / temperature / system prompt user-defined
  client-side bị loại. Mọi cấu hình LLM nằm ở server (provider router hiện có +
  prompt registry mới). Lý do: lộ secret + bypass cost engineering trivial khi
  client tự đặt model.
- **KHÔNG hỗ trợ streaming "regenerate" / "stop generation" trong story này**:
  user gửi câu hỏi → đợi xong → mới gửi câu hỏi tiếp. Nút "Stop" + tạo lại lượt
  cuối là phạm vi backlog sau.
- **KHÔNG hỗ trợ hội thoại có ảnh đính kèm (vision)**: vision là phạm vi US-017e/f
  (Xem Tướng / Xem Tay).
- **KHÔNG sửa `POST /explanations` để chứa multi-turn**: tách module mới hoàn
  toàn (decision 0013 §Alternatives).
- **KHÔNG xây UI "danh sách hội thoại lịch sử"** (sidebar liệt kê các
  conversation cũ): chỉ xử lý conversation hiện hành gắn với chart đang xem.
  List view là backlog sau khi đã có vài conversation thật.
- **KHÔNG đụng billing thật**: AI gate dùng chung cờ
  `AI_EXPLANATION_FREE_FOR_ALL` (decision 0010); billing là decision + story riêng.
- **KHÔNG WebSocket / GraphQL Subscription**: SSE 1 chiều đủ (decision 0013).
- **KHÔNG thêm dependency npm mới ở web**: transport SSE viết tay bằng `fetch`
  + `Response.body.getReader()` (Node 22 / browser hiện đại đều hỗ trợ).
- **KHÔNG nâng cấp anon → email khi user vượt quota**: chỉ hiện CTA "đăng ký để
  có quota cao hơn"; flow `linkIdentity` thật là story riêng.
