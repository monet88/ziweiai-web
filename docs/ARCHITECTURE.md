# Architecture

> **Nguồn sự thật**: kiến trúc chi tiết sống trong `SPEC.md` (Phần A + Phần B) và
> `docs/decisions/`. File này chỉ là **bản đồ định hướng** + con trỏ — KHÔNG mô tả lại
> để tránh drift. Khi cần chi tiết, đọc:
>
> - `SPEC.md` Phần A5 — cây phụ thuộc monorepo (xác nhận từ `package.json`).
> - `SPEC.md` Phần B — kiến trúc `apps/web` (Section 1–22).
> - `docs/decisions/0007-web-server-boundary.md` — boundary client/server.
> - `docs/decisions/0006-spec-vs-code-naming.md` — vì sao tên trong code ≠ minh hoạ SPEC.
> - `docs/product/invariants.md` — 3 bất biến cứng (boundary, ngôn ngữ, token tươi).

## Hình dạng thật (Phase 1–8 đã ship)

Monorepo pnpm + Turbo. Backend NestJS + SvelteKit SPA + package nội bộ dùng chung:

```text
packages/config        tsconfig/eslint base (không dep runtime)
  └─ packages/contracts    Zod v4 — SHARED api + web (triệt tiêu schema drift)
       └─ packages/core         logic + iztro          ← SERVER-ONLY
            └─ packages/astro-engine  iztro + lunar-javascript + temporal ← SERVER-ONLY
                 └─ apps/api          NestJS (contracts + core + astro-engine)
apps/web                 SvelteKit SPA — CHỈ import @ziweiai/contracts
vendor/xuanshu-runtime   runtime SERVER-ONLY (LiuYao/DaLiuRen/QiMen bridge)
```

Chuỗi phụ thuộc một chiều: `contracts → core → astro-engine → apps/api`. `apps/web` đứng
ngoài chuỗi engine, chỉ chạm `@ziweiai/contracts`. Đây là **bất biến boundary** (xem mục
Dependency Rule + decision 0007), không phải khuyến nghị.

## Dependency Rule (ràng buộc cứng, có hiệu lực ở lint/CI)

`apps/web` KHÔNG được import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`,
`lunar-javascript`. ESLint `no-restricted-imports` (`apps/web/eslint.config.mjs`) chặn 4
package này ở lint-time. Lý do: chúng kéo ephemeris + hàng trăm literal chữ Hán vào client
bundle, vi phạm cả boundary lẫn bất biến ngôn ngữ. Cần một hằng nhỏ từ core (vd
`CJK_TEXT_PATTERN`) → **copy giá trị** vào `apps/web/src/lib/text/cjk.ts`, không import.

## Parse-First Boundary Rule

Dữ liệu lạ phải được parse bằng schema `@ziweiai/contracts` trước khi vào inner code. Áp
dụng ở: HTTP request/response, identity claims (Supabase JWT), env, row trả về từ
Supabase client. Web KHÔNG tự định nghĩa DTO — mọi response UI dùng đều `parse()` qua
contracts (xem `docs/product/api-contract.md`). Engine chỉ chạy server-side; web nhận
`chartSnapshotSchema` đã chuẩn hoá (slug key ASCII, không chữ Hán).

## Observability

Backend gắn `request-id.middleware.ts` cho mỗi request; error trả về theo envelope
`{ code, message, requestId }` (`apiErrorSchema`). Chi tiết error-map: `api-contract.md`.
