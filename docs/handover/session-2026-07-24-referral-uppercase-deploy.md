# Closeout — Referral uppercase sanitize deploy (2026-07-24)

**Branch:** `main` (local; push chưa yêu cầu)  
**Demo:** https://tuvitoantap.vercel.app  
**Deployment:** `dpl_9joH2yx8hCJrM4gLp9go76wHaETR` → `build-lxwcwoihx-…`  
**Prior:** `docs/handover/session-2026-07-24-referral-session-closeout-handoff.md`

---

## Mục tiêu

Commit hẹp uppercase sanitize + e2e/000020/handovers → `pnpm deploy:vercel-demo` → live smoke Location `ref=AB12CD34`.

---

## Việc đã làm

| Step | Result |
|------|--------|
| Commit `d3e6144` | sanitize web/API + wallet/rewards, Playwright capture, OPS_ALERT e2e, `000020`, handovers |
| Deploy #1 | **BLOCKED** Hobby — author `ainear@users.noreply…` → status UNKNOWN |
| Empty commit `53b9e78` | `--author='galaxypro710-7060 <galaxypro710@gmail.com>'` (không đổi git config) |
| Deploy #2 | READY + alias `tuvitoantap.vercel.app` |
| Live smoke | PASS (xem dưới) |

**Không** stage: `skills-lock.json`, `.agents/`.  
**Không** SePay.

---

## Live smoke evidence

| Probe | Result |
|-------|--------|
| `GET /api/health` | `{"status":"ok",...}` |
| Human `?ref=ab12cd34` | `302` → `...?ref=AB12CD34` |
| Human `?ref=Ab12Cd34` | `302` → `...?ref=AB12CD34` |
| `/share/charts/…` rewrite | cùng Location uppercase |
| Bot UA: `og:url` | canonical **không** `ref` |
| Bot refresh / body link | **có** `ref=AB12CD34` |

---

## Commits

```
53b9e78 galaxypro710@gmail.com chore(deploy): empty commit with Vercel team author
d3e6144 ainear@…               fix(referral): uppercase sanitize so lowered ?ref= still redeems
```

---

## Residual

| Item | Notes |
|------|-------|
| Push remote | Chưa (user chưa bảo) |
| `skills-lock.json` / `.agents/` | Local leftover — cố ý bỏ ngoài |
| Deploy author Hobby | Mỗi Production deploy cần HEAD author team email hoặc empty commit như trên |
| SePay live smoke | P1 thu tiền — sẵn sàng nếu CEO mở |
| `000019` admin analytics | Chưa apply prod |

---

## Verdict

| Câu hỏi | Trả lời |
|---------|---------|
| Uppercase lên demo? | **Có** |
| Live `ab12cd34` → `AB12CD34`? | **Có** |
| SePay mở? | **Không** |
| Session | **DONE** |
| Next (default) | SePay live smoke **hoặc** push `main` nếu muốn sync remote |
