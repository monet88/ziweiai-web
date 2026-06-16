# Dự án: ziweiai-web — Migrate sang monorepo fullstack mới + thêm web SvelteKit

> Bản tóm tắt độc lập (self-contained), viết để chia sẻ cho AI/người khảo sát không có quyền truy cập codebase.

## 1. Bối cảnh & mục tiêu

Tôi đang có một **monorepo hiện hữu** (`ziweiai`) gồm:
- **Backend NestJS** (`apps/api`) — API luận giải tử vi/chiêm tinh, tích hợp AI explanation provider.
- **App Expo / React Native** (`apps/app`) — client mobile + web (qua Expo Router export:web).
- **Các package nội bộ** dùng chung qua pnpm workspace.

Tôi muốn tạo **một repo MỚI hoàn toàn** (`ziweiai-web`) bằng cách:
- **Migrate (mang sang)**: backend `apps/api` (kèm `apps/api/supabase/`), toàn bộ `packages/*`, runtime server-only `vendor/xuanshu-runtime/`, và các thư mục nghiên cứu `wiki/` + `raw/` + `.ref/`.
- **Thêm mới**: một web app **SvelteKit** (`apps/web`) thay cho client Expo.
- **Bỏ (drop)**: `apps/app` (Expo) — KHÔNG mang sang repo mới. Logic frontend cần thì viết lại sang Svelte, đọc tham khảo từ repo gốc.
- **Git**: `git init` mới, 1 commit khởi tạo (không mang lịch sử git repo gốc).

Repo gốc `ziweiai` **giữ nguyên, read-only**, chỉ dùng làm nguồn để đọc và rewrite React/RN → Svelte.

**Lý do chọn migrate fullstack** (thay vì web-only client gọi backend cũ): nếu chỉ copy contracts sang web-only sẽ gây **schema drift** (contracts ở web lệch dần với backend). Nếu copy backend nhưng vẫn để repo cũ chạy thì còn tệ hơn — hai backend drift hành vi. Chỉ migrate trọn vẹn (repo mới là nhà duy nhất) mới triệt tiêu drift: contracts trở thành **package workspace dùng chung** giữa api và web.

## 2. Stack

**Nguồn (Expo app, sẽ rewrite):**
- Expo Router + React Native + React 19
- TanStack React Query
- Supabase JS (auth + data)
- iztro (thư viện Tử Vi Đẩu Số TypeScript)

**Đích (web mới):**
- **SvelteKit + Svelte 5 runes** (`$state` / `$derived` / `$effect`)
- TypeScript + Vite
- `@tanstack/svelte-query`
- `@supabase/supabase-js` (auth client-only, dùng localStorage)
- **Zod v4** (validation, qua package contracts dùng chung)
- **adapter-static** ở chế độ SPA (`fallback: index.html`, `ssr=false`, `prerender=false` toàn cục) — vì là app sau đăng nhập, không cần SSR/SEO.
- **CSS**: scoped CSS của Svelte + CSS custom properties (design tokens). **KHÔNG dùng Tailwind** (bảng token chỉ ~30 giá trị, không đáng kéo Tailwind vào).

**Hạ tầng monorepo:**
- pnpm workspace + Turbo
- `packageManager: pnpm@10.17.1`, Node `>=22`
- `pnpm-workspace.yaml`: `apps/*` + `packages/*`

## 3. Các package nội bộ (dependency tree)

| Package | Vai trò | Ghi chú biên giới |
|---|---|---|
| `@ziweiai/config` | config dùng chung | |
| `@ziweiai/contracts` | **chỉ chứa Zod schemas + types** | web và api **cùng** import package này → triệt tiêu schema drift |
| `@ziweiai/core` | logic, kéo theo iztro | **SERVER-ONLY** |
| `@ziweiai/astro-engine` | iztro + lunar-javascript + @js-temporal (tính lá số) | **SERVER-ONLY** |
| `@ziweiai/api` | NestJS backend | |
| `@ziweiai/web` | **(mới)** SvelteKit | chỉ được import `@ziweiai/contracts` |

**BẤT BIẾN BẢO MẬT (biên giới quan trọng nhất):**
`apps/web` **TUYỆT ĐỐI KHÔNG** được import `@ziweiai/core` hay `@ziweiai/astro-engine` — đây là code server-only chứa engine tính toán lá số. Web chỉ được import `@ziweiai/contracts`. Sẽ thêm guard ESLint `no-restricted-imports` để chặn ở mức lint.

## 4. BẤT BIẾN NGÔN NGỮ (Han-character invariant)

Đây là ràng buộc nghiệp vụ cốt lõi, đã verify kỹ trong backend:

