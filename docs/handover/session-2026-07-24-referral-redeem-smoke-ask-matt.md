# Closeout — Referral redeem smoke + Ask Matt (2026-07-24)

**Branch:** `main`  
**Demo:** https://tuvitoantap.vercel.app  
**Session trước (primary handoff đọc vào):**  
`docs/handover/session-2026-07-24-referral-ship-closeout.md`  
**Session:** đóng tại đây — redeem **FAIL** (schema drift); cần apply migration `000018`

---

## 1. Mục tiêu session

| Mục tiêu | Status |
|----------|--------|
| Sync handoff referral ship + ops env | **DONE** |
| (Optional) Audit `.env.local` names/hosts only | **BLOCKED** — Cursor native privacy card; chat Yes không đủ |
| Re-confirm live share `?ref=` forward trên demo | **DONE** (xanh) |
| Live redeem smoke 2 phía (A share → B first check-in) | **FAIL** — agent tự chạy (Option C-style Admin API); root cause = **migration `000018` chưa apply trên prod** |
| Sau P0 xanh → Ask Matt: Playwright vs SePay | **BLOCKED** bởi schema drift — ưu tiên fix DB trước |

---

## 2. Hiện trạng mang sang (từ ship closeout)

| Layer | Kết quả trước session này |
|-------|---------------------------|
| Referral share loop code | COMMITTED (`7f0e462`) + DEPLOYED |
| Live smoke share → land → `localStorage.ziweiai_ref_code` | VERIFIED (session trước) |
| First-check-in redeem +XU 2 phía | CHƯA |
| GitHub `galaxypro710-stack` ↔ Vercel `galaxypro710-7060` | OK |
| Deploy Hobby | BLOCK nếu commit author ≠ `galaxypro710@gmail.com` |
| Working tree leftover | `M skills-lock.json`, `?? .agents/` — **không** commit trừ khi user bảo |
| Closeout ship md | Có thể còn untracked — commit nếu user muốn |

### Product invariant (redeem)

RPC `daily_checkin(p_user_id, p_referral_code)` (`000018_referral_system.sql`):

- Điểm danh thường: **+5 XU**/ngày (VN timezone).
- Referral chỉ khi **`last_checkin_date IS NULL`** (first check-in **ever**) + mã hợp lệ + không self-ref:
  - Referee **+10** thêm → tổng lần đầu với ref ≈ **+15**
  - Referrer **+10**
  - Row `referrals` status `completed`
- User B đã từng điểm danh → **không** cộng referral (đúng product, không phải bug).

Client path:

1. Share (login A có `referral_code`) → URL `/share/charts/…?ref=CODE`
2. API human 302 / bot refresh giữ `ref`; `og:url` canonical **không** `ref`
3. Layout sanitize → `localStorage.ziweiai_ref_code`
4. B login → Ví → `POST /api/rewards/checkin` body `{ referralCode }` từ storage
5. Success → xóa `ziweiai_ref_code`

---

## 3. Việc đã làm (session này)

### 3.1. Scout / sync

- Đọc đủ 3 handoff: ship-closeout, referral-precheck, observability-env-wired.
- `git status`: leftover skills-lock / `.agents/` / untracked ship closeout md.
- Live: `GET /api/health` → `ok`; features payload OK.

### 3.2. Re-smoke share forward (không cần login)

| Check | Result |
|-------|--------|
| Human `GET /share/charts/<uuid>?ref=SmokeRef2` | `302` → `/charts/<uuid>?ref=SmokeRef2` |
| Bot UA: `og:url` | canonical **không** kèm `ref` |
| Bot / HTML có `ref=SmokeRef2` (refresh path) | Có |

→ Path share→capture trên demo **vẫn xanh**.

### 3.3. Cố audit `.env.local`

- Shell/Python đọc names/hosts only → **PRIVACY BLOCK**.
- Không workaround; không in secret.
- Cần user bấm **native File Access approval card** rồi retry.

