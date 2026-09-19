# Documentation Map

Tài liệu của `ziweiai-web`: hợp đồng sản phẩm + vận hành demo + story backlog.
Code, test, Supabase migrations và báo cáo deploy là nguồn sự thật về *behavior*;
SPEC/Harness cũ chỉ còn giá trị tham chiếu về *intent*. Khi lệch, ưu tiên trạng
thái code hiện tại và xem thêm [[0006-spec-vs-code-naming]].

## Harness (cách người + agent làm việc)

- `HARNESS.md`: luồng làm việc harness, durable layer, task loop.
- `HARNESS_COMPONENTS.md`: bản đồ file ↔ trách nhiệm harness (theo repo thật).
- `HARNESS_MATURITY.md`: thang trưởng thành H0–H5 + trạng thái hiện tại.
- `HARNESS_BACKLOG.md`: danh sách cải tiến cũ. Lưu ý snapshot 2026-07-12:
  binary `scripts/bin/harness-cli.exe` không có trong workspace hiện tại.
- `FEATURE_INTAKE.md`: phân loại prompt thành lane tiny / normal / high-risk.
- `CONTEXT_RULES.md`: quy tắc chọn context theo phase × lane.
- `TRACE_SPEC.md`: trường trace, tier chất lượng, friction.
- `TOOL_REGISTRY.md`: danh mục lệnh harness-cli + tool ngoài.
- `TEST_MATRIX.md`: ma trận trạng thái theo code/tests hiện tại; không phụ
  thuộc Harness CLI vì binary cũ không có trong workspace.
- `ARCHITECTURE.md`: con trỏ tới kiến trúc thật (SPEC Part A5 + decisions 0006/0007).
- `GLOSSARY.md`: thuật ngữ chung.
- `spec-intake.md`, `skills-setup.md`: ghi chú vận hành.

## Thư mục

- `product/`: hợp đồng sản phẩm hiện hành — `overview.md`, `invariants.md`, `api-contract.md`.
- `deploy/`: checklist demo public Vercel và quy trình rollback/verify.
- `stories/`: story packet (epics E01–E10) + backlog.
- `decisions/`: quyết định durable 0001–0010.
- `postmortems/`: phân tích sự cố sau khi fix (vd `US-007-history-cache-stale.md`).
- `templates/`: mẫu spec-intake, story (normal + high-risk), decision,
  validation và checklist hoàn thành feature.
- `reports/`: báo cáo triển khai, test và debug theo mốc thời gian; đọc
  `reports/README.md` trước để phân biệt bằng chứng lịch sử và smoke mới nhất.
- `tooling-capabilities.md`: bản đồ công cụ/skill/plugin nên dùng cho Vercel,
  Build Web Apps, Sites, Browser, Figma, Supabase và TestSprite.
- `goal-completion-audit.md`: audit requirement-by-requirement cho active goal,
  gồm bằng chứng đã có và gap còn thiếu trước khi đánh dấu complete.
- `open-decisions.md`: decision log cho provider, quota/free beta, Lục Hào,
  live mutation smoke, Supabase ledger và monetization.
- `decision-questionnaire.md`: phiếu trả lời nhanh A/B cho các quyết định còn
  mơ hồ trước khi chạy live smoke hoặc mở phase tiếp theo.
- `feature-validation-hardening-matrix.md`: ma trận gate validation/hardening
  theo từng feature hoặc nhóm tính năng.

## Trạng thái hiện tại

Snapshot 2026-07-13: demo public chạy tại `https://tuvitoantap.vercel.app`.
Safe smoke mới nhất xác minh Vercel account đúng, deployment Ready, root page,
`/api/health`, `/api/features` và SPA fallback `/charts/<uuid>` đều trả 200.
Live mutation smoke đầy đủ cần report riêng nếu có deploy/env/schema mới.

Ứng dụng đang ở mức **MVP/pre-beta functional demo**, chưa phải production
business-ready:

- Web SvelteKit SPA + API NestJS + Supabase Cloud.
- Các nhóm tính năng đã có code/tests: Tử Vi, Bát Tự, Mai Hoa, Lục Hào,
  Đại Lục Nhâm, Kỳ Môn, Hợp Hôn, Mang Phái, Tarot, MBTI, Xem Tướng, Xem Tay,
  Lenormand, Giải Mộng, Rút Xăm, Hoàng Lịch, vận ngày/tháng/năm, hội thoại AI.
- Playwright hiện có 46 e2e specs trong `apps/web/tests/e2e`; full non-live E2E
  gần nhất pass 46/46 ngày 2026-07-13.
- Supabase hiện có 9 migrations trong `apps/api/supabase/migrations`.
- Chưa production-ready vì XU/ledger/VietQR/payment flow chưa hoàn thiện, story
  packet chi tiết còn nhiều file stale, và hạ tầng local/cloud cần chuẩn hoá thêm.
