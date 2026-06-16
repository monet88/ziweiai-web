# Documentation Map

Tài liệu của `ziweiai-web`: harness vận hành + hợp đồng sản phẩm. SPEC.md (gốc repo) là
nguồn sự thật về *intent*; code + test là sự thật về *behavior*; khi lệch xem
[[0006-spec-vs-code-naming]].

## Harness (cách người + agent làm việc)

- `HARNESS.md`: luồng làm việc harness, durable layer, task loop.
- `HARNESS_COMPONENTS.md`: bản đồ file ↔ trách nhiệm harness (theo repo thật).
- `HARNESS_MATURITY.md`: thang trưởng thành H0–H5 + trạng thái hiện tại.
- `HARNESS_BACKLOG.md`: danh sách cải tiến cũ; bản ghi hiện tại dùng
  `scripts/bin/harness-cli backlog`.
- `FEATURE_INTAKE.md`: phân loại prompt thành lane tiny / normal / high-risk.
- `CONTEXT_RULES.md`: quy tắc chọn context theo phase × lane.
- `TRACE_SPEC.md`: trường trace, tier chất lượng, friction.
- `TOOL_REGISTRY.md`: danh mục lệnh harness-cli + tool ngoài.
- `TEST_MATRIX.md`: ảnh chụp proof 10 story; trạng thái sống query bằng
  `scripts/bin/harness-cli query matrix`.
- `ARCHITECTURE.md`: con trỏ tới kiến trúc thật (SPEC Part A5 + decisions 0006/0007).
- `GLOSSARY.md`: thuật ngữ chung.
- `spec-intake.md`, `skills-setup.md`: ghi chú vận hành.

## Thư mục

- `product/`: hợp đồng sản phẩm hiện hành — `overview.md`, `invariants.md`, `api-contract.md`.
- `stories/`: story packet (epics E01–E10) + backlog.
- `decisions/`: quyết định durable 0001–0010.
- `postmortems/`: phân tích sự cố sau khi fix (vd `US-007-history-cache-stale.md`).
- `templates/`: mẫu spec-intake, story (normal + high-risk), decision, validation.

## Trạng thái hiện tại

Web v1 (Phase 1–8) đã ship: SvelteKit SPA + 6 hệ thuật số + history + luận giải AI, backend
NestJS + contracts + astro-engine. Story US-001..007 `implemented`; US-008/009/010 `planned`
(lá số trực quan, truy cập ẩn danh, AI premium). Xem SPEC.md Phần C để biết roadmap.
