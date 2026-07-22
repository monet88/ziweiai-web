# Pre-check hoàn thành — Phase 11 Ship / Share / OG

**Ngày:** 2026-07-22  
**Phạm vi:** Phase 11 (Ticket 1–3) + ship demo + live smoke + pre-check bugs  
**Branch:** `main` (workflow demo: push thẳng main, không PR bắt buộc)  
**Demo:** https://tuvitoantap.vercel.app

---

## 1. Mục tiêu pre-check

Trả lời trước khi coi **done**:

1. Logic đúng chưa?
2. Workflow user ổn chưa?
3. Thiếu tính năng gì?
4. Rủi ro tiềm ẩn?
5. Còn bug nào cần fix ngay?

---

## 2. Kết luận tóm tắt

| Câu hỏi | Kết luận |
|---------|----------|
| Logic đúng? | **Có** — share public, meta động, OG PNG, mystical scoped chart detail |
| Workflow ổn? | **Có** — create → detail → share link → bot meta + OG; human 302 → SPA |
| Thiếu feature? | **Không blocker** cho Phase 11; P1: Debugger FB, Playwright, cleanup smoke data |
| Rủi ro? | Còn residual (rate limit 10/IP, font CDN, public-by-UUID, year on quẻ = năm gieo) — không chặn ship |
| Bug pre-check? | **1 bug 500** invalid UUID → đã fix; missing-chart meta mơ hồ → đã harden |

**Status Phase 11 ship: DONE** sau hotfix pre-check + redeploy verify.

---

## 3. Việc đã làm (toàn chuỗi)

### 3.1. Phase 11 implementation (session trước)

| Ticket | Nội dung | Status |
|--------|----------|--------|
| 1 | Engine XuanShu cleanup | DONE |
| 2 | Glass mystical + GSAP web + Flutter | DONE |
| 3 | SEO meta + dynamic OG | DONE |

### 3.2. Ship session

- Push stack `main` → origin
- `pnpm deploy:vercel-demo` + alias `tuvitoantap.vercel.app`
- Harden deploy script parse URL Vercel CLI

### 3.3. Production fixes (smoke)

| Issue | Fix | Commit |
|-------|-----|--------|
| Share/OG 401 | `@Public()` | `12261ec` |
| OG 500 `satori-html` missing | local `og-element` tree; drop satori-html | `b75cf2b` |
| Font GitHub 404 | Inter latin+vi jsDelivr | `b75cf2b` |

### 3.4. Pre-check fixes (session này)

| Issue | Evidence | Fix |
|-------|----------|-----|
| `GET /share/charts/not-a-uuid` → **500** INTERNAL_ERROR | Postgres invalid UUID | `ZodValidationPipe(z.uuid())` → **400** |
| `GET /api/og/charts/not-a-uuid` → **500** | same | same pipe |
| Bot meta chart missing default **Tử Vi** + `og:image` 404 | curl fake UUID | Brand fallback, **không** gắn og:image khi không có chart |

---

## 4. Logic review (chi tiết)

### 4.1. Share / SEO path (production)

```
User Share button → /share/charts/:uuid
  ├─ Bot UA  → NestJS HTML meta + og:image=/api/og/charts/:uuid
  └─ Human   → 302 → /charts/:uuid (SPA)

OG PNG → NestJS satori + resvg-js → image/png 1200×630
```

- Vercel rewrite: `/share/*` → `/api/share/*` → Nest handler `share/charts/:id`
- SPA static **không** SSR crawler; canonical crawler = API

### 4.2. Auth

- Global `SupabaseAuthGuard` + `@Public()` trên share + OG — **bắt buộc** cho crawler
- Public by **unguessable UUID** (`findPublicChartSnapshotById`) — intentional product trade-off

### 4.3. Meta content

- `buildShareMeta`: system + optional gender + year; `escapeHtml` trên attributes
- Quẻ không birth (Lục Hào time cast): year có thể là **năm gieo/resolved** (vd 2026) — đúng dữ liệu snapshot, không phải bug engine

### 4.4. UI glass (Ticket 2)

- Scope `.theme-mystical` chart detail only; gold `#D4AF37`
- CSS production có `theme-mystical`, `surface-glass`, `d4af37`
- GSAP entrance + reduced-motion honored (local tests session trước)