- Lá số được engine sinh ra dùng **key slug ASCII** (vd `nameKey: "palaceLife"`, `toStarKey(...)`), **không bao giờ** chứa chữ Hán trực tiếp trong dữ liệu mới.
- Hàm map key là **fail-fast**: gặp giá trị iztro không hỗ trợ thì `throw`, không để chữ Hán lọt qua dưới dạng slug.
- Chữ Hán (`displayName`) **chỉ** xuất hiện ở **read-time** khi đọc snapshot **legacy v1** cũ (snapshot cũ có `name`+`stars` nhưng thiếu `nameKey`), qua bước `z.preprocess(normalizeLegacyChartSnapshot, ...)` trong contract. Khi đó gán `nameKey: \`legacyPalace${index}\``, `displayName: palace.name` (Hán).

**Hệ quả cho web:** web **bắt buộc** giữ:
- một **CJK guard** (regex `\p{Script=Han}`) + fallback hiển thị "Thuật ngữ cũ" cho dữ liệu legacy,
- hàm `translateZiweiKey` fail-fast,
- một test quét `\p{Script=Han}` để đảm bảo không có chữ Hán hardcode lọt vào UI.

→ Web sẽ có `lib/text/cjk.ts` (copy `CJK_TEXT_PATTERN`, **không** phụ thuộc `@ziweiai/core`).

## 5. Bản đồ rewrite React → Svelte 5

| React (Expo) | Svelte 5 |
|---|---|
| `useState` | `$state` |
| `useEffect` | `$effect` |
| `useQuery` | `createQuery` |
| `useMutation` | `createMutation` |
| `useRouter` / navigation | `goto` |
| `@tanstack/react-query` | `@tanstack/svelte-query` |
| `EXPO_PUBLIC_*` / `process.env` | `$env/static/public` (`PUBLIC_*`) |
| `react-native-url-polyfill` + AsyncStorage | bỏ — Supabase dùng `localStorage` mặc định |

Các module **logic thuần** (không phụ thuộc React) sẽ move thẳng: api-client (fetch-json), query-client config, supabase-client, env config, chart-display, palace-view-builder, markdown-blocks, explanation-sections, birth-profile-draft, history-query, chart-system-registry, chart-explanation-intent, v.v.

## 6. Kế hoạch 8 phase

1. **Migrate monorepo skeleton** — mang `apps/api` (kèm `apps/api/supabase/`) + `packages/*` + `vendor/xuanshu-runtime/` + `wiki/raw/.ref`, drop `apps/app`. Validate: `pnpm install` + `turbo build` + `pnpm -F @ziweiai/api test` xanh.
2. **Scaffold web + foundations** — thêm `apps/web` (@ziweiai/web), consume `@ziweiai/contracts` qua `workspace:*` (không vendoring). adapter-static SPA. Move/adapt api-client, query-client, supabase-client, env.
3. **Auth + route guard** — Supabase auth client-only.
4. **Pure logic + i18n + tokens** — port logic thuần, CJK guard, design tokens.
5. **UI primitives scaffold** — component cơ sở.
6. **Dashboard + birth form** — màn chính + form nhập thông tin sinh.
7. **Ziwei chart detail + explanation** — lá số Tử Vi + luận giải AI (markdown).
8. **Other systems + history** — các hệ khác (BaZi/Lục Hào...) + lịch sử.

## 7. Rủi ro chính

- **Boundary leak**: web vô tình import core/astro-engine → chặn bằng ESLint no-restricted-imports.
- **Mang nhầm secrets / apps/app**: kiểm tra `git status`, đảm bảo `.env` được gitignore khi migrate.
- **Drift logic React→Svelte**: dễ sai semantics khi chuyển hook sang runes (đặc biệt `$effect` vs `useEffect` về timing).
- **Legacy snapshot**: phải xử lý đúng cả lá số mới (slug) lẫn legacy v1 (Hán read-time).

## 8. Câu hỏi muốn xin ý kiến

- adapter-static SPA có phải lựa chọn đúng, hay nên cân nhắc adapter-node/SSR cho phần nào?
- Chiến lược migrate (fresh git init 1 commit) so với giữ lịch sử git — đánh đổi gì?
- Cách tổ chức `@ziweiai/contracts` dùng chung qua `workspace:*` có điểm mù nào về build/type khi web là Svelte còn api là NestJS?
- Deploy: static host cho `apps/web` (Cloudflare Pages / Netlify / nginx) + Node host cho `apps/api` — bố trí CI/CD và env tách biệt thế nào hợp lý?
- Rewrite React Query → Svelte Query: cạm bẫy thường gặp về cache key, SSR-off, hydration?
