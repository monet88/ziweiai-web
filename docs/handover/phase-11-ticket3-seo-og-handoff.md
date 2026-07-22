# Handover: Phase 11 Ticket 3 — SEO & Dynamic OG Image

## 1. Mục Tiêu
Hoàn thiện meta động + ảnh OG khi chia sẻ lá số (Facebook/Zalo/Telegram), đồng bộ style mystical glass (Ticket 2).

## 2. Quyết Định Kiến Trúc (quan trọng)
Production **không** phục vụ OG từ SvelteKit SSR. Vercel rewrite:

```
/share/:path*  →  /api/share/:path*
/api/:path*    →  NestJS serverless
```

Canonical path:
- Bot HTML meta: `GET /share/charts/:id` → `ShareController.handleShareRedirect`
- OG PNG: `GET /api/og/charts/:id` → `ShareController.generateOgImage`

Web routes `apps/web/.../share/...` chỉ giữ cho local/dev alignment.

## 3. Việc Đã Làm
1. **`share-meta.ts` + tests**: title/description/system/gender/year pure helpers + `escapeHtml`
2. **`share.controller.ts`**: meta động (hệ + giới + năm sinh), OG glass ink/gold, cache headers, XSS-safe meta
3. **`ChartDetailScreen`**: `<title>` + `description` động; Web Share API dùng cùng copy
4. **Web share load + og.png**: system keys đúng contract (`mei-hua-yi-shu`), `og:image` trỏ `/api/og/charts/:id`, design glass khớp API

## 4. Verification
| Gate | Result |
|------|--------|
| `pnpm -F @ziweiai/api test` (incl. share-meta) | 412 PASS |
| `pnpm -F @ziweiai/api typecheck` | PASS |
| `pnpm -F @ziweiai/web check` | 0 errors |
| `pnpm -F @ziweiai/web lint` | PASS |

## 5. Post-deploy smoke (cần làm sau deploy)
1. `curl -sS -A "facebookexternalhit/1.1" https://tuvitoantap.vercel.app/share/charts/<uuid> | head`
2. `curl -sSI https://tuvitoantap.vercel.app/api/og/charts/<uuid>` → `content-type: image/png`
3. Dán URL vào [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

## 6. Phase 11 status
| Ticket | Status |
|--------|--------|
| 1 Engine cleanup | DONE (committed) |
| 2 Glass + GSAP | DONE (committed) |
| 3 SEO + OG | DONE (this session) |

## 7. Next (sau Phase 11)
- Deploy demo + live OG smoke
- Optional: Playwright assert bot meta
- Product next: referral viral loop hoặc observability alerts (tùy ưu tiên growth vs ops)
