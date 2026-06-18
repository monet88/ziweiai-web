# Plan US-017 — Extended Divination Systems (6 hệ luận giải mới)

## Goal

Dựng khung kiến trúc + contract chung để mở rộng `ziweiai` từ 6 → 12 hệ
luận giải. Khung gồm: `chartSystemSchema` 12 giá trị, 4 schema kết quả
mới (`pairing-snapshot`, `mbti-result`, `tarot-draw`, `vision-analysis`),
3 mã lỗi mới (`IDENTITY_REQUIRED`, `FEATURE_DISABLED`,
`VISION_QUOTA_EXCEEDED`), 6 cờ feature-flag tách hệ, quota AI vision
riêng, Storage bucket `vision-uploads` private + RLS + scheduled cleanup
7 ngày, 4 endpoint nhóm mới (`/pairings`, `/quizzes/mbti`, `/draws/tarot`,
`/vision/{face|palm}`).

6 hệ thực thi rải qua 6 PR riêng (US-017a..f). Story TỔNG đóng khi
P0+P1+P2 + Tarot (P3a) merged để chứng minh khung chạy thật.

Reference: `docs/decisions/0012-extended-divination-systems.md`,
`docs/stories/epics/E17-extended-divination-systems/`.

## Pre-conditions

- [ ] Decision `0012-extended-divination-systems.md` accepted (đã ✓
      2026-06-17).
- [ ] Decision `0010-premium-ai-entitlement-flag.md` accepted (đã ✓ —
      AI gate dùng chung).
- [ ] Decision `0009-anonymous-auth-strategy.md` accepted (đã ✓ —
      face/palm chặn anon).
- [ ] Review tài liệu Supabase Storage CLI + RLS pattern
      (`storage.foldername(name)[1] = auth.uid()::text`).
- [ ] Review tài liệu `pg_cron` (Supabase plan hiện tại có hỗ trợ
      hay không — nếu không, cần backlog alternative).
- [ ] Confirm LLM Vision provider khả dụng (Gemini Vision với
      `GEMINI_API_KEY` hoặc OpenAI Vision với `OPENAI_COMPAT_API_KEY`)
      — kiểm trước khi P3e.
- [ ] `harness-cli` `intake --type spec-slice --summary "US-017 khung
      12 hệ" --lane high-risk` đã ghi.
- [ ] Snapshot legacy fixture (6 hệ cũ) parse OK trước khi mở rộng —
      verify baseline.
- [ ] PR theo từng phase (memory `pr-per-phase-workflow.md`): mỗi P
      = 1 nhánh + 1 PR vào `main`.

## Phases

### P0 — Contract foundation

Files dự kiến:

- `packages/contracts/src/chart/chart-system.ts` — mở rộng 12 giá trị.
- `packages/contracts/src/chart/pairing-snapshot.ts` (mới)
- `packages/contracts/src/chart/tarot-draw.ts` (mới)
- `packages/contracts/src/chart/vision-analysis.ts` (mới)
- `packages/contracts/src/quizzes/mbti-result.ts` (mới — namespace mới)
- `packages/contracts/src/api/error.ts` — thêm 3 mã lỗi.
- `packages/contracts/src/index.ts` — re-export.
- Tests đi kèm cho từng schema mới.

Tasks:

- [ ] Tạo branch `feat/us-017-p0-contract-foundation`.
- [ ] Đọc `packages/contracts/src/chart/chart-snapshot.ts` +
      `chart-contracts.test.ts` để khớp pattern hiện có.
- [ ] Mở rộng `chartSystems` từ 6 → 12 (KHÔNG đổi thứ tự 6 cũ; chỉ
      append 6 mới — backward-compat).
- [ ] Quyết định namespace cho `mbti-result.ts`: `chart/` hay
      `quizzes/` (MBTI không phải chart). Ưu tiên `quizzes/` để rõ
      ngữ nghĩa.
- [ ] Viết `pairing-snapshot.ts`:
      `{ chartSystem: 'hepan', primary: chartSnapshotSchema,
      partner: chartSnapshotSchema, compatibility: { ... } }`.
- [ ] Viết `tarot-draw.ts`:
      `{ chartSystem: 'tarot', spread, cards: [{ id, reversed }],
      question, seed, narrative }`.
- [ ] Viết `vision-analysis.ts`:
      `{ chartSystem: 'face' | 'palm', kind, imagePath, narrative,
      traits: [...] }`.
- [ ] Viết `mbti-result.ts`:
      `mbtiAnswerSchema { questionId, value }` +
      `mbtiResultSchema { axes, label, narrative }`.
