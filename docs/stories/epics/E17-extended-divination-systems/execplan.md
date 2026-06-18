# Exec Plan

## Goal

Dựng khung kiến trúc 12 hệ luận giải (6 cũ + 6 mới) — contract chung,
endpoint đa hình, Storage bucket cho vision, 6 cờ feature-flag tách hệ và
quota vision riêng — sẵn sàng để 6 epic con (US-017a..f) cắm vào tuần tự,
mỗi epic 1 PR riêng, mỗi cờ riêng.

Story TỔNG đóng khi P0+P1+P2 + Tarot (P3a) merged. 5 epic con còn lại
(US-017b..f) tracked riêng trong harness backlog.

## Scope

In scope:

- Mở rộng `chartSystemSchema` từ 6 → 12 giá trị.
- Thêm 4 schema mới (`pairing-snapshot`, `mbti-result`, `tarot-draw`,
  `vision-analysis`) trong `@ziweiai/contracts`.
- Thêm 3 mã lỗi mới (`IDENTITY_REQUIRED`, `FEATURE_DISABLED`,
  `VISION_QUOTA_EXCEEDED`) vào `apiErrorCodeSchema`.
- Thêm 6 cờ env + 1 quota vision (`API_VISION_REQUESTS_PER_DAY_PER_USER`).
- Thêm Storage bucket `vision-uploads` private + RLS + scheduled cleanup
  7 ngày.
- Endpoint `/features` (hoặc mở rộng `/health`) trả trạng thái 6 cờ cho
  web đọc.
- Hiện thực 1 epic con Tarot (US-017a) làm chứng minh khung — endpoint
  `POST /draws/tarot` + UI Tarot + cờ TAROT có thể bật.
- Stub UI 5 route còn lại (`/pairings`, `/mbti`, `/face`, `/palm`,
  `/(app)/?mangpai`) hiển thị "đang phát triển" (Việt ngữ).
- Cập nhật docs (`api-contract.md`, `invariants.md`, `SPEC.md`).

Out of scope:

- US-017b..f hiện thực (5 epic con — tracked riêng).
- Bật 6 cờ ở prod (chỉ TAROT có thể bật ở stg).
- Billing thật / bảng tier / payment.
- `linkIdentity` flow nâng cấp anon → email cho face/palm (epic con
  US-017e/f xử lý UI nhỏ; quyết định lớn nếu có là decision riêng).
- Sửa schema 5 bảng cũ.
- Port `annual-report` hoặc tính năng phụ khác của taibu.

## Risk Classification

Risk flags:

- Public contract (`chartSystemSchema` + 4 schema mới + 3 mã lỗi mới) —
  phải backward-compatible với snapshot legacy.
- Đường tiền tệ — LLM cost: vision đắt 5–10× text → quota tách bạch.
- PII / sinh trắc — ảnh chân dung + lòng bàn tay → bucket private + RLS +
  auto-delete 7 ngày.
- Mặt API phình — 4 endpoint mới + 1 bucket + 1 cleanup job.
- Cờ feature bật nhầm ở prod → cost LLM không kiểm soát.

Hard gates:

- 6 cờ default `false`; gate fail-CLOSED khi cờ off.
- `assertEmailIdentityRequired(user)` BẮT BUỘC ở face/palm — anon bị
  chặn 100%.
- AI gate dùng chung `assertCanUseAiExplanation` — 12 hệ AI bị gate đồng
  nhất khi billing thật bật.
- Web boundary nguyên vẹn — KHÔNG import core/astro-engine/iztro.
- Snapshot legacy (6 hệ cũ) parse OK sau mở rộng schema.
- `pnpm why zod` đơn nhất — không thêm zod version mới khi thêm contract.

## Work Phases

### P0 — Contract foundation

Files dự kiến:

- `packages/contracts/src/chart/chart-system.ts` — mở rộng `chartSystems`
  từ 6 → 12 giá trị. KHÔNG đổi `implementedChartSystems` (chỉ thêm khi
  từng epic con merge).
