# Pre-check + Closeout — Observability P0 (Matt Option B)

**Ngày:** 2026-07-22  
**Session:** dài — **đóng tại đây** sau pre-check; env secrets + product next để session mới  
**Branch:** `main`  
**Demo:** https://tuvitoantap.vercel.app

---

## 1. Mục tiêu session (chuỗi)

| Mục tiêu | Status |
|----------|--------|
| Phase 11 push → deploy → live OG smoke | **DONE** (session trước trong cùng ngày) |
| Matt Option B: observability 5xx + AI fail | **DONE** (code + deploy) |
| Pre-check trước khi coi hoàn thành | **DONE** (doc này + 1 hotfix OG) |

---

## 2. Pre-check Observability (4 câu)

### 2.1. Logic đúng chưa?

| Hạng mục | Đánh giá |
|----------|----------|
| Sentry init trên Vercel serverless | **Đúng** — `api/[...path].ts` gọi `initSentry` (trước chỉ `main.ts` → dead) |
| Alert khi 5xx / INTERNAL_ERROR | **Đúng** — `ApiErrorFilter.maybeAlert` |
| Alert AI `PROVIDER_TIMEOUT` / `PROVIDER_UNAVAILABLE` | **Đúng** — 504/502 qua filter |
| Không alert 4xx thường (400/401) | **Đúng** — `shouldAlertHttpStatus` |
| Throttle 60s cùng code+path | **Đúng** — instance-local (serverless cold = reset) |
| Webhook fail không phá request | **Đúng** — try/catch + tests |
| OG `@Res()` catch nuốt lỗi | **Đã fix pre-check** — gọi `reportOpsAlert` thủ công |

### 2.2. Workflow ổn chưa?

```
Request lỗi
  → ApiErrorFilter (HttpException / unknown)
  → response JSON cho client
  → reportOpsAlert:
       1) log [ops-alert] (luôn, Vercel logs)
       2) Sentry.capture* (nếu DSN init)
       3) POST OPS_ALERT_WEBHOOK_URL (nếu set)
```

| Verify | Result |
|--------|--------|
| `pnpm -F @ziweiai/api typecheck` | PASS |
| vitest observability + share | PASS |
| Live `GET /api/health` | 200 ok |
| Deploy observability `8ce3df1` | Ready trên tuvitoantap |

### 2.3. Thiếu tính năng gì?

| Item | Blocker? | Ghi chú |
|------|----------|---------|
| `SENTRY_DSN` trên Vercel Production | **Không** cho “code done” | **Có** cho push Sentry UI — user set |
| `OPS_ALERT_WEBHOOK_URL` (Telegram…) | **Không** | Không set → chỉ Vercel log |
| End-to-end test alert thật (force 500) | P1 | Tránh spam; manual sau khi set env |
| OpenTelemetry / dashboard / cost budget alert | Out of scope P0 | Docs residual |
| Referral / SePay | Product next | Không thuộc Option B |

**Kết luận feature gap:** P0 **code path hoàn tất**. “Alert kêu đến điện thoại” cần **ops env 5 phút** — không phải bug code.

### 2.4. Rủi ro tiềm ẩn

| Rủi ro | Mức | Ghi chú |
|--------|-----|---------|
| Chưa set DSN/webhook production | Trung bình | Structured log vẫn có; Sentry/Telegram im |
| Throttle per-instance | Thấp–TB | Burst multi-instance có thể >1 alert/60s |
| Sentry capture khi chưa init | Thấp | SDK no-op an toàn |
| Telegram `parse_mode=HTML` + message thô | Thấp | Ký tự đặc biệt có thể fail webhook (đã swallow) |
| `@Res()` routes khác nuốt lỗi | Thấp | Đã cover OG; stream conversation vẫn tự filter nếu throw |
| Serverless không `await` alert trước freeze | Thấp–TB | Webhook timeout 2.5s; log luôn sync |

### 2.5. Bugs pre-check

| Bug | Fix | Status |
|-----|-----|--------|
| OG generation `catch` → 500 **không** ops-alert | `reportOpsAlert` trong catch | Fixed pre-check (commit kèm) |

Không còn bug blocker khác trong phạm vi Option B.

---

## 3. Việc đã làm (toàn chuỗi ngày)

