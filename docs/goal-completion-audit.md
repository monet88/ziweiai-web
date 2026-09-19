# Kiểm Tra Mức Độ Hoàn Thành Goal

Ngày audit: 2026-07-13  
Lần cập nhật mới nhất: 2026-07-13 10:23 +07  
Phạm vi: active goal trong thread, `goal.md`, `spec.md`, `AGENTS.md`,
`docs/project-execution-dashboard.md` và plan hiện hành.

Nhật ký quyết định cho các điểm cần chốt: `docs/open-decisions.md`.
Brief trả lời nhanh cho chủ dự án: `docs/remaining-decision-brief.md`.
Ma trận validation/hardening theo feature:
`docs/feature-validation-hardening-matrix.md`.

## Kết Luận

Goal **chưa đủ điều kiện đánh dấu complete**.

Đã hoàn thành phần lớn nền tảng điều phối, tài liệu, tool discovery, smoke an
toàn, hardening AI/quota/ownership và release discipline. Tuy nhiên vẫn thiếu
bằng chứng mạnh cho các yêu cầu production-facing:

- Chưa chạy live mutation smoke mới tạo chart/quẻ và gọi AI provider thật sau
khi thêm guarded script.
- Supabase linked migration ledger đã xác minh pass lúc 2026-07-13 10:23 +07
  sau khi link local CLI vào project ref công khai lấy từ Supabase URL:
  `ttvqrukctlebkggsylun`.
- Chưa chốt provider chính DeepSeek hay OpenRouter/OpenAI-compatible.
- Chưa chốt policy free beta/quota/cost gate.
- Chưa có dashboard/alert tự động cho 5xx/provider/quota/spend.
- Monetization/payment/XU vẫn pending user decision.

Kiểm tra cục bộ mới nhất đã khép lỗi E2E còn lại: web check pass và Playwright
non-live E2E pass 46/46 sau khi gia cố nhận diện phiên anonymous, cache session
test để tránh Supabase Auth rate limit, cập nhật test theme theo direction
0031 và sửa test history không phụ thuộc CTA chỉ hiện cho member.

## Yêu Cầu Và Bằng Chứng

