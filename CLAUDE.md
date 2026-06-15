# CLAUDE.md

`ziweiai-web` — monorepo fullstack: backend NestJS (`apps/api`) + web SvelteKit SPA (`apps/web`, đang dựng) + package nội bộ dùng chung. Sản phẩm: luận giải Tử Vi / chiêm tinh, auth Supabase client-only, AI explanation. Migrate từ Expo app cũ sang Svelte 5 runes.

Trả lời người dùng bằng **tiếng Việt**. Mã định danh code giữ quy ước repo.

## Project map

```text
apps/
  api/                    # NestJS backend (+ supabase/ migrations bên trong)
  web/                    # SvelteKit SPA — Svelte 5 runes (đang dựng, Phase 2+)
packages/
  config/                 # tsconfig/base + eslint/base (no runtime dep)
  contracts/              # Zod schemas + types — DÙNG CHUNG api + web (zod v4)
  core/                   # logic, kéo iztro — SERVER-ONLY
  astro-engine/           # iztro + lunar-javascript + temporal — SERVER-ONLY
vendor/xuanshu-runtime/   # runtime SERVER-ONLY (LiuYao/DaLiuRen/QiMen bridge)
docs/
  product/                # hợp đồng sản phẩm (overview, invariants, api-contract)
  stories/epics/          # story packets US-001..US-007 (1 packet / phase)
  decisions/              # quyết định durable (0006 naming, 0007 boundary, ...)
SPEC.md                   # single source of truth — spec đầy đủ 8 phase
.ref/ wiki/ raw/          # nghiên cứu (read-only, .ref gitignore)
scripts/bin/harness-cli.exe  # durable layer CLI (intake/story/trace/matrix)
```

<important if="bạn đang bắt đầu BẤT KỲ task code nào trong repo này">

Đọc theo thứ tự TRƯỚC khi sửa code:

1. `SPEC.md` — single source of truth. Phần A (bối cảnh + 2 bất biến + migrate map + API surface + React→Svelte mapping), Phần B (kiến trúc web Section 1–22), Phần C (8 phase).
2. `docs/product/invariants.md` — 2 bất biến bắt buộc (ngôn ngữ + bảo mật). Vi phạm = chặn.
3. Story packet của phase đang làm: `docs/stories/epics/`. Chạy `scripts/bin/harness-cli.exe query matrix` để biết trạng thái proof.
4. `docs/decisions/` nếu task chạm kiến trúc / naming / boundary.

SPEC là sự thật về *ý định*. Code + test là sự thật về *hành vi*. Khi lệch nhau, đọc `docs/decisions/0006-spec-vs-code-naming.md` rồi xác nhận tên thật trong `packages/contracts/src/`.
</important>

<important if="bạn cần chạy lệnh build / test / lint / typecheck / dev">

Chạy từ repo root. pnpm@10.17.1, Node >=22, Turbo.

| Lệnh | Tác dụng |
|---|---|
| `pnpm install` | Cài deps toàn workspace |
| `turbo build` | Build mọi package theo thứ tự phụ thuộc |
| `turbo test` | Test toàn workspace |
| `turbo typecheck` | Typecheck toàn workspace |
| `pnpm lint` | ESLint toàn workspace (`--max-warnings=0`) |
| `pnpm -F @ziweiai/api dev` | Chạy backend NestJS |
| `pnpm -F @ziweiai/api test` | Test backend (Vitest) |
| `pnpm -F @ziweiai/web dev` | Chạy web SvelteKit (Phase 2+) |
| `pnpm -F @ziweiai/web build` | Build SPA tĩnh ra `build/` |
| `pnpm -F @ziweiai/web check` | svelte-check + tsc |
| `pnpm why zod` | Xác nhận chỉ một phiên bản zod v4 |
</important>

<important if="bạn đang thêm import / dependency vào apps/web">

`apps/web` chỉ được import `@ziweiai/contracts` từ workspace nội bộ. TUYỆT ĐỐI không import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, `lunar-javascript` — chúng kéo engine tính lá số + ephemeris + chữ Hán vào client bundle. ESLint `no-restricted-imports` chặn ở mức lint. Nếu cần hằng/regex nhỏ từ core (vd `CJK_TEXT_PATTERN`) → copy giá trị vào `apps/web/src/lib/text/cjk.ts`, KHÔNG import core. Chi tiết: `docs/decisions/0007-web-server-boundary.md`.
</important>

