# 0010 Luận giải AI là gói premium, gate server-side qua feature-flag

Date: 2026-06-16

## Status

Accepted

## Context

Luận giải AI sẽ là tính năng trả phí (premium): đặt mua rồi mới gửi kết quả. Nhưng giai
đoạn hiện tại cần **free toàn bộ** để test mọi tính năng cho dễ.

Khảo sát cho thấy **không có** hạ tầng entitlement/membership/payment ở bất kỳ đâu
(grep `membership|credit|tier|entitlement|subscription|premium|plan|paid|billing` = 0
match trong cả `apps/api` lẫn `packages/contracts`). `apiErrorCodeSchema` chỉ có
`UNAUTHORIZED | FORBIDDEN | INVALID_INPUT | NOT_FOUND | RATE_LIMITED | PROVIDER_TIMEOUT
| PROVIDER_UNAVAILABLE | INTERNAL_ERROR` — không có mã "cần thanh toán".

## Decision

- Gate entitlement đặt **server-side** trong `ExplanationsService.createExplanation`,
  cạnh `assertCanCreateExplanation`, **trước** khi gọi provider và tạo
  `explanation_requests`. Cờ client KHÔNG bao giờ là hàng rào thanh toán (dễ bypass).
- Thêm 1 env flag ở `apps/api/src/config/env.ts`: `AI_EXPLANATION_FREE_FOR_ALL`
  (`z.stringbool().default(true)`). Khi `true` (mặc định, giai đoạn test) → gate là
  no-op, mọi danh tính dùng AI miễn phí. Khi `false` → fail-closed, yêu cầu entitlement.
  Dùng `z.stringbool` (zod v4) chứ KHÔNG dùng `z.coerce.boolean()`: env luôn là chuỗi,
  mà `Boolean("false") === true` nên `z.coerce.boolean()` khiến `=false` vẫn ra `true`
  (gate vô hiệu ở prod). `z.stringbool` parse `"false"/"0"/"no"` → `false` đúng nghĩa.
- Thêm mã lỗi `PAYMENT_REQUIRED` vào `apiErrorCodeSchema` (`packages/contracts`), trả
  HTTP 402 khi không có quyền. Web parse mọi lỗi qua contracts nên phải thêm mã này
  trước, kèm thông điệp tiếng Việt (không chữ Hán).
- AI chỉ cho **danh tính** (anon-session hoặc email) — không có khái niệm "AI cho khách
  hoàn toàn không session", khớp với [[0009-anonymous-auth-strategy]] (anon vẫn là user).
- Cờ free là **env config**, không phải DB column → bật/tắt tức thì, có thể đảo ngược.

Nguồn "paid status" thật (column tier / bảng entitlements / billing provider) để **sau**;
giai đoạn này flag free khiến gate là no-op nên chưa cần bảng nào.

## Alternatives Considered

1. **Gate ở web bằng PUBLIC_* flag** — chỉ ẩn nút, không chặn API → bypass trivial.
   Chỉ dùng cho trình bày (ẩn CTA), KHÔNG thay gate server. Giữ làm lớp UX phụ.
2. **Tạo bảng entitlements/payments ngay** — chưa có billing, phình scope khi chưa cần.
   Hoãn tới khi tích hợp thanh toán thật.

## Consequences

Positive:

- Test free toàn bộ chỉ bằng 1 env mặc định `true`; không đụng DB.
- Gate ở service → mọi client (web + tương lai) đều bị chặn đồng nhất.
- Có sẵn mã lỗi 402 chuẩn cho web prompt mua khi bật premium.

Tradeoffs:

- Nếu để `AI_EXPLANATION_FREE_FOR_ALL=true` lên production thì AI free → chi phí không
  trần. Phải nhớ đặt `false` khi go-live (ghi rõ trong env.example + follow-up).
- Quyết định gate cache-hit (kết quả đã sinh) free hay vẫn chặn → để US-010 chốt chi tiết.

## Follow-Up

- US-010: thêm `AI_EXPLANATION_FREE_FOR_ALL` vào env schema + `.env.example`, thêm
  `PAYMENT_REQUIRED` vào contracts + i18n vi, chèn gate vào ExplanationsService.
- Khi tích hợp thanh toán: thêm nguồn entitlement thật (column/bảng) + đảo flag về `false`.
- Lớp UX web: ẩn/đổi nút luận giải thành CTA mua khi gate bật (chỉ trình bày).
