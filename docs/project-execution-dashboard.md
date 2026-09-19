# Bảng Điều Hành Thực Thi Dự Án

## Mục Đích

Tài liệu này là bảng điều hành hiện tại cho mục tiêu hoàn thiện Tử Vi Toàn Tập.
Nó gom các phần còn mơ hồ trong `goal.md`, hiểu biết codebase, công cụ/plugin có
thể dùng, trạng thái phase và cổng validation/hardening trước khi coi từng phần
là xong.

Nguồn sự thật cần đọc trước khi làm việc:

- `AGENTS.md`
- `spec.md`
- `goal.md`
- `README.md`
- `docs/agents/commands.md`
- `docs/agents/deploy.md`
- `docs/reports/README.md`
- `docs/tooling-capabilities.md`
- `docs/feature-validation-hardening-matrix.md`
- `docs/templates/feature-completion-checklist.md`
- `docs/goal-completion-audit.md`
- `docs/open-decisions.md`
- `docs/remaining-decision-brief.md`
- `docs/decision-questionnaire.md`
- `plans/260713-0838-complete-tuvitoantap-remaining-work/plan.md`

## Câu Hỏi Cần Chốt

Các điểm này còn mơ hồ và cần user chốt trước khi đổi code lớn:

1. Ưu tiên 30 ngày tới là demo public ổn định hay production thương mại có payment/XU?
2. AI provider chính là DeepSeek hay OpenRouter/OpenAI-compatible?
3. Lục Hào được giữ đường dự phòng cho demo hay phải gia cố `xuanshu` runtime thật trước khi coi xong?
4. AI explanation mở miễn phí cho public beta hay phải siết quota/cost gate trước?
5. Có cho phép chạy live smoke tạo dữ liệu thật trên Supabase production và gọi provider thật không?

Decision log chi tiết nằm ở `docs/open-decisions.md`.
Brief trả lời nhanh nằm ở `docs/remaining-decision-brief.md`.
Phiếu trả lời A/B nằm ở `docs/decision-questionnaire.md`.

Khuyến nghị PM/CEO: chọn demo public ổn định trước. Lý do: sản phẩm cần bằng
chứng activation và reliability trước khi thêm payment. Payment khi core flow
còn 5xx hoặc AI luận sai dữ liệu sẽ làm tăng support, refund và mất niềm tin.

## Hiểu Biết Codebase Hiện Tại

| Lớp | Vai trò | Ghi chú vận hành |
| --- | --- | --- |
| `apps/web` | SvelteKit SPA, Supabase auth client, API client, UI state | Không import engine server-only; response phải parse bằng `@ziweiai/contracts`. |
| `apps/api` | NestJS API, Supabase persistence, AI provider router, quota | Là lớp duy nhất gọi engine, Supabase service logic và AI provider. |
| `packages/contracts` | Zod schemas + shared API types | Nguồn sự thật cho request/response giữa web và API. |
| `packages/astro-engine` | Tính chart/quẻ server-side | Không ship vào browser; có bridge `xuanshu` cho Lục Hào/Đại Lục Nhâm/Kỳ Môn. |
| `vendor/xuanshu-runtime` | Runtime bridge nội bộ | Cần harden thêm nếu muốn production canonical cho các hệ dùng bridge. |
| `apps/api/supabase/migrations` | Schema/RLS Supabase | Owner-scoping dựa trên `owner_user_id`; cần xác minh cloud migration tracking. |

Bất biến quan trọng:

- Web không được import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`, `lunar-javascript`.
- UI user-facing dùng tiếng Việt, không để lọt chữ Hán/Chinese thô.
- `POST /explanations` phải chặn `blocksExactReading=true` trước khi gọi provider.
- Sai owner phải trả như not found, không leak sự tồn tại của record.
- Không commit env thật, service key, token, private key, credential, build output, `.agents`, `.claude`, `.gemini`, artifact mobile/media.

## Công Cụ Và Plugin

| Nhu cầu | Công cụ nên dùng | Trạng thái/ghi chú |
| --- | --- | --- |
| Deploy demo | Vercel CLI | Đường chuẩn: `pnpm deploy:vercel-demo`, token `VERCEL_GALAXY`; không có Vercel plugin callable riêng trong phiên này. |
| Inspect deploy | Vercel CLI | `vercel inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"`. |
| Safe live smoke | Vercel/curl script | `pnpm smoke:vercel-demo`; không tạo Supabase data, không gọi AI provider. |
| Observability tối thiểu | Vercel logs + checklist | `docs/deploy/observability-minimum.md`; theo dõi 5xx, provider timeout, quota hits, AI spend, Supabase drift. |
| Supabase migration sanity | Supabase/curl-free script | `pnpm check:supabase-migrations`; linked ledger cần `SUPABASE_VERIFY_LINKED=1` và CLI đã link project. |
| Local web E2E | Playwright | Config tự start API và web preview; dùng `corepack pnpm`. |
| Live UI debug | Browser/Chrome automation | Dùng khi lỗi chỉ xuất hiện trên domain live hoặc cần DevTools/console. |
| Frontend render debug | Build Web Apps `frontend-testing-debugging` skill | Hữu ích cho UI/console/responsive; không thay Playwright gate. |
| Redesign lớn | Build Web Apps `frontend-app-builder` skill | Chỉ dùng khi có yêu cầu thiết kế/concept mới. |
| External smoke | TestSprite | Dùng khi cần bằng chứng regression ngoài Playwright; queued không tính là pass. |
| Figma/design | Figma plugin | Chỉ dùng khi có file Figma hoặc yêu cầu thiết kế cụ thể. |
| Sites hosting | Sites plugin | Không dùng mặc định vì repo không có `.openai/hosting.json`; Vercel vẫn là đường deploy hiện tại. |

