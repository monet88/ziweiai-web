---
status: draft-awaiting-user-decisions
created: 2026-07-13
source_docs:
  - ../../goal.md
  - ../../spec.md
  - ../../AGENTS.md
  - ../../docs/project-execution-dashboard.md
---

# Hoàn Thành Phần Việc Còn Lại — Tử Vi Toàn Tập

## Mục Tiêu Thực Thi

Hoàn thiện Tử Vi Toàn Tập theo hướng ưu tiên demo public ổn định trước, sau đó
harden các lớp dữ liệu, AI, quota, observability và monetization. Mỗi feature
phải đi qua vòng: implement -> validate -> harden -> document trước khi coi là
xong.

Dashboard điều hành ngắn gọn cho goal này nằm tại
`docs/project-execution-dashboard.md`.

Completion audit hiện hành nằm tại `docs/goal-completion-audit.md`.
Decision log hiện hành nằm tại `docs/open-decisions.md`.
Brief trả lời nhanh hiện hành nằm tại `docs/remaining-decision-brief.md`.
Feature validation/hardening matrix hiện hành nằm tại
`docs/feature-validation-hardening-matrix.md`.
Template report hoàn thành feature nằm tại
`docs/templates/feature-completion-checklist.md`.

Goal vận hành:

```text
Core demo public tại https://tuvitoantap.vercel.app phải chạy ổn định:
anonymous auth -> create chart/quẻ -> mở detail -> refresh detail -> tạo AI
explanation bằng dữ liệu snapshot thật -> xem lại history, không có 404/5xx
trong luồng chính.
```

## Quyết Định Cần Chốt Với User

Các điểm này còn mơ hồ trong `goal.md` và cần chốt trước khi đổi code lớn:

1. Đích 30 ngày tới là **demo public ổn định** hay **production thương mại có
   payment/XU**?
2. AI provider chính là **DeepSeek hiện tại** hay chuyển **OpenRouter
   OpenAI-compatible** làm provider chính?
3. Lục Hào fallback có được giữ cho demo, hay phải harden `xuanshu` runtime thật
   trước khi coi tính năng này là hoàn tất?
4. AI explanation có mở miễn phí cho public beta không, hay phải làm quota/cost
   control trước khi mở traffic?
5. Payment/VietQR/XU là phase tiếp theo ngay, hay để sau khi core flow pass
   smoke production nhiều vòng?

Khuyến nghị CEO/PM: chọn **demo public ổn định trước**. Lý do: sản phẩm cần bằng
chứng activation/reliability trước khi thêm payment. Payment khi core flow còn
5xx hoặc AI luận sai dữ liệu sẽ làm tăng rủi ro support, refund và mất niềm tin.

## Công Cụ Và Kênh Triển Khai

| Nhu cầu | Công cụ chính | Ghi chú |
| --- | --- | --- |
| Deploy demo | Vercel CLI | Dùng `pnpm deploy:vercel-demo` và `VERCEL_GALAXY`. |
| Safe live smoke | Vercel/curl script | Dùng `pnpm smoke:vercel-demo`; không tạo dữ liệu Supabase, không gọi AI provider. |
| Guarded live mutation smoke | Vercel + Supabase + AI script | Dùng `pnpm smoke:vercel-live-mutation`; mặc định skip, chạy thật khi có cờ xác nhận. |
| Observability tối thiểu | Vercel logs + checklist | Dùng `docs/deploy/observability-minimum.md`; chưa thay cho dashboard/alert tự động. |
| Kiểm chứng web flow | Playwright | Gate chính, config tự start API và web preview. |
| Regression/demo smoke bên ngoài | TestSprite | Dùng khi cần bằng chứng độc lập cho demo public. |
| Debug UI live | Browser/Chrome automation | Dùng cho lỗi chỉ xuất hiện trên domain live. |
| Targeted frontend debug | Build Web Apps `frontend-testing-debugging` | Dùng cho lỗi UI/render/console/responsive; ưu tiên Browser plugin nếu khả dụng, fallback Playwright khi cần. |
| Redesign/polish lớn | Build Web Apps `frontend-app-builder` | Chỉ dùng khi có redesign hoặc UI concept mới; không cần cho bugfix core flow hiện tại. |
| Thiết kế/Figma | Figma plugin | Chỉ dùng khi có yêu cầu thiết kế hoặc file Figma. |
| Sites hosting | Sites plugin | Chỉ dùng nếu có `.openai/hosting.json` hoặc đổi chiến lược khỏi Vercel. |

