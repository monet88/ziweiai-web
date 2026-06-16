# ziweiai-web — Full Project Spec

> Spec hợp nhất (single source of truth) cho dự án `ziweiai-web`. Phần A là bối cảnh
> + bất biến + bản đồ migrate; Phần B (Section 1–22) là kiến trúc web app chi tiết;
> Phần C là roadmap thực thi: 8 phase migrate đã hoàn thành được cô đọng vào
> **Changelog**, các phase mới (Phase 9+) là spec đang hoạt động. Story packets sống ở
> `docs/stories/`, quyết định ở `docs/decisions/`, hợp đồng sản phẩm ở `docs/product/`.

---

# Phần A — Bối cảnh, phạm vi & bất biến

## A1. Mục tiêu

Tạo monorepo fullstack mới `ziweiai-web` (đã `git init`), trong đó:

- **Mang nguyên** (migrate as-is): backend NestJS `apps/api`, các package nội bộ
  `packages/{contracts,core,astro-engine,config}`, `apps/api/supabase/`,
  `vendor/xuanshu-runtime/`, và `wiki/` + `raw/` + `.ref/`.
- **BỎ** Expo app `apps/app` (React Native) — không port 1:1 mà **viết lại** sang
  Svelte, đọc tham khảo từ repo gốc.
- **THÊM** `apps/web` — SvelteKit + Svelte 5 runes + TypeScript + Vite +
  `@tanstack/svelte-query` + `@supabase/supabase-js`, tiêu thụ `@ziweiai/contracts`
  qua `workspace:*`.

**Lý do migrate fullstack** (thay vì web-only client): nếu chỉ copy contracts sang
web-only sẽ gây **schema drift**. Chỉ migrate trọn vẹn (repo mới là nhà duy nhất
của backend) mới triệt tiêu drift — contracts trở thành **package workspace dùng
chung** giữa api và web.

Repo gốc `F:/CodeBase/ziweiai` giữ nguyên, read-only, chỉ dùng đọc bản React/RN
khi viết lại sang Svelte.

## A2. Quyết định phạm vi (đã chốt)

- **Hướng**: fullstack repo mới (migrate), không phải web-only client.
- **Git**: fresh init, 1 commit đầu, bỏ lịch sử git repo gốc.
- **Contracts dùng chung**: `@ziweiai/contracts` là workspace package; api + web cùng
  import qua `workspace:*` → không còn schema drift.
- **Auth**: client-only Supabase (session ở Supabase + localStorage), không SSR cookie.
  Từ Phase 10 (US-009): bỏ tường đăng nhập — khách vào là có **anonymous session**
  (`signInAnonymously()`), nên luôn có JWT thật. Đăng nhập email chỉ cần cho lịch sử
  bền vững + nội dung trả phí. Backend (FK/RLS/quota/ownership) giữ nguyên vì anon user
  vẫn là một dòng `auth.users` thật. Chi tiết: `docs/decisions/0009-anonymous-auth-strategy.md`.
- **Styling**: scoped CSS thuần của Svelte + CSS custom properties (port từ
  `tokens.ts` vào `:root`). KHÔNG Tailwind. Dark-only, một `:root`.
- **Adapter**: `adapter-static` chế độ SPA (`fallback: 'index.html'`, `ssr=false`,
  `prerender=false` toàn cục). SPA fallback ở host: `_redirects` (`/* /index.html 200`)
  hoặc nginx `try_files`.
- **Legacy Tử Vi**: BỎ port `iztro` vào web bundle. Chỉ copy regex `CJK_TEXT_PATTERN`,
  giữ guard phát hiện Hán + fallback an toàn `"Thuật ngữ cũ"`. (`iztro` vẫn ở
  `core`/`astro-engine` phía backend — chỉ cấm rò sang client.)

## A3. BẤT BIẾN NGÔN NGỮ (bắt buộc)

> Frontend KHÔNG BAO GIỜ có chữ Hán — mọi nhãn hiển thị đều tiếng Việt.

- Contract/snapshot dùng key ASCII slug, không lưu chữ Hán.
- Frontend sở hữu từ điển key→tiếng Việt đầy đủ; token thiếu phải fail rõ, **cấm**
  fallback im lặng ra chữ Hán (`translateZiweiKey` fail-fast).
- Giữ test quét `\p{Script=Han}` trên output UI để chặn rò chữ Hán.
- i18n hiện chỉ `vi.ts`; giữ khung `AppLanguage` (`vi-VN`) để mở rộng sau.
- Chữ Hán (`displayName`) chỉ xuất hiện read-time khi đọc snapshot **legacy v1** cũ,
  qua `z.preprocess(normalizeLegacyChartSnapshot, …)` trong contracts. Web dùng chung
  contracts nên khi `parse()` snapshot v1 cũng nhận `displayName` Hán → guard CJK +
  fallback `"Thuật ngữ cũ"` là BẮT BUỘC. Đã verify backend KHÔNG pre-migrate snapshot
  legacy thành slug key trong DB (2026-06-14). Chi tiết: `docs/product/invariants.md`.

## A4. BẤT BIẾN BẢO MẬT (bắt buộc)

- **Boundary client/server**: `apps/web` chỉ được import `@ziweiai/contracts` (pure
  TS+Zod). TUYỆT ĐỐI không import `@ziweiai/core` / `@ziweiai/astro-engine` (kéo `iztro`
  + `lunar-javascript` + ephemeris + chữ Hán vào client bundle). Guard ESLint
  `no-restricted-imports` ở `apps/web` + CI + test quét Hán trên `build/`.
- Chỉ `PUBLIC_*` env lộ ra client: `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`,
  `PUBLIC_SUPABASE_ANON_KEY`.
