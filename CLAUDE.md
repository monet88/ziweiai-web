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
