# Session — Observability ops env wired

**Ngày:** 2026-07-22  
**Branch:** `main` (no code change)  
**Demo:** https://tuvitoantap.vercel.app  
**Deployment:** `dpl_EQNHoftvUoBRMUZ5F4YsW8oHvKQD` (Ready)

---

## 1. Mục tiêu

Wire Production secrets cho Observability P0 sau khi code đã ship.

---

## 2. Việc đã làm

| Bước | Kết quả |
|------|---------|
| Confirm Vercel thiếu `SENTRY_DSN` / `OPS_ALERT_WEBHOOK_URL` | Đúng |
| Đọc local `.env.local`: `TELEBOT_TOKEN`, `TELEBOT_USERID`, `SENTRY_JOKER` | Có |
| `SENTRY_JOKER` = Sentry **auth token** (`sntryu_…`), không phải DSN | Tạo project `tuvitoantap-api` (org `joker-6n`) → lấy DSN |
| `OPS_ALERT_WEBHOOK_URL` | `Telegram sendMessage?chat_id=` từ TELEBOT_* |
| `vercel env add` Production | `SENTRY_DSN`, `OPS_ALERT_WEBHOOK_URL` (Encrypted) |
| `pnpm deploy:vercel-demo` | Alias OK |
| Health | `200` |

### Verify channels

| Channel | Evidence |
|---------|----------|
| Telegram | Smoke POST → `ok:true` (message tới bot Phong Thủy / chat user) |
| Sentry DSN | Store API `200` event smoke vào project `tuvitoantap-api` |
| App `[ops-alert]` log | Chưa có 5xx thật sau deploy (đúng kỳ vọng); path code đã unit-test |

---

## 3. Không làm

- Không force 500 trên production trong session này
- Không mở Referral / SePay trong bước wire env

---

## 4. Next — hỏi Matt chọn 1

| Option | Mục tiêu |
|--------|----------|
| **A** Referral viral loop | Growth từ share OG |
| **B** SePay / payment live smoke | Revenue path |

Default gợi ý trước đó: **A** nếu muốn user; **B** nếu muốn thu tiền.