- `packages/contracts/src/chart/pairing-snapshot.ts` — `pairingSnapshotSchema`.
- `packages/contracts/src/chart/tarot-draw.ts` — `tarotDrawSchema`.
- `packages/contracts/src/chart/vision-analysis.ts` — `visionAnalysisSchema`.
- `packages/contracts/src/quizzes/mbti-result.ts` — `mbtiResultSchema` +
  `mbtiAnswerSchema`.
- `packages/contracts/src/api/error.ts` — thêm `IDENTITY_REQUIRED`,
  `FEATURE_DISABLED`, `VISION_QUOTA_EXCEEDED` vào `apiErrorCodeSchema`.
- `packages/contracts/src/index.ts` — re-export các schema mới.
- Tests đi kèm: `pairing-snapshot.test.ts`, `tarot-draw.test.ts`,
  `vision-analysis.test.ts`, `mbti-result.test.ts`, `chart-system.test.ts`
  (parse 12 giá trị + reject + snapshot legacy).

Validation: `pnpm -F @ziweiai/contracts test` xanh + `pnpm why zod` đơn nhất.

### P1 — Env + 6 cờ + quota vision

Files dự kiến:

- `apps/api/src/config/env.ts` — thêm 6 `EXTENDED_SYSTEM_*_ENABLED` +
  `API_VISION_REQUESTS_PER_DAY_PER_USER`.
- `apps/api/src/config/env.test.ts` — test parse default false; reject
  giá trị không hợp lệ; test `z.stringbool` không bị bug `'false'→true`.
- `apps/api/src/modules/quotas/quotas.service.ts` — thêm method
  `assertCanUseAiVisionExplanation(user)` đếm theo
  `API_VISION_REQUESTS_PER_DAY_PER_USER`.
- `apps/api/src/modules/auth/identity.guard.ts` (mới) — helper
  `assertEmailIdentityRequired(user)`; ném `IDENTITY_REQUIRED` cho anon.
- `apps/api/src/modules/health/` (hoặc tạo `features/`) — endpoint
  `GET /features` trả trạng thái 6 cờ (chốt P0/P1).

Validation: `pnpm -F @ziweiai/api test` xanh; cờ default off + boot OK
với env trống.

### P2 — Storage bucket + RLS + scheduled cleanup

Files dự kiến:

- `apps/api/supabase/migrations/000002_vision-uploads-bucket.up.sql`
  (tên đánh số tiếp theo) — tạo bucket private + 3 RLS policy + pg_cron
  job 03:00 UTC daily.
- `apps/api/supabase/migrations/000002_vision-uploads-bucket.down.sql`
  rollback (drop policy + cron + bucket).
- (Cân nhắc) `apps/api/supabase/migrations/000003_vision-analyses.up.sql`
  — bảng `public.vision_analyses` lưu narrative + image_path nếu cần
  cleanup ảnh không xoá kết quả. Quyết định ở P2 dựa trên
  `explanation_results` có đủ chứa không.

Validation: chạy migration trên Supabase local, integration test
upload/download với 2 user khác nhau (1 owner + 1 cross-user) → cross-user
select bị RLS chặn; cron job lên lịch đúng.

### P3a — Tarot epic (US-017a) — chứng minh khung

Files dự kiến:

- `apps/api/src/modules/draws-tarot/draws-tarot.module.ts`
- `apps/api/src/modules/draws-tarot/draws-tarot.controller.ts`
  (`POST /draws/tarot`, gate cờ TAROT, 404 khi off)
- `apps/api/src/modules/draws-tarot/draws-tarot.service.ts`
  (rút bài deterministic theo seed + LLM diễn giải qua provider hiện có)
- `apps/api/src/modules/draws-tarot/tarot-deck.ts` (78 lá Major+Minor —
  i18n Việt; dùng pattern fail-fast `translateZiweiKey`-style cho key
  bài → label Việt)
- `apps/api/src/modules/draws-tarot/draws-tarot.spec.ts` (unit + integration)
- `apps/web/src/lib/api/draws-tarot.ts` (API client wrapper —
  `createTarotDraw(input)` → parse `tarotDrawSchema`)