| Yêu cầu | Bằng chứng hiện có | Kết luận |
| --- | --- | --- |
| Đọc và tuân thủ `AGENTS.md` trước khi làm | Root `AGENTS.md` tồn tại; các lượt làm việc đọc `AGENTS.md`, `spec.md`, `goal.md`, `README.md`, `docs/agents/commands.md`, `docs/agents/deploy.md` trước sửa docs/scripts. | Đã chứng minh cho lượt hiện tại. |
| `spec.md` và `goal.md` là nguồn sự thật tiếng Việt | `spec.md`, `goal.md` đã được tạo/cập nhật bằng tiếng Việt; đã bổ sung quy tắc mọi trao đổi với chủ dự án và báo cáo sản phẩm dùng tiếng Việt, chỉ giữ English cho định danh kỹ thuật. | Đã chứng minh. |
| Hỏi các phần mơ hồ trong `goal.md` | `docs/project-execution-dashboard.md` và plan liệt kê 5 câu hỏi cần chốt: ưu tiên demo vs production thương mại, provider chính, Lục Hào fallback, free beta quota, payment phase. | Đã chứng minh. |
| Tạo goal/plan hoàn thành phần còn lại | `plans/260713-0838-complete-tuvitoantap-remaining-work/plan.md` tồn tại, có phase, evidence, gaps, acceptance criteria. | Đã chứng minh. |
| Mỗi feature có validation và hardening | `AGENTS.md` có checklist hoàn thành feature; plan ghi validation/hardening theo phase; `docs/feature-validation-hardening-matrix.md` map từng feature/nhóm tính năng sang gate và hardening cụ thể; full non-live E2E mới nhất pass 46/46; linked cloud migration ledger pass ngày 2026-07-13 10:23 +07. | Đã chứng minh một phần; vẫn cần live mutation smoke mới cho phần production-facing. |
| Hiểu codebase hiện tại | `docs/project-execution-dashboard.md` ghi kiến trúc apps/web, apps/api, contracts, astro-engine, xuanshu runtime, Supabase migrations và invariants. | Đã chứng minh ở mức tài liệu. |
| Khám phá công cụ/plugin Vercel và Build Web Apps | `docs/tooling-capabilities.md` ghi kết quả: không có Vercel connector callable riêng; Vercel dùng CLI/script; Build Web Apps là skill cho frontend debug/redesign; Sites/Figma/Browser scope rõ. | Đã chứng minh. |
| Demo public Vercel reachable | `pnpm smoke:vercel-demo` pass: Vercel account `galaxypro710-7060`, deployment `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`, root/API/fallback HTTP 200. | Đã chứng minh cho safe smoke. |
| Core flow production `anonymous -> create -> detail -> AI` pass hiện tại | Report lịch sử có live mutation evidence; report mới nhất `20260713-vercel-safe-smoke.md` chỉ safe smoke không ghi dữ liệu. Guarded script mới mặc định skip và chưa chạy thật. | Chưa chứng minh cho trạng thái hiện tại. |
| AI explanation dùng snapshot thật, không trả lời như chatbot chung | Rà code và tests trong plan: ExplanationsService lấy snapshot/divination context theo owner, prompt inject câu hỏi quẻ, blocked snapshot bị chặn. | Đã chứng minh local/by tests; live provider mới chưa chứng minh. |
| Không có 404/5xx ở core flow | Safe smoke chứng minh root/API public/fallback không 404/5xx. Chưa chứng minh create/detail/explanation live mới. | Đã chứng minh một phần. |
| `.gitignore` chặn secret/build/agent/mobile/media artifacts | `git check-ignore` chứng minh `.agents`, `.claude`, `.gemini`, `.env*`, `*.apk`, `*.mp4`, `*.aab`, `*.ipa` bị ignore; root `AGENTS.md` không bị ignore. | Đã chứng minh. |
| Provider/quota/cost gate đủ an toàn beta | Quota/error mapping hardening và provider router tests pass; observability checklist có alert cost/quota. Chưa chốt provider chính và policy free beta. | Đã chứng minh một phần. |
| Ownership/Supabase không leak dữ liệu user khác | Added gateway ownership test; targeted tests pass; service/gateway owner-scoped theo plan. Linked cloud migration ledger pass 2026-07-13 10:23 +07: local/remote cùng versions `000001`, `000002`, `000004`-`000010`. | Đã chứng minh cho schema/ledger hiện tại. |
| Release/rollback checklist rõ | `docs/deploy/vercel-demo-release-checklist.md`, deploy script, safe smoke script, guarded live mutation smoke script, observability doc có. | Đã chứng minh. |
| Reports không gây hiểu nhầm trạng thái | `docs/reports/README.md` phân loại bằng chứng lịch sử, safe smoke và live mutation smoke; report cũ có status note. | Đã chứng minh. |
| Tooling map rõ để phát huy đúng công cụ | `docs/tooling-capabilities.md` liệt kê Vercel CLI, Build Web Apps, Sites, Browser, Figma, Supabase, TestSprite theo use case. | Đã chứng minh. |
| Nếu bật monetization, payment/ledger/entitlement có test/audit | Phase 6 vẫn pending user decision; chưa triển khai payment/XU. | Chưa áp dụng / chưa hoàn tất. |

## Các Gate Đã Có Bằng Chứng Pass

Các bằng chứng được ghi trong plan/dashboard/report hiện hành:

- `corepack pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1`
  -> pass mới nhất 2026-07-13 09:50 +07.
- `corepack pnpm -F @ziweiai/web exec playwright test us-006-ziwei-detail.spec.ts us-025-divination.spec.ts --workers=1`
  -> pass.
- Targeted API tests cho explanations/prompt/provider router/quota/ownership
  -> pass mới nhất 2026-07-13 09:53 +07; Vitest chạy 62 files, 414 tests pass
  cho command `explanations.service explanation-provider-router
  conversation-provider-router quota-http supabase-persistence.gateway.ownership`.
- `corepack pnpm -F @ziweiai/contracts test`
  -> pass mới nhất 2026-07-13 09:53 +07; 15 files, 122 tests pass.
- `corepack pnpm -F @ziweiai/astro-engine test`
  -> pass mới nhất 2026-07-13 09:53 +07; 5 files, 36 tests pass.
- `corepack pnpm lint`
  -> pass mới nhất 2026-07-13 09:54 +07.
- `corepack pnpm typecheck`
  -> pass mới nhất 2026-07-13 09:54 +07; Turbo ran 8 tasks successfully.
- `corepack pnpm build`
  -> pass mới nhất 2026-07-13 09:55 +07; Turbo ran 5 build tasks
  successfully.
- `corepack pnpm test`
  -> pass mới nhất 2026-07-13 09:56 +07; Turbo ran 8 test tasks
  successfully. Visible counts: API 62 files / 414 tests, Web 41 files / 244
  tests, Contracts 15 files / 122 tests, Core 2 files / 9 tests,
  Astro-engine 5 files / 36 tests.
- `corepack pnpm -F @ziweiai/api typecheck`
  -> pass mới nhất 2026-07-13 09:50 +07.
