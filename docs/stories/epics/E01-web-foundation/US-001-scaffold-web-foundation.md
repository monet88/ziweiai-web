# US-001 Scaffold apps/web + nền tảng (env, supabase, query, api-client)

## Status

implemented

## Lane

normal

> Lane normal-mạnh: chạm bất biến bảo mật (boundary client/server + chỉ `PUBLIC_*`
> env) nhưng chưa làm auth thật, chưa đổi data model. Guard được *thiết lập* ở đây,
> auth thật là US sau (Phase 3). Xem `docs/product/invariants.md`.

## Product Contract

Thêm `apps/web` (SvelteKit + Svelte 5 runes) vào monorepo đã migrate (Phase 1),
chạy được bằng `pnpm -F @ziweiai/web dev`. Dựng tầng nền:

- `lib/env.ts` — validate `PUBLIC_*` env (fail rõ khi thiếu).
- `lib/supabase/supabase-client.ts` — Supabase browser client (localStorage).
- `lib/query-client.ts` — TanStack **svelte**-query, `staleTime: 30_000, retry: 1`.
- `lib/api-client/{fetch-json,index}.ts` — gọi backend, parse bằng `@ziweiai/contracts`.
- `+layout.ts` đặt `ssr = false; prerender = false`; `+layout.svelte` cấp QueryClient.
- `+page.svelte` tạm: gọi `fetchHealth()` để verify end-to-end.

Kết thúc story: trang health xanh qua api-client thật, build static SPA ra `build/`.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/invariants.md` (boundary + CJK)
- `docs/product/api-contract.md` (tên hàm/schema thật)
- `docs/decisions/0006-spec-vs-code-naming.md` (staleTime, route, tên schema)
- `docs/decisions/0007-web-server-boundary.md` (guard import)

## Acceptance Criteria

1. `apps/web/package.json` tên `@ziweiai/web`, `private: true`, được pnpm workspace
   bắt qua glob `apps/*`; deps gồm `@sveltejs/adapter-static`, `svelte@5`, `vite`,
   `@tanstack/svelte-query`, `@supabase/supabase-js`, `@ziweiai/contracts: "workspace:*"`.
2. `apps/web` **KHÔNG** khai báo dep `@ziweiai/core`, `@ziweiai/astro-engine`,
   `iztro`, hay `lunar-javascript`.
3. ESLint `no-restricted-imports` trong `apps/web` **fail** khi có import
   `@ziweiai/core` / `@ziweiai/astro-engine` / `iztro` / `lunar-javascript`.
4. `apps/web/src/routes/+layout.ts` export `ssr = false` và `prerender = false`.
5. `lib/query-client.ts` dùng `staleTime: 30_000, retry: 1` (KHÔNG phải 3000).
6. `lib/env.ts` chỉ đọc `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`,
   `PUBLIC_SUPABASE_ANON_KEY` từ `$env/static/public`; ném lỗi rõ khi thiếu.
7. `lib/env.ts` / supabase-client **không** chứa secret server-only
   (`SUPABASE_SERVICE_ROLE_KEY`, `*_API_KEY`, JWT secret).
8. `fetchHealth()` parse response bằng `healthResponseSchema` từ `@ziweiai/contracts`;
   trang chủ render trạng thái health (loading / ok / error).
9. `pnpm why zod` chỉ một dòng phiên bản (zod v4); không lẫn v3.
10. `pnpm -F @ziweiai/web exec tsc --noEmit` xanh.
11. `pnpm -F @ziweiai/web build` (adapter-static) ra `build/` không lỗi.

## Design Notes

- Commands: (không có command backend mới)
- Queries: `createQuery(() => ({ queryKey: ['health'], queryFn: fetchHealth }))`
- API: `GET /health` → `healthResponseSchema` (xem `docs/product/api-contract.md`)
- Tables: không đổi
- Domain rules: boundary import (decision 0007), chỉ `PUBLIC_*` env (invariants.md)
- UI surfaces: `/` (health check tạm — sẽ thay bằng redirect theo session ở Phase 3)

## Validation

Cập nhật proof số:
`harness-cli story update --id US-001 --unit 1 --integration 1 --e2e 0 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | `lib/env.ts` validate (thiếu env → ném lỗi); guard ESLint boundary fail đúng |
| Integration | `fetchHealth()` gọi API local thật, parse `healthResponseSchema` xanh |
| E2E | (hoãn — chưa có auth/flow người dùng; thuộc story Phase 3+) |
| Platform | `pnpm -F @ziweiai/web build` adapter-static ra `build/` (SPA fallback) |
| Release | (hoãn — gắn với quyết định deploy target, Q7 plan) |

## Harness Delta

- Tạo product docs: `overview.md`, `invariants.md`, `api-contract.md`.
- Tạo decisions: `0006-spec-vs-code-naming.md`, `0007-web-server-boundary.md`.
- Chốt `staleTime` = 30_000 (theo SPEC §7 + nguồn thật; decision 0006).

## Evidence

(Điền sau khi implement: output `tsc --noEmit`, `build`, lint guard, `pnpm why zod`.)