---

## 5. Workflow review

| Bước | Kỳ vọng | Verify |
|------|---------|--------|
| Health | 200 ok | PASS live |
| Features | 200 flags | PASS live |
| Create chart/quẻ (anon) | chart UUID | PASS (smoke chart) |
| Detail SPA | 200 index | PASS |
| Share bot | 200 meta động | PASS live |
| Share human | 302 detail | PASS live |
| OG real | 200 PNG 1200×630 | PASS live |
| OG missing | 404 | PASS live |
| Invalid UUID | 400 (sau fix) | redeploy verify |
| Mystical CSS ship | tokens present | PASS |

**Smoke chart (production, chưa cleanup):**

- `1ea9c744-be5d-4e66-8b7a-f50a7388539e`
- owner anon: `bd579f07-9ddb-4008-8701-71955738cec3`

---

## 6. Thiếu tính năng? (không blocker Phase 11)

| Hạng mục | Status | Ghi chú |
|----------|--------|---------|
| Engine cleanup | Done | Ticket 1 |
| Glass + GSAP web/mobile | Done | Ticket 2 |
| SEO + OG production | Done | Ticket 3 + hotfixes |
| Facebook Debugger manual | Optional P1 | Cache scrape |
| Playwright bot meta e2e | Optional P1 | Regression |
| Static brand OG fallback image | Optional | Missing chart hiện không có og:image |
| Vendor font offline | Optional | Phụ thuộc jsDelivr cold start |
| Referral / monetization | Out of Phase 11 | Product next |
| Live payment SePay | Out of scope | Phase 10 residual |

---

## 7. Rủi ro tiềm ẩn (residual)

| Rủi ro | Mức | Mitigation / note |
|--------|-----|-------------------|
| Rate limit default **10/min/IP** trên public share/OG | Trung bình | FB thường 1–2 hit; burst có thể 429 |
| Font fetch jsDelivr fail → OG 500 | Trung bình | Cache memory warm; vendor font nếu lặp lại |
| Public chart by UUID (service role query by id) | Thấp–TB | UUID unguessable; không list public |
| Throttle + bot crawlers | Thấp | Monitor 429 logs |
| Smoke data còn trên prod | Thấp | Cleanup optional service role |
| Year label trên quẻ = năm gieo | Thấp (UX) | Có thể refine meta riêng divination vs birth chart |
| SPA detail ownership | Đã có sẵn | User khác mở UUID vẫn load SPA; API detail cần auth |

---

## 8. Git / PR vs main

### Quyết định: **push thẳng `main`** (không mở PR)

**Lý do:**

1. Repo demo workflow (`AGENTS.md`): deploy demo từ `main` + `pnpm deploy:vercel-demo`
2. Toàn bộ Phase 11 + ship fix **đã** trên `main`/`origin/main`
3. Solo maintainer; PR overhead không thêm review gate thật
4. Hotfix production (401/500 OG) cần ship nhanh để smoke xanh

**Khi nào nên PR:** feature lớn multi-owner, breaking API, hoặc policy team bắt buộc review.

---

## 9. Verification commands

```bash
# Unit
pnpm -F @ziweiai/api typecheck
pnpm -F @ziweiai/api exec vitest run src/modules/share

# Live
CHART=1ea9c744-be5d-4e66-8b7a-f50a7388539e
curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS -A "facebookexternalhit/1.1" \
  "https://tuvitoantap.vercel.app/share/charts/${CHART}" | head -30
curl -sSI "https://tuvitoantap.vercel.app/api/og/charts/${CHART}"
curl -sS -w '%{http_code}\n' \
  "https://tuvitoantap.vercel.app/api/og/charts/not-a-uuid"   # expect 400 after fix
```

---

## 10. Kết quả pre-check

- **Logic:** đúng và đã harden edge cases (public, UUID, missing chart).
- **Workflow core demo:** ổn định trên production.
- **Feature gap Phase 11:** không còn item bắt buộc.
- **Bugs pre-check:** fixed + redeployed (xem commit/docs cập nhật kèm).
- **Ship path:** **main** (không PR).

**DONE** cho Phase 11 ship + pre-check.
