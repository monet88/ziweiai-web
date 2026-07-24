# Closeout + Handoff — Referral session arc (2026-07-24)

**Branch:** `main` (local uncommitted fixes + docs; **not** committed — user did not ask)  
**Demo:** https://tuvitoantap.vercel.app  
**Session role:** Implementation / PM closeout after uppercase sanitize fix  
**Priors (same day):**

| Doc | Arc step |
|-----|----------|
| `docs/handover/session-2026-07-24-referral-ship-closeout.md` | Ship share `?ref=` + deploy demo |
| `docs/handover/session-2026-07-24-referral-redeem-smoke-ask-matt.md` | Redeem smoke blocked by DB RPC drift |
| `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md` | Apply `000018` + `handle_new_user` + redeem PASS |
| `docs/handover/session-2026-07-24-playwright-referral-capture.md` | Playwright capture gate |
| `docs/handover/session-2026-07-24-referral-precheck-final.md` | Full pre-check + **uppercase sanitize fix** |
| **This file** | Final pre-check reconfirm + session CLOSE |

---

## Mục tiêu

1. Surgical pre-check lại vòng **share → capture → check-in redeem** sau fix `toUpperCase()`.
2. Chỉ sửa bug **mới** nếu tìm thấy (không mở SePay / feature lớn).
3. Viết closeout + handoff đầy đủ; verdict **DONE** hoặc **NOT DONE**.
4. Đưa **một** khuyến nghị CEO cho session kế tiếp + prompt copy-paste.

**Tuân thủ CEO/PM:** không SePay; không commit; không đụng `skills-lock` / `.agents`.

---

## Việc đã làm (toàn arc referral trong ngày)

| Step | Kết quả |
|------|---------|
| **Ship** share loop | Commit `7f0e462` — `?ref=` trên chart share; API human 302 forward; bot `og:url` canonical không `ref`; web layout capture `ziweiai_ref_code`; SPA `/share/charts/:id` giữ ref |
| **Migrate + redeem** | Prod apply `000018`; patch `handle_new_user` → `referral_code`; ledger `000018`/`000020`; smoke plain +15/+10 referral **PASS** |
| **Playwright** | `referral-capture.spec.ts` + `OPS_ALERT_WEBHOOK_URL=''` trong config để API e2e boot |
| **Case-fix** | `sanitizeReferralCode` → `toUpperCase()` (web + API); wallet + `RewardsService` sanitize trước body/RPC; tests/e2e cập nhật |
| **Final pre-check (turn này)** | Re-audit path; **không** tìm bug mới; re-run unit + Playwright; live health + share 302 (demo **chưa** có uppercase) |

---

## Kết quả / 4 pre-check answers

### 1. Logic đúng chưa?

**Có** (local sau uppercase fix).

| Layer | Invariant | Verdict |
|-------|-----------|---------|
| DB | `referral_code = upper(substr(md5(...),1,8))`; redeem so khớp case-sensitive | OK |
| Share URL | Login A → append safe `?ref=CODE` từ profile | OK |
| API ShareController | Human 302 giữ/forward `ref`; bot `og:url` canonical **không** `ref`; refresh/body có `ref` | OK (live reconfirm) |
| Web capture | `(app)/+layout` sanitize → `localStorage.ziweiai_ref_code` (uppercase) | OK local |
| SPA share | `/share/charts/[id]` → `appendReferralQuery` → `/charts/:id?ref=` | OK |
| Check-in | Wallet body `{ referralCode }` sanitized; API `daily_checkin(p_user_id, p_referral_code)` sanitized | OK local |
| Redeem | First check-in ever + mã hợp lệ + không self → referee +15 / referrer +10 / `referrals.completed` | OK (migrate session smoke) |

### 2. Workflow ổn chưa?

**Có** (product path end-to-end).

1. A chia sẻ chart (có mã) → B mở share → land `/charts/…?ref=` → storage  
2. B đăng nhập email (non-anonymous) → Ví → Điểm danh **lần đầu ever** → redeem 2 phía  
3. Mã bẩn không ghi đè storage  
4. Điểm danh thường (không ref / đã từng điểm danh) +5/ngày VN timezone  

**Demo live (chưa redeploy sau uppercase):** path share forward vẫn xanh với mã **đúng case** từ DB; lowercase từ messenger vẫn risk trên prod cho đến khi deploy fix.

### 3. Thiếu tính năng gì?

**Không thiếu** cho growth loop share → capture → first-check-in redeem.

Ngoài scope (không block DONE):

| Item | Ghi chú |
|------|---------|
| SePay live smoke | P1 thu tiền — **cấm** turn này |
| `000019` admin analytics | Chưa apply prod; không block referral |
| E2E API ShareController qua Vercel rewrite | Unit + live curl đủ |
| Deduplicate sanitize helper web/api | Drift risk thấp |

### 4. Rủi ro tiềm ẩn?

| Risk | Mức | Ghi chú |
|------|-----|--------|
| **Uppercase fix chưa deploy demo** | **TB–Cao** | Live `?ref=ab12cd34` → Location vẫn `ref=ab12cd34` (không upper); redeem case-sensitive → silent miss + storage bị clear sau check-in +5 |
| Uncommitted local (sanitize, e2e, `000020`, handovers) | TB | Mất sync nếu máy khác / crash trước commit |
| Deploy author Hobby mismatch | TB | Ops residual khi `deploy:vercel-demo` |
| Referral chỉ first check-in **ever** | Product | Đúng spec; dễ hiểu nhầm là “mỗi lần” |
| Helper duplicate web/api | Thấp | Giữ sync khi sửa sanitize |
| `000019` chưa apply | TB | Admin only |

---

## Bugs fixed

**Turn này:** không có bug mới.

