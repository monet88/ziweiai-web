# Harness Components

> File này map các thành phần Harness của repo `ziweiai-web` về thực tế trên đĩa.
> Nội dung lấy **trực tiếp từ file/lệnh thật** (không theo template `repository-harness`
> gốc). Khi code/durable layer đổi, cập nhật file này; nếu nghi ngờ, đối chiếu với
> `scripts/bin/harness-cli.exe --help` + `scripts/schema/*.sql`.

## Bối cảnh

`ziweiai-web` dùng Harness như một **lớp vận hành**, không phải sản phẩm. Sản phẩm là
monorepo Tử Vi (backend NestJS + web SvelteKit + packages dùng chung); Harness là docs +
durable layer (SQLite) giúp biến spec thành công việc có proof. CLI là một **binary
prebuilt** (`scripts/bin/harness-cli.exe`) — repo này KHÔNG chứa mã nguồn Rust (`crates/`,
`Cargo.toml`) như repo harness gốc; xem [[0005-prebuilt-rust-harness-cli]].

Status values:

- **Covered**: có file, lệnh, hoặc record cụ thể trong repo cho trách nhiệm này.
- **Partial**: có hỗ trợ nhưng chưa đầy đủ, thủ công, hoặc lệnh chưa chạy được trên DB hiện tại.
- **Missing**: chưa có hỗ trợ ý nghĩa nào.

## Responsibility Map

| # | Trách nhiệm | Status | File / lệnh thật | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | Task specification | Covered | `AGENTS.md`, `docs/FEATURE_INTAKE.md`, `docs/templates/story.md`, `docs/templates/high-risk-story/*`, `docs/stories/epics/E01..E10/*`, bảng `intake` + `story` | Request được phân loại type/lane trước khi code; story packet US-001..US-010 sống trong durable layer. |
| 2 | Context selection | Covered | `CLAUDE.md`, `docs/CONTEXT_RULES.md`, `docs/ARCHITECTURE.md`, `docs/decisions/*`, `SPEC.md` | CLAUDE.md `<important if=...>` blocks định tuyến context theo loại task; `score-context` đo độ phủ context-read so với CONTEXT_RULES. |
| 3 | Tool access | Covered | `scripts/bin/harness-cli.exe`, `docs/TOOL_REGISTRY.md`, bảng `tool`, `scripts/schema/003-tool.sql` | CLI prebuilt là entrypoint durable; `query tools` xuất manifest công cụ; đăng ký/gỡ tool ngoài qua `tool register`. |
| 4 | Project memory | Covered | `docs/HARNESS.md`, `docs/decisions/0001..0010`, `docs/GLOSSARY.md`, `docs/HARNESS_BACKLOG.md`, `docs/postmortems/*`, `harness.db` (bảng `decision`, `backlog`, `trace`) | Decision + backlog + story + trace + postmortem giữ tri thức bền across task. |
| 5 | Task state | Covered | `scripts/bin/harness-cli.exe query matrix`, `docs/TEST_MATRIX.md`, bảng `intake`/`story`/`trace` | Durable record theo dõi intake, story status, cột proof, trace. |
| 6 | Observability | Partial | `docs/TRACE_SPEC.md`, bảng `trace`, `harness-cli trace`, `score-trace`, `query traces`, `query friction` | Trace auto-score khi ghi, rescore + review friction được; chưa có dashboard/benchmark ingestion. |
| 7 | Failure attribution | Partial | `docs/HARNESS_BACKLOG.md`, `trace.errors`, `trace.harness_friction`, bảng `backlog`, `query friction` | Lỗi gắn được vào file/friction/backlog + context intake; chưa có attribution tự động từ benchmark. |
| 8 | Verification | Covered | `docs/TEST_MATRIX.md`, `query matrix`, `story verify`, `story verify-all`, `decision` verify, `story.verify_command`, `docs/templates/validation-report.md`, `scripts/schema/002-story-verify.sql` | Story/decision lưu + chạy proof command, cập nhật `last_verified_result`; trace cảnh báo khi story chưa verify. |
| 9 | Permissions | Partial | `CLAUDE.md`, `docs/HARNESS.md` (Harness Change Policy), `docs/FEATURE_INTAKE.md` | Chính sách mô tả khi nào agent được tự sửa vs phải hỏi (đổi kiến trúc/boundary/invariant); chỉ ở mức instruction, không có policy layer cưỡng chế. |
| 10 | Entropy auditing | Covered | `docs/HARNESS_BACKLOG.md`, `docs/HARNESS_AUDIT.md`, `docs/IMPROVEMENT_PROTOCOL.md`, bảng `backlog`, `trace.harness_friction`, `harness-cli audit`, `harness-cli propose` | `audit` phát hiện drift (story mồ côi/chưa verify) + entropy score; backlog so dự đoán vs thực tế; `propose` sinh đề xuất từ friction + intervention + audit drift. |
| 11 | Intervention recording | Covered | bảng `intervention` (`scripts/schema/004-intervention.sql`), `harness-cli intervention add`, `harness-cli query interventions`, `trace` | Can thiệp của human/reviewer/CI/agent ghi tách khỏi trace; lọc theo trace/story/type. |

## Lệnh CLI khả dụng (xác nhận từ `--help` + chạy thật trên `harness.db`)

