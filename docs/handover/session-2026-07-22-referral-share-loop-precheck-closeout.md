# Pre-check + Closeout — Referral viral loop (share chart)

**Ngày:** 2026-07-22  
**Branch:** `main` (thay đổi **chưa commit / chưa deploy**)  
**Demo hiện tại:** https://tuvitoantap.vercel.app — **chưa** có referral-on-share cho đến khi push + `pnpm deploy:vercel-demo`  
**Session:** dài — **đóng tại đây** sau pre-check

---

## 1. Mục tiêu session

| Mục tiêu | Status |
|----------|--------|
| Ops env P0 (`SENTRY_DSN` + Telegram webhook) wire + redeploy | **DONE** (trước trong session) |
| Matt chọn product A Referral (không SePay) | **DONE** |
| Đóng vòng viral: share chart mang `?ref=` → capture → check-in XU | **DONE** (code + pre-check) |
| Pre-check 4 câu + hotfix bugs | **DONE** |
| Commit / deploy live smoke referral | **Chưa** — để session mới |

---

## 2. Pre-check (4 câu)

### 2.1. Logic đúng chưa?

| Hạng mục | Đánh giá |
|----------|----------|
| Share URL gắn `?ref=` khi user login có `referral_code` | **Đúng** — `ChartDetailScreen.handleShare` + `appendReferralQuery` |
| Anonymous / chưa có code → share không `ref` | **Đúng** — không regress |
| API forward `ref` human 302 + bot refresh | **Đúng** — `ShareController` |
| `og:url` canonical không kèm `ref` | **Đúng** — tránh bẩn OG |
| Sanitize `[A-Za-z0-9]{4,16}` | **Đúng** — API + web helper |
| Layout capture → `ziweiai_ref_code` | **Đúng** (+ hotfix sanitize) |
| Redeem XU qua check-in / RPC cũ | **Không đổi** — tái dùng `daily_checkin` |

### 2.2. Workflow ổn chưa?

```text
User login (có referral_code)
  → Chart detail → Chia Sẻ
  → /share/charts/{id}?ref=CODE
  → (prod rewrite) API ShareController
  → 302 /charts/{id}?ref=CODE
  → (app) layout sanitize + localStorage
  → Sign-in (nếu anon) → Ví → Điểm danh lần đầu
  → RPC daily_checkin + referral → +10 XU hai phía
```

| Verify | Result |
|--------|--------|
| `vitest` API append-referral + public routes | PASS |
| `vitest` web append-referral | PASS |
| `pnpm -F @ziweiai/web check` | PASS (0 errors) |
| Live demo smoke referral-on-share | **Chưa** (chưa deploy) |

### 2.3. Thiếu tính năng gì?

| Item | Blocker? | Ghi chú |
|------|----------|---------|
| Commit + deploy demo | **Có** cho “live done” | Code local only |
| Live smoke 2 user (A share → B open → check-in) | P1 | Cần 2 account / 1 account fresh never-checkin |
| CTA copy rõ “kèm mã giới thiệu” | Không | UX polish |
| Chart share từ nơi khác ngoài ChartDetailScreen | Không | Chỉ 1 entry Chia Sẻ |
| Fraud / rate-limit referral | Out of scope | Đã ghi residual |
| SePay live | Product khác | Matt Option B — sau |

**Kết luận gap:** Feature code **complete** trong phạm vi plan. “Done trên demo public” cần **commit + deploy + smoke**.

### 2.4. Rủi ro tiềm ẩn

| Rủi ro | Mức | Ghi chú |
|--------|-----|---------|
| Redeem chỉ **first check-in ever** | Trung bình (product) | User đã điểm danh trước đó không nhận referral — đúng RPC cũ |
| Profile mới thiếu `referral_code` | Thấp–TB | Migration backfill cũ; insert mới nếu omit code → share không ref |
| Helper duplicate API/web | Thấp | Cố ý surgical; drift nếu sửa một bên |
| Chưa deploy | Trung bình | Demo chưa có behavior mới |
| Vercel rewrite `/share` | Thấp | Query string mặc định được giữ |

### 2.5. Bugs pre-check → đã fix

| Bug | Fix | Status |
|-----|-----|--------|
| Race: tap Chia Sẻ khi wallet query chưa load → mất `ref` | Fallback `supabase.profiles.select('referral_code')` trong `handleShare` | Fixed |
| Layout lưu mọi `ref` thô vào localStorage | `sanitizeReferralCode` trước `setItem` | Fixed |
| `req.query.ref` có thể `string[]` → drop silent | Unwrap `ref[0]` trước `appendReferralQuery` | Fixed |