- [ ] Thêm 3 mã lỗi vào `apiErrorCodeSchema`.
- [ ] Re-export tất cả qua `index.ts`.
- [ ] Tests: unit parse OK + reject + snapshot legacy parse OK.
- [ ] PR review + merge.

Validation:

```text
pnpm -F @ziweiai/contracts test
pnpm why zod
```

### P1 — Env + 6 cờ + quota vision

Files dự kiến:

- `apps/api/src/config/env.ts` — thêm 6 cờ + `API_VISION_REQUESTS_PER_DAY_PER_USER`.
- `apps/api/src/config/env.test.ts` — test parse default + reject.
- `apps/api/src/modules/quotas/quotas.service.ts` — thêm
  `assertCanUseAiVisionExplanation(user)`.
- `apps/api/src/modules/auth/identity.guard.ts` (mới) — helper
  `assertEmailIdentityRequired(user)`.
- `apps/api/src/modules/health/` (hoặc `features/`) — endpoint
  `GET /features` trả trạng thái 6 cờ.

Tasks:

- [ ] Tạo branch `feat/us-017-p1-env-flags-quota`.
- [ ] Thêm 6 cờ vào `apiEnvSchema` với `z.stringbool().default(false)`
      (theo pattern decision 0010).
- [ ] Thêm `API_VISION_REQUESTS_PER_DAY_PER_USER` (default `5`,
      `z.coerce.number().int().positive()`).
- [ ] Test env: parse default off; reject `'invalid'`; regression
      `z.stringbool('false')===false`.
- [ ] Mở rộng `QuotasService` với
      `assertCanUseAiVisionExplanation(user)` đếm theo
      `API_VISION_REQUESTS_PER_DAY_PER_USER`. Throw
      `VISION_QUOTA_EXCEEDED` khi vượt.
- [ ] Tạo `IdentityGuard.assertEmailIdentityRequired(user)`. Throw
      `IDENTITY_REQUIRED` cho `user.is_anonymous === true`.
- [ ] Endpoint `GET /features` (public) trả `{ hepan: bool, mangpai:
      bool, tarot: bool, mbti: bool, face: bool, palm: bool }`. Web
      sẽ đọc trạng thái cờ qua đây.
- [ ] Tests: unit + integration cho endpoint + guard + quota.
- [ ] PR review + merge.

Validation:

```text
pnpm -F @ziweiai/api test -- env.test
pnpm -F @ziweiai/api test -- quotas.service
pnpm -F @ziweiai/api test -- identity.guard
pnpm -F @ziweiai/api test:integration -- features
```

### P2 — Storage bucket + RLS + scheduled cleanup

Files dự kiến:

- `apps/api/supabase/migrations/000002_vision-uploads-bucket.up.sql`
- `apps/api/supabase/migrations/000002_vision-uploads-bucket.down.sql`
- (Cân nhắc) `000003_vision-analyses.up.sql` — bảng
  `public.vision_analyses` lưu narrative + image_path nếu cần.
- `apps/api/test/integration/vision-uploads.spec.ts` — test
  upload/cross-user/cleanup.

Tasks:

- [ ] Tạo branch `feat/us-017-p2-storage-bucket`.
- [ ] Confirm `pg_cron` extension có sẵn trên Supabase plan hiện tại;
      nếu không → backlog alternative cleanup (Edge Function timer).
- [ ] Viết migration tạo bucket `vision-uploads` private +
      `insert/select/delete` RLS theo `auth.uid() =
      storage.foldername(name)[1]`.
- [ ] Viết `pg_cron` job `vision-uploads-cleanup` xoá object > 7 ngày,
      03:00 UTC daily.
- [ ] Quyết định P2: `public.vision_analyses` có cần không. Nếu có,
      tạo migration `000003`.
- [ ] Viết down migration đối xứng (drop RLS + cron + bucket).
- [ ] Integration test: chạy migration trên Supabase local; user A
      upload OK; user B select cross-user → RLS chặn; cron job lên
      lịch trong `cron.job`.
- [ ] PR review + merge.

Validation:

```text
pnpm -F @ziweiai/api supabase:migrate  # hoặc lệnh tương đương
pnpm -F @ziweiai/api test:integration -- vision-uploads
```

### P3a — Tarot epic (US-017a) — chứng minh khung

Files dự kiến:

