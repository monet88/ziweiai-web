# Incident report: Supabase PAT leak via `ziweiai-demo.zip`

**Date:** 2026-07-24  
**Repo:** `galaxypro710-stack/ziweiai-web` (only — **not** `monet88`)  
**Severity:** High (account-level Personal Access Token exposed on public GitHub)  
**Status:** Contained and hardened — see pre-check below

---

## 1. Mục tiêu

1. Chặn lộ tiếp secret (repo public → private).
2. Gỡ artifact chứa secret khỏi tree **và** git history.
3. Siết `.gitignore` + pre-commit để **không tái phạm**.
4. Làm việc chỉ trên account/repo **`galaxypro710-stack`**, không push/sync `monet88`.
5. Giữ `.agents/skills` (và workflows/rules) **trackable**; ignore junk AI (`.claude`, `.gemini`, `.agents/logs|cache|tmp`).

---

## 2. Nguyên nhân gốc (root cause)

Đây **không** phải lỗi runtime Supabase app, cũng không phải “token cũ tự hỏng”.

| Yếu tố | Chi tiết |
|---|---|
| Trigger | Commit `e13c327` (2026-07-20) thêm `ziweiai-demo.zip` (~67MB) lên GitHub **public** |
| Nội dung zip | Gói nhầm `.env.local`, `.env.vercel`, `.env.vercel.prod`, `temp-envs/*` |
| Secret bị quét | Supabase PAT tên `nh`, prefix `sbp_f618…` (`SUPABASE_ACCESS_TOKEN`) |
| Hành động của Supabase | Revoke PAT vì bot phát hiện token còn valid trên GitHub |
| Hệ quả | CLI/`supabase` dùng PAT đó sẽ auth fail; **không** đồng nghĩa anon/service-role app key bị revoke cùng lúc |

**Phân loại token:**

- `sbp_…` = Personal Access Token (quản trị account / Management API / CLI)
- Khác `eyJ…` anon key / service role JWT dùng runtime app

Local `.env.local` sau đó đã dùng PAT khác (`sbp_caed…`) — token revoke là bản **đã đóng trong zip**, không phải bug “Supabase cũ” theo nghĩa product defect.

---

## 3. Việc đã làm (chronology)

### 3.1 Phân tích
- Xác nhận zip trong history chứa `SUPABASE_ACCESS_TOKEN=sbp_f618…`.
- Xác nhận raw GitHub URL vẫn tải được khi repo còn public.
- Token `ainear` trên remote chỉ có **push**, không **admin** → không đổi visibility được.
- `GITHUB_GALAXY` trong env local thuộc `galaxypro710-stack` (**admin**) → dùng để private + merge + force-push.

### 3.2 Containment
- Đổi repo → **private** (`visibility: private`; lưu ý public fork không nhận `private: true` đơn thuần).
- Anonymous GitHub HTML/API → **404**.

