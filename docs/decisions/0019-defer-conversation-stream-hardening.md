# 0019 Hoãn hardening streaming hội thoại (abort/timeout/retry) đến khi có provider streaming thật

Date: 2026-06-25

## Status

Superseded by 0026 (2026-06-26): the activation condition (real provider
streaming) is now being implemented under backlog #28 / US-027. The deferral
reasoning below remains the historical record of why fake-chunk hardening was
not built at the time.

## Context

PR #16 (US-018: trợ lý AI hội thoại + SSE) nhận review từ gemini/codex. Trong lúc
xử lý, khảo sát các repo mẫu `.ref` (taibu `chat-stream-manager.ts`, zhouwenwang
`masters/service.ts`, xuanshu `lib/ai/transport.ts`) để xem nên port pattern streaming
nào. Đề xuất ban đầu là port 3 mảnh: (1) AbortSignal huỷ stream khi unmount/đổi lá số,
(2) timeout im lặng quanh `reader.read()`, (3) retry non-stream + phát hiện markdown cắt dở.

Khi soi lại code thật, kiến trúc backend hiện tại là **chunk-giả**:
`conversations.controller.ts` gọi `appendMessageAndGenerate` sinh TOÀN BỘ text và
**persist assistant message vào DB TRƯỚC**, rồi mới `flushHeaders` + `fullText.split(/\s+/)`
phát từng từ với delay 5ms. Hệ quả: tới lúc chunk đầu bay đi, token provider đã tiêu xong
và dữ liệu đã lưu. Cửa sổ stream chỉ ~1-2s và chỉ mở khi user bấm gửi.

## Decision

Hoãn cả 3 mảnh hardening streaming; gom thành MỘT việc, kích hoạt ĐỒNG THỜI khi
backend lên provider streaming thật (`stream: true` thay vì `fullText.split`).

Lý do (idea-refine 2026-06-25):

1. Dưới kiến trúc chunk-giả, abort phía client gần như VÔ GIÁ TRỊ hôm nay: huỷ không
   tiết kiệm cost provider (đã tiêu), không mất dữ liệu (đã persist), và ghi vào model
   Svelte 5 đã unmount là vô hại (không có DOM gắn vào).
2. Timeout im lặng (#2) và retry/markdown-cắt (#3) chỉ có nghĩa khi stream có thể "treo
   giữa chừng" — điều chỉ xảy ra với streaming thật, không xảy ra với text đã nằm sẵn
   trong memory.
3. YAGNI: làm hardening cho một chế độ vận hành chưa tồn tại là nợ kỹ thuật ngược.

Lưu vết: harness backlog #28 (điều kiện kích hoạt + 3 mảnh), và design spec
`docs/superpowers/specs/2026-06-25-assistant-stream-abort-design.md` (đổi trạng thái
DEFERRED, giữ làm thiết kế cho việc tương lai).

## Alternatives Considered

1. **Triển khai ngay Approach A (abort thật).** Forward-useful nhưng giá trị hiện tại ~0;
   thêm code + test cho hành vi chưa cần. Bác bỏ theo YAGNI.
2. **Chỉ làm #1 (abort), hoãn #2/#3.** Vẫn là gold-plating phần lifecycle mà chunk-giả
   không cần; tách lẻ khiến lúc lên streaming thật phải đụng lại cùng vùng code 2 lần.
   Bác bỏ — gom một lần khi có streaming thật rẻ hơn.
3. **Xoá luôn chunk-giả cho gọn.** Sẽ mất khả năng render dần phía client (UX nhấp nháy
   cả khối). Ngoài phạm vi; giữ chunk-giả tới khi có streaming thật thay thế.

## Consequences

Positive:

- PR #16 giữ scope đúng nhu cầu; không thêm code cho chế độ vận hành chưa tồn tại.
- Khi lên streaming thật, contract SSE client (`chunk`/`done`/`error`, Zod-validated)
  giữ nguyên — `AbortSignal` thêm sau này tái dùng được, chỗ sửa duy nhất là
  `conversations.controller.ts` (pattern zhouwenwang `masters/service.ts`).
- Quyết định "chưa làm" được ghi rõ ràng (backlog #28 + ADR này), không trôi mất.

Tradeoffs:

- Nếu user bấm gửi RỒI đổi lá số trong ~1-2s, một fetch nền chạy nốt rồi bị bỏ (vô hại,
  không crash/không leak ngoài chính fetch đó). Chấp nhận đến khi có streaming thật.

## Follow-Up

- Khi mở story provider-streaming thật: triển khai backlog #28 trọn gói. Lưu ý triển khai
  bắt buộc: check `AbortError` phải đứng TRƯỚC nhánh rollback optimistic trong `catch`
  của `assistant-model`, nếu không abort sẽ xoá nhầm lượt chat — phải có test chốt.