| Lệnh | Trạng thái thực tế |
| --- | --- |
| `init`, `migrate`, `import` | Khả dụng (bootstrap DB). |
| `intake`, `story`, `decision`, `backlog`, `tool` | Khả dụng — ghi/cập nhật durable record. |
| `trace`, `score-trace`, `score-context` | Khả dụng — trace auto-score khi ghi. |
| `query matrix` / `matrix --numeric` / `backlog` / `stats` / `traces` / `friction` / `tools` | Khả dụng. |
| `audit` | Khả dụng — báo story mồ côi/chưa verify + entropy. |
| `intervention add` / `query interventions` | Khả dụng — bảng `intervention` đã migrate (schema_version 4). |
| `propose` / `propose --commit` | Khả dụng — sinh đề xuất từ friction + intervention + audit drift. |

## Schema durable layer (thật)

`scripts/schema/` có 4 file migration (schema_version 4):

| File | Bảng tạo |
| --- | --- |
| `001-init.sql` | `schema_version`, `intake`, `story`, `decision`, `backlog`, `trace` |
| `002-story-verify.sql` | thêm cột verify cho `story` (`verify_command`, `last_verified_at`, `last_verified_result`) |
| `003-tool.sql` | `tool` |
| `004-intervention.sql` | `intervention` (mở khoá `intervention add`/`query interventions`/`propose`) |

## File Inventory (docs + scripts thật)

| File | Trách nhiệm chính | Phụ |
| --- | --- | --- |
| `AGENTS.md` | Task specification | Context selection, permissions |
| `CLAUDE.md` | Context selection | Task specification, permissions |
| `README.md` | Project memory | Task specification |
| `PROJECT_SUMMARY.md` | Project memory | Task specification |
| `SPEC.md` | Task specification | Context selection, project memory |
| `docs/ARCHITECTURE.md` | Context selection | Permissions (pointer tới SPEC + decisions) |
| `docs/FEATURE_INTAKE.md` | Task specification | Permissions, context selection |
| `docs/GLOSSARY.md` | Project memory | Context selection |
| `docs/HARNESS.md` | Task specification | Project memory, task state, permissions |
| `docs/HARNESS_BACKLOG.md` | Entropy auditing | Project memory, failure attribution |
| `docs/HARNESS_COMPONENTS.md` | Failure attribution | Observability, entropy auditing |
| `docs/HARNESS_MATURITY.md` | Entropy auditing | Observability, verification |
| `docs/HARNESS_AUDIT.md` | Entropy auditing | Verification |
| `docs/IMPROVEMENT_PROTOCOL.md` | Entropy auditing | Failure attribution, intervention recording |
| `docs/CONTEXT_RULES.md` | Context selection | Permissions, task specification |
| `docs/TRACE_SPEC.md` | Observability | Failure attribution |
| `docs/TOOL_REGISTRY.md` | Tool access | Context selection, verification |
| `docs/TEST_MATRIX.md` | Verification | Task state |
| `docs/README.md` | Project memory | Context selection |
| `docs/skills-setup.md` | Tool access | Context selection |
| `docs/spec-intake.md` | Task specification | Context selection |
| `docs/product/overview.md` | Task specification | Project memory |
| `docs/product/invariants.md` | Permissions | Task specification, verification |
| `docs/product/api-contract.md` | Task specification | Verification |
| `docs/product/README.md` | Project memory | Context selection |
| `docs/decisions/0001..0010-*.md` | Project memory | Permissions |
| `docs/decisions/README.md` | Project memory | Context selection |
| `docs/postmortems/US-007-history-cache-stale.md` | Failure attribution | Project memory |
| `docs/stories/README.md` | Task specification | Project memory |
| `docs/stories/backlog.md` | Task specification | Project memory |
| `docs/stories/epics/E01..E10/US-00N-*.md` | Task specification | Verification, project memory |
| `docs/templates/decision.md` | Project memory | Task specification |
| `docs/templates/story.md` | Task specification | Verification |
| `docs/templates/spec-intake.md` | Task specification | Context selection |
| `docs/templates/validation-report.md` | Verification | Failure attribution |
| `docs/templates/high-risk-story/{overview,design,execplan,validation}.md` | Task specification | Verification, permissions |
| `scripts/README.md` | Tool access | Context selection |
| `scripts/bin/harness-cli.exe` | Tool access | Task state, observability |
| `scripts/schema/001-init.sql` | Task state | Project memory, observability |
| `scripts/schema/002-story-verify.sql` | Verification | Task state |
| `scripts/schema/003-tool.sql` | Tool access | Project memory |
| `scripts/schema/004-intervention.sql` | Intervention recording | Failure attribution |

## Coverage Summary

- Covered: 7/11 (Task specification, Context selection, Tool access, Project memory, Task state, Verification, Intervention recording).
- Partial: 4/11 (Observability, Failure attribution, Permissions, Entropy auditing).
- Missing: 0/11.

Bước kế tiếp để nâng coverage: thêm benchmark ingestion cho Observability/Failure
attribution, và một lint rule cho phần private-env (xem `docs/product/invariants.md §1`).
Tất cả nên vào backlog qua `harness-cli backlog add` thay vì claim sẵn ở đây.
