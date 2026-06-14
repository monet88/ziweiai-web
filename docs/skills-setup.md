# Bộ skill AI Agent cho ziweiai-web

Tài liệu này liệt kê các Agent Skill phù hợp với stack `ziweiai-web`
(SvelteKit + Svelte 5 runes + TypeScript + pnpm/Turbo + Supabase + Zod +
TanStack Svelte Query + NestJS) kèm lệnh cài cụ thể.

> **Nguyên tắc:** ưu tiên skill **official** (pin theo version package, ít
> hallucination), cài **scoped theo project** (`.claude/skills/` trong repo này)
> thay vì global để dễ kiểm soát, và **đọc `SKILL.md` trước khi cài** với skill
> community.

## Cài nhanh (bộ tối thiểu khuyến nghị)

```bash
# 1. Svelte official MCP skills (runes + autofixer) — qua plugin marketplace
#    /plugin marketplace add sveltejs/mcp   (chạy trong Claude Code)
#    /plugin install <skill>@sveltejs

# 2. Scaffold + review SvelteKit (có target SPA/Static đúng adapter-static)
npx skills add OliveiraCleidson/svelte-5-skills --all

# 3. Monorepo Turborepo (official Vercel) — cho Phase 1 migrate
npx skills add vercel/turborepo

# 4. Supabase official (auth client-only + RLS + Postgres best practices)
#    /plugin marketplace add supabase/agent-skills   (Claude Code)
npx skills add supabase/agent-skills
```

Vercel Skills CLI cài được cho nhiều agent: thêm `-a claude-code -a cursor` để
chọn agent đích, hoặc `--all` để cài cho tất cả.

## Công cụ cài: `npx skills` (vercel-labs/skills)

`npx skills` là CLI cài skill **trung lập stack** (hỗ trợ 67+ agent gồm
Claude Code, Cursor, Codex). Đây là công cụ dùng xuyên suốt tài liệu này.

```bash
npx skills add <owner/repo>                 # cài cả repo
npx skills add <owner/repo> --skill <name>  # cài 1 skill
npx skills add <owner/repo> --list          # liệt kê skill trong repo
npx skills add <owner/repo> -a claude-code  # chọn agent đích
npx skills find <keyword>                    # tìm skill theo từ khoá
npx skills list                              # xem skill đã cài
npx skills update                            # cập nhật skill
```

Mặc định cài **scoped theo project** (`.claude/skills/` trong repo này); thêm
`-g` để cài global.

## Skill trung lập từ Vercel (dùng được cho Svelte)

Bộ `vercel-labs/agent-skills` thiên về React/Next, **nhưng** vài skill độc lập
framework dùng tốt cho SvelteKit:

