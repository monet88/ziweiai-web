# Closeout — Apply 000018 + redeem PASS (2026-07-24)

**Branch:** `main` (local migration file `000020` added; not necessarily committed)  
**Demo:** https://tuvitoantap.vercel.app  
**Supabase prod:** `nachzhkeuzwiqmbtelrp` (`galatuvi`, ACTIVE_HEALTHY)  
**Primary prior:** `docs/handover/session-2026-07-24-referral-redeem-smoke-ask-matt.md`

---

## 1. Quyết định CEO / PM

**Chọn: Apply migration `000018` lên production ngay + patch `handle_new_user` + re-smoke.**

| Không chọn | Lý do |
|------------|--------|
| Rollback API về RPC cũ `(user_id)→boolean` | Mất referral; ship code đã đi theo signature mới; chỉ trì hoãn |
| Chỉ hotfix API map `user_id` tạm | Referral vẫn không chạy; dual-path nợ kỹ thuật |
| Playwright / SePay trước | Verify sai mục tiêu khi DB còn drift |
| Chờ user manual UI | Agent đã chứng minh bằng Admin API nhanh hơn, đủ evidence |

**Vì sao đây là lựa chọn đúng**

1. **Root cause đã chứng minh:** app deploy gọi `daily_checkin(p_user_id, p_referral_code)`; prod còn `daily_checkin(user_id)→boolean` → mọi Điểm danh API **400**.  
2. **Blast radius cao, fix hẹp:** một migration đã có trong repo; không cần redesign.  
3. **Demo public đang gãy wallet habit-loop** — ưu tiên ổn định core trước growth gate / payment.  
4. **Pre-check bắt buộc thêm:** trigger `handle_new_user()` insert profile **không** có `referral_code` → sau `NOT NULL` sẽ gãy signup; phải patch cùng lúc.

---

## 2. Pre-check (trước apply)

| Check | Result |
|-------|--------|
| Project khớp Vercel Production | `nachzhkeuzwiqmbtelrp` / `galatuvi` |
| `profiles` count | 15 |
| RPC trước | `daily_checkin(user_id uuid) → boolean` |
| `referral_code` / `referrals` | thiếu |
| Trigger `on_auth_user_created` → `handle_new_user()` | insert `(user_id, display_name)` only — **risk** |
| Migration `000019` (admin analytics) | chưa apply — **không** block check-in; để residual |

**Pre-check: OK để apply** (kèm patch trigger).

---

## 3. Việc đã làm

1. Apply `000018_referral_system.sql` qua Supabase Management SQL API (transaction).  
2. Patch `handle_new_user()` set `referral_code` on signup.  
3. `GRANT EXECUTE` signature mới cho `service_role` + `authenticated`.  
4. Verify schema: columns + `referrals` + RPC args `p_user_id uuid, p_referral_code text` → `integer`.  
5. Backfill: 15/15 profiles có `referral_code`, 0 null.  
6. Ghi ledger `supabase_migrations.schema_migrations`: `000018` (trước đó remote dừng ở `000017`).  
7. Thêm file repo `apps/api/supabase/migrations/000020_handle_new_user_referral_code.sql` + ledger `000020` trên prod.  
8. Re-smoke ephemeral users (cleanup sau).  
9. Wipe temp Vercel env files.

**Không** làm: SePay, Playwright harden, commit skills-lock/`.agents`.

---

## 4. Kết quả smoke

| Case | Evidence | Verdict |
|------|----------|---------|
| Plain check-in | HTTP 201, `xu_added: 5`, balance 0→5 | **PASS** |
| Referral A→B (first check-in) | HTTP 201, `xu_added: 15`, A +10, B +15, `referred_by` = ref, `referrals.status=completed` | **PASS** |
| Overall | | **PASS** |

Share `?ref=` path (session trước) vẫn PASS; giờ redeem DB path cũng PASS.

---

## 5. Residual

| Item | Mức | Ghi chú |
|------|-----|---------|
| `000019` admin analytics chưa apply | TB | Không block check-in/referral; apply khi đụng admin dashboard |
| Deploy author Hobby mismatch | TB | Author team email khi `deploy:vercel-demo` |
| Commit `000020` + closeout docs | Thấp | Cần user bảo commit |
| Playwright share/referral gate | P1 | Matt default sau PASS |
| SePay live smoke | P1 | Sau Playwright hoặc override thu tiền |
| Helper duplicate API/web referral sanitize | Thấp | Drift nếu sửa một bên |

---

## 6. Ask Matt — làm gì tiếp?

```text
[DONE] 000018 + trigger patch + redeem PASS
   ↓
[CHỌN 1] Playwright share/referral harden  XOR  SePay live smoke
```

**Default Matt:** Playwright harden (khóa regression share/`?ref=` vừa ship).  
**SePay** nếu ưu tiên thu tiền (user override OK vì P0 redeem đã xanh).

---

## 7. Prompt session mới

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập.

## Handoff
1. `docs/handover/session-2026-07-24-referral-migrate-redeem-pass.md` ← primary
2. `docs/handover/session-2026-07-24-referral-redeem-smoke-ask-matt.md`

## Hiện trạng
- Prod apply 000018 + handle_new_user patch + ledger 000018/000020
- Plain check-in + referral redeem: PASS
- Repo có file mới: `000020_handle_new_user_referral_code.sql` (chưa chắc đã commit)
- 000019 admin analytics: chưa apply

## P1 (chọn 1)
- Default: Playwright share/referral harden
- Hoặc SePay live smoke

## Không làm
- Không re-open migrate trừ khi regression
- Không commit skills-lock/.agents unrelated
```

---

## 8. Kết luận

| Câu hỏi | Trả lời |
|---------|---------|
| Chọn giải pháp nào? | **Apply 000018 + patch signup trigger** |
| Pre-check OK? | **Có** |
| Redeem PASS? | **Có** |
| Check-in API demo hết 400? | **Có** (smoke 201 success) |
| Session | **CLOSE** — chờ chọn P1 hoặc commit docs/migration |
