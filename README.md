# ziweiai-web

Monorepo fullstack cho sản phẩm luận giải **Tử Vi / chiêm tinh**: backend NestJS + web SvelteKit (Svelte 5 runes) + các package nội bộ dùng chung. Lá số do engine server-only tính, luận giải sinh bằng AI, auth Supabase client-only.

Repo này được migrate từ monorepo gốc `ziweiai` (NestJS + Expo). Phần client Expo bị bỏ và viết lại bằng SvelteKit; backend và toàn bộ package dùng chung được mang nguyên sang để **contracts trở thành package workspace dùng chung giữa api và web**, triệt tiêu schema drift.

## Cấu trúc

```text
apps/
  api/                    # NestJS backend (+ supabase/ migrations bên trong)
  web/                    # SvelteKit SPA — Svelte 5 runes
packages/
  config/                 # tsconfig/base + eslint/base (không có runtime dep)
  contracts/              # Zod schemas + types — DÙNG CHUNG bởi api + web (zod v4)
  core/                   # logic, kéo theo iztro — SERVER-ONLY
  astro-engine/           # iztro + lunar-javascript + temporal — SERVER-ONLY
vendor/xuanshu-runtime/   # runtime SERVER-ONLY (LiuYao/DaLiuRen/QiMen bridge)
docs/                     # product contract, deploy notes, story packets, decisions
```

Tài liệu nền tảng nên đọc theo thứ tự: `docs/product/overview.md` →
`docs/product/invariants.md` → `docs/product/api-contract.md` →
`docs/deploy/vercel-demo-release-checklist.md` → story packets trong
`docs/stories/epics/` → `docs/decisions/`.

Lưu ý vận hành 2026-07-12: một số tài liệu harness cũ còn nhắc
`scripts/bin/harness-cli.exe`, nhưng binary đó không có trong workspace hiện tại.
Khi cần trạng thái thực tế, ưu tiên code + tests + báo cáo deploy gần nhất.

## Stack

| Lớp | Công nghệ |
|---|---|
| Backend | NestJS 11, Zod v4, Supabase JS |
| Web | SvelteKit 2 + Svelte 5 runes, Vite, `@tanstack/svelte-query`, `@supabase/supabase-js` |
| Web render | `adapter-static` chế độ SPA (`ssr=false`, `prerender=false`, `fallback: index.html`) — anonymous/session app, không cần SSR/SEO |
| Styling | scoped CSS + CSS custom properties (design tokens). **Không dùng Tailwind** |
| Engine lá số | iztro + lunar-javascript + `@js-temporal` (server-only) |
| Monorepo | pnpm workspace + Turbo. `pnpm@10.17.1`, Node `>=22` |

## Hai bất biến bắt buộc

Đây là ràng buộc cốt lõi, vi phạm là blocker. Chi tiết: `docs/product/invariants.md`.

**1. Biên giới server (security).** `apps/web` chỉ được import `@ziweiai/contracts` từ workspace nội bộ. TUYỆT ĐỐI không import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, `lunar-javascript` — chúng kéo engine tính lá số + ephemeris + chữ Hán vào bundle client. ESLint `no-restricted-imports` chặn ở mức lint. Cần một hằng/regex nhỏ từ core (vd `CJK_TEXT_PATTERN`) → copy giá trị vào `apps/web/src/lib/text/cjk.ts`, không import core.

**2. Ngôn ngữ (Han-character invariant).** Frontend không bao giờ chứa chữ Hán — mọi nhãn đều tiếng Việt. `translateZiweiKey` là fail-fast (thiếu key → throw; cấm fallback ngầm về chữ Hán). Snapshot legacy v1 có `displayName` chữ Hán → guard bằng `CJK_TEXT_PATTERN` + fallback `"Thuật ngữ cũ"`. Mọi output UI phải qua test quét `\p{Script=Han}`.

## Bản đồ rewrite React → Svelte 5

| React (Expo) | Svelte 5 |
|---|---|
| `useState` | `$state` |
| `useMemo` | `$derived` |
| `useEffect` | `$effect` (đừng port máy móc — nhiều effect nên thành `$derived` hoặc event handler) |
| `useQuery` / `useMutation` | `createQuery` / `createMutation` (wrap options trong hàm: `createQuery(() => ({ ... }))`) |
| `useRouter` | `goto` |
| `EXPO_PUBLIC_*` / `process.env` | `$env/static/public` (`PUBLIC_*`) |

Mapping lịch sử đầy đủ nằm trong spec gốc; với trạng thái hiện tại, ưu tiên
`spec.md`, `docs/product/*` và các `AGENTS.md` theo phạm vi.

## API backend

`GET /health` + `GET /features` là public; phần còn lại đều cần Bearer, gom theo domain:

| Nhóm | Endpoint |
|---|---|
| Lá số Tử Vi | `POST /charts`, `GET /charts/:id`, `POST /charts/:id/horoscope` |
| Vận hạn | `GET /charts/:id/daily`, `GET /charts/:id/monthly`, `POST /charts/:id/annual-report` |
| Luận giải + lịch sử | `POST /explanations`, `GET /history?limit=N` |
| Trợ lý AI hội thoại | `POST /conversations`, `GET /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages`, `POST /conversations/:id/messages/stream` |
| Các hệ thuật số mở rộng | `POST /divinations`, `POST /draws/tarot`, `POST /draws/lenormand`, `POST /draws/stick`, `POST /dreams/interpret`, `POST /almanac/select`, `POST /vision/face`, `POST /vision/palm`, `POST /quizzes/mbti`, `POST /pairings` |

Mọi response UI dùng phải `parse()` bằng schema từ `@ziweiai/contracts` (tên camelCase: `historyListResponseSchema`, `chartDetailResponseSchema`, ...) — web không tự định nghĩa DTO. Token = `session.access_token` gửi qua header `Authorization: Bearer`. Chi tiết: `docs/product/api-contract.md`.

## Cấu hình env

Chỉ tiền tố `PUBLIC_*` được lộ ra bundle client:

- `PUBLIC_API_BASE_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Web đọc env qua `$env/static/public`, không qua `process.env`. Secret server (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_COMPAT_API_KEY`, geocoding key) chỉ sống trong `apps/api`. Không commit `.env` thật.

## Lệnh thường dùng

Chạy từ repo root.

| Lệnh | Tác dụng |
|---|---|
| `pnpm install` | Cài deps toàn workspace |
| `turbo build` | Build mọi package theo thứ tự phụ thuộc |
| `turbo test` | Test toàn workspace |
| `turbo typecheck` | Typecheck toàn workspace |
| `pnpm lint` | ESLint toàn workspace (`--max-warnings=0`) |
| `pnpm -F @ziweiai/api dev` | Chạy backend NestJS |
| `pnpm -F @ziweiai/api test` | Test backend (Vitest) |
| `pnpm -F @ziweiai/web dev` | Chạy web SvelteKit |
| `pnpm -F @ziweiai/web build` | Build SPA tĩnh ra `build/` |
| `pnpm -F @ziweiai/web check` | svelte-check + tsc |
| `pnpm -F @ziweiai/web e2e` | Playwright E2E |
| `pnpm check:supabase-migrations` | Kiểm tra tên/version migration local; bật `SUPABASE_VERIFY_LINKED=1` để chạy ledger linked |
| `pnpm deploy:vercel-demo` | Deploy demo Vercel + alias `tuvitoantap.vercel.app` bằng `VERCEL_GALAXY` |
| `pnpm smoke:vercel-demo` | Safe smoke demo Vercel: inspect alias, health/features, SPA fallback; không tạo dữ liệu |
| `pnpm smoke:vercel-live-mutation` | Guarded smoke tạo Lục Hào + gọi AI thật; mặc định skip, chỉ chạy khi bật cờ xác nhận |

## Trạng thái

Trạng thái theo code/tests/deploy ngày 2026-07-12:

- Demo public chạy tại `https://tuvitoantap.vercel.app`.
- Luồng chính đã verify: anonymous session → lập lá số → mở `/charts/<uuid>` →
  refresh detail không còn Vercel 404.
- Đã có các nhóm tính năng: Tử Vi, Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ
  Môn, Hợp Hôn, Mang Phái, Tarot, MBTI, Face/Palm, Lenormand, Giải mộng, Xin
  xăm, Hoàng lịch, vận hạn ngày/tháng/năm và trợ lý hội thoại.
- Có 46 Playwright E2E specs trong `apps/web/tests/e2e`; full non-live E2E gần nhất pass 46/46 ngày 2026-07-13.
- Có 9 migration Supabase trong `apps/api/supabase/migrations`.

Chưa coi là production business-ready:

- Ví XU / ledger / VietQR / payment chưa là flow hoàn chỉnh.
- Một số story packet cũ vẫn ghi `planned`; xem `docs/TEST_MATRIX.md` để biết
  operational snapshot mới nhất.
- Hạ tầng đang có hai hướng: Lightsail production guide cũ và Vercel demo hiện
  đang dùng. Demo Vercel là đường kiểm thử public hiện tại.

## Quy trình harness

Repo từng dùng harness workflow (lane normal/high-risk). Vì binary harness không
có trong workspace hiện tại, các cập nhật status gần đây dùng kiểm chứng trực
tiếp: code, unit/e2e, Vercel inspect, smoke test và báo cáo trong `docs/reports/`.