<important if="bạn đang viết code hiển thị nhãn, tên cung/sao, hoặc xử lý chart snapshot ở web">

Bất biến ngôn ngữ: frontend KHÔNG BAO GIỜ có chữ Hán — mọi nhãn tiếng Việt. `translateZiweiKey` fail-fast (key thiếu → throw, cấm fallback im lặng ra Hán). Snapshot legacy v1 có `displayName` Hán → guard `CJK_TEXT_PATTERN` + fallback `"Thuật ngữ cũ"`. Mọi output UI phải qua được test quét `\p{Script=Han}`. Chi tiết: `docs/product/invariants.md`.
</important>

<important if="bạn đang xử lý env / secret / biến cấu hình">

Chỉ `PUBLIC_*` được lộ ra client bundle: `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`. Server secret (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_COMPAT_API_KEY`, geocoding key) chỉ sống ở `apps/api`. Web đọc env qua `$env/static/public`, không `process.env`. Không bao giờ commit `.env` thật.
</important>

<important if="bạn đang gọi backend API hoặc parse response ở web">

5 endpoint: `GET /health` (public), `POST /charts`, `GET /charts/:id`, `POST /explanations`, `GET /history?limit=N` (đều Bearer). Mọi response UI dùng phải `parse()` bằng schema từ `@ziweiai/contracts` (tên camelCase: `historyListResponseSchema`, `chartDetailResponseSchema`, ...) — KHÔNG tự định nghĩa DTO ở web. api-client dùng hàm phẳng (`fetchHealth`/`createChart`/`fetchChartDetail`/`createExplanation`/`fetchHistory`). Token = `session.access_token` gửi qua `Authorization: Bearer`, đọc từ auth store ngay trước mỗi request (không snapshot lúc mount). Chi tiết: `docs/product/api-contract.md`.
</important>

<important if="bạn đang viết hoặc sửa file .svelte / .svelte.ts (rewrite từ React/Expo)">

Svelte 5 runes: `useState`→`$state`, `useMemo`→`$derived`, `useQuery`→`createQuery`, `useMutation`→`createMutation`, Context→`setContext`/`getContext`, `useRouter`→`goto`. KHÔNG port `useEffect` máy móc sang `$effect` — nhiều effect React nên thành `$derived` hoặc event handler. `createQuery` phải bọc options trong hàm: `createQuery(() => ({ ... }))` để giữ reactivity. Styling: scoped CSS + `var(--*)`, KHÔNG Tailwind. Nguồn React để đọc tham khảo nằm ở repo gốc `F:/CodeBase/ziweiai/apps/app/` (không tồn tại trong repo này). Mapping đầy đủ: SPEC.md Phần A8.
</important>

<important if="bạn cần chạy harness-cli (intake / story / trace / matrix / decision / backlog)">

CLI nằm ở `scripts/bin/harness-cli.exe` (KHÔNG phải `scripts/harness-cli.exe`). Trong Git Bash trên Windows gọi bằng đường dẫn tương đối từ repo root: `scripts/bin/harness-cli.exe <lệnh>`. `harness.db` là durable layer (đã init, gitignore).

Bẫy cú pháp đã xác nhận trên repo này:
- `--outcome` chỉ nhận `completed | blocked | partial | failed` (CHECK constraint, giá trị khác → lỗi sqlite).
- Proof story là boolean **dạng số** `1`/`0` — CLI từ chối `yes`/`no`.
- Flag trace là `--read` và `--changed` (KHÔNG phải `--files-read`/`--files-changed`).
- `trace` bắt buộc tối thiểu `--summary --outcome --agent --actions`; thêm `--friction` (hoặc `--errors`) để đạt tier `standard` mà lane normal yêu cầu.
- Backlog lane dùng `--risk tiny|normal|high-risk` (`low` không hợp lệ).

| Lệnh (tiền tố `scripts/bin/harness-cli.exe`) | Khi nào |
|---|---|
| `query matrix` | xem trạng thái proof mọi story (đọc trước khi làm) |
| `query matrix --numeric` | lấy proof dạng `1/0` để copy lại vào `story update` |
| `query backlog` / `query stats` | xem friction / thống kê |
| `intake --type <type> --summary <text> --lane <lane>` | ghi NGAY khi nhận task (type: spec-slice/change-request/maintenance/...; lane: tiny/normal/high-risk) |
| `story add --id US-NNN --title <text> --lane <lane> --verify "<cmd>"` | tạo story packet mới |
| `story update --id US-NNN --unit 1 --integration 1 --e2e 0 --platform 0` | cập nhật proof sau khi validate |
| `story verify US-NNN` | chạy verify command đã cấu hình của story |
| `decision add --id NNNN-slug --title <text> --doc docs/decisions/<file>.md --notes <text>` | ghi decision durable (kèm file markdown) |
| `trace --intake <n> --story US-NNN --summary <text> --outcome completed --agent <name> --actions <text> --read <files> --changed <files> --friction <text>` | ghi trace cuối task |
| `backlog add --title <text> --pain <text> --risk tiny` | ghi friction khi phát hiện |
</important>

<important if="bạn đang nhận một task code hoặc chuẩn bị kết thúc task trong repo này (normal/high-risk)">

6 RULE HARNESS BẮT BUỘC cho repo này (thứ tự thực thi):

1. **Nạp ngữ cảnh trước** — TRƯỚC bất kỳ việc gì, đọc + phân tích nền tảng: `SPEC.md`, `docs/product/invariants.md`, `docs/HARNESS.md`, `docs/FEATURE_INTAKE.md`, `docs/ARCHITECTURE.md`, `docs/CONTEXT_RULES.md`, story packet của phase, và `query matrix`. Hiểu bức tranh tổng thể + quyết định kiến trúc đã chốt trước khi chạm code.

2. **Đánh giá & phân rã, KHÔNG nhảy thẳng vào code** — nhận spec (User Story + Acceptance Criteria), `intake` để phân loại độ phức tạp/rủi ro (lane tiny/normal/high-risk theo `docs/FEATURE_INTAKE.md`), rồi bẻ nhỏ thành Epic/Story cụ thể (product doc + story packet) trước khi viết dòng code đầu tiên. Mỗi phase ứng 1 story `US-001..US-007`; chỉ làm trong lane + phạm vi story đã chọn.

3. **Sửa doc drift TRƯỚC khi code** — nếu phát hiện lệch giữa code thật và tài liệu (vd tên schema, hành vi), cập nhật tài liệu/SPEC/decision cho khớp sự thật code TRƯỚC, rồi mới implement story. Giữ tài liệu luôn sống. Mẫu lệch đã biết: `docs/decisions/0006-spec-vs-code-naming.md`.

4. **Vòng lặp kiểm chứng bắt buộc** — sau khi implement xong mỗi story/milestone, chạy validation thật: unit / integration API / E2E / browser smoke tùy story. Cập nhật proof vào test matrix qua `story update --unit 1 --integration 1 ...` (boolean số) bằng kết quả lệnh **ĐÃ thực sự chạy xanh** — đừng bao giờ claim pass khi chưa chạy.

5. **Ghi vết & friction backlog** — ghi `trace` cuối mỗi task (đúng/sai đều lưu, kèm `--friction` khi có). Gặp cản trở (thiếu tool, môi trường chưa đủ) → `backlog add` thay vì đoán mò; để dự án tiến hóa từ khiếm khuyết thu thập được.

6. **Ghi decision khi đổi kiến trúc** — bất kỳ thay đổi kiến trúc / boundary / naming contract / bất biến nào: tạo `docs/decisions/NNNN-*.md` (từ `docs/templates/decision.md`) + `decision add` NGAY. Durable layer ghi nhớ *vì sao* dự án đi hướng này.

Lưu ý: CLAUDE.md gốc tham chiếu `docs/TOOL_REGISTRY.md` nhưng file đó hiện thiếu (đã ghi backlog).
</important>

<important if="bạn được yêu cầu thay đổi kiến trúc, boundary, naming contract, hoặc bất biến">

Dừng và xác nhận với người dùng trước. Ghi decision durable: tạo `docs/decisions/NNNN-*.md` từ `docs/templates/decision.md` + `harness-cli.exe decision add`. Không tự nới fail-fast `translateZiweiKey`, không tự tắt test quét Hán, không tự nới boundary import của web.
</important>

## Skill Reference — bảng tham chiếu nhanh

Gọi skill **TRƯỚC** khi hành động, không gọi sau khi đã làm xong. Skill là công cụ chuyên biệt — dùng đúng skill tiết kiệm thời gian hơn làm tay.

### A. Trước khi code (nạp ngữ cảnh + đánh giá)

| Skill | Khi gọi | Tác dụng |
|---|---|---|
| **find-docs** | Cần tra cứu API/SDK/library/framework (Svelte, TanStack, Supabase, NestJS, Zod, Playwright, ...) — kể cả thứ "đã biết" vì training data có thể cũ | Gọi Context7 CLI lấy docs chính xác phiên bản đang dùng. Luôn gọi `library` trước rồi `docs`. Không dùng cho logic nghiệp vụ |
| **scrutinize** | Review plan/PR/design/approach — cần góc nhìn outsider kiểm tra tính đúng đắn trước khi code | Phân tích intent → trace code path → xác minh change làm đúng điều nó hứa. Dùng trước khi implement task lớn hoặc review code người khác |
| **scan** | Trước khi bắt đầu phase mới, muốn biết codebase có vấn đề gì đang tồn tại | Quét toàn bộ codebase tìm issues + security problems |
| **learnings** | Muốn biết team quan tâm gì trong code review, pattern nào được ưa thích | Xem cubic learnings của repo |
| **wiki** | Cần đọc tài liệu wiki của repo trên cubic | Browse cubic wiki documentation |

### B. Trong khi code (implement Svelte 5 runes)

| Skill | Khi gọi | Tác dụng |
|---|---|---|
| **svelte-code-writer** | Tạo/sửa BẤT KỲ file `.svelte` hoặc `.svelte.ts` nào — luôn gọi trước khi viết | Validate Svelte 5 runes, tránh sai `$state`/`$derived`/`$effect`/`$props`. Đây là skill TỔNG — tự route đến các skill con bên dưới khi cần |
| **svelte-runes** | Dùng `$state`, `$derived`, `$effect`, `$state.raw`, `$derived.by`, `$props`, `$bindable` | Đảm bảo đúng pattern reactive Svelte 5, không lẫn V1 (`@State`, `@Prop`, ...) |
| **svelte-components** | Dùng thư viện component (Bits UI, Ark UI, Melt UI), form pattern, hoặc tích hợp third-party | Hướng dẫn đúng cách dùng custom elements + component libraries |
| **svelte-styling** | Viết CSS trong Svelte — scoped styles, `var(--*)`, `:global`, style directive | Đảm bảo styling đúng convention Svelte, không dùng Tailwind |
| **svelte-template-directives** | Dùng snippets, attachments, `{@html}`, `{@debug}`, global DOM events | Hướng dẫn đúng cú pháp template Svelte 5 |
| **sveltekit-structure** | Làm routing, layouts, error handling, SSR, `svelte:boundary` | Đảm bảo đúng file naming, nested layouts, error boundaries, pending UI |
| **sveltekit-data-flow** | Dùng load functions, form actions, server/client boundary, serialization, invalidation | Đảm bảo data flow đúng SvelteKit — project này là SPA nên ít dùng, nhưng vẫn cần cho pattern đúng |
| **svelte-layerchart** | Dùng LayerChart — tooltip snippets, Chart context, gradients, highlights, axes | Chỉ khi làm việc với chart/visualization |
| **tanstack-query** | Dùng `createQuery` / `createMutation` — đặc biệt khi nghi ngờ behavior (cache, staleTime, reset data lúc pending, ...) | Tra cứu docs TanStack Query chính xác phiên bản, tránh phải đọc source `node_modules` |
| **supabase** | Làm auth, database, storage, RLS, migration — bất kỳ task nào chạm Supabase | Hướng dẫn đúng API + pattern cho supabase-js, @supabase/ssr, RLS |
| **typescript-unit-testing** | Viết/sửa `.spec.ts` — mock, AAA pattern, in-memory DB | Đảm bảo test đúng cấu trúc, mock đúng cách |

### C. Ngay sau khi code (review + validate)

Gọi theo thứ tự: **code-review** → **security-review** (nếu code chạm auth/input/API) → chạy test thật → **verify**

| Skill | Khi gọi | Tác dụng |
|---|---|---|
| **code-review** | **MANDATORY** — ngay sau khi viết/sửa code xong, trước khi commit | Review diff: correctness bugs + reuse/simplification/efficiency. Mức low/medium: high-confidence findings; high/max: broader coverage |
| **simplify** | Sau code-review, muốn clean up code — reuse, simplification, altitude | Chỉ quality, không hunt bugs. Áp dụng trực tiếp các finding vào working tree |
| **security-review** | Code chạm auth, input validation, database, file system, API call, crypto, payment | Audit toàn diện các vấn đề bảo mật. Gọi TRƯỚC khi commit code nhạy cảm |
| **verify** | Sau khi sửa, cần xác nhận fix hoạt động thật — chạy app + quan sát behavior | Tự động launch app, verify change hoạt động đúng. Dùng sau khi code-review pass |
| **run** | Cần chạy app để xem change hoạt động (không chỉ test) | Launch app + drive để xem kết quả thật |
| **debug-mantra** | Debug — gặp bug, lỗi, stack trace, hoặc hành vi không như mong đợi | 4 bước: reproduce → trace fail path → falsify hypothesis → cross-reference. Gọi TRƯỚC khi sửa bug |
| **run-review** | Muốn chạy cubic AI review trên local changes trước khi push | Chạy cubic review local, không cần PR |
| **post-mortem** | Sau khi fix xong một bug quan trọng, trước khi đóng ticket | Viết RCA canonical: root cause → mechanism → fix → validation → how it slipped through |

### D. Sau khi merge (ghi vết + docs)

| Skill | Khi gọi | Tác dụng |
|---|---|---|
| **post-mortem** | Bug đã fix + merge, cần viết RCA cho team | Viết bài học kỹ thuật — dùng chung với mục debug trên |
| **management-talk** | Cần báo cáo cho leadership (VP, director, PM, release manager) | Rewrite kỹ thuật → ngôn ngữ quản lý. Dùng cho JIRA comment, Slack post, standup, email |
| **improve-claude-md** | CLAUDE.md có `important if` không được tuân thủ tốt, hoặc phát hiện thiếu rule | Phân tích + cải thiện CLAUDE.md để tăng adherence |

### E. Meta / Setup (không thường xuyên)

| Skill | Khi gọi | Tác dụng |
|---|---|---|
| **update-config** | Cần đổi settings.json — permissions, env vars, hooks | Cấu hình Claude Code harness. Dùng khi thêm allowlist, đổi hook, set env |
| **fewer-permission-prompts** | Quá nhiều permission prompt khi chạy Bash/MCP | Quét transcript, tạo allowlist ưu tiên trong settings.json |
| **claude-api** | Cần reference Claude API — model ids, pricing, params, streaming, token counting | Tra cứu API chính xác, tránh dùng giá trị cũ từ training data |
| **init** | Khởi tạo CLAUDE.md mới cho codebase chưa có | Tạo file CLAUDE.md ban đầu với phân tích codebase |
| **prompt-master** | Viết/sửa/tối ưu prompt cho LLM, Cursor, Midjourney, hoặc AI tool khác | Sinh prompt tối ưu cho bất kỳ AI tool nào |

### F. KHÔNG dùng trong repo này

| Skill | Lý do |
|---|---|
| **notebooklm** | Google NotebookLM — không liên quan |
| **deep-research** | Fan-out web search — repo này dùng local docs + Context7 + Exa là đủ |
| **techdebt-finder** | Tìm technical debt — có thể dùng nhưng không phải workflow chính |
| **svelte-deployment** | Deploy guide — chưa tới phase deploy |
| **sveltekit-remote-functions** | `query()`, `form()` pattern — project này là SPA, gọi REST API qua `fetchJson`, không dùng SvelteKit server functions |
| **claude-hud:setup / claude-hud:configure** | Cấu hình HUD statusline — không liên quan đến code |
| **keybindings-help** | Phím tắt — không liên quan |
| **loop** | Recurring task — không dùng trong workflow chính |
| **comments** | Xem cubic review comments trên PR — có thể dùng nhưng niche, thường đọc trực tiếp trên GitHub |
| **review** | Review PR — trùng với `code-review` + `scrutinize`, dùng hai skill kia chi tiết hơn |

### G. Quy tắc gọi skill

1. **Gọi TRƯỚC, không gọi sau** — skill cần chạy trước khi bạn hành động, không phải để kiểm tra lại việc đã làm.
2. **Một skill đúng > làm tay nhiều bước** — nếu phân vân giữa tự làm và gọi skill, gọi skill. Một lần `tanstack-query` tiết kiệm 5 phút grep `node_modules`.
3. **Skill tổng tự route đến skill con** — `svelte-code-writer` sẽ tự gọi `svelte-runes` / `svelte-styling` / ... khi cần. Bạn chỉ cần gọi skill tổng.
4. **Không gọi skill trùng lặp** — đọc output skill trước khi quyết định gọi thêm skill khác cho cùng vấn đề.
5. **Code review là MANDATORY** — mỗi lần viết/sửa code xong phải gọi `code-review` (hoặc `security-review` nếu code nhạy cảm) trước khi commit.