Không còn bug blocker trong phạm vi plan.

---

## 3. Việc đã làm (toàn session)

### Ops (đầu session)

- Confirm thiếu env → lấy `TELEBOT_*` + `SENTRY_JOKER` từ `.env.local`
- Tạo Sentry project `tuvitoantap-api`, set Production `SENTRY_DSN` + `OPS_ALERT_WEBHOOK_URL`
- Redeploy demo; Telegram/Sentry channel smoke OK
- Doc: `docs/handover/session-2026-07-22-observability-env-wired.md`

### Referral (Matt A)

| File | Việc |
|------|------|
| `apps/api/.../append-referral-query.ts` (+ test) | Sanitize + append `ref` |
| `apps/api/.../share.controller.ts` | Forward `ref` 302/refresh; `og:url` canonical |
| `apps/web/.../referral/append-referral-query.ts` (+ test) | Helper web |
| `ChartDetailScreen.svelte` | Share URL + `ref`; fetch fallback race |
| `share/charts/[chartId]/+page.svelte` | Local replace forward `ref` |
| `(app)/+layout.svelte` | Capture sanitize |

### Pre-check

- Rà 4 câu; hotfix 3 bugs; gate unit + svelte-check lại PASS

---

## 4. Kết quả

| Layer | Kết quả |
|-------|---------|
| Observability Production env | **DONE** (đã trên Vercel) |
| Referral share loop code | **DONE** + pre-check |
| Demo live referral-on-share | **NOT YET** — cần commit/deploy |
| Session | **CLOSE** — handoff session mới |

Working tree (referral-related, chưa commit):

- `apps/api/src/modules/share/append-referral-query.ts`
- `apps/api/src/modules/share/append-referral-query.test.ts`
- `apps/api/src/modules/share/share.controller.ts`
- `apps/web/src/lib/features/referral/*`
- `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`
- `apps/web/src/routes/(app)/share/charts/[chartId]/+page.svelte`
- `apps/web/src/routes/(app)/+layout.svelte`
- (+ có thể lẫn `.gitignore` / `skills-lock.json` / docs ops — **review trước commit**)

---

## 5. Matt — làm gì tiếp? (session mới)

**P0 ship**

1. Review `git status` — chỉ stage file referral (+ handover docs); tránh commit nhầm `skills-lock.json` nếu không liên quan
2. Commit + `pnpm deploy:vercel-demo`
3. Live smoke tối thiểu:
   - Login user A → mở chart → Chia Sẻ → URL có `?ref=`
   - Browser ẩn danh / user B mở link → `/charts/...?ref=` → DevTools localStorage `ziweiai_ref_code`
   - User B (chưa từng check-in) đăng nhập → Ví → Điểm danh → +XU referral

**P1 product (chọn 1, không song song)**

| Option | Khi nào |
|--------|---------|
| **B SePay live smoke** | Muốn thu tiền |
| Harden Playwright share/referral | Muốn regression gate |
| Cleanup smoke charts Phase 11 | Giữ Supabase sạch |

---

## 6. Prompt session mới (copy-paste)

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập — session mới (session trước dài, đã closeout).

## Handoff (đọc đủ)
1. `docs/handover/session-2026-07-22-referral-share-loop-precheck-closeout.md`
2. `docs/handover/session-2026-07-22-observability-env-wired.md` (ops đã wire)
3. (nếu đụng share) `docs/handover/session-2026-07-22-phase11-precheck-complete.md`

## Hiện trạng
- Observability P0 env: DONE trên Vercel Production
- Referral share loop: CODE + pre-check DONE trên working tree
- **Chưa** chắc đã commit/deploy — kiểm `git status` lúc mở session

## P0 session này
1. Review + commit chỉ file referral/handover (không nhầm skills-lock nếu unrelated)
2. `pnpm deploy:vercel-demo`
3. Live smoke: share URL có `?ref=` → land chart giữ ref → localStorage → check-in redeem (nếu referee chưa từng check-in)
4. Sau P0 xanh — hỏi user: SePay (B) hay harden Playwright share/referral

## Không làm
- Không mở SePay trước khi referral live smoke xong (trừ user override)
- Không refactor ngoài scope
```

---

## 7. Kết luận pre-check

| Câu hỏi | Trả lời |
|---------|---------|
| Logic đúng? | **Có** (+ 3 hotfix) |
| Workflow ổn? | **Có** (code path); live phụ thuộc deploy |
| Thiếu feature? | Commit/deploy/live smoke — không blocker “code complete” |
| Rủi ro? | Residual documented; không blocker |
| Done? | **DONE** referral plan + pre-check. **Session đóng.** Ship demo = owner session mới. |