Tooling map chi tiết: `docs/tooling-capabilities.md`.
Decision log chi tiết: `docs/open-decisions.md`.
Ma trận validation/hardening chi tiết:
`docs/feature-validation-hardening-matrix.md`.

Kết luận tool discovery 2026-07-13:

- Repo có `vercel.json`, script `pnpm deploy:vercel-demo` và checklist Vercel,
  nên Vercel CLI là kênh deploy chuẩn.
- Safe smoke sau deploy có script `pnpm smoke:vercel-demo`: kiểm tra account,
  inspect alias, root page, `/api/health`, `/api/features` và SPA fallback
  `/charts/<uuid>`.
- Live mutation smoke có script `pnpm smoke:vercel-live-mutation`: tạo anonymous
  Supabase session, cast Lục Hào, mở detail và gọi overview AI explanation khi
  bật cờ `LIVE_MUTATION_SMOKE=1` + `LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app`.
- Report index `docs/reports/README.md` phân biệt bằng chứng lịch sử, safe smoke
  và live mutation smoke để tránh dùng report cũ làm bằng chứng hiện tại quá
  phạm vi.
- Không có `.openai/hosting.json`; Sites plugin không phải đường triển khai
  hiện tại và không nên dùng thay Vercel nếu chưa có quyết định đổi hosting.
- Build Web Apps skill hữu ích nhất ở nhánh kiểm thử/render frontend; với repo
  hiện tại vẫn phải tôn trọng SvelteKit SPA, Playwright E2E và AGENTS/spec.
- Tool discovery không trả về Vercel plugin callable riêng; Vercel vận hành qua
  CLI/script trong repo.
- Tool discovery refresh 2026-07-13 10:13 +07 vẫn cho kết luận trên: Sites,
  Figma, GitHub, Codex thread và multi-agent tools có callable MCP; Vercel
  connector riêng không có; Build Web Apps hiện dùng như skill/hướng dẫn cho
  frontend debug/redesign, không phải deploy connector.

## Phase 1 — Chuẩn Hóa Nguồn Sự Thật

Trạng thái: `completed`

Mục tiêu:

- Root `AGENTS.md` tồn tại và không bị Git ignore.
- `goal.md` và `spec.md` là tiếng Việt, đủ rõ để agent đọc trước khi làm.
- Các docs mới không mâu thuẫn với `README.md`, `docs/agents/*`,
  `docs/deploy/vercel-demo-release-checklist.md`.

Việc cần làm:

- [x] Tạo root `AGENTS.md`.
- [x] Việt hóa heading chính của `goal.md` và `spec.md`.
- [x] Cho phép Git track root `AGENTS.md`.
- [x] Giữ ignore cho `.agent`, `.agents`, `.claude`, `.gemini`, env, key,
  mobile/media artifacts.
- [x] Rà nhanh README/docs chính để phát hiện claims cũ còn mâu thuẫn.
- [x] Sửa các entrypoint docs còn trỏ sai spec cũ/root agent router/API
  endpoint snapshot cũ.
- [x] Ghi tooling map để tránh dùng nhầm plugin/skill cho deploy hoặc UI debug.

Evidence:

- `README.md`
- `docs/product/README.md`
- `docs/product/overview.md`
- `docs/agents/README.md`
- `docs/agents/web-boundaries.md`
- `docs/tooling-capabilities.md`

Validation:

- `git check-ignore -v AGENTS.md .agents .claude .gemini .env.local '*.apk' '*.mp4' || true`
- `git diff --check`

Hardening:

- Không ghi secret, token, service role, env thật vào docs.
- Không tạo rule docs làm mất quyền ưu tiên của `apps/web/AGENTS.md`,
  `apps/api/AGENTS.md`, `packages/AGENTS.md`.

## Phase 2 — Core Demo Reliability

Trạng thái: `in_progress`

Mục tiêu:

- Luồng anonymous -> create -> detail -> refresh -> AI explanation -> history
  chạy ổn trên local và demo public.
- Không còn lỗi 404 `/api/charts/:id` trên route detail.
- Không còn AI trả lời dựa trên câu hỏi lạc ngữ cảnh hoặc snapshot rỗng.

