# Closeout — Referral share/redeem full pre-check (2026-07-24)

**Branch:** `main` (local fixes; **not** committed — user did not ask)  
**Demo:** https://tuvitoantap.vercel.app  
**Priors:**  
- `docs/handover/session-2026-07-24-playwright-referral-capture.md`  
- `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md`  
- `docs/handover/session-2026-07-24-referral-redeem-smoke-ask-matt.md`

---

## 0. Quyết định CEO / PM (tuân thủ)

| Quyết định | Status |
|------------|--------|
| **Không** mở SePay | Tuân thủ |
| **Không** commit trừ khi user bảo | Tuân thủ (không commit) |
| Pre-check full share/redeem sau 000018 + Playwright; fix bug thật; DONE nếu xanh | **DONE** (local gates xanh; 1 bug case-normalize đã fix) |

---

## 1. Pre-check (4 câu)

### 1. Logic đúng chưa?

**Có**, với một harden vừa sửa.

| Layer | Invariant | Verdict |
|-------|-----------|---------|
| Share URL | Login A → `/share/charts/:id?ref=CODE` từ `referral_code` DB | OK |
| API ShareController | Human 302 forward `?ref=`; bot `og:url` canonical **không** `ref`; refresh/body giữ `ref` | OK (live reconfirm) |
| Web capture | `(app)/+layout` sanitize → `localStorage.ziweiai_ref_code` | OK (+ uppercase normalize) |
| SPA share forward | `/share/charts/[id]` giữ `ref` khi replace → `/charts/:id` | OK |
| Check-in | Wallet body `{ referralCode }` từ storage; API → RPC `daily_checkin(p_user_id, p_referral_code)` | OK (+ sanitize API/wallet) |
| DB | First check-in ever + mã hợp lệ + không self → +15 referee / +10 referrer / `referrals.completed` | OK (session migrate PASS) |
| Signup | `000020` `handle_new_user` set `referral_code` | Repo file OK; prod đã apply session trước |

**Bug tìm thấy:** DB lưu `upper(md5 hex)` nhưng sanitize trước đây **giữ nguyên case**. Postgres so khớp case-sensitive → URL bị lowercasing (messenger/user) → redeem lặng thất bại; wallet vẫn xóa `ziweiai_ref_code` sau điểm danh +5 thành công.  
**Fix:** `sanitizeReferralCode` → `toUpperCase()` (web + API); wallet + `RewardsService` sanitize trước gửi/RPC.

### 2. Workflow ổn chưa?

**Có** (end-to-end product path).

1. A chia sẻ chart (có mã) → B mở share → land `/charts/…?ref=` → storage  
2. B đăng nhập email (non-anonymous) → Ví → Điểm danh lần đầu → redeem 2 phía  
3. Mã bẩn không ghi đè storage  
4. Điểm danh thường (không ref) +5/ngày VN timezone  

Live (không redeploy sau fix local):

| Probe | Result |
|-------|--------|
| `GET /api/health` | `ok` |
| Human `GET /share/charts/<uuid>?ref=Ab12Cd34` | `302` → `/charts/…?ref=Ab12Cd34` |
| Bot UA: `og:url` | canonical **không** `ref`; refresh/body có `ref` |

> Uppercase normalize **chưa** lên demo cho đến khi deploy commit chứa fix. Path share forward hiện tại vẫn xanh với mã đúng case từ DB.

### 3. Thiếu tính năng gì?

Không thiếu cho **growth loop share → capture → first-check-in redeem**.

Ngoài scope / residual (không block DONE):

| Item | Ghi chú |
|------|---------|
| SePay live smoke | P1 thu tiền — CEO cấm mở turn này |
| `000019` admin analytics | Chưa apply prod; không block referral |
| E2E API ShareController bot/human qua Vercel rewrite | Unit + live smoke đủ; optional |
| Deduplicate helper API/web | Drift risk thấp nếu sửa một bên |
| Deploy uppercase fix | Cần commit + `deploy:vercel-demo` (author Hobby) |

### 4. Rủi ro tiềm ẩn?

