# Session Handoff — 2026-07-22: Phase 11 Ship + Live Smoke

> **Branch:** `main` (synced with `origin/main` sau session)  
> **Working tree:** clean sau commit docs này (nếu còn uncommitted chỉ file handoff)  
> **Demo:** https://tuvitoantap.vercel.app  
> **Deployment:** `build-14yg9bx72-galaxypro710-7060s-projects.vercel.app` (`dpl_G7CsRiutDdjNZdnQaUqcruLo6umC`)

---

## 1. Mục tiêu session

P0 only từ closeout Phase 11:

1. Xác nhận git / push `main`
2. Deploy demo `pnpm deploy:vercel-demo`
3. Live smoke: health, features, share bot meta, OG PNG, mystical assets
4. Ghi kết quả + handoff

**Không** mở feature mới (referral, admin, WASM…).

---

## 2. Việc đã làm

### 2.1. Ship

| Bước | Kết quả |
|------|---------|
| `git status` | clean; ahead 12 commits lúc đầu session |
| `git push origin main` | OK — đẩy stack Phase 9–11 + closeout |
| Deploy #1 | Build Ready nhưng script fail parse URL → **alias `tuvitoantap` chưa cập nhật** |
| Alias thủ công | `build-c4k57b6hu…` → `tuvitoantap.vercel.app` |
| Fix deploy script | Parse URL Vercel CLI linh hoạt hơn (`scripts/deploy-vercel-demo.zsh`) |
| Deploy #2 + #3 | Script exit 0 + alias auto OK |

### 2.2. Production bugs phát hiện & fix trong smoke

| Bug | Triệu chứng | Fix | Commit |
|-----|-------------|-----|--------|
| Share/OG không `@Public()` | `GET /share/*` và `/api/og/*` → **401** global `SupabaseAuthGuard` | `@Public()` trên 2 handlers + unit test | `12261ec` |
| OG PNG 500 | `Cannot find package 'satori-html'` (dynamic `eval(import)` không vào Vercel NFT) | Bỏ `satori-html`; tree satori local `og-element.ts` | `b75cf2b` |
| Font OG 404 | GitHub raw Inter URL 404 | Inter latin+vietnamese từ jsDelivr fontsource | `b75cf2b` |

### 2.3. Smoke data

Tạo **một** chart Lục Hào trên production (anonymous, **không** gọi AI explanation):

- `chartId`: `1ea9c744-be5d-4e66-8b7a-f50a7388539e`
- `ownerUserId`: `bd579f07-9ddb-4008-8701-71955738cec3`
- **Chưa cleanup** (cần `SUPABASE_SERVICE_ROLE_KEY` + admin delete user nếu muốn dọn)

---

## 3. Live smoke results (sau deploy cuối)

| Check | Result |
|-------|--------|
| `GET /api/health` | **200** `status: ok` |
| `GET /api/features` | **200** flags JSON |
| Bot share `UA=facebookexternalhit/1.1` `/share/charts/<uuid>` | **200** HTML meta động: title `Quẻ Lục Hào · 2026 \| Tử Vi Toàn Tập`, og:image trỏ `/api/og/charts/...` |
| Human share | **302** → `/charts/<uuid>` |
| Missing chart OG | **404** `Chart not found` (không còn 401) |
| Real OG `GET /api/og/charts/<uuid>` | **200** `image/png` **1200×630** ~43KB, `Cache-Control: public, max-age=86400` |
| SPA `/charts/<uuid>` | **200** static index (client route) |
| Mystical CSS ship | `theme-mystical`, `surface-glass`, `#d4af37` có trong `/_app/immutable/assets/0.*.css` |

### Commands lặp lại

```bash
CHART=1ea9c744-be5d-4e66-8b7a-f50a7388539e

curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS -A "facebookexternalhit/1.1" \
  "https://tuvitoantap.vercel.app/share/charts/${CHART}" | head -40
curl -sSI "https://tuvitoantap.vercel.app/api/og/charts/${CHART}"
# Optional: Facebook Sharing Debugger
# https://developers.facebook.com/tools/debug/
```

---

## 4. Commits session này (sau stack Phase 11)

| Commit | Nội dung |
|--------|----------|
| `12261ec` | `fix(share): mark share/OG routes public for crawlers` (+ deploy URL parse) |
| `b75cf2b` | `fix(share): generate OG PNG without satori-html on Vercel` |

(Plus docs handoff commit nếu có.)

---

## 5. Verification local (cùng session)

| Gate | Result |
|------|--------|
| `pnpm -F @ziweiai/api typecheck` | PASS |
| `vitest` share module | **7 PASS** (share-meta + public + og-element) |
| Local satori+resvg pipeline | PNG OK |

---

## 6. Còn lại (P1 / optional)

1. **Manual browser:** anonymous → tạo chart → `/charts/<uuid>` visual glass/GSAP (token CSS đã ship; chưa automate browser).
2. **Facebook Debugger** scrape URL share thật (sau cache clear).
3. **Cleanup** smoke user/chart production nếu policy yêu cầu.
4. Playwright assert bot meta / OG content-type (harden regression).
5. Cân nhắc **vendor font** vào repo nếu lo jsDelivr cold-start/rate (hiện cache memory warm OK).

---

## 7. Product next (sau P0 xanh)

Theo AGENTS.md priority, **không** bắt buộc ngay:

- Referral / viral loop
- Observability alerts (5xx / provider timeout) — OG 500 đã lộ qua smoke
- Monetization polish (SePay live) nếu chưa smoke payment

---

## 8. Prompt session mới (nếu cần)

```markdown
Chào bạn, tiếp tục Tử Vi Toàn Tập.

## Handoff
Đọc: `docs/handover/session-2026-07-22-phase11-ship-smoke.md`
Phase 11 code + ship + live OG smoke đã xanh.

## Hiện trạng
- main synced origin; demo `tuvitoantap.vercel.app` deploy OK
- Share bot meta + OG PNG production verified
- Smoke chart: 1ea9c744-be5d-4e66-8b7a-f50a7388539e (chưa cleanup)

## Gợi ý việc tiếp
1. (Optional) Manual glass UI browser + Facebook Debugger
2. Cleanup smoke data nếu cần
3. Product next: referral viral loop HOẶC observability — hỏi Matt/user chọn
```

---

## 9. Kết luận

- **Mục tiêu P0 push → deploy → live OG smoke: ĐẠT** (sau 2 hotfix production).
- Phase 11 không chỉ “code xong” mà **đã chứng minh trên demo public**.
- Session có thể dừng; follow-up là polish/ops/product next, không blocker ship.