Việc cần làm:

- [x] Chạy Playwright smoke local.
- [x] Chạy live pre-check trên `https://tuvitoantap.vercel.app`.
- [x] Kiểm tra route detail dùng đúng API client và parse contract.
- [x] Kiểm tra `POST /explanations` chỉ dùng structured snapshot/chart data.
- [x] Kiểm tra prompt không để model trả lời như chatbot chung chung.
- [x] Fix hẹp lỗi E2E local bị dính `PUBLIC_API_BASE_URL` production.
- [x] Chạy lại E2E core sau fix.

Evidence 2026-07-13:

- Local smoke pass: `corepack pnpm -F @ziweiai/web exec playwright test
  smoke.spec.ts --workers=1` -> 1 passed.
- Vercel inspect pass: deployment `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`, target
  production, status Ready.
- Public API health pass: `GET /api/health` -> HTTP 200.
- Public feature flags pass: `GET /api/features` -> HTTP 200.
- SPA fallback pass: `HEAD /charts/0391944a-50dd-44ae-ba2b-3d784c8b757e` ->
  HTTP 200, `content-disposition: inline; filename="index.html"`.
- Code inspection: `fetchChartDetail` parse bằng `chartDetailResponseSchema`;
  `createExplanation` parse bằng `createExplanationResponseSchema`; UI disable
  nút AI khi `snapshot.calculationConfidence.blocksExactReading=true`.
- Code inspection: `ExplanationsService` lấy snapshot theo owner, chặn
  `blocksExactReading`, resolve `divinationInquiry` từ DB cho hệ quẻ, rồi truyền
  `chartSnapshot` + `explanationContext` vào provider.
- Prompt inspection: Lục Hào/Mai Hoa/Kỳ Môn/Đại Lục Nhâm inject câu hỏi gốc qua
  `buildDivinationInquiryLines`; Tử Vi per-palace prompt dùng dữ liệu cung sao
  thật và bắt buộc tiếng Việt.
- Targeted API tests pass: `corepack pnpm -F @ziweiai/api test --
  explanations.service build-liuyao-explanation-prompt
  build-palace-explanation-prompt explanation-provider-router` -> 60 files, 402
  tests passed.
- E2E core phát hiện lỗi cấu hình local: bản web preview build với
  `PUBLIC_API_BASE_URL=https://api.tuvi.monet.uno`, nên browser localhost gọi API
  production và bị CORS chặn ở `/features`, `/history`, `/charts`,
  `/divinations`. Fix tại `apps/web/playwright.config.ts`: web server E2E ép
  `PUBLIC_API_BASE_URL=http://localhost:3000` trong build/preview.
- E2E core rerun pass sau fix: `corepack pnpm -F @ziweiai/web exec playwright
  test us-006-ziwei-detail.spec.ts us-025-divination.spec.ts --workers=1` -> 3
  passed.
- Full web E2E non-live pass sau hardening session/theme/history:
  `corepack pnpm -F @ziweiai/web e2e` -> 46 passed, 0 failed. Lượt này chứng
  minh regression local tốt hơn nhưng vẫn không thay thế live mutation smoke
  production vì không gọi provider thật.

Remaining Phase 2 gap:

- Chưa chạy full browser live tạo chart/quẻ mới + tạo AI explanation trên
  production vì bước đó dùng Supabase production và có thể gọi provider thật.

Validation:

```bash
pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS https://tuvitoantap.vercel.app/api/features
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
```

Hardening:

- Confirm không có 404/5xx trong DevTools cho core flow.
- Confirm `blocksExactReading=true` bị chặn trước provider.
- Confirm output AI tiếng Việt, không raw Chinese/Han.
- Dọn smoke data nếu dùng service-role script.

## Phase 3 — AI Provider Và Cost Gate

Trạng thái: `in_progress`

Mục tiêu:

- AI provider có thứ tự fallback rõ.
- Public traffic không thể đốt chi phí không kiểm soát.
- Provider errors trả typed error, UI hiển thị thông báo Việt dễ hiểu.

Việc cần làm:

- [ ] Chốt DeepSeek hay OpenRouter làm provider chính.
- [x] Rà env production liên quan AI mà không in secret.
- [x] Rà quota hiện tại: anonymous, signed-in, conversation, explanation.
- [x] Hardening quota/error mapping để lỗi hạ tầng không bị báo nhầm là user vượt quota.
- [x] Hardening timeout/failover/provider unavailable ở router layer.
- [x] Thêm test cho provider router timeout failover và CJK no-failover.