| Skill | Cài | Phủ |
|---|---|---|
| web-design-guidelines | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines` | 100+ rule a11y, focus state, form, animation, typography, i18n — review UI bất kỳ framework |
| writing-guidelines | `npx skills add vercel-labs/agent-skills --skill writing-guidelines` | Chuẩn voice/tone cho docs, README, prose |
| skill-creator | `npx skills add vercel-labs/agent-skills --skill skill-creator` | Tự viết SKILL.md riêng cho repo (vd skill về invariant CJK/ngôn ngữ) |
| vercel-deploy-claimable | `npx skills add vercel-labs/agent-skills --skill vercel-deploy-claimable` | Deploy nhanh — auto-detect SvelteKit/Vite (tùy chọn cho `apps/web`) |

> **Bỏ qua** các skill React-cứng trong repo này: `react-best-practices`,
> `react-view-transitions`, `composition-patterns`, `react-native-guidelines`
> — không dùng được với Svelte.

## Bậc 1 — Official (độ tin cậy cao nhất, cài trước)

| Skill | Nguồn | Cài | Phủ |
|---|---|---|---|
| Svelte MCP skills (`svelte-code-writer`, `svelte-core-bestpractices`, autofixer) | Official Svelte `@sveltejs/mcp` — https://svelte.dev/docs/ai/skills | `/plugin marketplace add sveltejs/mcp` (Claude Code) hoặc copy `tools/skills` vào `.claude/skills` | Runes, reactivity, styling, autofix `.svelte`/`.svelte.ts`. Cập nhật theo version Svelte (5.42+) |
| turborepo | Official Vercel | `npx skills add vercel/turborepo` | Task pipeline, cache, monorepo conventions, anti-patterns — dùng cho Phase 1 |
| Supabase + Postgres best practices | Official Supabase | `/plugin marketplace add supabase/agent-skills` + `/plugin install postgres-best-practices@supabase-agent-skills` | Auth setup, RLS multi-tenant, index/schema, query optimization |

## Bậc 2 — Community chất lượng cao (Svelte/SvelteKit)

| Skill | Nguồn | Cài | Điểm mạnh |
|---|---|---|---|
| svelte-skills-kit (svelte5-runes, sveltekit-data-flow, sveltekit-structure) | `spences10/svelte-skills-kit` | plugin marketplace của tác giả | Verified 90-95% vs docs; kèm forced-eval hook khắc phục skill không tự kích hoạt |
| svelte5-init / svelte5-review / sveltekit-review | `OliveiraCleidson/svelte-5-skills` | `npx skills add OliveiraCleidson/svelte-5-skills --all` | **Có target SPA/Static** đúng adapter-static; review rune correctness + routing/load |
| claude-svelte5-skill | `splinesreticulating/claude-svelte5-skill` | clone vào `.claude/skills` | Tiết kiệm ~3.3k token/request; `$derived` vs `$effect`, `goto()` navigation, SSE |
| svelte5-sveltekit | `alejandrojnm/svelte5-sveltekit` | clone vào `.claude/skills` | Form actions + **Zod validation** + remote functions |

## Bậc 3 — TypeScript / monorepo / testing nền tảng

| Skill | Nguồn | Cài | Phủ |
|---|---|---|---|
| typescript-clean-code | `bmad-labs/skills` | `npx skills add bmad-labs/skills --skill typescript-clean-code` | Clean code, architecture conventions, PR review |
| typescript-unit-testing (TS/NestJS+Jest) | `bmad-labs/skills` | `npx skills add bmad-labs/skills --skill typescript-unit-testing` | Unit test cho `apps/api` NestJS |
| typescript-e2e-testing | `bmad-labs/skills` | `npx skills add bmad-labs/skills --skill typescript-e2e-testing` | E2E + TDD workflow |
| pnpm-workspace | `oakoss/agent-skills` | `npx skills add oakoss/agent-skills --skill pnpm-workspace` | Workspace filtering, catalogs |
| typescript-patterns | `oakoss/agent-skills` | `npx skills add oakoss/agent-skills --skill typescript-patterns` | Type utilities, generics nâng cao |
| mastering-typescript | `SpillwaveSolutions/mastering-typescript-skill` | `npx skills add SpillwaveSolutions/mastering-typescript-skill --skill mastering-typescript` | TS 5.9+, Zod, Vite 7, ESLint 9 |

## TanStack Svelte Query — kiểm tra skill kèm package

TanStack có **TanStack Intent**: skill ship kèm npm package, pin theo version
cài đặt. Sau khi cài `@tanstack/svelte-query`, kiểm tra package có kèm `SKILL.md`
không — đây là nguồn chính xác nhất cho cache key / invalidation, tránh tài liệu
v4 cũ. Đây là rủi ro đã ghi trong plan (bẫy cache/hydration khi port React Query
→ Svelte Query).

## Cảnh báo bảo mật

Skill có thể đọc file, chạy lệnh, truy cập credential.

- Ưu tiên official (Anthropic, Svelte, Vercel, Supabase, TanStack).
- Với community skill: đọc `SKILL.md` trước khi cài, hoặc quét qua scanner
  (Mondoo Skill Check / ClawHub) để phát hiện prompt injection / credential theft.
- Cài scoped theo project (`.claude/skills/` trong repo này), không cài global
  trừ khi đã tin tưởng.

## Ánh xạ skill → phase của plan

| Phase | Skill liên quan |
|---|---|
| Phase 1 — Migrate monorepo skeleton | turborepo, pnpm-workspace |
| Phase 2 — Scaffold web + foundations | svelte5-init, Svelte MCP skills, mastering-typescript |
| Phase 3 — Auth + route guard | supabase/agent-skills, sveltekit-data-flow |
| Phase 4 — Pure logic + i18n + tokens | typescript-patterns, svelte-core-bestpractices |
| Phase 5 — UI primitives | svelte5-review, claude-svelte5-skill |
| Phase 6 — Dashboard + birth form | svelte5-sveltekit (form actions + Zod), TanStack Svelte Query |
| Phase 7 — Ziwei chart detail + explanation | sveltekit-review, svelte-core-bestpractices |
| Phase 8 — Other systems + history | typescript-unit-testing, typescript-e2e-testing |
