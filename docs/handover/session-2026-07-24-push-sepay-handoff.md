# Handoff — Push main + SePay live smoke (2026-07-24)

**Branch:** `main` @ `edb66fb` (local **ahead of origin**; push **FAILED** this session)  
**Demo:** https://tuvitoantap.vercel.app  
**Last deploy:** `dpl_5rzHgDnbD2ZNLSFeSQhnqtzTqneC` (wallet copy + referral uppercase already live)  
**Session role:** Close long referral arc; hand off push + SePay  
**Ask Matt:** User chose **push main + mở SePay** — next session executes that.

---

## Mục tiêu session tới

1. **Push `main` → `origin`** (blocked hôm nay bởi GitHub auth).  
2. **SePay live smoke** — xác nhận thu tiền / cộng XU trên demo (Option 2 Matt, CEO override).  
3. Fix bug thật nếu smoke đỏ; ghi closeout `docs/handover/…`.

**Không làm:** commit `skills-lock.json` / `.agents/`; không in secrets; không mở feature lớn ngoài SePay smoke.

---

## Hiện trạng (đã DONE — không làm lại)

### Referral growth loop — **DONE**

| Item | Status |
|------|--------|
| Share `?ref=` + capture + first-check-in redeem | Logic + workflow DONE |
| Prod migrate `000018` + `handle_new_user` | Redeem smoke PASS (session trước) |
| Uppercase sanitize | Committed + **live** (`?ref=ab12cd34` → `Location …ref=AB12CD34`) |
| Playwright referral-capture | 4 PASS |
| Final CEO pre-check | **DONE** — `docs/handover/session-2026-07-24-referral-final-precheck-done.md` |
| Wallet copy XU (+15 / +10) | Fixed + redeployed |

### Commits local chưa push (từ `7f0e462`…`edb66fb`, ~9 commits ahead)

Bao gồm referral share, deploy hooks/author empty commits, uppercase sanitize, handovers, wallet copy.

### Working tree leftover (cố ý bỏ ngoài)

- `M skills-lock.json`
- `?? .agents/`

---

## Blocker session này

| Blocker | Chi tiết | Cách mở |
|---------|----------|---------|
| **Push GitHub** | `git push` / `gh` fail: *not logged into any GitHub hosts* / HTTPS *Device not configured* | User chạy `gh auth login` (hoặc SSH remote + key), rồi `git push -u origin main` |
| **SePay** | Chưa mở — chỉ handoff | Session mới sau khi push (hoặc song song nếu auth xong sớm) |

---

## SePay — scope “hoàn thành” (smoke, không rebuild)

Code đã có sẵn:

| Path | Role |
|------|------|
| `apps/api/src/modules/payment/payment.controller.ts` | `POST /webhooks/sepay` (+ Bearer `SEPAY_WEBHOOK_SECRET`) |
| `apps/api/src/modules/payment/payment.service.ts` | Parse `TVTT <short_uuid>`, idempotency, RPC `add_xu` |
| `packages/contracts/src/payment/sepay.ts` | Webhook schema |
| `apps/web/.../wallet/+page.svelte` | QR `qr.sepay.vn` + `PUBLIC_SEPAY_ACCOUNT` / `PUBLIC_SEPAY_BANK` |
| `scripts/mock_sepay_webhook.ts` | Mock local (port hardcode `3005` — kiểm tra lại vs API thật) |
| `apps/api/supabase/migrations/000011_sepay-transactions-and-wallet.sql` | Ledger nền |

**Acceptance smoke (đề xuất):**

1. Env demo có `SEPAY_WEBHOOK_SECRET`, `PUBLIC_SEPAY_*` (không log giá trị).  
2. Login email → Ví → chọn gói → QR hiển thị đúng `des=TVTT <8-char>`.  
3. Webhook (mock an toàn **hoặc** chuyển khoản thật nhỏ) → `success` + XU tăng realtime.  
4. Replay cùng `id`/reference → **không** cộng đúp (idempotency).  
5. Request thiếu/sai Bearer → 401.

Ưu tiên mock webhook vào **demo URL** nếu CEO không muốn chuyển khoản thật; ghi rõ path đã dùng.

---

## Ask Matt routing (session mới)

```
[DONE] Referral arc + uppercase live
   ↓
[1] Push main (unblock auth trước)
   ↓
[2] SePay live smoke  ← /qa hoặc scout payment + mock/live webhook
   ↓ nếu đỏ
[/diagnosing-bugs] tight repro → fix → redeploy
   ↓
Closeout docs/handover
```

Không cần `/grill-with-docs` trừ khi CEO muốn đổi model thanh toán. Không `/wayfinder`.

---

## Suggested skills

| Skill | Khi nào |
|-------|---------|
| `ak-git` / shell push | Sau `gh auth login` |
| `qa` | Live SePay smoke checklist |
| `diagnosing-bugs` | Webhook/XU không cộng / double credit |
| `ak-ship` / `docs/agents/deploy.md` | Chỉ nếu phải redeploy sau fix |
| `ask-matt` | Nếu scope SePay phình ra (refund, multi-bank, …) |

---

## Copy-paste prompt — NEW session

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`.

## Handoff (đọc trước)
1. `docs/handover/session-2026-07-24-push-sepay-handoff.md` ← primary
2. `docs/handover/session-2026-07-24-referral-final-precheck-done.md` (referral DONE)
3. Root `AGENTS.md` + `docs/agents/deploy.md` nếu redeploy

## Hiện trạng
- Referral loop + uppercase sanitize: **DONE trên demo** (live `ab12cd34` → `AB12CD34`)
- Local `main` @ `edb66fb` **chưa push** — session trước fail: `gh` chưa login / HTTPS no credentials
- Leftover cố ý: `skills-lock.json`, `.agents/` — **không** commit
- SePay: code sẵn (webhook + QR Ví); **chưa** live smoke

## P0 session này (theo thứ tự)
1. Auth GitHub (`gh auth login` hoặc SSH) → `git push -u origin main` (không đẩy skills-lock/.agents)
2. SePay live smoke trên https://tuvitoantap.vercel.app:
   - Ví QR `TVTT <short_uuid>`
   - Webhook → cộng XU (mock an toàn hoặc transfer nhỏ)
   - Idempotency + 401 nếu sai secret
3. Fix bug nếu đỏ → redeploy (`pnpm deploy:vercel-demo`, author team email Hobby) → closeout docs

## Không làm
- Không đụng referral trừ regression blocker
- Không commit skills-lock / .agents
- Không in secrets (SEPAY_*, VERCEL_*, Supabase keys)

## Skills
- ask-matt (đã chọn: push + SePay)
- qa / diagnosing-bugs nếu smoke fail
```

---

## Session CLOSE (turn handoff)

| Item | Status |
|------|--------|
| Referral | **DONE** |
| Push main | **BLOCKED** (auth) |
| SePay | **NOT STARTED** — sẵn sàng session mới |
| Verdict handoff | **READY** — mở NEW session với prompt trên |