- `apps/web/src/lib/i18n/vi.ts` — thêm key Việt cho Tarot UI
- `apps/web/src/routes/(app)/tarot/+page.svelte` — UI Tarot (form câu hỏi
  + spread → kết quả)
- `apps/web/src/routes/(app)/tarot/tarot-model.svelte.ts` — mutation +
  state Svelte 5 runes
- E2E `apps/web/e2e/tarot.spec.ts`

Validation: `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/web check` +
e2e Tarot xanh; cờ TAROT off → endpoint 404 + UI ẩn nút.

### P3b — MBTI epic (US-017b)

(Tracked riêng. Khung skeleton đã có sau P0/P1; epic con build:
`quizzes-mbti.module.ts` + `mbti-questions.ts` (60 câu Việt) + scoring
deterministic + LLM + UI questionnaire + e2e.)

### P3c — Hợp Hôn epic (US-017c)

(Tracked riêng. Build `pairings.module.ts` — 2 birth-input → 2 ziwei
chart qua `@ziweiai/core` (server-only, KHÔNG đụng web) → ghép
`pairingSnapshotSchema` + LLM diễn giải tương hợp + UI form 2 lá số.)

### P3d — Manh Phái epic (US-017d)

(Tracked riêng. Mở rộng `charts/` xử lý `chartSystem='mangpai'` — bazi
mở rộng + LLM. KHÔNG endpoint mới. Bật cờ MANGPAI ở stg.)

### P3e — Xem Tướng epic (US-017e)

(Tracked riêng. Build `vision-face.module.ts` + multipart parser + upload
Storage + Vision LLM (Gemini Vision ưu tiên) + UI camera/upload + email
identity guard + e2e với fixture ảnh 1 chiều.)

### P3f — Xem Tay epic (US-017f)

(Tracked riêng. Tương tự P3e, hệ palm thay face. Có thể tái dùng module
`vision-shared/` nếu pattern trùng > 80% sau khi P3e ổn định.)

### P4 — Docs + i18n + cờ default false ở prod

Files dự kiến:

- `docs/product/api-contract.md` — thêm 4 endpoint nhóm + 6 chartSystem
  mới + mã lỗi mới.
- `docs/product/invariants.md` — bổ sung quy tắc 12 hệ + auto-delete 7
  ngày + anon chặn face/palm.
- `SPEC.md` — cập nhật roadmap: Phase US-017 (P0/P1/P2 + Tarot) +
  US-017b..f.
- `apps/web/src/lib/i18n/vi.ts` — đảm bảo nhãn 6 hệ mới + 3 mã lỗi mới
  có message Việt.
- Verify cấu hình `prod`: 6 cờ giữ `false`; chỉ TAROT bật ở stg.

Validation: `pnpm lint` + `turbo typecheck` + `turbo test` xanh; spot
check `\p{Script=Han}` scan KHÔNG match label Tarot UI.

## Stop Conditions

Pause for human confirmation if:

- Snapshot legacy (6 hệ cũ) FAIL parse sau khi mở rộng `chartSystems`
  → khung backward-compat sai, dừng và quyết định cấu trúc lại schema.
- Supabase Storage RLS test FAIL (cross-user vẫn select được ảnh) → hard
  block; KHÔNG merge P2 cho tới khi RLS đúng.
- `pg_cron` không khả dụng trên Supabase plan hiện tại → backlog
  alternative cleanup (Edge Function timer hoặc external cron).
- Cờ TAROT bật mà LLM provider hiện tại refuse / quota exhaust → fall
  back deterministic mock + flag log; KHÔNG đóng story cho tới khi
  provider thật chạy được trong stg.
- Multipart parser không tương thích NestJS/Fastify hiện trạng — đụng
  ở P3e. Stop trước khi đẩy P3e nếu phát hiện.
- Phải đổi `implementedChartSystems` ngay trong P0 (logic phụ thuộc
  enum này có thể vỡ) — quyết định lùi sang sau khi mỗi epic con merge.
- Bật bất kỳ cờ nào ở prod trong phạm vi US-017 — vi phạm hard gate.
- Cần đụng RLS / schema 5 bảng cũ — vi phạm Out of scope; dựng decision
  riêng trước.