| Prior (cùng ngày, đã có trong working tree) | Status |
|---------------------------------------------|--------|
| Case-sensitive redeem miss khi `ref` bị lowercasing | Fixed local; **chưa** trên demo |

Không sửa file product trong turn closeout này — chỉ xác nhận + tài liệu.

---

## Validation evidence (actual, turn này)

```bash
pnpm -F @ziweiai/web exec vitest run src/lib/features/referral/
# → Test Files 1 passed | Tests 3 passed

pnpm -F @ziweiai/api exec vitest run \
  src/modules/share/append-referral-query.test.ts \
  src/modules/share/share.controller.public.test.ts
# → Test Files 2 passed | Tests 6 passed

OPS_ALERT_WEBHOOK_URL= pnpm -F @ziweiai/web exec playwright test referral-capture.spec.ts --workers=1
# → 4 passed (22.0s)
#   1. /?ref=SmokeRef1 → storage SMOKEREF1
#   2. /charts/:id?ref=Ab12Cd34 → storage AB12CD34
#   3. /?ref=ab12cd34 → storage AB12CD34
#   4. bad!code không ghi đè KeepMeOK1
```

### Live (demo — residual uppercase)

| Probe | Result |
|-------|--------|
| `GET /api/health` | `{"status":"ok",...}` |
| Human `GET /api/share/charts/<uuid>?ref=Ab12Cd34` | `302` → `.../charts/...?ref=Ab12Cd34` |
| Human `?ref=ab12cd34` | `302` → `...?ref=ab12cd34` (**chưa** uppercase — fix chưa deploy) |
| Bot UA: `og:url` | canonical **không** `ref`; refresh URL có `ref` |

---

## Residual / risks

1. **Ship uppercase normalize lên demo** (commit hẹp + `pnpm deploy:vercel-demo`) — residual quan trọng nhất.  
2. Uncommitted: sanitize web/api, wallet/rewards sanitize, playwright config, `referral-capture.spec.ts`, `000020_*.sql`, handover docs.  
3. **Không** commit: `skills-lock.json`, `.agents/`.  
4. `000019` admin analytics chưa apply.  
5. SePay chưa live smoke (cố ý để session sau).

---

## CEO recommendation for NEXT session

**Chọn 1 (default): Deploy uppercase fix**

**Lý do:** Local gates xanh; prod DB so khớp case-sensitive với mã `UPPER`; demo vẫn forward lowercase nguyên xi → messenger/OS lowercasing làm redeem lặng thất bại và clear `ziweiai_ref_code`. Đây là rủi ro thật trên growth loop vừa ship, rẻ hơn SePay, và cần commit trước deploy.

Thứ tự trong session mới:

1. Commit hẹp (sanitize + tests/e2e + `000020` + handover docs; **không** `skills-lock`/`.agents`)  
2. `pnpm deploy:vercel-demo`  
3. Live re-probe: `?ref=ab12cd34` Location phải là `ref=AB12CD34`  
4. Chỉ sau đó mới cân nhắc SePay nếu CEO muốn thu tiền

**Không** chọn SePay làm default turn tới (session dài; residual referral chưa đóng trên demo).  
**Không** chỉ “commit docs” mà không deploy — chưa đóng rủi ro live.

---

## Copy-paste prompt for new session

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`.

## Handoff (đọc trước)
1. `docs/handover/session-2026-07-24-referral-session-closeout-handoff.md` ← primary
2. `docs/handover/session-2026-07-24-referral-precheck-final.md` (uppercase fix detail)
3. Root `AGENTS.md`

## Hiện trạng
- Referral loop (share → capture → first-check-in redeem): logic + workflow DONE local
- Prod migrate 000018 + handle_new_user: redeem smoke PASS (session trước)
- Uppercase sanitize fix: **local only**, chưa commit, chưa deploy
- Live demo vẫn `302` giữ case gốc (`ref=ab12cd34` không upper)
- Playwright referral-capture: 4 PASS; web referral vitest 3; API share tests 6
- Uncommitted: sanitize web/api + wallet/rewards, playwright OPS_ALERT, referral-capture.spec.ts, 000020 SQL, handover docs
- Không stage: skills-lock.json, .agents/

## P0 session này (một việc)
Commit hẹp referral/sanitize/e2e/000020/handovers → `pnpm deploy:vercel-demo` → live smoke:
- health ok
- share `?ref=ab12cd34` Location phải `ref=AB12CD34`
- (optional) human/bot og:url canonical không ref

## Không làm
- Không mở SePay trừ khi CEO override sau khi deploy fix xong
- Không commit skills-lock / .agents
- Không in secrets

## Skills gợi ý
- ak-ship / deploy docs trong `docs/agents/deploy.md`
- code-review (diff hẹp trước commit)
- qa (live smoke sau deploy)
```

---

## Suggested skills

| Skill | Khi nào |
|-------|---------|
| `ak-ship` / repo deploy docs | Commit + `deploy:vercel-demo` |
| `code-review` | Review diff sanitize/e2e trước commit |
| `qa` | Live smoke sau deploy |
| `ask-matt` | Nếu CEO muốn đổi sang SePay trước deploy fix |

---

## Session CLOSE

| Câu hỏi | Trả lời |
|---------|---------|
| Logic đúng? | **Có** (local) |
| Workflow ổn? | **Có** |
| Thiếu tính năng (share/redeem)? | **Không** |
| Rủi ro? | Uppercase **chưa** trên demo; uncommitted; Hobby deploy; 000019; SePay chưa |
| Bugs mới turn này? | **Không** |
| SePay mở? | **Không** |
| Commit? | **Không** (chưa được bảo) |
| Verdict | **DONE** |
| Next | **Deploy uppercase fix** (commit hẹp + `deploy:vercel-demo`) — mở **NEW session** với prompt trên |
