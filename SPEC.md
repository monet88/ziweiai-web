# ziweiai-web — Full Project Spec

> Spec hợp nhất (single source of truth) cho dự án `ziweiai-web`. Hấp thụ toàn bộ
> nội dung kế hoạch migrate 8-phase. Phần A là bối cảnh + bất biến + bản đồ
> migrate; Phần B (Section 1–22) là kiến trúc web app chi tiết; Phần C là 8 phase
> thực thi + success criteria. Story packets sống ở `docs/stories/`, quyết định ở
> `docs/decisions/`, hợp đồng sản phẩm ở `docs/product/`.

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

Recommended `apps/web` structure:

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

| Route               | Purpose                            |        Auth |
| ------------------- | ---------------------------------- | ----------: |
| `/`                 | redirect based on session          | conditional |
| `/login`            | login/sign-up entry                |      public |
| `/auth/callback`    | Supabase auth callback handling    |      public |
| `/dashboard`        | main authenticated app shell       |    required |
| `/charts/[chartId]` | Ziwei chart detail and explanation |    required |
| `/history`          | saved chart/history list           |    required |

The app may later add routes for other systems:

```txt id="umw0o7"
bazi
liu-hao
western astrology
other chart systems
```

But the initial route architecture should not hardcode Ziwei as the only possible chart system.

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