| Risk | Mức | Ghi chú |
|------|-----|--------|
| Fix uppercase chưa deploy demo | TB | Local xanh; live vẫn case-sensitive until ship |
| Deploy author Hobby mismatch | TB | Ops residual |
| Referral chỉ first check-in **ever** | Product | User đã điểm danh trước → không bonus (đúng spec) |
| Helper duplicate web/api | Thấp | Giữ sync khi sửa sanitize |
| `000019` chưa apply | TB | Admin only |
| Clear storage sau bất kỳ check-in success | Thấp | Đúng cleanup; nếu redeem fail do bug case → mất mã (đã mitigate bằng uppercase) |

---

## 2. Bugs found + fixed

| Bug | Fix | Files |
|-----|-----|-------|
| Case-sensitive redeem miss khi `ref` bị lowercasing | `sanitizeReferralCode` → uppercase; wallet + RewardsService sanitize | `apps/web/.../append-referral-query.ts`, `apps/api/.../append-referral-query.ts`, `wallet-model.svelte.ts`, `rewards.service.ts` + tests/e2e |

Không có bug khác trên path referral/share/checkin trong audit này.

---

## 3. Validation (actual)

```bash
pnpm -F @ziweiai/web exec vitest run src/lib/features/referral/append-referral-query.test.ts
# → 3 passed

pnpm -F @ziweiai/api exec vitest run src/modules/share/append-referral-query.test.ts src/modules/share/share.controller.public.test.ts
# → 6 passed (5 append + 1 public decorator)

pnpm -F @ziweiai/api exec tsc --noEmit -p tsconfig.json
# → exit 0

pnpm -F @ziweiai/web exec svelte-check --threshold error
# → 0 errors 0 warnings

OPS_ALERT_WEBHOOK_URL= pnpm -F @ziweiai/web exec playwright test referral-capture.spec.ts --workers=1
# → 4 passed (24.3s)
#   - /?ref=SmokeRef1 → storage SMOKEREF1
#   - /charts/:id?ref=Ab12Cd34 → storage AB12CD34 + giữ query
#   - /?ref=ab12cd34 → storage AB12CD34 (new)
#   - bad!code không ghi đè
```

Live smoke (evidence only; no secrets): health ok; share `?ref=` 302 + og:url canonical.

---

## 4. Files changed (this turn)

| Path | Change |
|------|--------|
| `apps/web/src/lib/features/referral/append-referral-query.ts` | uppercase sanitize |
| `apps/web/src/lib/features/referral/append-referral-query.test.ts` | expect uppercase |
| `apps/web/src/lib/features/payment/wallet-model.svelte.ts` | sanitize before check-in body |
| `apps/web/tests/e2e/referral-capture.spec.ts` | uppercase expectations + lowercase case |
| `apps/api/src/modules/share/append-referral-query.ts` | uppercase sanitize |
| `apps/api/src/modules/share/append-referral-query.test.ts` | expect uppercase |
| `apps/api/src/modules/rewards/rewards.service.ts` | sanitize before RPC |
| `docs/handover/session-2026-07-24-referral-precheck-final.md` | this closeout |

**Không** đụng: SePay, `skills-lock.json`, `.agents/`, commit.

Untracked leftover từ trước (ngoài scope commit turn này trừ khi user bảo): `000020_*.sql`, playwright OPS_ALERT fix, handover docs khác.

---

## 5. Ask Matt — làm gì tiếp?

```text
[DONE] Referral pre-check + case-normalize fix + gates xanh
   ↓
[CHỌN 1] Commit hẹp (migration 000020 + e2e + sanitize fix + handovers)
        rồi deploy:vercel-demo
   XOR  SePay live smoke (sau hoặc trước deploy fix — ưu tiên deploy fix nếu lo messenger lowercase)
```

**Default Matt:** commit hẹp + deploy demo để uppercase normalize lên production, rồi SePay nếu muốn thu tiền.

---

## 6. Verdict

| Câu hỏi | Trả lời |
|---------|---------|
| Logic đúng? | **Có** (sau uppercase fix) |
| Workflow ổn? | **Có** |
| Thiếu tính năng? | **Không** cho share/redeem loop |
| Rủi ro? | Deploy fix chưa lên demo; Hobby author; 000019; SePay chưa smoke |
| SePay mở? | **Không** |
| Commit? | **Không** (chưa được bảo) |
| Session | **DONE** |
