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
docs/                     # SPEC, product contract, story packets, decisions
scripts/bin/harness-cli.exe   # CLI lớp durable (intake/story/trace/matrix)
SPEC.md                   # nguồn chân lý duy nhất — full spec 8 phase
```

Tài liệu nền tảng nên đọc theo thứ tự: `SPEC.md` → `docs/product/invariants.md` → `docs/HARNESS.md` + `docs/ARCHITECTURE.md` → story packets trong `docs/stories/epics/` → `docs/decisions/`.

## Stack

| Lớp | Công nghệ |
|---|---|
| Backend | NestJS 11, Zod v4, Supabase JS |
| Web | SvelteKit 2 + Svelte 5 runes, Vite, `@tanstack/svelte-query`, `@supabase/supabase-js` |
| Web render | `adapter-static` chế độ SPA (`ssr=false`, `prerender=false`, `fallback: index.html`) — app sau đăng nhập, không cần SSR/SEO |
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

Mapping đầy đủ: `SPEC.md` Part A8.

## API backend

`GET /health` + `GET /features` là public; phần còn lại đều cần Bearer, gom theo domain:

| Nhóm | Endpoint |
|---|---|
| Lá số Tử Vi | `POST /charts`, `GET /charts/:id`, `POST /charts/:id/horoscope` |
| Vận hạn | `GET /charts/:id/daily`, `GET /charts/:id/monthly`, `POST /charts/:id/annual-report` |
| Luận giải + lịch sử | `POST /explanations`, `GET /history?limit=N` |
| Trợ lý AI hội thoại | `POST /conversations`, `GET /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages`, `POST /conversations/:id/messages/stream` |
| Các hệ thuật số mở rộng | `POST /divinations`, `POST /draws/tarot`, `POST /vision/face`, `POST /vision/palm`, `POST /quizzes/mbti`, `POST /pairings` |

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

## Trạng thái

Nền tảng 8 phase đầu (US-001..US-007) đã xong: scaffold → auth + route guard → logic thuần + i18n + design tokens → UI primitives → dashboard + birth form → chi tiết lá số Tử Vi + luận giải → các hệ thuật số khác + lịch sử.

Sau đó tiếp tục mở rộng (US-008 trở đi): lá số Tử Vi trực quan + đường nối tam phương tứ chính, tô màu sao, highlight đa màu vận hạn, panel vận hạn (đại vận/lưu niên/lưu nguyệt/lưu nhật); quota anon qua Redis/Upstash; khung 6 hệ luận giải mở rộng (Hợp Hôn, Manh Phái, Tarot, MBTI, Xem Tướng, Xem Tay) + trợ lý AI hội thoại multi-turn; ví XU + ledger + thanh toán VietQR; re-theme Notion paper-calm; flow gieo quẻ (Lục Hào / Mai Hoa). Mặc định AI provider là **openai-compat**, fallback **deepseek**.

Xem proof status từng story: `scripts/bin/harness-cli.exe query matrix`.

## Quy trình harness

Repo chạy harness workflow bắt buộc (lane normal/high-risk), theo thứ tự: intake → story breakdown → (fix doc drift nếu có) → implement → validate + update matrix → trace; thay đổi kiến trúc → decision. Chi tiết: `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`. CLI ở `scripts/bin/harness-cli.exe`.