- `apps/api/src/modules/draws-tarot/draws-tarot.module.ts`
- `apps/api/src/modules/draws-tarot/draws-tarot.controller.ts`
- `apps/api/src/modules/draws-tarot/draws-tarot.service.ts`
- `apps/api/src/modules/draws-tarot/tarot-deck.ts` (78 lá, i18n Việt)
- `apps/api/src/modules/draws-tarot/draws-tarot.spec.ts`
- `apps/api/src/modules/draws-tarot/draws-tarot.integration.spec.ts`
- `apps/web/src/lib/api/draws-tarot.ts` (client wrapper)
- `apps/web/src/lib/i18n/vi.ts` (thêm key Tarot)
- `apps/web/src/routes/(app)/tarot/+page.svelte`
- `apps/web/src/routes/(app)/tarot/tarot-model.svelte.ts`
- `apps/web/e2e/tarot.spec.ts`

Tasks:

- [ ] Tạo branch `feat/us-017a-tarot`.
- [ ] Tạo packet US-017a riêng (`docs/stories/epics/E17-extended-divination-systems/US-017a-tarot.md`).
- [ ] Build `tarot-deck.ts` 78 lá Major+Minor — key bài → label Việt
      (pattern fail-fast giống `translateZiweiKey`).
- [ ] Build `draws-tarot.service.ts`:
      1. Validate input qua `tarotDrawInputSchema` (P0).
      2. Đọc cờ `EXTENDED_SYSTEM_TAROT_ENABLED` — off → 404
         `FEATURE_DISABLED`.
      3. `assertCanCreateExplanation(user)` (quota text).
      4. `assertCanUseAiExplanation(user)` (gate AI premium).
      5. Rút bài deterministic theo `seed` (PRNG cố định) +
         `spread`.
      6. Gọi LLM diễn giải (provider hiện có, prompt Việt).
      7. Trả `tarotDrawSchema`.
- [ ] Build `draws-tarot.controller.ts` `POST /draws/tarot` Bearer +
      `SupabaseAuthGuard`.
- [ ] Unit test rút bài deterministic (cùng seed → cùng kết quả) +
      reject input méo.
- [ ] Integration test: cờ on → 200; cờ off → 404; không Bearer →
      401.
- [ ] Web client: `createTarotDraw(input)` parse `tarotDrawSchema`.
- [ ] Web UI Tarot: form câu hỏi + chọn spread → bấm rút → hiển thị
      kết quả Việt; nếu cờ TAROT off ở `/features` → CTA ẩn.
- [ ] Web i18n Việt cho mọi label Tarot; spot scan
      `\p{Script=Han}` trên rendered output → 0 match.
- [ ] E2E Tarot: chạm flow "câu hỏi → rút bài → diễn giải".
- [ ] PR review + merge; bật cờ TAROT ở stg.

Validation:

```text
pnpm -F @ziweiai/api test -- draws-tarot
pnpm -F @ziweiai/api test:integration -- draws-tarot
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test:e2e -- tarot
```

### P3b–P3f — 5 epic con còn lại (tracked riêng)

KHÔNG hiện thực trong scope plan này. Mỗi epic con có packet riêng
khi đến lượt:

- US-017b — MBTI (`POST /quizzes/mbti` + 60 câu Việt + scoring + LLM
  + UI questionnaire + cờ MBTI on)
- US-017c — Hợp Hôn (`POST /pairings` + ghép 2 ziwei + LLM + UI 2
  birth-input + cờ HEPAN on)
- US-017d — Manh Phái (mở rộng `POST /charts` xử lý
  `chartSystem='mangpai'` — KHÔNG endpoint mới + LLM + UI + cờ
  MANGPAI on)
- US-017e — Xem Tướng (`POST /vision/face` + multipart + Storage +
  Vision LLM + email-identity guard + UI camera/upload + cờ FACE on)
- US-017f — Xem Tay (như US-017e, hệ palm)

### P4 — Docs + i18n + cờ default false ở prod

Files dự kiến:

- `docs/product/api-contract.md` — thêm 4 endpoint nhóm + 6
  chartSystem mới + 3 mã lỗi mới.
- `docs/product/invariants.md` — bổ sung quy tắc 12 hệ + auto-delete
  7 ngày + anon chặn face/palm.
- `SPEC.md` — cập nhật roadmap.
- `apps/web/src/lib/i18n/vi.ts` — đảm bảo 6 hệ + 3 mã lỗi mới có
  message Việt.

Tasks:

- [ ] Tạo branch `feat/us-017-p4-docs-i18n`.
- [ ] Cập nhật `api-contract.md` + `invariants.md` + `SPEC.md`.
- [ ] Verify cờ prod: 6 cờ giữ `false`; chỉ TAROT bật ở stg.
- [ ] Spot scan `\p{Script=Han}` trên web rendered output → 0 match.
- [ ] PR review + merge.

Validation:

```text
pnpm lint
turbo typecheck
turbo test
pnpm -F @ziweiai/web build
```

## Risk + Rollback

Risks:

