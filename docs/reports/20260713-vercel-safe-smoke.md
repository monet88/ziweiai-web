# Báo Cáo Safe Smoke Vercel — 2026-07-13

> Status note: đây là report smoke không ghi dữ liệu. Nó xác nhận domain/API
> public/fallback còn sống, nhưng không thay thế live mutation smoke tạo
> chart/quẻ và gọi AI provider thật.

Lần cập nhật mới nhất: 2026-07-13 10:23 +07.

## Mục Tiêu

Xác minh demo công khai `https://tuvitoantap.vercel.app` đang trỏ đúng Vercel
account, deployment production ở trạng thái Ready, API public còn sống và SPA
fallback cho route detail không bị mất.

Smoke này không tạo dữ liệu Supabase và không gọi AI provider.

## Lệnh Đã Chạy

```bash
corepack pnpm smoke:vercel-demo
corepack pnpm check:supabase-migrations
SUPABASE_VERIFY_LINKED=1 corepack pnpm check:supabase-migrations
corepack pnpm smoke:vercel-live-mutation
corepack pnpm -F @ziweiai/api typecheck
corepack pnpm -F @ziweiai/web check
corepack pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
corepack pnpm -F @ziweiai/web exec playwright test tests/e2e/us-009-anonymous-access.spec.ts --workers=1
corepack pnpm -F @ziweiai/web e2e
corepack pnpm -F @ziweiai/api test -- explanations.service explanation-provider-router conversation-provider-router quota-http supabase-persistence.gateway.ownership
corepack pnpm -F @ziweiai/contracts test
corepack pnpm -F @ziweiai/astro-engine test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
git check-ignore -v .env .env.local .agent .agents .claude .gemini foo.apk foo.aab foo.ipa foo.mp4 foo.key foo.pem firebase-adminsdk-test.json google-services.json GoogleService-Info.plist apps/api/supabase/.temp/project-ref
secret pattern scan on modified/untracked files
```

Lưu ý: `smoke:vercel-live-mutation` được chạy ở chế độ mặc định để kiểm tra
guard an toàn. Script đã skip đúng thiết kế, không ghi Supabase production và
không gọi provider thật.

## Kết Quả

| Check | Kết quả |
| --- | --- |
| Vercel account | `galaxypro710-7060` |
| Deployment inspect | `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`, target `production`, status `Ready`; rechecked 2026-07-13 10:13 +07 |
| Root page | HTTP 200 |
| `/api/health` | HTTP 200 |
| `/api/features` | HTTP 200 |
| `/charts/<uuid>` SPA fallback | HTTP 200, `index.html` confirmed |
| Live mutation guard | Skipped đúng thiết kế khi chưa có approval |
| Supabase migration local sanity | 9 files, pass local; versions `000001`, `000002`, `000004`-`000010`; warning gap `000002 -> 000004`; linked ledger skipped |
| Supabase linked ledger | Pass 2026-07-13 10:23 +07 sau khi link local CLI vào project ref `ttvqrukctlebkggsylun`; local/remote versions khớp |
| Supabase CLI project visibility | CLI login được; `projects list` không thấy ref `uaicvwttnajeglxiorpb` được ghi trong docs cũ |
| API typecheck local | Pass |
| Web check local | Pass, `svelte-check` 0 errors, 0 warnings |
| Playwright smoke local | Pass, 1 spec passed |
| Playwright US-009 anonymous access | Pass, 1 spec passed |
| Playwright E2E non-live đầy đủ | Pass, 46 tests passed |
| API targeted tests | Pass, 62 files / 414 tests |
| Contracts tests | Pass, 15 files / 122 tests |
| Astro-engine tests | Pass, 5 files / 36 tests |
| Repo lint | Pass |
| Repo typecheck | Pass, Turbo 8/8 tasks successful |
| Repo build | Pass, Turbo 5/5 build tasks successful |
| Repo test | Pass, Turbo 8/8 tasks successful; API 414 tests, Web 244 tests, Contracts 122 tests, Core 9 tests, Astro-engine 36 tests |
| Git ignore sensitive paths | Pass for env, agent dirs, keys, Firebase/Google credentials, mobile/media artifacts and Supabase temp |
| Secret pattern scan | Pass on modified/untracked files; no common API key/private key/service-role/token pattern found |
| Secret/ignore recheck | Pass 2026-07-13 10:16 +07; ignore rules cover env/key/agent/mobile/media/Firebase-Google artifacts; scan found no key/token-like value, only documentation keywords |

## Kết Luận

Safe smoke pass cho các check không ghi dữ liệu. Core live mutation flow vẫn
chưa được chứng minh trong report này vì chưa tạo chart/quẻ mới và chưa gọi
`POST /api/explanations` trên production.

E2E cục bộ non-live đã pass 46/46 sau khi gia cố session test và anonymous UI
flow. Kết quả này chứng minh regression cục bộ tốt hơn trước, nhưng vẫn không
thay thế smoke production có ghi dữ liệu thật.

## Rủi Ro Còn Lại

- Chưa xác minh browser flow đầy đủ: anonymous session -> create chart/quẻ ->
  detail -> refresh -> AI explanation -> history.
- US-009 E2E hiện dùng session test thật được đánh dấu anonymous-like phía
  browser để tránh rate limit của Supabase anonymous Auth trong full suite; đây
  là kiểm tra ổn định cho UI/flow, không phải bằng chứng rằng endpoint anonymous
  sign-in của Supabase Cloud luôn khả dụng dưới tải test lặp lại.
- Chưa xác minh provider thật và quota/cost gate trong production live flow.
- Supabase linked migration ledger đã pass cho project ref
  `ttvqrukctlebkggsylun`; vẫn cần không dùng `supabase config push` bừa bãi vì
  auth rate-limit cloud có thể khác `config.toml` local.
- Chưa dọn/kiểm tra dữ liệu production vì smoke này không tạo dữ liệu mới.
