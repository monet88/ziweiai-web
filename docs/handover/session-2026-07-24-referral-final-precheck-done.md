# Closeout — Referral loop final pre-check (CEO/PM) — 2026-07-24

**Branch:** `main`  
**Demo:** https://tuvitoantap.vercel.app  
**Role:** CEO/PM final pre-check after uppercase sanitize deploy  
**Priors:**

| Doc | Arc |
|-----|-----|
| `docs/handover/session-2026-07-24-referral-uppercase-deploy.md` | Deploy uppercase + live Location PASS |
| `docs/handover/session-2026-07-24-referral-session-closeout-handoff.md` | Pre-deploy closeout |
| `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md` | Prod 000018 + redeem smoke PASS |

---

## Mục tiêu

1. Pre-check vòng **share → capture → first-check-in redeem** sau khi uppercase đã lên demo.  
2. Trả lời 4 câu: Logic / Workflow / Thiếu tính năng / Rủi ro.  
3. Fix bug thật nếu tìm thấy.  
4. Verdict **DONE** hoặc **NOT DONE**.

**Ngoài scope:** SePay (không mở trừ CEO override); không commit `skills-lock` / `.agents`.

---

## 4 câu pre-check

### 1. Logic đúng chưa?

**Có.**

| Layer | Invariant | Evidence |
|-------|-----------|----------|
| DB | `referral_code = upper(substr(md5…))`; redeem so khớp case-sensitive | `000018` + redeem smoke session trước PASS |
| Signup | `handle_new_user` set `referral_code` | Prod patched; repo `000020` |
| Share API | Human 302 forward `ref` đã **uppercase**; bot `og:url` canonical **không** `ref` | Live re-probe session này |
| Web capture | `(app)/+layout` sanitize → `localStorage.ziweiai_ref_code` UPPER | Playwright 4/4 |
| SPA `/share/charts/:id` | `appendReferralQuery` giữ/upper `ref` khi replace | Code audit |
| Chart share button | Mã từ profile/wallet → `appendReferralQuery` (sanitize) | Code audit |
| Check-in | Wallet sanitize body; API `RewardsService` sanitize trước RPC | Code audit |
| Redeem | First check-in **ever** + mã hợp lệ + không self → referee +15 / referrer +10 | SQL `000018` |

**Bug case-normalize (messenger lowercase):** đã ship + live `?ref=ab12cd34` → `Location: …?ref=AB12CD34`.

### 2. Workflow ổn chưa?

**Có.**

1. A (login, có mã) chia sẻ chart / link Ví `?ref=CODE`  
2. B mở share → land `/charts/…?ref=AB12CD34` (hoặc `/`) → storage UPPER  
3. B đăng nhập email (non-anonymous) → Ví → Điểm danh **lần đầu ever** → redeem 2 phía  
4. Mã bẩn không ghi đè storage  
5. Điểm danh thường (không ref / đã từng điểm danh) +5/ngày (timezone VN)

Gates session này:

| Gate | Result |
|------|--------|
| Web referral vitest | 3 passed |
| API share tests | 6 passed |
| Playwright `referral-capture.spec.ts` | 4 passed (~23s) |
| Live health | ok |
| Live human `?ref=ab12cd34` | `302` → `ref=AB12CD34` |
| Live bot `og:url` | canonical không `ref`; refresh có `ref=AB12CD34` |

### 3. Thiếu tính năng gì?

**Không thiếu** cho growth loop share → capture → first-check-in redeem.

Ngoài scope (không block DONE):

| Item | Ghi chú |
|------|---------|
| SePay live smoke | P1 thu tiền — cố ý chưa mở |
| `000019` admin analytics | Chưa apply prod |
| Deduplicate sanitize helper web/api | Drift risk thấp |
| Push `main` lên remote | Chưa được yêu cầu |
| E2E full redeem 2 phía trên demo | Đã PASS session migrate; không cần lặp mỗi pre-check |

### 4. Rủi ro tiềm ẩn?

| Risk | Mức | Ghi chú |
|------|-----|--------|
| Deploy Hobby author mismatch | TB | HEAD commit author phải là team email hoặc empty commit `galaxypro710@gmail.com` |
| Unpushed local commits | TB | Máy khác / crash → mất sync remote |
| `skills-lock` / `.agents` leftover | Thấp | Cố ý không commit |
| Referral chỉ first check-in **ever** | Product | Dễ hiểu nhầm “mỗi lần” — copy Ví đã làm rõ hơn |
| Clear storage sau mọi check-in success | Thấp | Đúng cleanup; uppercase đã mitigate miss case |
| `000019` chưa apply | TB | Admin only |

---

## Bugs found + fixed (turn này)

| Bug | Severity | Fix |
|-----|----------|-----|
| Copy Ví: “cả hai đều nhận 10 XU” sai với RPC (referee **+15**, referrer **+10**) | UX / trust | Sửa copy trong `apps/web/src/routes/(app)/wallet/+page.svelte` |

Không tìm thấy bug logic mới trên path share/capture/check-in/redeem sau uppercase deploy.

---

## Việc đã làm (turn này)

1. Audit code path: sanitize (web+API), layout capture, SPA share, ChartDetail share, wallet check-in, ShareController, RPC `000018`.  
2. Re-run unit + Playwright referral-capture.  
3. Re-probe live demo (health + 302 uppercase + bot og).  
4. Fix copy XU trên trang Ví.  
5. Ghi closeout này.

---

## Kết quả / Verdict

| Câu hỏi | Trả lời |
|---------|---------|
| Logic đúng? | **Có** (local + live uppercase) |
| Workflow ổn? | **Có** |
| Thiếu tính năng (share/redeem loop)? | **Không** |
| Rủi ro? | Hobby author; unpushed; SePay/000019 ngoài scope |
| Bugs mới? | 1 copy UX — **đã fix** |
| SePay mở? | **Không** |
| Verdict | **DONE** |

### Tóm tắt một dòng

Referral growth loop (share → capture → first-check-in redeem) **hoàn thành** trên demo với uppercase normalize live; gates xanh; chỉ còn residual ops (push, Hobby author, SePay khi CEO muốn thu tiền).

---

## Ship trong cùng turn (sau pre-check)

| Step | Result |
|------|--------|
| Commit `a77f8e7` | Copy Ví + closeout (author team) |
| `pnpm deploy:vercel-demo` | `dpl_5rzHgDnbD2ZNLSFeSQhnqtzTqneC` READY |
| Live re-smoke | health ok; `?ref=ab12cd34` → `ref=AB12CD34` |

## Next (khuyến nghị CEO)

1. **Default:** Push `main` remote để sync (nếu muốn).  
2. **Sau đó:** SePay live smoke nếu ưu tiên thu tiền.  
3. Giữ quy ước deploy author team email (Hobby).
