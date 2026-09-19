# Ma Trận Kiểm Chứng Và Gia Cố Feature

Ngày cập nhật: 2026-07-13

## Mục Đích

Tài liệu này biến nguyên tắc “mỗi feature phải có validation và hardening” thành
ma trận vận hành cụ thể cho Tử Vi Toàn Tập. Dùng file này trước khi báo một
feature là xong, trước khi deploy demo, hoặc trước khi mở traffic beta.

Khi cần ghi report hoàn thành cho một feature cụ thể, dùng template:
`docs/templates/feature-completion-checklist.md`.

Quy tắc chung:

- Validation chứng minh feature chạy đúng bằng test, check, smoke hoặc bằng
  chứng UI/live phù hợp.
- Hardening chứng minh feature chịu được dữ liệu xấu, lỗi provider, sai owner,
  quota/cost, serverless timeout và UX error.
- Feature production-facing không được coi là hoàn tất nếu chỉ có code review
  hoặc safe smoke public; phải có bằng chứng đúng với phạm vi rủi ro.

## Gate Chung Theo Blast Radius

| Phạm vi thay đổi | Validation tối thiểu | Hardening bắt buộc |
| --- | --- | --- |
| Copy/docs nhỏ | `git diff --check` | Không làm sai source of truth; không lộ secret. |
| Web UI không gọi API mới | `pnpm -F @ziweiai/web check`; Playwright spec liên quan nếu có flow | Không chữ Hán; không console/framework overlay; responsive không vỡ. |
| Web flow có API | Web check + Playwright spec liên quan + schema parse bằng `@ziweiai/contracts` | Loading/error/empty states tiếng Việt; token Bearer đúng; không leak raw provider error. |
| API/service | `pnpm -F @ziweiai/api typecheck`; API unit tests liên quan | Owner scope; typed API errors; quota/cost guard; không log secret/user content nhạy cảm. |
| Contracts/shared schema | `pnpm -F @ziweiai/contracts build/test`; API + web compile path liên quan | Backward compatibility hoặc migration rõ; response parse fail-fast. |
| Engine/server-only | `pnpm -F @ziweiai/astro-engine test/build`; API tests gọi engine | Web không import engine; fallback confidence/warnings rõ khi runtime không chuẩn. |
| Supabase/RLS/migration | `pnpm check:supabase-migrations`; API persistence tests | RLS/owner isolation; migration idempotent; linked ledger nếu production-facing. |
| AI provider/prompt | Provider/router/prompt unit tests; live smoke khi production-facing | `blocksExactReading` gate; timeout/unavailable handling; CJK guard; quota/cost. |
| Deploy/demo public | `pnpm deploy:vercel-demo`; `pnpm smoke:vercel-demo` | Đúng Vercel account; không secret log; rollback checklist; live mutation smoke nếu cần chứng minh create/AI. |

## Ma Trận Theo Feature