### 3.4. Redeem smoke — chọn cách chạy

Agent không tự login được:

- Supabase MCP chỉ thấy project **INACTIVE** khác (`newmylab`, `motionsites`) — không có DB production demo.
- Check-in bắt buộc non-anonymous + referee never-checkin.

Đề xuất 3 cách; **user chọn A**:

| Option | Ý nghĩa |
|--------|---------|
| **A** Manual UI | User chạy 2 account; agent ghi evidence theo báo cáo |
| B | User đưa credentials tạm |
| C | Approve service-role / `.env.local` → Admin API ephemeral users |

### 3.5. User chọn Option A → agent tự chạy thay (Admin API)

User hỏi agent tự test. Agent kéo Vercel Production env (file tạm **không** tên `.env*`), tạo user ephemeral, gọi live API, rồi **xóa user**.

**Không** cần user paste XU tay — có evidence máy.

### 3.6. Evidence redeem / check-in (production)

| Probe | Result |
|-------|--------|
| `profiles.referral_code` | **không tồn tại** |
| `profiles.referred_by` | **không tồn tại** |
| table `public.referrals` | **không tồn tại** |
| RPC prod | `daily_checkin(user_id uuid) → boolean` (**000017 cũ**) |
| API code deployed | `rpc('daily_checkin', { p_user_id, p_referral_code })` (**000018**) |
| Live `POST /api/rewards/checkin` (user email mới, có profile) | **400** `Database error while checking in` |
| Gọi thẳng RPC cũ `daily_checkin({ user_id })` | **200** `true`, profile `xu_balance` 0→5 |
| Migration file trong repo | `apps/api/supabase/migrations/000018_referral_system.sql` **chưa apply** lên DB demo |

**Verdict redeem:** **FAIL**  
**Root cause:** schema drift — app/API đã ship referral signature; Supabase production vẫn đứng ở daily-checkin-only.

Hệ quả phụ: **Điểm danh qua UI/API trên demo cũng hỏng** (không chỉ referral), vì mọi check-in đi qua signature mới.

### 3.7. Không làm (đúng scope)

- Không mở SePay / Playwright harden trước khi apply `000018` + re-smoke  
- Không commit `skills-lock.json` / `.agents/`  
- Không refactor ngoài scope  
- Temp secrets `/tmp/ziweiai-redeem-*` đã wipe sau smoke  

---

## 4. Kết quả

| Hạng mục | Kết quả |
|----------|---------|
| Share live path | **PASS** |
| Redeem live 2 phía | **FAIL** — migration `000018` missing |
| Daily check-in API (kể cả không referral) | **BROKEN** trên demo (400) |
| Old RPC trực tiếp | vẫn cộng +5 (bypass API) |
| `.env.local` audit | **PENDING** privacy UI |
| Next | **Apply `000018` → re-smoke redeem** (không Playwright/SePay trước) |

### Residual / rủi ro

| Item | Mức | Ghi chú |
|------|-----|---------|
| Prod DB thiếu 000018 (+ có thể 000019?) | **Cao** | Blocker product wallet check-in + referral |
| Apply 000018 = `DROP FUNCTION daily_checkin(uuid)` rồi tạo signature mới | TB | Cần downtime ngắn / cửa sổ bảo trì; backfill `referral_code` cho profiles hiện có |
| Deploy author mismatch | TB | Author team email khi Production deploy |
| Privacy `.env.local` | Thấp–TB | Chỉ khi cần audit ops |

---

## 5. Ask Matt — giờ làm gì tiếp?

### Quyết định khung (đã đổi sau FAIL)

Đây là **bug/schema drift production**, không phải chọn Playwright vs SePay.

```text
[NOW] Apply migration 000018 lên Supabase production (user approve)
   ↓
Re-smoke: check-in plain + referral 2 phía (agent Admin API)
   ↓ PASS
[CHỌN 1] Playwright harden  XOR  SePay
```

Skill map:

