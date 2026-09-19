# Session — Observability P0 (Matt Option B)

**Ngày:** 2026-07-22  
**Quyết định:** Matt Option B — ops alerts (5xx + AI fail/timeout), **không** referral  
**Branch:** `main`

---

## 1. Mục tiêu

Sau Phase 11 ship: có **báo lỗi tự động tối thiểu** khi demo production hỏng core path hoặc AI chết — không phụ thuộc “mở Vercel logs tình cờ”.

---

## 2. Phát hiện scout

| Gap | Chi tiết |
|-----|----------|
| Sentry chỉ init trong `main.ts` | **Vercel không chạy `main.ts`** — entry là `api/[...path].ts` → DSN có cũng không capture |
| `ApiErrorFilter` | Chỉ `captureException` nhánh non-HttpException; **5xx HttpException / PROVIDER_*** return sớm, im lặng |
| Vercel env | **Chưa** có `SENTRY_DSN` / alert webhook trên project demo |
| Docs | `docs/deploy/observability-minimum.md` mô tả checklist thủ công, chưa code path |

---

## 3. Việc đã làm

1. **`init-sentry.ts`** — init idempotent; gọi từ `main.ts` **và** `api/[...path].ts`
2. **`ops-alert.ts`** — structured `[ops-alert]` log + Sentry + optional webhook; throttle 60s
3. **`ApiErrorFilter`** — alert khi `status >= 500` hoặc code `PROVIDER_TIMEOUT` / `PROVIDER_UNAVAILABLE` / `INTERNAL_ERROR`
4. **Env** — `OPS_ALERT_WEBHOOK_URL` optional URL
5. **Tests** — `ops-alert.test.ts` (throttle, webhook, no-throw)
6. **Docs** — cập nhật `observability-minimum.md` + handover này

---

## 4. Kết quả

| Gate | Result |
|------|--------|
| `pnpm -F @ziweiai/api typecheck` | PASS |
| vitest observability + api-error | PASS |

**Production push alert chưa “kêu” thật** cho đến khi set env trên Vercel:

- `SENTRY_DSN` và/hoặc  
- `OPS_ALERT_WEBHOOK_URL` (Telegram sendMessage + `?chat_id=`)

Sau deploy: log Vercel đã có thể lọc `[ops-alert]` ngay cả khi chưa set webhook.

---

## 5. Việc user/Matt cần làm (ops, 5 phút)

1. Tạo Sentry project (hoặc skip) → dán `SENTRY_DSN` Production trên Vercel  
2. (Khuyến nghị) Telegram bot + chat_id → `OPS_ALERT_WEBHOOK_URL`  
3. Redeploy demo  
4. Smoke: force một lỗi (optional) hoặc chờ sự cố thật; xác nhận log/Sentry/Telegram  

---

## 6. Không làm (đúng scope)

- Referral / viral loop  
- Full APM / OpenTelemetry  
- Dashboard custom  
- Thay Langfuse (đã có wrapper riêng cho traces AI)

---

## 7. Next product (sau ops env bật)

- Monetization SePay live smoke  
- hoặc Referral (Matt Option A)  
- Cleanup smoke chart Phase 11  

---

## 8. Prompt session mới (nếu cần wire secrets)

```text
Observability code đã ship. Set SENTRY_DSN và/hoặc OPS_ALERT_WEBHOOK_URL trên
Vercel production, redeploy, verify [ops-alert] / Sentry / Telegram với một
lỗi test an toàn. Không mở feature mới.
```