| Feature / nhóm | Validation cần có | Hardening cần có | Bằng chứng hiện có trong repo |
| --- | --- | --- | --- |
| Anonymous auth + email/password | E2E anonymous/sign-in; auth service tests | Chờ loading trước redirect; token Bearer; session anonymous không bị đẩy về sign-in | `apps/web/tests/e2e/us-009-anonymous-access.spec.ts`, `apps/api/src/modules/auth/*test.ts` |
| Dashboard + birth form + chart create | Playwright smoke; chart service tests; contract tests | Input validation; API error tiếng Việt; không gọi production API trong local E2E | `smoke.spec.ts`, `us-006-ziwei-detail.spec.ts`, `charts.service.test.ts` |
| Chart detail/history | E2E detail + history; API history tests | `/charts/:id` refresh không Vercel 404; wrong owner trả not found; stale cache xử lý | `us-006-ziwei-detail.spec.ts`, `us-007-other-systems-history.spec.ts`, `history.service.test.ts` |
| Tử Vi board/palace/flows | E2E board/aspect/color/horoscope; engine tests | Không chữ Hán; web không import engine; per-palace prompt dùng dữ liệu cung thật | `us-008`, `us-011`, `us-012`, `us-014`, `us-015`, `ziwei-horoscope.test.ts` |
| Bát Tự | API prompt tests; live spec nếu gọi provider thật | Prompt phải dùng snapshot thật; provider timeout/unavailable message rõ | `build-bazi-explanation-prompt.test.ts`, `us-023-bazi-explanation-live.spec.ts` |
| Mai Hoa / Lục Hào / Đại Lục Nhâm / Kỳ Môn | Divination E2E + service tests; live mutation smoke cho Lục Hào | `snapshot.liuyao` tồn tại; `blocksExactReading=false` nếu fallback demo; warning/confidence rõ | `us-025-divination.spec.ts`, `divinations.service.test.ts`, `build-liuyao-explanation-prompt.test.ts` |
| Hợp Hôn / Mang Phái | E2E + service/engine tests | Không overclaim độ chính xác; owner scope; prompt có dữ liệu structured | `us-017c-hepan.spec.ts`, `us-017d-mangpai.spec.ts`, `hepan-compatibility.test.ts`, `mangpai-reading.test.ts` |
| Tarot / Lenormand / Rút Xăm | E2E default/live; service/deck tests | Seed/spread hợp lệ; output tiếng Việt; quota AI nếu gọi provider | `us-017h-*`, `us-037-*`, `us-039-*`, `draws-*`, `tarot-prompts.test.ts` |
| Giải Mộng / Hoàng Lịch | E2E default/live; service/engine tests | Input rỗng/xấu; vocab guard; không Hán tự raw | `us-038-*`, `us-040-*`, `dreams.service.test.ts`, `almanac.service*.test.ts` |
| MBTI | E2E quiz; scoring/controller tests | Validate đủ câu trả lời; không coi là chẩn đoán y tế/tâm lý chính thức | `us-017b-mbti.spec.ts`, `mbti-scoring.test.ts`, `quizzes-mbti*.test.ts` |
| Face/Palm vision | E2E mocked/live; vision prompt/service tests | File shape/size; privacy; quota vision riêng; delete/history path | `us-017e-*`, `us-017f-*`, `vision-analysis.service.test.ts`, `vision-prompt.test.ts` |
| AI explanations | API prompt/router tests; E2E gating; live provider smoke khi deploy | Chặn `blocksExactReading`; timeout/fallback; quota; CJK guard; không trả lời như chatbot chung | `explanations.service.test.ts`, `explanation-provider-router.test.ts`, `us-010-explanation-gating.spec.ts` |
| AI conversations | E2E assistant + controller/service/router tests | History owner scope; stream fallback; quota conversation riêng; không log content nhạy cảm | `us-018-assistant-chat*.spec.ts`, `conversations*.test.ts`, `conversation-provider-router.test.ts` |
| Annual/daily/monthly fortune | E2E fortune/live; service tests | Feature flag/premium gate nếu cần; cache/idempotency; serverless timeout guard | `us-016-*`, `fortune.service.test.ts`, `annual-report.service.test.ts` |
| Quota/cost gate | API quota tests; E2E rate-limit | Tách quota theo feature; error mapping rõ; spend metric/alert trước beta rộng | `us-013-quota-rate-limit.spec.ts`, `quotas.service.test.ts`, `quota-http.test.ts` |
| Supabase persistence/RLS | Gateway ownership tests; migration sanity; linked ledger khi production | Wrong owner không leak; migrations tracking; service role không lộ | `supabase-persistence.gateway.ownership.test.ts`, `persistence-*.test.ts`, `pnpm check:supabase-migrations` |
| Deploy Vercel demo | Deploy script + safe smoke + inspect | Đúng account `galaxypro710-7060`; không dùng token sai; rollback/report rõ | `scripts/deploy-vercel-demo.zsh`, `scripts/smoke-vercel-demo.zsh`, `docs/deploy/*` |
| Live mutation smoke | Guarded script chạy thật khi được duyệt | Cleanup nếu có service role; ghi chart id/provider/status; không chạy ngầm | `scripts/smoke-vercel-live-mutation.zsh`, `docs/open-decisions.md` OD-005 |
| Payment/VietQR/XU | Chưa bắt đầu: cần ledger/idempotency/webhook/E2E paid gate | Refund/audit/privacy/terms; không mở trước core reliability | Pending OD-007 |

## Quy Trình Trước Khi Báo Xong Feature

1. Xác định feature thuộc hàng nào trong ma trận.
2. Chạy gate hẹp nhất chứng minh logic/workflow vừa sửa.
3. Nếu feature chạm shared contract, API, auth, database, AI hoặc deploy, chạy
   thêm gate theo blast radius.
4. Ghi rõ hardening đã kiểm tra: dữ liệu xấu, owner, quota, provider, timeout,
   UI error, privacy/security.
5. Nếu deploy/live, ghi report trong `docs/reports/` và phân biệt safe smoke với
   live mutation smoke.
6. Nếu feature có blast radius vừa hoặc lớn, tạo report từ
   `docs/templates/feature-completion-checklist.md` để reviewer không phải suy
   luận từ log rời rạc.

## Điều Kiện Chưa Được Claim Complete

Không claim feature hoặc goal complete nếu còn một trong các điểm sau:

- Chưa chạy test/smoke đúng với phạm vi rủi ro.
- Live production flow chỉ được chứng minh bằng report lịch sử cũ.
- Supabase production schema/RLS chưa được xác minh khi feature phụ thuộc vào
  migration mới.
- AI provider thật chưa được gọi nhưng feature được mô tả là live AI-ready.
- Chưa chốt quota/cost policy cho public beta.
- Có thể ghi/chạm production data nhưng chưa có approval rõ.