- Server secret (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`,
  `GEMINI_API_KEY`, `OPENAI_COMPAT_API_KEY`, geocoding key) chỉ sống ở `apps/api`.
- Token = `session.access_token` (Supabase JWT) gửi qua `Authorization: Bearer`.
- `autoRefreshToken: true` + `onAuthStateChange` để token luôn tươi, tránh 401 ngầm.
- **Entitlement trả phí** (từ Phase 11 / US-010): cổng kiểm tra quyền dùng luận giải AI
  phải nằm **server-side** (`apps/api`). Cờ `PUBLIC_*` ở web chỉ điều khiển hiển thị
  paywall — KHÔNG được là hàng rào thanh toán duy nhất (client dễ bypass). Chi tiết:
  `docs/decisions/0010-premium-ai-entitlement-flag.md`.

Chi tiết bất biến + decision: `docs/product/invariants.md`,
`docs/decisions/0007-web-server-boundary.md`.

## A5. Cây phụ thuộc monorepo (xác nhận từ package.json)

```text
packages/config       (tsconfig/base + eslint/base — không dep runtime)
  └─ packages/contracts   (chỉ zod@^4.1.12)               ← apps/web import được
       └─ packages/core         (kéo iztro)               ← SERVER-ONLY, cấm ở web
            └─ packages/astro-engine (iztro + lunar-javascript + @js-temporal)  ← SERVER-ONLY
                 └─ apps/api  (NestJS: contracts + core + astro-engine)
apps/web (MỚI)  ←  chỉ @ziweiai/contracts (workspace:*) + svelte stack
vendor/xuanshu-runtime  ←  runtime SERVER-ONLY, bridge từ astro-engine spawn qua tsx
apps/app (Expo) ←  BỎ
```

Workspace: pnpm@10.17.1, Node `>=22`, Turbo; `pnpm-workspace.yaml` = `apps/*` + `packages/*`.

## A6. Bản đồ migrate / tái dùng

| Nguồn (repo gốc) | Chiến lược | Ghi chú |
|---|---|---|
| `packages/contracts/` | migrate as-is | Workspace pkg dùng chung api+web. Hết schema drift. |
| `packages/core/`, `packages/astro-engine/` | migrate as-is | Server-only. CHỈ backend dùng; web cấm import. |
| `packages/config/` | migrate as-is | tsconfig/eslint base; web extends. |
| `apps/api/**` + `apps/api/supabase/**` | migrate as-is | NestJS + migrations/rollbacks/seed/config.toml. |
| `vendor/xuanshu-runtime/` | migrate as-is | Runtime server-only cho LiuYao/DaLiuRen/QiMen; bridge spawn qua `tsx`. Cần build astro-engine trước khi chạy. |
| `wiki/`, `raw/`, `.ref/` | migrate as-is | `.ref/` gitignore như cũ. |
| `apps/app/` (Expo) | **drop** | Không mang. Logic frontend cần thì viết lại sang Svelte. |
| `apps/app/src/lib/api-client/{fetch-json,index}.ts` | move→web, adapt | `appEnv.EXPO_PUBLIC_*` → `$env/static/public`; import `@ziweiai/contracts`. |
| `apps/app/src/lib/query-client.ts` | move→web, adapt | `@tanstack/react-query` → `@tanstack/svelte-query`. `staleTime: 30_000, retry: 1`. |
| `apps/app/src/lib/supabase/supabase-client.ts` | move→web, adapt | Bỏ `react-native-url-polyfill` + AsyncStorage; localStorage mặc định. |
| `apps/app/src/config/env.ts` | move→web, adapt | `EXPO_PUBLIC_*` → `PUBLIC_*`, `process.env` → `$env/static/public`. |
| Logic thuần frontend (chart-display, palace-view-builder, palace-grid-layout, markdown-blocks, explanation-sections, birth-profile-draft, history-query, chart-system-registry, chart-detail-view-state, chart-explanation-intent) | move→web | Không phụ thuộc React. `legacy-ziwei-display-name.ts` BỎ → `lib/text/cjk.ts` + fallback. |
| i18n (`vi.ts`, `ziwei-terms-vi.ts`, `ziwei-star-terms-vi.ts`) | move→web | `process.env.NODE_ENV` → `import.meta.env.DEV`. |
| `theme/tokens.ts` | move→web | → CSS custom properties (`:root`); không Tailwind. |
| Auth (`auth-context`, `auth-provider`, `auth-shell`, `sign-in-screen`) | rewrite-svelte | Context → runes store + setContext; useEffect → $effect; Redirect → goto. |
| Toàn bộ `.tsx` screens + components | rewrite-svelte | RN primitives → HTML; useState→$state; useQuery→createQuery; useMemo→$derived. |

**Lưu ý migrate**: loại trừ `dist/`, `node_modules/`, `.turbo/`, `.env` (secret),
`harness.db`, `.codegraph/` khi copy.

## A7. API surface (xác nhận từ contracts thật)

| Endpoint | Auth | Body / Param | Response schema (tên THẬT) |
|---|---|---|---|
| `GET /health` | Public | — | `healthResponseSchema` |
| `POST /charts` | Bearer | `createChartRequestSchema` | `createChartResponseSchema` |
| `GET /charts/:id` | Bearer | param `z.uuid()` | `chartDetailResponseSchema` |
| `POST /explanations` | Bearer | `createExplanationRequestSchema` | `createExplanationResponseSchema` |
| `GET /history?limit=N` | Bearer | limit int 1-50, default 20 | `historyListResponseSchema` |

> Tên schema dùng **camelCase** như export thật trong `@ziweiai/contracts` (không phải
> PascalCase như minh hoạ ở Section 13). api-client dùng hàm phẳng
> `fetchHealth/createChart/fetchChartDetail/createExplanation/fetchHistory`, không phải
> `apiClient.charts.listHistory()`. Reconcile: `docs/decisions/0006-spec-vs-code-naming.md`.
> Chi tiết hợp đồng: `docs/product/api-contract.md`.

## A8. React → Svelte 5 mapping (chuẩn dùng xuyên suốt)

| React / RN / Expo | Svelte 5 / SvelteKit |
|---|---|
| `useState(x)` | `let x = $state(...)` |
| `useMemo(fn, deps)` | `$derived(...)` / `$derived.by(...)` |
| `useEffect(fn, deps)` + cleanup | `$effect(() => { …; return cleanup })` |
| `useQuery` (react-query) | `createQuery(() => ({ queryKey, queryFn, enabled }))` |
| `useMutation` | `createMutation(...)`, gọi `$mut.mutate()` |
| React Context + `useX()` | `setContext(KEY, store)` / `getContext(KEY)` |
| `useRouter().push/replace` | `goto(path, { replaceState })` từ `$app/navigation` |
| `useLocalSearchParams` | `$page.params` từ `$app/stores` |
| `ScrollView/View/Text/Pressable/TextInput` | `div/p/span/h1-3/button/input` |
| `ActivityIndicator` | CSS spinner |
| `StyleSheet.create` | scoped `<style>` + CSS vars (`var(--*)`), KHÔNG Tailwind |
| `useWindowDimensions` | CSS media query / `bind:clientWidth` |
| Expo group `(app)` | SvelteKit route group `src/routes/(app)/` |
| `ErrorBoundary` (class) | `<svelte:boundary>` hoặc `+error.svelte` |
| `AsyncStorage` | `localStorage` |

> Cạm bẫy: KHÔNG port `useEffect` máy móc sang `$effect`. Nhiều effect React nên thành
> `$derived` hoặc event handler trong Svelte. `createQuery` phải bọc options trong
> hàm để giữ reactivity (xem Section 7).

---

# Phần B — Kiến trúc Web App (Section 1–22)

## 1. Decision

`apps/web` is a SvelteKit SPA implemented with:

```txt id="7ram6j"
SvelteKit
Svelte 5 runes
TypeScript
Vite
@tanstack/svelte-query
@supabase/supabase-js
@ziweiai/contracts
scoped Svelte CSS
CSS custom properties
```

The web app is client-rendered only.

It must not contain server-side SvelteKit logic during the initial migration.

Do not use:

```txt id="s6ccj4"
+page.server.ts
+layout.server.ts
+server.ts API routes
SvelteKit form actions
SSR-only auth
Tailwind
React compatibility layers
React Native compatibility layers
```

## 2. Runtime Mode

`apps/web` runs as a static SPA.

Required root route options:

```ts id="yr3rty"
// apps/web/src/routes/+layout.ts
export const ssr = false;
export const prerender = false;
```

Required adapter:

```js id="ro6cmt"
// apps/web/svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html'
    })
  }
};

export default config;
```

The exact fallback filename may be changed per deployment host. The invariant is SPA fallback routing.

## 3. Package Dependencies

`apps/web/package.json` should include:

```json id="7dr9oz"
{
  "name": "@ziweiai/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "@tanstack/svelte-query": "^5.0.0",
    "@ziweiai/contracts": "workspace:*",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

Version numbers should be normalized with the actual repo dependency policy. The key architectural requirement is not the exact version shown above; it is that `apps/web` imports only `@ziweiai/contracts` from the internal workspace.

## 4. Directory Layout

> **Minh hoạ, KHÔNG phải truth.** Cây dưới là đề xuất Phase 2; cấu trúc thật đã ship lệch
> tên thư mục/file (pattern "SPEC là input material" — xem [[0006-spec-vs-code-naming]]).
> Truth là cây file thật trong `apps/web/src/`. Map minh hoạ → thật:
>
> | SPEC minh hoạ | File thật đã ship |
> | --- | --- |
> | `lib/api/{client,errors,fetch-json,endpoints}.ts` | `lib/api-client/{index,fetch-json}.ts` (hàm phẳng) |
> | `lib/config/env.ts` | `lib/env.ts` |
> | `lib/query/{query-client,keys}.ts` | `lib/query-client.ts` (factory, không `keys.ts` riêng) |
> | `lib/supabase/client.ts` | `lib/supabase/supabase-client.ts` |
> | `lib/auth/{auth-state,auth-guard,session}` | `lib/auth/{auth-store.svelte.ts,auth-context.ts}` + guard inline trong `(app)/+layout.svelte` |
> | `lib/text/ziwei-terms.ts` | `lib/i18n/{vi,ziwei-terms-vi,ziwei-star-terms-vi}.ts` (`lib/text/cjk.ts` giữ guard) |
> | `lib/ui/*` | `lib/components/ui/*` |
> | `routes/{login,dashboard}/`, `routes/auth/callback/` | `routes/sign-in/`, group `routes/(app)/` (dashboard ở `(app)/+page.svelte`); **không** có `/auth/callback` |
> | `styles/{tokens,global}.css` | tokens nhúng `:root` (từ `tokens.ts`); không thư mục `styles/` riêng |
>
> Các hệ khác có route thật: `(app)/{bazi,meihua,liuyao,daliuren,qimen,history}/+page.svelte`.

Recommended `apps/web` structure (minh hoạ):

```txt id="jel7sl"
apps/web/
├── src/
│   ├── app.d.ts
│   ├── app.html
│   ├── hooks.client.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── errors.ts
│   │   │   ├── fetch-json.ts
│   │   │   └── endpoints.ts
│   │   ├── auth/
│   │   │   ├── auth-state.svelte.ts
│   │   │   ├── auth-guard.svelte.ts
│   │   │   └── session.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── query/
│   │   │   ├── query-client.ts
│   │   │   └── keys.ts
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   ├── text/
│   │   │   ├── cjk.ts
│   │   │   └── ziwei-terms.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── birth-profile/
│   │   │   ├── ziwei-chart/
│   │   │   ├── explanations/
│   │   │   └── history/
│   │   └── ui/
│   │       ├── Button.svelte
│   │       ├── Card.svelte
│   │       ├── Field.svelte
│   │       └── ...
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.ts
│   │   ├── +page.svelte
│   │   ├── login/
│   │   │   └── +page.svelte
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── +page.svelte
│   │   ├── dashboard/
│   │   │   └── +page.svelte
│   │   ├── charts/
│   │   │   └── [chartId]/
│   │   │       └── +page.svelte
│   │   └── history/
│   │       └── +page.svelte
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── static/
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 5. Route Model

Initial route map:

> Cập nhật từ Phase 10 (US-009): bỏ tường đăng nhập. Khách có **anonymous session**
> (Supabase `signInAnonymously`) nên vẫn lập + xem được lá số. Chỉ `/history` và luận
> giải AI cần danh tính cao hơn. Chi tiết: `docs/decisions/0009-anonymous-auth-strategy.md`.

> Route THẬT trong code (`apps/web/src/routes/`): root layout `+layout.svelte` (group
> `(app)` qua thư mục), `(app)/+page.svelte` (dashboard), `sign-in/+page.svelte`,
> `(app)/charts/[chartId]/+page.svelte`, `(app)/history/+page.svelte`, và 5 route hệ
> `(app)/{bazi,meihua,liuyao,daliuren,qimen}/+page.svelte`. **KHÔNG** có `/auth/callback`
> (Supabase client-only dùng implicit/refresh trong store, không cần route callback
> riêng). Bảng dưới đã đồng bộ với code; cột Auth là trạng thái **mục tiêu Phase 10**
> (US-009 chưa implement — hiện guard vẫn redirect `/sign-in`, xem §12).

| Route                          | Purpose                            |              Auth (mục tiêu P10) |
| ------------------------------ | ---------------------------------- | -------------------------------: |
| `/sign-in`                     | login/sign-up entry (tùy chọn)     |                           public |
| `/` (dashboard)                | main app shell + birth form        |                anonymous-allowed |
| `/charts/[chartId]`            | Ziwei chart detail + explanation   |                anonymous-allowed |
| `/{bazi,meihua,liuyao,daliuren,qimen}` | 5 hệ thuật số khác (form + detail) |          anonymous-allowed |
| `/history`                     | saved chart/history list           |                  email-user only |

`anonymous-allowed` = mọi visitor (kể cả chưa đăng nhập email) dùng được, vì luôn có
JWT từ anonymous session. `email-user only` = cần tài khoản email thật (anon session
không đủ) — guard phân biệt qua `isAnonymous` của Supabase user.

5 route hệ (`bazi/meihua/liuyao/daliuren/qimen`) đã live từ Phase 8 (US-007) — route
architecture không hardcode Ziwei là hệ duy nhất; `chartSystem` quyết định detail card.

## 6. Root Layout Responsibilities

`src/routes/+layout.svelte` owns global providers:

```txt id="1q79hx"
QueryClientProvider
global auth initialization
global CSS import
app shell container
```

Recommended shape:

```svelte id="htn6ry"
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { queryClient } from '$lib/query/query-client';
  import '$styles/tokens.css';
  import '$styles/global.css';

  let { children } = $props();
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

Do not create a new `QueryClient` inside every page or component. It must be app-global.

## 7. Query Client

> **Minh hoạ.** Code thật dùng **factory** `createAppQueryClient()` trong
> `lib/query-client.ts` (không phải singleton `queryClient` export sẵn) — mỗi phiên tạo
> client riêng để logout/đổi danh tính có thể `clear()` sạch. `staleTime: 30_000, retry: 1`
> giữ đúng. Pattern `createQuery(() => ({ ... }))` (wrap trong hàm) là bắt buộc và đã áp dụng.

Create one browser-side QueryClient.

```ts id="62f06x"
// apps/web/src/lib/query/query-client.ts
import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      enabled: browser,
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});
```

Because this app has SSR disabled globally, `enabled: browser` is defensive rather than strictly required. Keep it anyway to prevent accidental query execution if SSR is reintroduced later.

TanStack Svelte Query requires query options to be wrapped in a function to preserve Svelte reactivity.

Required pattern:

```svelte id="ivwk79"
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { apiClient } from '$lib/api/client';

  const chartsQuery = createQuery(() => ({
    queryKey: ['charts', 'history'],
    queryFn: () => apiClient.charts.listHistory()
  }));
</script>
```

Avoid this pattern:

```svelte id="os286l"
<script lang="ts">
  const chartsQuery = createQuery({
    queryKey: ['charts', 'history'],
    queryFn: () => apiClient.charts.listHistory()
  });
</script>
```

The second form risks losing reactive behavior in Svelte Query.

## 8. Query Key Policy

> **Minh hoạ.** Code thật KHÔNG có `lib/query/keys.ts` tập trung — query key được khai
> báo inline tại chỗ dùng (vd `['history']`, `['chart-detail', chartId]`), token-scoped
> qua auth store. Nguyên tắc dưới (key mảng ổn định, invalidate đúng key sau mutation,
> tránh rò cache cross-user) vẫn áp dụng; chỉ khác là không gom về một file `keys.ts`.

All query keys must be defined centrally.

```ts id="a8m04a"
// apps/web/src/lib/query/keys.ts
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const
  },
  charts: {
    history: () => ['charts', 'history'] as const,
    detail: (chartId: string) => ['charts', 'detail', chartId] as const,
    explanation: (chartId: string) =>
      ['charts', 'explanation', chartId] as const
  },
  birthProfiles: {
    draft: () => ['birth-profile', 'draft'] as const
  }
};
```

Rules:

```txt id="juw776"
Use stable array keys
Do not use object literals unless their shape is stable
Include user-specific scope when data can differ by user
Invalidate exact keys after mutations
Do not duplicate stringly-typed keys across components
```

If data is user-specific and user id is available, prefer:

```ts id="n6oslu"
['charts', userId, 'history']
```

over:

```ts id="f4xrah"
['charts', 'history']
```

This prevents stale cross-user cache after logout/login on the same browser.

## 9. Environment Variables

Web env must use public SvelteKit env only.

Required public variables:

```txt id="dm4vo6"
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
PUBLIC_API_BASE_URL
```

Recommended env module:

```ts id="x4l7ok"
// apps/web/src/lib/config/env.ts
import {
  PUBLIC_API_BASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL
} from '$env/static/public';
import { z } from 'zod';

const PublicEnvSchema = z.object({
  PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_SUPABASE_URL: z.string().url(),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export const publicEnv = PublicEnvSchema.parse({
  PUBLIC_API_BASE_URL,
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
});
```

Forbidden in `apps/web`:

```txt id="o8q5qy"
process.env
$env/static/private
$env/dynamic/private
SUPABASE_SERVICE_ROLE_KEY
AI provider keys
database URLs
JWT secrets
```

Do not import `@ziweiai/config` into web unless it is explicitly split into browser-safe exports.

## 10. Supabase Browser Client

Supabase client lives in one module:

```ts id="tvw15h"
// apps/web/src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '$lib/config/env';

export const supabase = createClient(
  publicEnv.PUBLIC_SUPABASE_URL,
  publicEnv.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
```

Notes:

```txt id="g32l4s"
Supabase anon key is public.
Supabase service role key is never public.
Browser session persistence is acceptable for this SPA model.
Server-side cookie auth is not used in the initial architecture.
```

If SSR is introduced later, this module must be revisited. Do not reuse a browser-only client in server load functions.

## 11. Auth State

Auth state should be centralized in a rune-based module.

> Cập nhật từ Phase 10 (US-009): mô hình auth không còn `unauthenticated` như một
> trạng thái nghỉ. `initialize()` luôn đảm bảo có session — nếu Supabase chưa có session
> thì gọi `signInAnonymously()` để mọi visitor đều có JWT. Phân biệt 2 mức danh tính:
>
> - `isAnonymous` (Supabase `user.is_anonymous === true`): lập + xem lá số được, nhưng
>   KHÔNG xem `/history` và KHÔNG sinh luận giải AI.
> - email-user (đăng nhập thật): mở khóa `/history` + luận giải AI.
>
> Token vẫn là `session.access_token` cho mọi mức — contract Bearer không đổi. Chi tiết:
> `docs/decisions/0009-anonymous-auth-strategy.md`. Khối code dưới là hình mẫu Phase 3
> (client-only thuần); Phase 10 mở rộng `initialize()` thêm nhánh anonymous + getter
> `isAnonymous`/`isEmailUser`.

```ts id="cn3qn3"
// apps/web/src/lib/auth/auth-state.svelte.ts
// ⚠️ Minh hoạ. Code thật: class `AuthStore` ở `lib/auth/auth-store.svelte.ts` (KHÔNG
// singleton `authState`) + cấp qua `setContext`/`getContext` (`lib/auth/auth-context.ts`),
// không export instance toàn cục. Method thật: `init()` (không `initialize()`),
// `getAccessToken()`, getter `isAuthenticated`/`isInitializing`. Xem [[0006-spec-vs-code-naming]].
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase/client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

class AuthState {
  session = $state<Session | null>(null);
  user = $derived<User | null>(this.session?.user ?? null);
  status = $state<AuthStatus>('loading');

  async initialize() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      this.session = null;
      this.status = 'unauthenticated';
      return;
    }

    this.session = data.session;
    this.status = data.session ? 'authenticated' : 'unauthenticated';

    supabase.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.status = session ? 'authenticated' : 'unauthenticated';
    });
  }

  async signOut() {
    await supabase.auth.signOut();
    this.session = null;
    this.status = 'unauthenticated';
  }
}

export const authState = new AuthState();
```

Root layout should initialize auth once.

```svelte id="og0e9c"
<script lang="ts">
  import { onMount } from 'svelte';
  import { authState } from '$lib/auth/auth-state.svelte';

  onMount(() => {
    authState.initialize();
  });

  let { children } = $props();
</script>

{@render children()}
```

Do not initialize auth separately in every page.

## 12. Route Guard

Route guard should be client-side only.

```ts id="61syof"
// apps/web/src/lib/auth/auth-guard.svelte.ts
// ⚠️ Minh hoạ. Code thật KHÔNG có file `auth-guard.svelte.ts` / `requireAuth()` tách riêng:
// guard nằm inline trong `routes/(app)/+layout.svelte` (một `$effect` chờ `!isInitializing`
// rồi `goto(resolve('/sign-in'))`). Từ Phase 10 (US-009) guard này sẽ bỏ redirect cứng vì
// anon-session luôn tồn tại. Xem [[0006-spec-vs-code-naming]].
import { goto } from '$app/navigation';
import { authState } from './auth-state.svelte';

export function requireAuth() {
  $effect(() => {
    if (authState.status === 'unauthenticated') {
      goto('/login');
    }
  });
}

export function redirectAuthedUser() {
  $effect(() => {
    if (authState.status === 'authenticated') {
      goto('/dashboard');
    }
  });
}
```

Usage in protected page:

```svelte id="gw5ei3"
<script lang="ts">
  import { requireAuth } from '$lib/auth/auth-guard.svelte';

  requireAuth();
</script>
```

However, be strict about the security interpretation:

```txt id="l0xsvs"
Client-side route guards are UX only.
They are not authorization.
The API must enforce real authorization.
```

## 13. API Client

The API client must be centralized and contract-validated.

Recommended modules:

```txt id="zxue33"
src/lib/api/fetch-json.ts
src/lib/api/client.ts
src/lib/api/errors.ts
src/lib/api/endpoints.ts
```

Base fetch utility:

```ts id="5zef1h"
// apps/web/src/lib/api/fetch-json.ts
import { supabase } from '$lib/supabase/client';
import { publicEnv } from '$lib/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchJsonOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
};

export async function fetchJson<T>(
  path: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${publicEnv.PUBLIC_API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const responseBody = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
      responseBody
    );
  }

  return responseBody as T;
}
```

Contract-validated endpoint wrapper:

```ts id="hszskc"
// apps/web/src/lib/api/client.ts
import {
  ChartHistoryResponseSchema,
  ChartDetailResponseSchema
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

export const apiClient = {
  charts: {
    async listHistory() {
      const json = await fetchJson<unknown>('/charts/history');
      return ChartHistoryResponseSchema.parse(json);
    },

    async getDetail(chartId: string) {
      const json = await fetchJson<unknown>(`/charts/${chartId}`);
      return ChartDetailResponseSchema.parse(json);
    }
  }
};
```

Rules:

```txt id="0m6qvr"
Every API response used by UI must be parsed with @ziweiai/contracts.
Do not duplicate DTO types inside apps/web.
Do not trust raw JSON even inside the monorepo.
Treat Zod parse failures as integration bugs.
```

## 14. Auth + Query Cache Interaction

On logout, clear user-specific query cache.

```ts id="5463mv"
import { queryClient } from '$lib/query/query-client';

await authState.signOut();
queryClient.clear();
```

Without cache clearing, the same browser can briefly show previous user data after logout/login.

Minimum required behavior:

```txt id="b6tjsc"
logout clears query cache
auth token changes invalidate user-specific queries
protected pages do not fetch until auth status is authenticated
```

Example guarded query:

```svelte id="4ddvxs"
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { authState } from '$lib/auth/auth-state.svelte';
  import { apiClient } from '$lib/api/client';
  import { queryKeys } from '$lib/query/keys';

  const historyQuery = createQuery(() => ({
    queryKey: queryKeys.charts.history(),
    queryFn: () => apiClient.charts.listHistory(),
    enabled: authState.status === 'authenticated'
  }));
</script>
```

## 15. Svelte 5 State Policy

Use Svelte 5 runes for local and feature state.

Allowed:

```txt id="1t5fck"
$state
$derived
$effect
```

Rules:

```txt id="dw6f8o"
Use $state for local mutable UI state.
Use $derived for computed state.
Use $effect only for side effects.
Do not use $effect to compute state that should be $derived.
Do not mirror server state into $state unless there is a strong UI reason.
Use Svelte Query for server state.
```

React migration mapping:

| React/RN                     | Svelte 5                                  |
| ---------------------------- | ----------------------------------------- |
| `useState`                   | `$state`                                  |
| `useMemo`                    | `$derived`                                |
| `useEffect` for side effects | `$effect` or `onMount`                    |
| `useQuery`                   | `createQuery`                             |
| `useMutation`                | `createMutation`                          |
| React context provider       | Svelte module state or provider component |
| `useRouter`                  | `goto` / `$app/navigation`                |

Pitfall:

```txt id="r7b0ek"
Do not port useEffect mechanically to $effect.
Many React effects should become $derived or explicit event handlers in Svelte.
```

## 16. Feature Module Policy

Feature modules live under:

```txt id="xjvfly"
src/lib/features/
```

Each feature can contain:

```txt id="tpkto5"
components
queries
mutations
view builders
formatters
feature-local types
```

Example:

```txt id="eupm3l"
src/lib/features/ziwei-chart/
├── components/
│   ├── ZiweiChartView.svelte
│   ├── PalaceGrid.svelte
│   └── PalaceCard.svelte
├── queries.ts
├── view-builder.ts
├── translations.ts
└── types.ts
```

Rules:

```txt id="p2jfej"
Feature modules may import @ziweiai/contracts.
Feature modules may import shared web utilities.
Feature modules may not import @ziweiai/core.
Feature modules may not import @ziweiai/astro-engine.
Feature modules may not import backend source.
```

## 17. UI State vs Server State

Use Svelte Query for:

```txt id="pb84s3"
chart history
chart detail
AI explanation
saved birth profiles
current user-owned server resources
```

Use `$state` for:

```txt id="j0lnhd"
form drafts
active tab
expanded/collapsed panels
selected palace
modal visibility
transient UI errors
```

Use localStorage only for:

```txt id="pc05dy"
non-sensitive UI preferences
recoverable birth form draft, if acceptable
theme preference
last selected chart system
```

Never store:

```txt id="jv6taa"
service keys
AI provider keys
private backend secrets
authoritative chart results as trusted data
```

## 18. Styling Architecture

Use Svelte scoped CSS and global design tokens.

Global tokens:

```css id="tw58s9"
/* apps/web/src/styles/tokens.css */
:root {
  --color-bg: #0f0d14;
  --color-surface: #181420;
  --color-text: #f6efff;
  --color-muted: #b8a9c9;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;

  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Rules:

```txt id="t1qvto"
No Tailwind.
No global utility class explosion.
Component layout styles should stay scoped.
Design tokens live in global CSS custom properties.
```

## 19. Static Asset Policy

Use `apps/web/static/` only for assets that should be served as-is.

Examples:

```txt id="97x4p3"
favicon
manifest
static icons
social images, if any
```

Do not place private research files or raw backend reference data into `apps/web/static`.

Anything in static output is public.

## 20. Error Handling

API errors should map to UI states.

Minimum categories:

```txt id="2vuybd"
401 unauthenticated
403 unauthorized
404 not found
422 validation error
500 server error
network error
contract parse error
```

Recommended UI behavior:

| Error           | UI behavior                                   |
| --------------- | --------------------------------------------- |
| `401`           | clear auth state and redirect to `/login`     |
| `403`           | show permission error                         |
| `404`           | show not-found state                          |
| `422`           | show form validation feedback                 |
| `500`           | show retryable server error                   |
| network         | show reconnect/retry message                  |
| Zod parse error | show generic integration error and log in dev |

Do not display raw backend exception messages directly to users.

## 21. Build Rules

`apps/web` build must fail if:

```txt id="hx3ftc"
TypeScript fails
svelte-check fails
ESLint boundary rule fails
CJK hardcode test fails
contract imports fail
forbidden server-only import is detected
```

Required scripts:

```json id="1i5nbm"
{
  "scripts": {
    "build": "vite build",
    "typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

Root CI should run:

```sh id="1gkal5"
pnpm -F @ziweiai/contracts build
pnpm -F @ziweiai/web typecheck
pnpm -F @ziweiai/web lint
pnpm -F @ziweiai/web test
pnpm -F @ziweiai/web build
```

## 22. Done Criteria

This section is implemented when:

```txt id="i2xzrl"
apps/web exists
SvelteKit builds as static SPA
ssr=false is set globally
prerender=false is set globally
QueryClientProvider wraps the app
Supabase browser client is centralized
public env is validated
API client uses PUBLIC_API_BASE_URL
API responses are parsed with @ziweiai/contracts
protected routes use client-side auth guard
logout clears query cache
apps/web imports no server-only internal package
no Tailwind is installed
no React Native dependency remains in apps/web
```

---

# Phần C — Phase thực thi

> Phase 1–8 (migrate + web v1) đã hoàn thành — tóm tắt ở **Roadmap đã hoàn thành**
> bên dưới (changelog gọn, không lặp lại spec chi tiết). Spec thực thi đầy đủ chỉ giữ
> cho các phase MỚI (9–11). Mỗi phase có story packet ở `docs/stories/`; trạng thái
> proof sống trong durable layer Harness (`harness-cli query matrix`).

## Roadmap đã hoàn thành (Phase 1–8, web v1)

> Tất cả `implemented` (xem `harness-cli query matrix`). Đây là changelog — chi tiết
> kiến trúc nằm ở Phần B (Section 1–22) và story packet tương ứng.

| Phase | Story | Nội dung | Trạng thái |
| --- | --- | --- | --- |
| 1 | — | Migrate monorepo skeleton (backend + packages + supabase + vendor; bỏ Expo) | ✅ DONE 2026-06-14 — build 4/4, test 18 files/81 passed |
| 2 | US-001 | Scaffold `apps/web` + nền tảng (env/supabase/query/api-client + guard boundary) | ✅ implemented |
| 3 | US-002 | Auth client-only Supabase + route guard `(app)` | ✅ implemented |
| 4 | US-003 | Logic thuần + i18n tiếng Việt + design tokens + CJK guard | ✅ implemented |
| 5 | US-004 | UI primitives + `AppScaffold` | ✅ implemented |
| 6 | US-005 | Dashboard + birth form + điều hướng | ✅ implemented |
| 7 | US-006 | Chi tiết Tử Vi (bàn 12 cung) + luận giải AI theo cung | ✅ implemented |
| 8 | US-007 | 5 hệ thuật số khác + history + chốt guard Hán toàn cục | ✅ implemented |

**Quyết định Q4 (Phase 4)**: bỏ `iztro` khỏi web bundle; legacy snapshot hiển thị
`"Thuật ngữ cũ"` thay tên chính xác (fix triệt để = migrate snapshot legacy → slug key
ở backend). Chi tiết: `docs/decisions/`.

---

> **Các phase MỚI (9–11)** mở rộng web v1 theo 3 hướng đã chốt: lá số trực quan kiểu bàn
> vuông truyền thống, bỏ tường đăng nhập (truy cập ẩn danh), và đưa luận giải AI vào gói
> premium. Thứ tự triển khai: 9 → 10 → 11. Quyết định nền: `docs/decisions/0009` (anonymous
> auth), `docs/decisions/0010` (premium entitlement flag).

## Phase 9 — Lá số Tử Vi trực quan (bàn vuông truyền thống)

**Story**: `docs/stories/epics/E08-ziwei-visual-board/US-008-ziwei-visual-board.md` ·
Lane **normal** · chỉ chạm `apps/web` (không đổi contract/api/DB).

**Mục tiêu**: nâng bàn 12 cung hiện có (`PalaceGrid`/`PalaceCell`) lên mức trực quan
kiểu tuvi.vn — tách vùng sao, Trường Sinh, đại vận/lưu niên, tam phương tứ chính, và
bàn vuông cho cả mobile. Đây là **nâng cấp** trên nền đã có (~80%), không làm mới.

**Bối cảnh**: bàn vuông 4x4 đã tồn tại — `PalaceGrid.svelte` có `.board` (grid 4x4 +
`BRANCH_GRID_POSITION` map địa chi vào ô viền) + `.board-center` (trung cung
`grid-row 2/4 / grid-column 2/4`). `palace-view-builder.ts` đã build đủ field
(`changsheng`, `decadalRange`, `ages`, sao theo nhóm + `brightness` + `mutagen`). Bản
tham chiếu đúng là `.ref/taibu` (bàn vuông); `.ref/xuanshu` dùng layout tròn — KHÔNG dùng.

**Bước chính**:
- `PalaceCell.svelte`: thay `<ul>` sao phẳng bằng bố cục theo vùng — chủ tinh (trên, kèm
  độ sáng/đắc-hãm) tách khỏi phụ/tạp tinh; góc ô hiển thị can-chi + Trường Sinh + đại vận
  + tuổi. Mọi nhãn vẫn qua `translateZiweiKey` (đã có ở view-builder).
- `palace-view-builder.ts`: surface `horoscope` (đại vận/lưu niên) từ snapshot (dữ liệu
  `horoscopeSchema` đã có nhưng chưa map) vào `PalaceView`; thêm overlay khi chọn cung.
- `PalaceGrid.svelte`: vẽ tam phương tứ chính khi chọn cung (công thức `[self, +6, +4, -4] mod 12`),
  có thể là SVG overlay; cho phép bàn vuông hiển thị ở mobile (scale/scroll) thay vì
  ép về lưới responsive dưới 769px.
- `chart-display.ts`: làm giàu trung cung (`formatCenterSummaryItems`) cho khối bản mệnh
  kiểu tuvi.vn.
- Bổ sung copy tiếng Việt mới ở `vi.ts` cho nhãn mới (Trường Sinh, đại vận, lưu niên...).

**Validation**: `pnpm check` + `tsc --noEmit` xanh; `pnpm test` (test quét `\p{Script=Han}`
trên mọi field mới render + test dịch key) xanh; E2E: mở lá số → bàn vuông render đủ
sao/Trường Sinh/đại vận tiếng Việt → chọn cung → highlight tam phương tứ chính → kiểm
mobile bàn vuông không tràn.

**Rủi ro**: nhãn mới (`horoscope` mutagen/palace keys, Trường Sinh) thiếu từ điển →
`translateZiweiKey` fail-fast throw (phải bổ sung `vi.ts` đầy đủ); legacy snapshot thiếu
địa chi chuẩn → vẫn rơi về lưới responsive (không vỡ); cám dỗ import logic tính cung từ
`core`/`astro-engine` để dựng tam phương tứ chính — CẤM, chỉ tính từ index/branch trên
dữ liệu contracts (decision 0007); bàn vuông ở mobile dễ chật → ưu tiên scroll/scale,
không animate width/height.

## Phase 10 — Bỏ tường đăng nhập (truy cập ẩn danh)

**Story**: `docs/stories/epics/E09-anonymous-access/US-009-anonymous-access.md` ·
Lane **high-risk** · chạm mô hình auth. Quyết định: `docs/decisions/0009-anonymous-auth-strategy.md`.

**Mục tiêu**: khách KHÔNG cần đăng nhập vẫn lập + xem lá số (giống tuvi.vn/lap-la-so-tu-vi).
Lịch sử (`/history`) + luận giải AI giữ yêu cầu danh tính. Đăng nhập email trở thành tùy chọn
"nâng cấp", không phải cổng bắt buộc.

**Quyết định nền (đã chốt)**: dùng **Supabase anonymous sign-in** — mỗi khách vẫn có JWT
thật + một dòng `auth.users` thật. Hệ quả: backend (`SupabaseAuthGuard`, ownership,
`QuotasService`, FK `owner_user_id`, RLS) **GIỮ NGUYÊN không đổi** — không migration DB,
không nới lỏng bảo mật. Đây là đường rủi ro thấp nhất; tránh hoàn toàn nullable-owner /
public-read-by-id / sửa RLS.

**Bước chính** (chỉ `apps/web`):
- `auth-store.svelte.ts`: `init()` gọi `signInAnonymously()` khi `getSession()` rỗng →
  luôn có session/JWT. Thêm phân biệt `isAnonymous` vs `isEmailUser` (xem §11).
- `(app)/+layout.svelte`: BỎ guard redirect toàn group. Dashboard `/` + `/charts/[chartId]`
  render cho mọi người; chỉ `/history` giữ "cần đăng nhập email" (CTA mời đăng nhập khi `isAnonymous`).
- `(app)/+page.svelte`: header email + nút đăng xuất chỉ hiện khi `isEmailUser`; khi
  `isAnonymous` hiện link "Đăng nhập" (tùy chọn).
- `DashboardSidebar` + history list: ẩn/hiện theo `isEmailUser` (history theo `userId`,
  anon-session không có lịch sử bền vững giữa thiết bị).
- Copy tiếng Việt mới ở `vi.ts` cho CTA ẩn danh + lời mời đăng nhập.

**Validation**: `pnpm check` + `tsc --noEmit` xanh; `pnpm test` xanh; E2E: vào app KHÔNG
đăng nhập → tự có anon session → lập lá số → xem chi tiết → reload vẫn xem được (cùng anon
session) → mở `/history` thấy CTA đăng nhập; đăng nhập email → `/history` hoạt động; đăng
xuất → quay lại anon session sạch (queryClient.clear).

**Rủi ro**: `queryKey` history theo `userId` — chuyển anon→email phải `queryClient.clear()`
tránh rò cache giữa danh tính (đường upgrade chưa được test kỹ); bỏ guard ảnh hưởng MỌI
trang trong `(app)` (mỗi trang phải chịu được trạng thái `isAnonymous`, không giả định
`auth.user` tồn tại); anon-session bền theo trình duyệt (localStorage) — xóa storage =
mất lá số chưa đăng nhập (chấp nhận, giống tuvi.vn); KHÔNG mở public GET tách rời ownership
(giữ enforcement ở tầng app như cũ).

## Phase 11 — Luận giải AI premium (gate server-side + flag free khi test)

**Story**: `docs/stories/epics/E10-premium-ai-gating/US-010-premium-ai-gating.md` ·
Lane **high-risk** · chạm `apps/api` + `packages/contracts` + `apps/web`. Quyết định:
`docs/decisions/0010-premium-ai-entitlement-flag.md`.

**Mục tiêu**: luận giải AI (`POST /explanations`) trở thành tính năng trả phí — chỉ gửi
kết quả khi người dùng có quyền. Giai đoạn hiện tại bật cờ **free toàn bộ** để test mọi
tính năng dễ dàng; khi tắt cờ, gate fail-closed.

**Quyết định nền (đã chốt)**:
- Entitlement gate đặt **server-side** trong `ExplanationsService.createExplanation`
  (ngay cạnh/sau `assertCanCreateExplanation`, TRƯỚC khi gọi provider). Client flag chỉ để
  hiển thị paywall, KHÔNG bao giờ là cổng thực thi thanh toán.
- Cờ free: env `apps/api` (vd `AI_EXPLANATION_FREE_FOR_ALL`, default `true` lúc này = free).
  Khi cờ bật → gate là no-op. Khi tắt → yêu cầu entitlement, thiếu thì ném lỗi `PAYMENT_REQUIRED`.
- AI chỉ cho người có danh tính (anon-session hoặc email) — khớp Phase 10.

**Bước chính**:
- `packages/contracts/src/api/backend-api.ts`: thêm mã lỗi `PAYMENT_REQUIRED` vào
  `apiErrorCodeSchema` (web parse mọi lỗi qua contracts — thiếu mã sẽ bị từ chối). Cân nhắc
  field entitlement/access trên response nếu cần surface trạng thái.
- `apps/api/src/config/env.ts`: thêm cờ `AI_EXPLANATION_FREE_FOR_ALL` (default `true`).
- `apps/api/.../explanations.service.ts`: chèn `assertCanUseAiExplanation(user)` — no-op khi
  cờ free; fail-closed (`402 PAYMENT_REQUIRED`) khi tắt + chưa có entitlement. Quyết định
  rõ: gate có áp cho cache-hit (kết quả đã sinh) hay chỉ lần sinh mới.
- `apps/web` (`ChartDetailScreen.svelte` + `explanation-model.svelte.ts`): khi nhận
  `PAYMENT_REQUIRED` → hiển thị CTA paywall tiếng Việt thay vì nút sinh; thêm ghi chú
  "miễn phí trong giai đoạn thử nghiệm" khi cờ free. Copy mới ở `vi.ts`.

**Validation**: `pnpm -F @ziweiai/api test` (gate no-op khi free; 402 khi tắt cờ + chưa
entitled) xanh; `turbo typecheck` (contracts đồng bộ api+web) xanh; `pnpm -F @ziweiai/web test`
(quét Hán trên copy paywall) xanh; E2E: cờ free → sinh luận giải bình thường; (mô phỏng) tắt
cờ → nhận paywall tiếng Việt, không sinh.

**Rủi ro**: cờ free quên tắt ở production → chi phí AI không kiểm soát (gate phải
fail-CLOSED khi tắt cờ + log khi đang force free); thêm `PAYMENT_REQUIRED` phải đồng bộ cả
contracts (api + web cùng parse); reasonKey/thông báo paywall phải là key tiếng Việt
(`translateZiweiKey` fail-fast + test quét Hán); chưa có nguồn entitlement thật — giai đoạn
này entitlement chỉ là khái niệm, cờ free che đi (xem Unresolved).

## Success Criteria (toàn dự án)

**Web v1 (Phase 1–8) — đã đạt:**

- Repo fresh init; `pnpm install` + `turbo build` xanh toàn workspace (api + packages + web).
- `pnpm -F @ziweiai/api test` xanh (backend giữ nguyên hành vi sau migrate).
- `apps/web` chạy `pnpm dev` lên SvelteKit, gọi `GET /health` xanh.
- Tạo lá số, xem chi tiết Tử Vi (vòng 12 cung), sinh luận giải AI theo cung.
- 5 module BaZi/MeiHua/LiuYao/DaLiuRen/QiMen + history hoạt động.
- Không có chữ Hán ở bất kỳ màn hình nào; test quét chữ Hán xanh trên `build/`.
- Boundary giữ nguyên: web bundle chỉ `PUBLIC_*` + `@ziweiai/contracts`, không
  `core`/`astro-engine`/secret.

**Phase 9–11 — tiêu chí chấp nhận mới:**

- **P9 (lá số trực quan)**: mở lá số Tử Vi → bàn vuông truyền thống render đủ vùng sao +
  Trường Sinh + đại vận/lưu niên tiếng Việt; chọn cung → highlight tam phương tứ chính;
  bàn vuông hiển thị được cả ở mobile (không tràn); test quét Hán vẫn xanh.
- **P10 (truy cập ẩn danh)**: vào app KHÔNG đăng nhập → tự có anon session → lập + xem lá số;
  KHÔNG còn redirect `/sign-in` bắt buộc; `/history` + luận giải AI vẫn cần danh tính; backend
  không đổi (anon JWT đi qua `SupabaseAuthGuard` như user thường).
- **P11 (AI premium)**: cờ `AI_EXPLANATION_FREE_FOR_ALL=true` → sinh luận giải bình thường
  (free khi test); tắt cờ + chưa entitled → server trả `402 PAYMENT_REQUIRED`, web hiển thị
  CTA paywall tiếng Việt; gate luôn fail-closed ở server, client flag chỉ để hiển thị.

## Rủi ro xuyên suốt

- **Boundary leak** (quan trọng nhất): web vô tình import `core`/`astro-engine` → ESLint
  `no-restricted-imports` + CI + test quét Hán trên `build/`.
- **Zod v4 bắt buộc**: lib khác kéo zod v3 → vỡ `z.uuid()`/`z.iso.datetime()`. `pnpm why zod`.
- **Token refresh**: propagate token mới từ `onAuthStateChange` vào store.
- **Legacy snapshot**: giữ guard CJK + fallback `"Thuật ngữ cũ"` (backend KHÔNG pre-migrate).
- **Drift React→Svelte**: `$effect` vs `useEffect` timing — nhiều effect nên thành `$derived`.

## Unresolved (chờ chốt, không chặn các phase đã làm)

- Deploy target: static host cho `apps/web` (Cloudflare Pages / Netlify / nginx) + Node
  host cho `apps/api`. Quyết định sau khi web chạy local.
- Supabase local: verify `supabase db reset` (cần Supabase CLI).
- **Nguồn entitlement thật (P11)**: hiện chỉ có cờ env `AI_EXPLANATION_FREE_FOR_ALL` (free
  toàn bộ). Khi tích hợp thanh toán thật cần chốt: bảng/cột entitlement, provider thanh toán,
  gate cache-hit, và đảo cờ về `false`. Là một decision + story riêng (xem `docs/decisions/0010`).
- **Đường nâng cấp anon → email (P10)**: `signInAnonymously` rồi `linkIdentity`/`updateUser`
  để giữ lá số khi khách đăng nhập sau — chưa test kỹ, chốt cách di trú lá số anon sang
  email account ở story sau.