```ts id="cn3qn3"
// apps/web/src/lib/auth/auth-state.svelte.ts
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

> 8 phase tuần tự. Mỗi phase có story packet tương ứng ở `docs/stories/`. Trạng thái
> proof sống trong durable layer Harness (`harness-cli query matrix`), không lặp lại ở đây.

## Phase 1 — Migrate monorepo skeleton

**Mục tiêu**: dựng monorepo mới, mang backend + packages + supabase + vendor +
wiki/raw/.ref, bỏ Expo. Backend giữ nguyên hành vi.

**Bước chính**: copy `apps/api` (gồm `supabase/`), `packages/*`, `vendor/xuanshu-runtime`,
file config root (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`,
`eslint.config.mjs`, `.npmrc`, `.prettierrc`, `.env.example`, `pnpm-lock.yaml`); loại
`dist/`/`node_modules/`/`.turbo/`/`.env`. `pnpm install` → `turbo build` → test.

**Validation**: `pnpm install` sạch; `pnpm why zod` chỉ v4; `turbo build` xanh;
`pnpm -F @ziweiai/api test` xanh; `pnpm -F @ziweiai/api typecheck` xanh; không có `apps/app`.

**Trạng thái**: ✅ DONE (2026-06-14) — build 4/4, test 18 files / 81 passed.

## Phase 2 — Scaffold apps/web + nền tảng

**Mục tiêu**: thêm `apps/web` (SvelteKit + Svelte 5), chạy `dev`; dựng tầng
env/supabase/query-client/api-client; `GET /health` xanh qua api-client thật.

**Bước chính**: scaffold SvelteKit skeleton (`@ziweiai/web`, private); cài deps
(`@tanstack/svelte-query`, `@supabase/supabase-js`, `@sveltejs/adapter-static`,
`@ziweiai/contracts: workspace:*`); adapter-static SPA (`ssr=false`, `prerender=false`);
`tsconfig` extends `@ziweiai/config/tsconfig/base`; eslint `no-restricted-imports` cấm
`core`/`astro-engine`/`iztro`/`lunar-javascript`; move-adapt env/api-client/query-client/
supabase-client; `+page.svelte` health check tạm.

**Validation**: `pnpm install` sạch; `pnpm why zod` một v4; `dev` lên trang health xanh;
`tsc --noEmit` xanh; `build` ra `build/`; ESLint fail nếu import core/astro-engine.

**Story**: `docs/stories/epics/E01-web-foundation/US-001-scaffold-web-foundation.md`.

## Phase 3 — Auth client-only + route guard

**Mục tiêu**: đăng nhập Supabase client-only; store auth runes giữ session +
access_token tươi; route group `(app)` redirect `/sign-in` khi chưa auth; token bơm
vào api-client.

**Bước chính**: `auth-store.svelte.ts` (`$state` session/loading, `onAuthStateChange`
subscribe + cleanup, `getAccessToken`, `signIn`/`signOut`); `+layout.svelte` init auth
+ setContext; `sign-in/+page.svelte` form email/password; `(app)/+layout.svelte` guard
`$effect` (chờ `loading=false` trước khi redirect).

**Validation**: chưa auth vào `(app)` → redirect `/sign-in`; auth thành công →
`GET /history` 200; logout → redirect; session idle qua refresh → request sau vẫn 200;
`tsc --noEmit` xanh.

**Rủi ro**: token refresh không propagate (đọc token từ store ngay trước mỗi request,
không snapshot lúc mount); vòng lặp redirect (chờ `loading=false`); `detectSessionInUrl`.

## Phase 4 — Logic thuần + i18n + design tokens

**Mục tiêu**: mang logic thuần (không phụ thuộc React) + từ điển i18n tiếng Việt +
design tokens; test quét chữ Hán có khung.

**Bước chính**: copy verbatim logic thuần (palace-grid-layout, palace-view-builder,
chart-detail-view-state, chart-explanation-intent, explanation-sections, markdown-blocks,
birth-profile-draft, history-query, chart-system-registry); copy-adapt `chart-display.ts`
(giữ `@ziweiai/contracts`); i18n (`ziwei-terms-vi.ts`: `process.env.NODE_ENV` →
`import.meta.env.DEV`); `theme/tokens.ts` → `tokens.css`; `text/cjk.ts` copy
`CJK_TEXT_PATTERN` + fallback `"Thuật ngữ cũ"`. **BỎ** `legacy-ziwei-display-name.ts` +
`iztro`.

**Validation**: `tsc --noEmit` xanh; vitest test dịch key + test quét Hán xanh; smoke
build palace view-model in ra toàn tiếng Việt.

**Quyết định Q4**: bỏ `iztro` khỏi web (lý do + đánh đổi): `docs/decisions/` (legacy
hiển thị `"Thuật ngữ cũ"` thay tên chính xác — chấp nhận; fix triệt để là migrate
snapshot legacy → slug key ở backend).

## Phase 5 — UI primitives + AppScaffold

**Mục tiêu**: tầng UI nền — RN primitive + StyleSheet → HTML + scoped CSS/CSS vars;
bộ component dùng lại + khung `AppScaffold`.

**Bước chính**: `Spinner` + `FullScreenState` trước; `PrimaryButton` (variant/loading/
disabled, focus-visible ring); `FormField`/`TextInputField`/`SelectField` (`$bindable`,
`aria-invalid`/`aria-describedby`); `SummaryCard`/`NoticeBanner`/`EmptyStateCard`
slot-based; `AppScaffold` (header + `<main>` semantic + container responsive). Mọi style
`var(--*)`; chỉ animate `transform`/`opacity`. `useWindowDimensions` → CSS media query
(768/1024).

**Validation**: `tsc --noEmit` + `pnpm check` (svelte-check) xanh; route nháp
`/_ui-sandbox` (dev-only) kiểm mắt; kiểm keyboard focus ring; không chữ Hán.

**Rủi ro**: kỷ luật "kiềm chế" — primitive đủ dùng, không thêm biến thể chưa cần (YAGNI).

## Phase 6 — Dashboard + birth form + nav

**Mục tiêu**: màn chính sau đăng nhập — form nhập sinh + sidebar lịch sử + điều hướng
giữa các hệ. Tạo lá số (POST /charts) + điều hướng tới chi tiết.

**Bước chính** (tách nhỏ DashboardScreen): `dashboard-model.svelte.ts` (factory: state
draft + `createMutation` createChart + điều hướng); `BirthForm.svelte`;
`DashboardSidebar.svelte` (history limit 8); `ChartSystemPicker.svelte` (registry).
Layout 2 cột responsive, <768px xếp dọc. Lỗi mutation → `NoticeBanner` tiếng Việt.

**Validation**: `pnpm check` + `tsc --noEmit` xanh; E2E/thủ công: đăng nhập → form hợp
lệ → submit → điều hướng chi tiết với id thật; thiếu field → chặn + lỗi tiếng Việt;
sidebar load hoặc empty.

**Rủi ro**: DashboardScreen quá lớn (bắt buộc tách); vòng lặp reactive draft (draft là
`$state` thuần, validity `$derived`); map `chartSystem` → route đúng.

## Phase 7 — Chi tiết Tử Vi + luận giải AI

**Mục tiêu**: trang chi tiết Tử Vi — vẽ vòng 12 cung, chọn cung, sinh luận giải AI theo
cung (POST /explanations). Màn hình lõi.

**Bước chính**: `+page.svelte` lấy `chartSnapshotId` từ `$page.params`, `createQuery`
`fetchChartDetail`; `chart-detail-model.svelte.ts` (`$state` selectedPalaceKey, reset khi
chartId đổi qua `{#key chartId}`, TRÁNH `$effect` ghi state); `PalaceGrid`/`PalaceCell`
(CSS grid 4x4 từ palace-grid-layout); `explanation-model.svelte.ts` (`createMutation`
createExplanation theo intent cung); `ExplanationSectionCard` + `MarkdownView` (sanitize,
KHÔNG `{@html}` thô). Tên cung/sao qua `translateZiweiKey` fail-fast; legacy Hán →
`"Thuật ngữ cũ"`.

**Validation**: `pnpm check` + `tsc --noEmit` xanh; thủ công/E2E: mở lá số → 12 cung
tiếng Việt → chọn cung → luận giải markdown tiếng Việt → đổi lá số → state reset đúng;
test quét Hán trên output palace + explanation.

**Rủi ro**: vòng lặp reset theo chartId (`{#key}` thay `$effect`); `{@html}` XSS (bắt
buộc sanitize); rò chữ Hán từ AI (điều tra prompt/backend, KHÔNG nới test);
`use-palace-explanation-model.ts` reader bỏ sót — PHẢI định vị, fallback tái dựng từ
`chart-explanation-intent` + `createExplanation`.

## Phase 8 — 5 hệ thuật số khác + history + chốt guard Hán

**Mục tiêu**: hoàn thiện BaZi/MeiHua/LiuYao/DaLiuRen/QiMen + trang lịch sử + chốt test
quét chữ Hán toàn cục. Đạt đủ Success Criteria.

**Bước chính**: 5 route wrapper mỏng (tái dùng `dashboard-model` + `BirthForm` với
`initialChartSystem` + copy riêng); detail card mỗi hệ (presentational, breakpoint CSS);
trang chi tiết chọn card theo `chartSystem`; `history/+page.svelte` (`createQuery` limit
20, `HistoryList` link đúng hệ); `tests/no-han-characters.test.ts` quét `\p{Script=Han}`
toàn hệ; rà secret không lọt client bundle.

**Validation**: `pnpm build` + `tsc --noEmit` + `pnpm check` xanh; `pnpm test` (Hán +
dịch key + logic thuần) xanh; E2E mỗi hệ: tạo → chi tiết → (Tử Vi: luận giải) → history
thấy item mới; xác nhận Success Criteria.

**Rủi ro**: drift copy 5 wrapper (giữ chung `dashboard-model`); card thiếu field → empty
state; test Hán bắt lỗi (bổ sung từ điển, KHÔNG nới fail-fast/tắt test); lộ secret (grep
`SERVICE_ROLE`/`DEEPSEEK`/`GEMINI` trong `src/` → vi phạm bất biến bảo mật).

## Success Criteria (toàn dự án)

- Repo mới fresh init; `pnpm install` + `turbo build` xanh toàn workspace (api + packages + web).
- `pnpm -F @ziweiai/api test` xanh (backend giữ nguyên hành vi sau migrate).
- `apps/web` chạy `pnpm dev` lên SvelteKit, gọi `GET /health` xanh.
- Đăng nhập Supabase client-only; route bảo vệ redirect `/sign-in` khi chưa auth.
- Tạo lá số, xem chi tiết Tử Vi (vòng 12 cung), sinh luận giải AI theo cung.
- 5 module BaZi/MeiHua/LiuYao/DaLiuRen/QiMen + history hoạt động.
- Không có chữ Hán ở bất kỳ màn hình nào; test quét chữ Hán xanh trên `build/`.
- Boundary giữ nguyên: web bundle chỉ `PUBLIC_*` + `@ziweiai/contracts`, không
  `core`/`astro-engine`/secret.

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