Chi tiết lựa chọn tool nằm ở `docs/tooling-capabilities.md`.
Ma trận validation/hardening theo feature nằm ở
`docs/feature-validation-hardening-matrix.md`.

## Trạng Thái Phase

| Phase | Trạng thái | Việc đã có bằng chứng | Khoảng trống còn lại |
| --- | --- | --- | --- |
| 1. Nguồn sự thật | Completed | `AGENTS.md`, `goal.md`, `spec.md`, `.gitignore` và docs entrypoint đã được chuẩn hóa. | Các file mới cần được Git track khi chuẩn bị commit. |
| 2. Core demo reliability | In progress | Local Playwright smoke pass; full web E2E non-live pass 46/46; route detail/API client/prompt/explanation đã rà; E2E core pass sau fix `PUBLIC_API_BASE_URL`; anonymous/session test đã harden để tránh Supabase Auth rate limit. | Chưa chạy full live smoke tạo chart/quẻ mới + AI explanation trên production. |
| 3. AI provider/cost gate | In progress | Env names đã rà không in secret; quota/error mapping đã harden; router timeout failover/CJK no-failover đã có test; router/quota tests pass. | Cần chốt provider chính và policy mở free beta; live provider smoke cần user cho phép vì sẽ ghi Supabase/gọi provider. |
| 4. Data/ownership/Supabase | In progress | Gateway/services owner-scoped; thêm test ownership; API typecheck pass; local migration sanity pass; linked cloud migration ledger pass 2026-07-13 10:23 +07. | Còn rủi ro vận hành: không `supabase config push` bừa bãi vì auth/rate-limit cloud có thể khác local. |
| 5. Observability/release | In progress | Vercel checklist, deploy script, safe smoke script, report `docs/reports/20260713-vercel-safe-smoke.md`, report index `docs/reports/README.md` và checklist `docs/deploy/observability-minimum.md` đã có. | Chưa có dashboard/alert tự động; live mutation smoke mới cần user cho phép vì sẽ ghi Supabase/gọi provider. |
| 6. Monetization | Pending user decision | Có định hướng credit/XU/payment/entitlement. | Không triển khai tiền khi core flow, AI data quality và ownership chưa đủ bằng chứng. |

## Kiểm Tra Hoàn Thành

Audit hiện hành nằm ở `docs/goal-completion-audit.md`.

Kết luận ngắn: chưa đủ điều kiện đánh dấu goal complete. Các blocker bằng chứng
chính là live mutation smoke mới chưa chạy thật, provider/free-beta policy chưa
chốt và chưa có dashboard alert tự động cho traffic beta. Supabase linked
migration ledger đã pass 2026-07-13 10:23 +07.

## Validation Và Hardening Theo Feature

Mỗi feature chỉ được coi là xong khi có đủ bốn lớp:

1. Logic: dùng dữ liệu thật, contract đúng, không mock hoặc dựa vào dữ liệu rỗng.
2. Workflow: người dùng đi hết được từ entry đến kết quả, không 404/5xx trong luồng chính.
3. Validation: có test/check/smoke phù hợp với phạm vi thay đổi.
4. Hardening: có chặn lỗi dữ liệu, owner leak, quota/cost, provider timeout, UX error và docs cần thiết.

Checklist cụ thể theo feature hoặc nhóm tính năng nằm ở
`docs/feature-validation-hardening-matrix.md`. Khi cần report cho một feature
cụ thể, dùng `docs/templates/feature-completion-checklist.md`.

Gate hẹp thường dùng:

```bash
corepack pnpm -F @ziweiai/api typecheck
corepack pnpm -F @ziweiai/api test -- <target>
corepack pnpm -F @ziweiai/web check
corepack pnpm -F @ziweiai/web e2e
corepack pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
corepack pnpm check:supabase-migrations
git diff --check
git check-ignore .env .env.local .agents .claude .gemini || true
```

Gate deploy/live:

```bash
pnpm deploy:vercel-demo
pnpm smoke:vercel-demo
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
curl -sS https://tuvitoantap.vercel.app/api/health
curl -sS https://tuvitoantap.vercel.app/api/features
```

## Bước Tiếp Theo Khuyến Nghị

1. Chốt 5 câu hỏi ở đầu tài liệu.
2. Nếu chọn demo public ổn định: chạy live smoke có kiểm soát, ghi report và dọn dữ liệu test nếu có service-role path an toàn.
3. Hoàn thiện Phase 3 provider timeout/unavailable UX và quota/cost gate.
4. Nếu anh cho phép, chạy live mutation smoke tạo dữ liệu thật và gọi provider thật, rồi lưu report.
5. Khi có migration mới, chạy lại local + linked Supabase ledger check trước deploy.
6. Khi có traffic thật, nâng checklist observability thành dashboard/alert tự động.
7. Chỉ mở Phase 6 payment/XU sau khi core flow và AI data-quality có bằng chứng pass.