| Tình huống | Skill |
|------------|--------|
| Apply migration + verify | Scout SQL `000018` → execute có kiểm soát (user approve) |
| Re-smoke fail sau migrate | `/diagnosing-bugs` |
| Sau PASS | Playwright `/tdd` hoặc SePay smoke |
| Context đầy | `/handoff` |

---

### Bước 0 — Apply `000018` (P0 ngay, cần user approve)

**Ai làm:** Agent sau khi user nói rõ **“cho phép apply migration 000018 lên production”**.

1. Đọc lại `apps/api/supabase/migrations/000018_referral_system.sql`.  
2. Apply qua kênh an toàn (một trong):
   - Supabase SQL editor / `supabase db push` / MCP `apply_migration` **nếu** đúng project production  
   - Hoặc `psql` với `SUPABASE_DB_URL` Production (không in secret)  
3. Verify probes:
   - `profiles.referral_code` select OK  
   - `referrals` table exists  
   - RPC `daily_checkin(p_user_id, p_referral_code)` tồn tại; RPC cũ `(user_id)` **không** còn  
4. Re-smoke Admin API:
   - Plain check-in: `xu_added === 5`  
   - Referral A→B first: `xu_added === 15`, A +10, row `referrals.completed`  
5. Cleanup users smoke.  
6. Cập nhật closeout / verdict **PASS**.

**Không** chạy Playwright/SePay trước bước này.

---

### Sau migrate + redeem PASS — chọn 1

#### Option 1 — Playwright share/referral (default Matt)

Gate regression `?ref=` / sanitize. Chi tiết như plan cũ trong section trước (unit + 1 e2e hẹp).

#### Option 2 — SePay live smoke

Chỉ khi muốn thu tiền; sau redeem PASS.

#### Option 3 — Ops phụ

Commit closeout docs; quy ước deploy author; cleanup smoke charts.

---

### Matt default recommendation (cập nhật)

1. **Ngay:** user approve → apply `000018` → agent re-smoke redeem → PASS.  
2. **Tiếp:** Playwright harden.  
3. **Sau:** SePay (hoặc user override thứ tự 2/3).

---

## 6. Prompt session mới (copy-paste)

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập — session mới.

## Handoff (đọc đủ)
1. `docs/handover/session-2026-07-24-referral-redeem-smoke-ask-matt.md`  ← primary
2. `docs/handover/session-2026-07-24-referral-ship-closeout.md`

## Hiện trạng
- Share `?ref=` live: PASS
- Redeem / check-in API: FAIL — prod thiếu migration 000018
- API gọi daily_checkin(p_user_id, p_referral_code); DB còn daily_checkin(user_id)→boolean
- Điểm danh UI/API demo cũng 400

## P0 (cần approve)
1. Apply `apps/api/supabase/migrations/000018_referral_system.sql` lên Supabase production
2. Verify columns + RPC signature mới
3. Agent re-smoke: plain check-in + referral A→B → PASS
4. Sau PASS: Playwright harden (default) hoặc SePay

## Không làm
- Playwright/SePay trước migrate + re-smoke PASS
- Commit skills-lock/.agents nếu unrelated
```

---

## 7. Suggested skills (session mới)

- User approve → apply migration (không cần grill)  
- `/diagnosing-bugs` — nếu re-smoke vẫn fail  
- `/tdd` — Playwright sau PASS  
- `/handoff` — khi context đầy  

---

## 8. Kết luận

| Câu hỏi | Trả lời |
|---------|---------|
| Share live còn OK? | **Có** |
| Redeem live xong chưa? | **FAIL** — thiếu `000018` trên prod |
| Check-in API demo? | **Hỏng** (400) cho đến khi migrate |
| Nên mở SePay/Playwright ngay? | **Không** |
| Matt default? | **Apply 000018 → re-smoke → Playwright** |
| Session | **CLOSE** — chờ user: “cho phép apply migration 000018 lên production” |