### 3.3 Tree cleanup (PR #1)
- Branch: `fix/security-gitignore-remove-demo-zip`
- Harden `.gitignore`: env/keys/credentials, `temp-envs/`, `*.apk|aab|ipa|mp4|zip…`, agent junk; giữ `!.agents/skills/**` v.v.
- Untrack + xóa: `ziweiai-demo.zip`, `apps/mobile/logcat.txt`, `apps/mobile/window_dump.xml`
- Merge squash vào `main` (PR #1)

### 3.4 History purge (Phase 2)
- Offline bundle rollback (máy local, **không** commit):  
  `~/Documents/bydone/tuvinew/ziweiai-pre-secret-purge-2026-07-24.bundle`
- `git filter-repo --invert-paths` cho:
  - `ziweiai-demo.zip`
  - `apps/mobile/logcat.txt`
  - `apps/mobile/window_dump.xml`
- Force-push **chỉ** `origin` = `https://github.com/galaxypro710-stack/ziweiai-web.git`
- **Không** thêm lại / không push `upstream` `monet88`

### 3.5 Anti-repeat
- `.githooks/pre-commit`: chặn path nhạy cảm + scan content `sbp_` / `ghp_` / service-role JWT / private key
- `scripts/install-git-hooks.sh` + `package.json` → `"prepare": "scripts/install-git-hooks.sh"`
- Hook dùng `grep -EI` (không phụ thuộc `rg`) để tránh fail trên máy thiếu ripgrep
- Scrub bản local backup từng chứa `sbp_f618…`
- Gỡ remote `upstream` (monet88)

### 3.6 Docs
- Closeout ngắn: `docs/handover/session-2026-07-24-supabase-pat-leak-closeout.md`
- Báo cáo đầy đủ: **file này**

---

## 4. Kết quả (verification 2026-07-24)

| Kiểm tra | Kết quả |
|---|---|
| Repo private (anon HTML/API) | 404 |
| `git rev-list --all -- ziweiai-demo.zip` | **0** |
| `logcat.txt` / `window_dump.xml` trong history | **0** |
| HEAD tree có zip/dumps | Không |
| Working tree có `ziweiai-demo.zip` | Không |
| Remote `monet88` / `upstream` | Không |
| `origin` | `galaxypro710-stack/ziweiai-web` only |
| Pre-commit block `*.zip` (force-add) | OK (exit 1) |
| Pre-commit block `sbp_…` content | OK (exit 1) |
| `core.hooksPath` | `.githooks` |

Commits bảo mật chính trên `main` (sau rewrite):

1. `fix(security): harden gitignore and remove leaked demo zip (#1)`
2. `chore(security): add pre-commit secret/binary guard after PAT leak`

---

## 5. Pre-check hoàn thành

### Logic đúng chưa?
**Có.** Root cause đúng (zip chứa env trên public repo). Containment (private) → remove from tree → purge history → harden ignore/hooks là chuỗi đúng chuẩn secret-incident. Phân biệt PAT vs runtime keys đúng.

### Workflow ổn chưa?
**Có, cho phạm vi incident này.**

- Developer mới: `pnpm install` → `prepare` cài hook.
- Commit env/zip/apk… → bị chặn.
- Clone skills: `.agents/skills` vẫn trackable (không bị ignore cả thư mục `.agents`).

### Thiếu tính năng gì?
Không thiếu cho **đóng incident**, nhưng các hạng mục **owner follow-up** (không block “contained”) còn:

1. Rotate `GITHUB_GALAXY` nếu từng lộ trong terminal log khi purge.
2. Xem Supabase **Audit logs**; rotate service-role / JWT / AI keys từng nằm trong zip **nếu** vẫn valid trên project đang dùng.
3. GitHub có thể giữ unreachable blob đến khi GC — repo private nên anon không đọc được; có thể ticket GitHub Support nếu cần purge CDN/blob cứng.
4. (Tuỳ chọn) Commit `.agents/skills/**` lên repo để clone máy khác có sẵn skills (hiện trackable nhưng có thể chưa được add hàng loạt).
5. (Tuỳ chọn) Thêm CI secret scan (gitleaks) — defense in depth ngoài pre-commit local.

### Rủi ro tiềm ẩn?
| Rủi ro | Mức | Mitigation hiện tại |
|---|---|---|
| Clone/fork cũ vẫn giữ zip | Trung bình | Repo private; yêu cầu mọi máy `re-clone` hoặc reset về remote đã rewrite |
| Force-push làm lệch branch feature cũ | Trung bình | Đã rewrite + force-push các branch local tracked; máy khác cần fetch --prune |
| Hook chưa cài nếu bỏ qua `prepare` | Thấp | Document + `pnpm prepare`; `.gitignore` vẫn chặn hầu hết |
| `git add -f` + `--no-verify` bypass hook | Thấp–TB | Quy ước team; có thể bổ sung CI |
| Secret khác trong zip vẫn live | TB nếu chưa rotate | Owner rotate checklist ở trên |
| Nhầm push sang monet88 | Đã giảm | Remote upstream đã gỡ |

---

## 6. Bugs tìm thấy ở vòng kiểm tra lại + fix

| Bug | Fix |
|---|---|
| Pre-commit phụ thuộc `rg` → máy không có ripgrep sẽ không scan content | Đổi sang `grep -EIq` (portable) |

Không phát hiện regression app runtime từ các thay đổi security (chỉ gitignore/hooks/docs/history).

---

## 7. Quy tắc vận hành để không tái phạm

1. **Không bao giờ** commit/pack `.env*`, key, zip demo chứa env.
2. Artifact lớn (`apk`/`aab`/`ipa`/`mp4`/`zip`) → storage ngoài git (Release/Drive), không vào commit.
3. Chỉ remote **`galaxypro710-stack/ziweiai-web`** cho workstream này; không gắn `monet88` làm push upstream trừ khi có quyết định riêng.
4. Trước push: `git status`, đảm bảo hook đang bật (`git config core.hooksPath` → `.githooks`).
5. Nếu nghi lộ secret: revoke ngay → private (nếu cần) → purge → rotate → document.

---

## 8. Verdict

**DONE — incident contained & hardened trên `galaxypro710-stack`.**

- Mục tiêu containment + anti-repeat: đạt.
- History zip: sạch (0 commits).
- Repo: private; anon: 404.
- monet88: không liên quan trong triển khai.
- Owner còn rotate/audit (mục 5) — không chặn trạng thái “đã xử lý sự cố”, nhưng nên làm sớm.
