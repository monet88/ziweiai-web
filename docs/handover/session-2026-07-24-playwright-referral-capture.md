# Closeout — Playwright referral capture gate (2026-07-24)

**Branch:** `main` (local changes; may be uncommitted)  
**Demo:** https://tuvitoantap.vercel.app (không cần redeploy — test-only)  
**Prior:** `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md`

---

## 1. Quyết định CEO / PM (+ Ask Matt)

**Chọn: Harden Playwright share/referral capture** (không SePay trong bước này).

| Lý do | Chi tiết |
|-------|----------|
| P0 redeem đã PASS | Gate regression cho path vừa ship |
| Rẻ hơn SePay | Test-only; không đụng payment/secret |
| Matt default | Growth loop ổn trước thu tiền |

---

## 2. Pre-check

| Check | Result |
|-------|--------|
| Unit web `append-referral-query` | 3 PASS |
| Unit API `append-referral-query` | 5 PASS |
| E2E capture `ziweiai_ref_code` | **Thiếu** → thêm |
| Seams (đã chốt Matt / user “làm theo đề xuất”) | (1) `?ref=` hợp lệ → storage (2) ref bẩn không ghi đè (3) `/charts/:id?ref=` giữ query |

**Pre-check: OK** → implement.

---

## 3. Việc đã làm

| File | Việc |
|------|------|
| `apps/web/tests/e2e/referral-capture.spec.ts` | 3 cases Playwright |
| `apps/web/playwright.config.ts` | `OPS_ALERT_WEBHOOK_URL: ''` — shell có giá trị non-URL làm Zod fail boot API e2e |

Không đụng product runtime. Không SePay. Không commit skills-lock/`.agents`.

---

## 4. Validation

```bash
pnpm -F @ziweiai/web exec vitest run src/lib/features/referral/append-referral-query.test.ts
# → 3 passed
pnpm -F @ziweiai/api exec vitest run src/modules/share/append-referral-query.test.ts
# → 5 passed
pnpm -F @ziweiai/web exec playwright install chromium   # one-time missing browser
OPS_ALERT_WEBHOOK_URL= pnpm -F @ziweiai/web exec playwright test referral-capture.spec.ts --workers=1
# → 3 passed
```

| Case | Verdict |
|------|---------|
| `/?ref=SmokeRef1` → `localStorage.ziweiai_ref_code` | PASS |
| `/charts/:id?ref=Ab12Cd34` giữ query + storage | PASS |
| `/?ref=bad!code` không ghi đè storage | PASS |

---

## 5. Residual

| Item | Mức | Ghi chú |
|------|-----|---------|
| E2E chưa cover API ShareController bot/human (Vercel rewrite) | Thấp | Unit append + live smoke trước đã cover; optional sau |
| `000019` admin analytics chưa apply prod | TB | Không block referral |
| Commit docs + `000020` + e2e | Thấp | Cần user bảo commit |
| SePay live smoke | P1 | Option còn lại sau gate này |

---

## 6. Ask Matt — làm gì tiếp?

```text
[DONE] Playwright referral capture gate PASS
   ↓
[CHỌN 1] Commit thay đổi (docs/migration/e2e)  XOR  SePay live smoke
```

**Default Matt:** commit hẹp (handover + `000020` + referral e2e + playwright env fix) nếu muốn giữ repo sync; hoặc **SePay** nếu ưu tiên thu tiền.

---

## 7. Prompt session mới

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập.

## Handoff
1. `docs/handover/session-2026-07-24-playwright-referral-capture.md` ← primary
2. `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md`

## Hiện trạng
- Redeem prod PASS (000018)
- Playwright referral-capture.spec.ts: 3 PASS
- Uncommitted: 000020, e2e, playwright OPS_ALERT fix, handover docs

## P1 chọn 1
- Commit hẹp (khuyến nghị nếu muốn sync)
- Hoặc SePay live smoke
```

---

## 8. Kết luận

| Câu hỏi | Trả lời |
|---------|---------|
| Chọn gì? | **Playwright referral capture harden** |
| Pre-check OK? | **Có** |
| Gate xanh? | **Có** (3/3) |
| Session | **CLOSE** — chờ commit hoặc SePay |