Evidence 2026-07-13:

- Env/config inspection: `apiEnvSchema` có `AI_DEFAULT_PROVIDER`, `DEEPSEEK_*`,
  `OPENAI_COMPAT_*`, `GEMINI_*`, `AI_PROVIDER_TIMEOUT_MS`,
  `AI_EXPLANATION_FREE_FOR_ALL`, `AI_CONVERSATION_ENABLED`,
  `AI_ANNUAL_REPORT_ENABLED`, `QUOTA_STORE_DRIVER`, `QUOTA_FAIL_MODE`.
- Provider chain inspection: `ExplanationProviderRouter` dùng provider base chain
  và lọc provider vision-capable khi có ảnh; nếu không có provider đọc ảnh thì
  ném `ProviderUnavailableError`.
- Provider config inspection: Vercel production có các env name
  `OPENAI_COMPAT_API_KEY`, `OPENAI_COMPAT_BASE_URL`, `OPENAI_COMPAT_MODEL`,
  `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `AI_DEFAULT_PROVIDER`; không in secret
  value. Không thấy `GEMINI_API_KEY`, nên Gemini chưa phải fallback production
  đáng tin nếu chưa cấu hình thêm.
- Router tests pass: `corepack pnpm -F @ziweiai/api test --
  explanation-provider-router conversation-provider-router` -> 61 files, 407
  tests passed.
- Router hardening: timeout/provider lỗi ở provider đầu sẽ failover sang provider
  kế tiếp; CJK guard không failover để tránh đốt quota kép cho nội dung đã bị
  chặn.
- Test added: `explanation-provider-router.test.ts` và
  `conversation-provider-router.test.ts` khóa timeout failover và CJK no-failover.
- Test pass: `corepack pnpm -F @ziweiai/api test --
  explanation-provider-router conversation-provider-router llm-exchange` -> 62
  files, 414 tests passed.
- Quota inspection: anonymous chart/explanation/conversation đếm daily theo IP
  qua `QuotaCounterStore`; signed-in chart/explanation/conversation đếm theo DB
  hoặc userId; vision và annual có quota riêng.
- Hardening: `throwQuotaRateLimited` không còn catch-all mọi lỗi thành 429.
  `DailyQuotaExceededError`, `RateLimitWindowError` và legacy quota messages vẫn
  trả `429 RATE_LIMITED`; lỗi hạ tầng lạ trả `503 INTERNAL_ERROR` với message
  tiếng Việt chung.
- Test pass: `corepack pnpm -F @ziweiai/api test -- quota-http quotas.service
  charts.service explanations.service annual-report.service draws-tarot.service`
  -> 61 files, 407 tests passed.
- Typecheck pass: `corepack pnpm -F @ziweiai/api typecheck`.

Validation:

```bash
pnpm -F @ziweiai/api test -- explanations
pnpm -F @ziweiai/api typecheck
pnpm -F @ziweiai/web test
```

Hardening:

- Không log API key hoặc prompt chứa dữ liệu nhạy cảm.
- Không gửi provider khi snapshot thiếu dữ liệu nền.
- Có user-facing error cho timeout/unavailable/quota exceeded.

Remaining Phase 3 gap:

- Chưa chốt provider chính DeepSeek hay OpenRouter/OpenAI-compatible.
- Chưa chốt policy public beta: mở free AI explanation hay siết quota trước.
- Chưa chạy live provider call trên production vì cần user cho phép ghi Supabase
  và gọi provider thật.

## Phase 4 — Data, Ownership Và Supabase

Trạng thái: `in_progress`

Mục tiêu:

- Mọi record scoped theo `owner_user_id`.
- Anonymous và signed-in đều lưu/xem lại đúng history.
- Sai owner không lộ sự tồn tại của record.

Việc cần làm:

- [x] Rà migrations đã apply và tracking Supabase cloud.
- [x] Thêm/chạy local migration sanity check để tránh sai filename/version trước
  khi đối chiếu cloud.
- [x] Rà persistence gateway ownership cho chart, divination, explanation,
  history, conversation, annual report và vision results.
- [x] Rà chart/explanation/history/conversation services để sai owner trả về
  như không tồn tại thay vì lộ record.
- [x] Thêm/chạy test owner-scoping ở gateway và service layer.

Evidence 2026-07-13:

- Migrations inspection: các migration `000001`, `000004`, `000005`, `000006`,
  `000007`, `000009`, `000010` đều dùng `owner_user_id`/RLS cho các bảng user
  data chính; `vision_results.image_path` có check theo owner prefix.
- Persistence inspection: `SupabasePersistenceGateway` đọc snapshot,
  divination context, explanation request/result, history, conversation,
  annual report và vision result bằng `owner_user_id`.
- Service inspection: `ChartsService.getChartDetail`,
  `ConversationsService.createConversation`, `getConversationDetail`,
  `listConversationsForChart` và `HistoryService.listHistory` đều đi qua gateway
  owner-scoped; sai owner trả 404/not found thay vì 403 có thể leak existence.
- Test added: `apps/api/src/database/supabase-persistence.gateway.ownership.test.ts`
  khóa các query quan trọng phải có `.eq('owner_user_id', ownerUserId)`.
- Test pass: `corepack pnpm -F @ziweiai/api test --
  supabase-persistence.gateway.ownership history.service conversations.service
  charts.service explanations.service` -> 62 files, 410 tests passed.
- Typecheck pass: `corepack pnpm -F @ziweiai/api typecheck`.
- Script added: `scripts/check-supabase-migrations.zsh` và package command
  `pnpm check:supabase-migrations`.
- Local migration sanity pass: `corepack pnpm check:supabase-migrations` -> 9
  migration files, no duplicate versions; warning gap `000002 -> 000004` vì repo
  hiện không có `000003`.
- Linked migration ledger initially failed because CLI was not linked to the
  project ref.
- Safe project ref discovery 2026-07-13 10:23 +07: parsed only Supabase URL
  host from `.env`/`.env.local`, did not print secrets; project ref is
  `ttvqrukctlebkggsylun`.
- Local CLI link 2026-07-13 10:23 +07: `supabase link --project-ref
  ttvqrukctlebkggsylun --workdir apps/api --yes` completed. This writes only
  ignored local CLI state under `apps/api/supabase/.temp`, not production schema.
- Linked migration ledger pass 2026-07-13 10:23 +07:
  `SUPABASE_VERIFY_LINKED=1 corepack pnpm check:supabase-migrations` -> local
  and remote both list `000001`, `000002`, `000004`, `000005`, `000006`,
  `000007`, `000008`, `000009`, `000010`.

Validation:

```bash
pnpm -F @ziweiai/api test -- supabase-persistence
pnpm -F @ziweiai/api test
pnpm check:supabase-migrations
SUPABASE_VERIFY_LINKED=1 pnpm check:supabase-migrations
```

Hardening:

- Không query Supabase ad hoc từ feature modules.
- Không expose service role ra browser.
- Không leak 403/404 theo cách cho biết record tồn tại.

Remaining Phase 4 gap:

- Supabase cloud migration tracking đã được xác minh cho project
  `ttvqrukctlebkggsylun` lúc 2026-07-13 10:23 +07. Còn rủi ro vận hành: không
  được `supabase config push` bừa bãi vì auth rate-limit cloud có thể khác
  `config.toml` local.

## Phase 5 — Observability Và Release Discipline

Trạng thái: `in_progress`

Mục tiêu:

- Có checklist vận hành đủ để biết demo lỗi ở đâu: API 5xx, provider latency,
  AI cost, Vercel deploy, Supabase health.

Việc cần làm:

- [x] Chuẩn hóa release checklist.
- [x] Bổ sung script/doc safe live smoke để giảm thao tác thủ công.
- [x] Bổ sung guarded live mutation smoke script, mặc định không ghi production.
- [x] Đề xuất dashboard/alert tối thiểu: 5xx, provider timeout, quota hits,
  AI spend.
- [x] Rà docs reports để tránh claims cũ gây nhầm trạng thái.

Evidence 2026-07-13:

- `docs/deploy/vercel-demo-release-checklist.md` đã ghi rõ pre-check token
  `VERCEL_GALAXY`, account `galaxypro710-7060`, script deploy, smoke test,
  TestSprite rerun và rollback bằng Vercel alias.
- `scripts/deploy-vercel-demo.zsh` source `~/.zshrc`, bắt buộc
  `VERCEL_GALAXY`, unset `VERCEL_TOKEN`, kiểm tra đúng account trước deploy,
  alias domain và inspect lại domain.
- `scripts/smoke-vercel-demo.zsh` source `~/.zshrc`, bắt buộc
  `VERCEL_GALAXY`, unset `VERCEL_TOKEN`, kiểm tra đúng account, inspect alias,
  kiểm tra root page, `/api/health`, `/api/features` và SPA fallback chart
  detail. Script mặc định không ghi Supabase và không gọi AI provider.
- `scripts/smoke-vercel-live-mutation.zsh` mặc định skip nếu thiếu cờ xác nhận;
  khi chạy thật sẽ dùng Supabase anonymous sign-in, gọi `POST /api/divinations`
  cho `liu-yao`, kiểm tra `snapshot.liuyao` và `blocksExactReading=false`, gọi
  `GET /api/charts/:id`, rồi gọi `POST /api/explanations` với `overview`.
  Cleanup anonymous user chỉ chạy khi có `LIVE_MUTATION_SMOKE_CLEANUP=1` và
  `SUPABASE_SERVICE_ROLE_KEY`.
- Safe smoke pass 2026-07-13: `corepack pnpm smoke:vercel-demo` -> Vercel
  account `galaxypro710-7060`, deployment `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`
  target production Ready, root/API/fallback đều HTTP 200.
- Report: `docs/reports/20260713-vercel-safe-smoke.md`.
- Report index: `docs/reports/README.md` phân loại `20260617` là review lịch
  sử, `20260710` là bằng chứng deploy/debug lịch sử có phụ lục audit, và
  `20260713` là safe smoke mới nhất không ghi dữ liệu.
- Observability checklist: `docs/deploy/observability-minimum.md` định nghĩa
  nguồn tín hiệu, alert tối thiểu, post-deploy checklist và incident runbook cho
  API 5xx, provider timeout/unavailable, quota hits, quota-store outage, AI
  spend và Supabase migration drift.

Remaining Phase 5 gap:

- Chưa có dashboard/alert tự động gom log thành biểu đồ 5xx/provider/quota/spend.
- Chưa chạy live mutation smoke mới sau khi thêm guarded script vì bước đó cần
  user cho phép ghi Supabase và gọi provider thật. Bằng chứng live mutation lịch sử
  nằm trong phụ lục `docs/reports/20260710-tuvitoantap-vercel-testsprite-deploy.md`.

Validation:

- Chạy deploy inspect khi có deploy.
- Chạy `pnpm smoke:vercel-demo` sau deploy.
- Lưu report ngắn trong `docs/reports/` nếu có production smoke mới.

Hardening:

- Rollback path rõ.
- Không deploy nhầm Vercel account.
- Không để TestSprite queued là bằng chứng pass.
- Không log secret, full prompt, ảnh người dùng hoặc dữ liệu cá nhân không cần
  thiết khi điều tra incident.

## Phase 6 — Monetization: Payment / VietQR / XU

Trạng thái: `pending-user-decision`

Mục tiêu:

- Chỉ triển khai khi core demo đủ ổn định và user chốt payment là ưu tiên gần.

Việc cần làm:

- [ ] Chốt model: credit/XU, premium report, conversation package hoặc hybrid.
- [ ] Chốt provider thanh toán: VietQR/SePay/Stripe/khác.
- [ ] Thiết kế ledger không sửa tay được, idempotent, audit được.
- [ ] Gate AI/premium bằng entitlement thật.
- [ ] Viết refund/privacy/terms/data deletion tối thiểu.

Validation:

- Unit test ledger/idempotency.
- Integration test webhook/payment callback.
- E2E paid gate: chưa mua -> bị chặn, đã mua -> mở đúng quyền.

Hardening:

- Không xử lý tiền nếu chưa có audit path.
- Không lưu thông tin thanh toán nhạy cảm vượt nhu cầu.
- Không mở paid UX khi core AI còn thiếu data-quality gate.

## Acceptance Criteria Tổng

Goal này chỉ hoàn tất khi có bằng chứng:

| Điều kiện | Trạng thái hiện tại | Bằng chứng / việc còn lại |
| --- | --- | --- |
| `AGENTS.md`, `goal.md`, `spec.md` phản ánh đúng trạng thái | Đã có nội dung; còn cần Git stage/commit khi chuẩn bị ship | Root `AGENTS.md`, `goal.md`, `spec.md`; `git status` vẫn đang có file untracked. |
| Core flow local Playwright smoke pass | Đã chứng minh | Local smoke và full non-live E2E pass 46/46. |
| Core flow production smoke pass trên `https://tuvitoantap.vercel.app` | Chưa chứng minh đủ | Safe smoke pass; live mutation smoke production chưa chạy thật vì cần approval Q1. |
| AI explanation dùng snapshot thật, không trả lời lạc ngữ cảnh như chatbot chung | Đã chứng minh local/by tests; live provider chưa chứng minh | `ExplanationsService` lấy snapshot/context theo owner; prompt tests pass; cần live mutation smoke để chứng minh provider thật. |
| Không có 404/5xx ở core flow trong demo smoke | Đã chứng minh một phần | Safe smoke root/API/fallback pass; chưa chứng minh create/detail/explanation live mới. |
| `.gitignore` chặn env/key/credentials/agent dirs/mobile/media artifacts | Đã chứng minh | `git check-ignore` pass cho env, key, credentials, `.agents`, `.claude`, `.gemini`, apk/aab/ipa/mp4. |
| Provider/quota/cost gate đủ an toàn cho traffic beta | Đã chứng minh một phần | Router/quota tests pass; còn cần chốt provider chính và quota/free beta policy Q2/Q3. |
| Ownership/Supabase không leak dữ liệu user khác | Đã chứng minh cho schema/ledger hiện tại | Gateway ownership tests pass; linked Supabase migration ledger pass 2026-07-13 10:23 +07. |
| Có release/rollback checklist rõ | Đã chứng minh | Vercel checklist, deploy script, safe smoke script, guarded live mutation script, observability checklist. |
| Nếu bật monetization, payment/ledger/entitlement có test và audit path | Chưa áp dụng / chưa làm | Q5 đang khuyến nghị để sau core reliability; nếu chọn làm ngay phải tạo spec riêng trước code. |