- **Cờ feature bật nhầm ở prod** → 1 hệ chưa thử lửa rò ra user → cost
  LLM tăng. Mitigate: gate fail-CLOSED khi cờ off, log cảnh báo khi cờ
  on ở prod.
- **Storage RLS sai** → ảnh chéo giữa user (PII leak). Mitigate: P2
  integration test cross-user select bắt buộc xanh trước merge.
- **`pg_cron` không khả dụng** → bucket phình. Mitigate: P2 phase 0
  confirm; nếu không có → backlog Edge Function timer.
- **`chartSystemSchema` mở rộng vỡ snapshot legacy** → 6 hệ cũ
  không parse. Mitigate: KHÔNG reorder enum cũ; chỉ append; test
  baseline trước.
- **LLM Vision provider quota / API thay đổi** → P3e/f vỡ. Mitigate:
  abstract adapter; P0 confirm Gemini Vision `GEMINI_API_KEY` còn hạn
  ngạch; nếu không → switch OpenAI Vision.
- **Multipart parser xung đột với Nest hiện tại** → P3e block.
  Mitigate: P3e đầu phase verify; backlog nếu cần đổi `platform-fastify`
  hoặc thêm middleware.
- **Anon-user dùng được face/palm vì quên guard** → PII rò + lạm dụng
  vision. Mitigate: `assertEmailIdentityRequired` ở ĐẦU controller, có
  unit test bắt regression; e2e với anon JWT phải nhận 403
  `IDENTITY_REQUIRED`.
- **Web import `core`/`astro-engine` để tính ghép lá số / bazi mở
  rộng** → vỡ web boundary (decision 0007). Mitigate: ESLint
  `no-restricted-imports` đã chặn; review PR khắt khe ở P3c/d.
- **Bundle web phình do thêm 6 route mới** → mục tiêu < 5% tăng.
  Mitigate: dynamic import từng route; route stub siêu nhẹ.

Rollback:

- **Mỗi cờ tắt = ẩn hệ tương ứng** (gate fail-CLOSED). Set
  `EXTENDED_SYSTEM_<X>_ENABLED=false` ở env → endpoint trả 404 +
  CTA web ẩn.
- **Rollback P0/P1**: revert PR; `chartSystemSchema` giữ nguyên 6 giá
  trị; 6 cờ + quota vision biến mất → backward-compat hoàn toàn.
- **Rollback P2 (Storage)**: chạy down migration
  `000002_vision-uploads-bucket.down.sql` — drop RLS + cron + bucket
  (xoá tất cả ảnh trong bucket TRƯỚC khi drop để tránh orphan). Khi
  rollback face/palm sau này (US-017e/f), thực hiện đối xứng: cờ off
  → drain queue Vision → drop bucket + cleanup.
- **Rollback P3a (Tarot)**: tắt cờ TAROT là đủ (endpoint 404, UI
  ẩn); nếu cần revert hoàn toàn → revert PR Tarot, KHÔNG ảnh hưởng
  P0/P1/P2.
- **Rollback P3b..f**: từng epic con tắt cờ tương ứng — KHÔNG ảnh
  hưởng các hệ khác (đó là lý do tách 6 cờ).

## Done Criteria

Story TỔNG US-017 đóng khi tất cả:

- [ ] P0 merged: `chartSystemSchema` 12 giá trị + 4 schema mới + 3 mã
      lỗi mới; tests xanh; snapshot legacy parse OK.
- [ ] P1 merged: 6 cờ env + `API_VISION_REQUESTS_PER_DAY_PER_USER` +
      `assertCanUseAiVisionExplanation` + `assertEmailIdentityRequired`
      + `GET /features`; tests xanh.
- [ ] P2 merged: Storage bucket `vision-uploads` private + RLS +
      `pg_cron` cleanup 7 ngày; integration test cross-user RLS xanh.
- [ ] P3a merged (Tarot — chứng minh khung): `POST /draws/tarot`
      chạy với cờ on, 404 với cờ off; UI Tarot e2e xanh; cờ TAROT
      bật được ở stg.
- [ ] P4 merged: docs + i18n + audit cấu hình prod (6 cờ `false`).
- [ ] `harness-cli` `story update --id US-017 --unit 1 --integration
      1 --e2e 1 --platform 1` ghi nhận.
- [ ] `harness-cli` `trace --story US-017 --outcome completed`.
- [ ] 5 epic con (US-017b..f) tracked trong harness backlog với
      pre-conditions rõ ràng.

KHÔNG yêu cầu trong story TỔNG:

- 5 epic con còn lại merged.
- 5 cờ còn lại bật ở prod.
- Billing thật cho AI gate.
- Bảng `payment` / `tier`.