### Phase 11 ship (trước)

- Push stack Phase 11, deploy, smoke share/OG
- Hotfix: `@Public`, satori-html → og-element, font jsDelivr, UUID 400

### Observability P0

| File / area | Việc |
|-------------|------|
| `observability/init-sentry.ts` | Init idempotent |
| `observability/ops-alert.ts` + tests | Log + Sentry + webhook + throttle |
| `api-error.filter.ts` | Alert 5xx + AI codes |
| `api/[...path].ts` | Init Sentry trên Vercel |
| `env.ts` | `OPS_ALERT_WEBHOOK_URL` |
| Docs | `observability-minimum.md`, handovers |

### Pre-check

- Rà logic/workflow/risk
- Fix OG silent 500 alert gap
- Doc closeout này

---

## 4. Kết quả

| Layer | Kết quả |
|-------|---------|
| Code Observability P0 | **DONE** trên `main` |
| Demo deploy health | **200** |
| Alert channels production | **Chưa bind secret** (user action) |
| Phase 11 | **DONE** ship + precheck |
| Session | **CLOSE** — handoff session mới |

---

## 5. Matt — giờ làm gì tiếp?

**Không** mở feature mới trong session này (đã dài).

### P0 session mới (ops 15 phút) — khuyến nghị làm trước

1. Set Vercel Production:
   - `SENTRY_DSN=...` và/hoặc
   - `OPS_ALERT_WEBHOOK_URL=https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>`
2. Redeploy `pnpm deploy:vercel-demo`
3. Verify: gây 1 lỗi test an toàn **hoặc** đợi lỗi thật; lọc `[ops-alert]` / Sentry / Telegram

### P1 product (chọn 1 sau ops env)

| Option | Khi nào | Skill |
|--------|---------|--------|
| **A Referral / viral** | Muốn growth từ share OG | `/ak:plan` → `/ak:cook` |
| **B money SePay live** | Muốn thu tiền | `/ak:payment-integration` → smoke |
| **C Harden** | Playwright share/OG + cleanup smoke chart | `/ak:test` |

**Matt default sau ops wire:** **A Referral** nếu muốn user; **B SePay** nếu muốn revenue. Không làm cả hai song song.

---

## 6. Prompt session mới (copy-paste)

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập — session mới (session trước dài, đã closeout).

## Handoff (đọc đủ)
1. `docs/handover/session-2026-07-22-observability-precheck-closeout.md`
2. `docs/handover/session-2026-07-22-observability-p0.md`
3. (nếu đụng share) `docs/handover/session-2026-07-22-phase11-precheck-complete.md`

## Hiện trạng
- Phase 11 ship + OG smoke + precheck: DONE trên main/demo
- Observability P0 code: DONE (Sentry init Vercel, [ops-alert], filter 5xx/AI, OG catch alert)
- Vercel **chưa** chắc có SENTRY_DSN / OPS_ALERT_WEBHOOK_URL
- Working tree: kiểm tra git status lúc mở session

## P0 session này
1. Xác nhận/set env Production: SENTRY_DSN và/hoặc OPS_ALERT_WEBHOOK_URL
2. Redeploy demo nếu vừa set env
3. Verify alert path (log `[ops-alert]` tối thiểu; Sentry/Telegram nếu có secret)
4. **Chỉ sau P0 xanh** — hỏi user chọn product:
   - A) Referral viral loop, hoặc
   - B) SePay/payment live smoke

## Không làm
- Không UI polish / WASM / admin feature mới trước khi wire ops env (trừ user override)
- Không refactor ngoài scope

## Gate
- Health 200 sau deploy
- Có bằng chứng alert (log hoặc channel)
```

---

## 7. Kết luận pre-check

| Câu hỏi | Trả lời |
|---------|---------|
| Logic đúng? | **Có** (+ hotfix OG alert) |
| Workflow ổn? | **Có** (code path); channel push phụ thuộc env |
| Thiếu feature? | Ops **secrets** + product next — không blocker “code complete” |
| Rủi ro? | Residual documented; không blocker |
| Done? | **DONE** Observability P0 code + pre-check. **Session đóng.** |

**Next owner:** paste prompt §6 vào session mới; ưu tiên wire env rồi chọn A/B product.