Audit trạng thái 2026-07-13:

- `docs/goal-completion-audit.md` kết luận chưa đủ điều kiện complete.
- Các gap chính: live mutation smoke mới chưa chạy thật,
  provider/free-beta policy chưa chốt, chưa có dashboard/alert tự động cho
  traffic beta. Supabase linked migration ledger đã pass 2026-07-13 10:23 +07.
- Các quyết định đang chờ user chốt được gom trong `docs/open-decisions.md`.
- Phiếu trả lời nhanh nằm ở `docs/decision-questionnaire.md`.

## Checklist Thực Thi Sau Khi User Chốt Q1-Q5

Nếu user trả lời `Q1=A, Q2=A, Q3=A, Q4=A, Q5=A`, làm theo thứ tự:

1. Không đổi provider/env/payment trước smoke; giữ DeepSeek chính và
   OpenRouter/OpenAI-compatible fallback như hiện tại.
2. Chạy live mutation smoke có kiểm soát:

```bash
LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

3. Nếu có thể dùng service role để cleanup, thêm:

```bash
LIVE_MUTATION_SMOKE_CLEANUP=1
```

4. Ghi report mới trong `docs/reports/` với chart id, owner user id, provider,
   HTTP status, cleanup status và lỗi 5xx/quota/provider nếu có.
5. Cập nhật `docs/goal-completion-audit.md`, `docs/open-decisions.md`,
   `docs/remaining-decision-brief.md` và `docs/project-execution-dashboard.md`
   theo kết quả thật.
6. Nếu smoke pass, không mở payment ngay; giữ Payment/VietQR/XU ở backlog cho
   đến khi có spec ledger/idempotency/webhook/paid gate.
7. Nếu smoke fail, fix theo root cause trước khi claim complete: provider,
   Supabase auth/DB, API 5xx, quota, prompt/data quality hoặc Vercel timeout.

## Anti-Self-Sabotage

- Không thêm feature mới khi core flow chưa pass smoke.
- Không deploy nếu `VERCEL_GALAXY` không xác nhận đúng account.
- Không coi TestSprite queued là pass.
- Không mở payment trước khi AI và ownership ổn định.
- Không dùng “đã đọc code thấy ổn” thay cho test/smoke thực tế.
