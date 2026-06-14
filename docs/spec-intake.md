# Spec Intake — ziweiai-web

Date: 2026-06-14

## Source

- User prompt: "migrate fullstack monorepo + thêm web SvelteKit", chốt phạm vi qua nhiều vòng hỏi-đáp.
- Attached file: `SPEC.md` (Section 4 — Web App Architecture), `PROJECT_SUMMARY.md`.
- External reference: repo gốc `F:/CodeBase/ziweiai` (đọc verbatim React/RN để rewrite).

## Project Summary

Xây web app **SvelteKit SPA** (`apps/web`) cho người dùng đã đăng nhập, thay client Expo/RN
cũ, trong **monorepo fullstack** mới đã migrate (backend NestJS + packages + supabase). Web
chỉ tiêu thụ `@ziweiai/contracts` qua `workspace:*` để triệt tiêu schema drift. Auth
client-only Supabase. Sản phẩm: tạo và xem lá số Tử Vi (+ 5 hệ thuật số khác) kèm luận giải AI.

## Candidate Product Docs

| File | Purpose | Source sections |
| --- | --- | --- |
| `docs/product/overview.md` | Sản phẩm, người dùng, ranh giới, route map | SPEC §5, PROJECT_SUMMARY §1-2 |
| `docs/product/web-architecture.md` | Hợp đồng kiến trúc SPA: runtime, query, env, styling | SPEC §1-2, §6-10, §15-19 |
| `docs/product/invariants.md` | 2 bất biến cốt lõi: CJK ngôn ngữ + boundary bảo mật | SPEC §9-13, PROJECT_SUMMARY §3-4 |
| `docs/product/api-contract.md` | API surface thật + tên schema đã verify | SPEC §13, contracts source |

## Candidate Epics

| Epic | Description | Status |
| --- | --- | --- |
| E01 | Web foundation — scaffold `apps/web`, env/supabase/query/api-client, boundary guard | sliced (US-001) |
| E02 | Auth client-only + route guard | unsliced (Phase 3) |
| E03 | Pure logic + i18n + design tokens (CJK guard) | unsliced (Phase 4) |
| E04 | UI primitives + AppScaffold | unsliced (Phase 5) |
| E05 | Dashboard + birth form | unsliced (Phase 6) |
| E06 | Ziwei chart detail + AI explanation | unsliced (Phase 7) |
| E07 | 5 hệ thuật số khác + history | unsliced (Phase 8) |

## Architecture Questions

- Runtime stack: SvelteKit + Svelte 5 runes + TS + Vite, `@tanstack/svelte-query`, `@supabase/supabase-js`, Zod v4 (qua contracts).
- Product surfaces: browser SPA (client-rendered, không SSR).
- Storage: backend NestJS + Supabase Postgres; web stateless, chỉ localStorage cho session + UI prefs.
- External providers: Supabase auth; AI explanation providers (server-only).
- Deployment target: static host cho web (Cloudflare Pages / Netlify / nginx) — **chưa chốt** (Q7); Node host cho api — chưa chốt.
- Security model: client-only Supabase JWT qua `Authorization: Bearer`; secret chỉ ở `apps/api`; web chỉ thấy `PUBLIC_*`.

## Validation Shape

| Layer | Expected proof |
| --- | --- |
| Unit | translateZiweiKey fail-fast, CJK guard, view builders, formatters |
| Integration | api-client parse contract thật; `GET /health` xanh qua client |
| E2E | login → dashboard → tạo lá số → xem chi tiết → luận giải |
| Platform | `adapter-static` build ra `build/`; SPA fallback hoạt động trên host |
| Release | test quét `\p{Script=Han}` xanh trên `build/`; boundary guard ESLint xanh |

## Open Decisions

- Route đăng nhập: SPEC §5 ghi `/login`; nguồn Expo dùng `sign-in.tsx`. → **Chốt `/sign-in`** (theo nguồn Expo). Ghi ở decision 0006.
- Deploy target web + api (Q7) — chưa chặn foundation, chốt sau khi web chạy local.

## First Story Candidates

- US-001 — Scaffold web foundation (E01). Lane normal. Đây là story đầu tiên.

## Harness Delta

- Tạo `docs/product/{overview,web-architecture,invariants,api-contract}.md`.
- Tạo decision `0006-spa-client-only-architecture.md`.
- Tạo story packet `docs/stories/epics/E01-web-foundation/US-001-scaffold-web-foundation.md`.
- Chốt `staleTime` = `30_000`, verify với SPEC §7 + nguồn thật.
- Backlog #1 (TOOL_REGISTRY.md thiếu) + #2 (apps/api copy kèm artifact) đã ghi ở Phase 1.