- `corepack pnpm -F @ziweiai/web check`
  -> pass mới nhất 2026-07-13 10:08 +07; `svelte-check` 0 errors, 0 warnings.
- `corepack pnpm -F @ziweiai/web exec playwright test tests/e2e/us-009-anonymous-access.spec.ts --workers=1`
  -> pass mới nhất 2026-07-13 10:08 +07; anonymous access flow pass sau khi
  test harness dùng session thật nhưng đánh dấu browser-side là anonymous-like
  để tránh Supabase Cloud anonymous Auth rate limit.
- `corepack pnpm -F @ziweiai/web e2e`
  -> pass mới nhất 2026-07-13 10:09 +07; 46 tests passed, 0 failed. Đây là
  E2E non-live, không gọi provider AI thật.
- `corepack pnpm check:supabase-migrations`
  -> pass local mới nhất 2026-07-13 10:13 +07; 9 migration files, versions
  `000001`, `000002`, `000004`-`000010`, warning gap `000002 -> 000004`.
- `SUPABASE_VERIFY_LINKED=1 corepack pnpm check:supabase-migrations`
  -> pass mới nhất 2026-07-13 10:23 +07 sau khi local CLI link project
  `ttvqrukctlebkggsylun`; local/remote ledger đều có `000001`, `000002`,
  `000004`, `000005`, `000006`, `000007`, `000008`, `000009`, `000010`.
- `supabase projects list`
  -> CLI đang login được nhưng danh sách project hiện tại không thấy project ref
  `uaicvwttnajeglxiorpb` được ghi trong docs cũ.
- `pnpm smoke:vercel-demo`
  -> pass safe smoke mới nhất 2026-07-13 10:13 +07; account
  `galaxypro710-7060`, deployment `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`, root,
  `/api/health`, `/api/features` và SPA fallback đều HTTP 200.
- `pnpm smoke:vercel-live-mutation`
  -> pass ở chế độ skip an toàn, không ghi production.
- `git diff --check`
  -> pass trong lượt docs/tooling gần nhất.
- Secret hygiene pre-check trên modified/untracked files
  -> pass mới nhất 2026-07-13 10:16 +07; không phát hiện private key block,
  JWT-like token, OpenAI/OpenRouter-like key, Vercel token-like value hoặc env
  assignment nhạy cảm. Các match còn lại chỉ là keyword tài liệu/script như
  `service role`, `firebase-adminsdk`, `private_key`.
- `git check-ignore -v .env .env.local .env.production .agent .agents .claude .gemini foo.apk foo.aab foo.ipa foo.mp4 foo.key foo.pem firebase-adminsdk-test.json google-services.json GoogleService-Info.plist apps/api/supabase/.temp/project-ref`
  -> pass mới nhất 2026-07-13 10:16 +07; các đường dẫn nhạy cảm đều bị ignore
  bởi `.gitignore`.

## Gaps Cần Đóng Trước Khi Complete

1. Chạy live mutation smoke mới nếu được xác nhận:

```bash
LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

Nếu có service role và muốn dọn anonymous user:

```bash
LIVE_MUTATION_SMOKE_CLEANUP=1 LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

2. Chốt quyết định sản phẩm:

- provider chính: DeepSeek hay OpenRouter/OpenAI-compatible;
- AI explanation free beta hay siết quota/cost trước;
- Lục Hào fallback có chấp nhận cho demo hay phải harden `xuanshu` runtime;
- payment/XU có vào phase tiếp theo hay để sau core reliability.

Khuyến nghị mặc định và điều kiện chốt từng mục nằm ở
`docs/open-decisions.md`; bản trả lời nhanh nằm ở
`docs/remaining-decision-brief.md`.

3. Nếu mở beta rộng, nâng checklist observability thành dashboard/alert tự động
cho 5xx, provider timeout/unavailable, quota hits và AI spend.

4. Trước khi push, rà lại toàn bộ dirty worktree vì hiện có nhiều file modified
và untracked từ nhiều phase. Secret pattern scan hiện tại pass, nhưng vẫn cần
review scope commit để tránh gom nhầm thay đổi ngoài ý định.

## Quyết Định Không Đánh Dấu Complete

Không gọi `update_goal(status="complete")` ở trạng thái hiện tại vì bằng chứng
chưa chứng minh đầy đủ core flow production hiện hành bằng live mutation smoke
mới và các quyết định provider/free-beta/payment vẫn chưa chốt. Đây là quyết
định bảo toàn chất lượng: goal yêu cầu completion thật, không chỉ dựa vào safe
smoke hoặc report lịch sử.
