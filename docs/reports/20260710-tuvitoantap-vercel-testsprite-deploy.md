# Tuvitoantap Vercel + TestSprite Debug Report

> Status note 2026-07-13: report này là historical evidence cho đợt debug/deploy
> Vercel và có phụ lục audit đến 2026-07-13. Safe smoke mới nhất nằm ở
> `docs/reports/20260713-vercel-safe-smoke.md`; index đọc evidence nằm ở
> `docs/reports/README.md`. Sau deploy/env/schema mới, phải inspect/smoke lại.

Ngày: 2026-07-10  
Phạm vi: `tuvitoantap.vercel.app`, repo `ziweiai-web`

## Mục Tiêu

- Kiểm tra và debug lỗi demo public `https://tuvitoantap.vercel.app`.
- Dùng TestSprite để kiểm thử luồng chính: mở trang, tạo lá số Tử Vi, vào `/charts/<uuid>`, refresh trang chi tiết.
- Xác minh cấu hình deploy Vercel và token deploy đúng account.
- Chuẩn hóa cách deploy demo để tránh nhầm account/token trong các lần sau.

## Bối Cảnh Ban Đầu

- Người dùng báo lỗi khi mở trang chi tiết lá số:
  - `/api/charts/<uuid>` trả `404`
  - UI hiển thị `Không tải được chi tiết lá số`
- Repo là SvelteKit SPA dùng `adapter-static` với fallback `index.html`.
- API chạy trên Vercel serverless qua route `/api/[...path]`.
- Domain demo mong muốn: `https://tuvitoantap.vercel.app`.

## Việc Đã Làm

### 1. Kiểm tra TestSprite và tạo test

- Đọc docs TestSprite:
  - `https://docs.testsprite.com/web-portal/getting-started/overview`
  - `https://docs.testsprite.com/cli/reference/command-reference`
  - `https://docs.testsprite.com/cli/core/agent-integration`
- Dùng API key TestSprite từ `~/.zshrc`, chỉ xác nhận biến đã set, không in token.
- Cài/chạy CLI qua `npx @testsprite/testsprite-cli`.
- Tạo project TestSprite frontend:
  - Project ID: `7d0a9fac-140a-4076-8d40-c16a0db46f81`
  - Target URL: `https://tuvitoantap.vercel.app`
- Tạo test plan tại:
  - `.testsprite/plans/tuvitoantap-chart-detail.plan.json`
- TestSprite run đầu tiên fail với:
  - `failureKind: routing_404`
  - Chart URL mẫu: `/charts/7d56867f-78eb-43d2-93e2-16e5d4ea04c2`
  - Vercel trả generic `404: NOT_FOUND` khi refresh/direct load `/charts/<uuid>`.

### 2. Xác định nguyên nhân chính

- Kiểm tra code local cho thấy route SvelteKit có tồn tại:
  - `apps/web/src/routes/(app)/charts/[chartId]/+page.svelte`
- Kiểm tra `svelte.config.js` cho thấy app là SPA static:
  - `adapter-static`
  - `fallback: 'index.html'`
- Kiểm tra `vercel.json` ban đầu chỉ có rewrite:
  - `/api/:path*` -> `/api/[...path]`
- Thiếu rewrite fallback cho client-side route khiến Vercel không biết route `/charts/<uuid>` khi người dùng refresh hoặc mở trực tiếp.

### 3. Sửa lỗi Vercel SPA fallback

- Cập nhật `vercel.json`:
  - Giữ rewrite `/api/:path*` đi vào serverless API.
  - Thêm rewrite `/:path*` -> `/index.html` cho toàn bộ client-side routes.

File thay đổi:

- `vercel.json`

Lý do:

- SvelteKit static SPA cần fallback về `index.html` để router phía client xử lý các route như `/charts/<uuid>`.
- `/api/*` phải được đặt trước fallback để không bị nuốt vào SPA.

### 4. Deploy và alias lại domain

- Deploy production lên Vercel.
- Phát hiện domain `tuvitoantap.vercel.app` chưa tự trỏ deployment mới.
- Gán alias thủ công để domain trỏ deployment mới.
- Verify bằng `curl`:
  - `https://tuvitoantap.vercel.app/charts/<uuid>` trả `HTTP 200`
  - Không còn Vercel generic `404`.

### 5. Smoke test production

- Dùng Chrome/Playwright automation để kiểm thử live site.
- Luồng đã kiểm:
  - Mở `https://tuvitoantap.vercel.app`
  - Supabase anonymous auth cấp session thành công
  - Tạo lá số Tử Vi
  - `POST /api/charts` trả `201`
  - Điều hướng sang `/charts/<uuid>`
  - `GET /api/charts/<uuid>` trả `200`
  - Refresh trang chi tiết
  - `GET /api/charts/<uuid>` vẫn trả `200`
  - Không còn text `Không tải được chi tiết lá số`

### 6. Kiểm tra token Vercel

- Kiểm tra `VERCEL_TOKEN` trong `~/.zshrc`:
  - Biến có set nhưng thuộc account/team khác: `onenearcelos-projects`
  - Không dùng được cho project `tuvitoantap`.
- Kiểm tra `VERCEL_GALAXY` trong `~/.zshrc`:
  - Account đúng: `galaxypro710-7060`
  - Team đúng: `galaxypro710-7060s-projects`
  - Inspect `https://tuvitoantap.vercel.app` thành công.

Quyết định vận hành:

- Dùng `VERCEL_GALAXY` làm token chuẩn cho demo Vercel.
- Không dùng `VERCEL_TOKEN` cho project này để tránh deploy nhầm account.

### 7. Chuẩn hóa script deploy

Đã thêm script:

- `scripts/deploy-vercel-demo.zsh`

Script làm các việc:

- Source `~/.zshrc`.
- Kiểm tra `VERCEL_GALAXY` tồn tại.
- Unset `VERCEL_TOKEN` để token generic không shadow token đúng.
- Kiểm tra `whoami` phải là `galaxypro710-7060`.
- Deploy production bằng `VERCEL_GALAXY`.
- Lấy deployment URL từ output Vercel.
- Alias `tuvitoantap.vercel.app` sang deployment mới.
- Inspect lại domain sau deploy.

Đã thêm npm script:

```bash
pnpm deploy:vercel-demo
```

File thay đổi:

- `scripts/deploy-vercel-demo.zsh`
- `package.json`
- `docs/agents/deploy.md`
- `implementation_notes.html`

### 8. Verify script deploy end-to-end

Đã chạy:

```bash
pnpm deploy:vercel-demo
```

Kết quả:

- Build Vercel pass.
- Deployment production mới Ready:
  - `https://build-bat2afuz7-galaxypro710-7060s-projects.vercel.app`
- Alias thành công:
  - `https://tuvitoantap.vercel.app`
- Inspect domain sau alias:
  - Status: `Ready`
- HTTP check:
  - `/charts/<uuid>` trả `HTTP 200`

## Kết Quả

- Lỗi Vercel `404: NOT_FOUND` khi refresh/direct load `/charts/<uuid>` đã được xử lý.
- Demo public đang hoạt động tại:
  - `https://tuvitoantap.vercel.app`
- Luồng tạo lá số và mở lại trang chi tiết đã pass trong smoke test production.
- Token deploy đúng đã xác định:
  - Dùng `VERCEL_GALAXY`
  - Không dùng `VERCEL_TOKEN` cho project này.
- Đã có script deploy chuẩn, giảm rủi ro deploy nhầm account/team.

## File Đã Thay Đổi

- `vercel.json`
- `scripts/deploy-vercel-demo.zsh`
- `package.json`
- `docs/agents/deploy.md`
- `implementation_notes.html`
- `.testsprite/plans/tuvitoantap-chart-detail.plan.json`

## Rủi Ro Còn Lại

- `VERCEL_TOKEN` vẫn tồn tại trong `~/.zshrc` và thuộc account khác. Không nên dùng biến này cho project `tuvitoantap`.
- TestSprite rerun sau khi fix từng có trạng thái `queued`; smoke test production đã pass độc lập. Có thể poll/rerun lại TestSprite sau nếu cần bằng CLI.
- Repo đã ignore `.DS_Store`, env, key, credentials, service account, Firebase/Google config, folder agent cục bộ và artifact mobile/media.

## Lệnh Chuẩn Sau Này

Deploy demo:

```bash
pnpm deploy:vercel-demo
```

Kiểm tra domain:

```bash
source ~/.zshrc >/dev/null 2>&1
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
```

Smoke check route SPA:

```bash
curl -I https://tuvitoantap.vercel.app/charts/0391944a-50dd-44ae-ba2b-3d784c8b757e
```

## Phụ Lục Audit 2026-07-12

### Mục Tiêu

- Rà lại toàn bộ demo public theo vai trò CEO/PM trước khi coi là ổn để test người dùng.
- Xử lý lỗi `POST /api/explanations` trả `502` do thiếu AI provider.
- Cấu hình OpenRouter từ `~/.zshrc` để thay thế nhóm OpenAI/Gemini-compatible nếu cần.
- Kiểm tra bảo mật trước push/deploy: không đưa env, key, credentials, service key, build output, folder agent hoặc artifact mobile/media vào git/Vercel.

### Việc Đã Làm

- Cấu hình Vercel production env cho Supabase cloud, API, CORS, quota và AI.
- Giữ DeepSeek làm AI provider chính; cấu hình OpenRouter qua `OPENAI_COMPAT_API_KEY`, `OPENAI_COMPAT_BASE_URL` và `OPENAI_COMPAT_MODEL=google/gemini-2.5-flash`.
- Redeploy production và alias lại `https://tuvitoantap.vercel.app`.
- Sửa môi trường test local bị stale package node_modules; cài lại dependency bằng Node 22.
- Thêm `.vercelignore` và mở rộng `.gitignore` để chặn secret/build/agent/media/mobile artifacts.
- Cập nhật `implementation_notes.html` với quyết định AI provider, OpenRouter fallback và quy tắc bảo mật deploy.

### Kết Quả Kiểm Thử

- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm test`: pass.
- `pnpm build`: pass.
- Vercel production build: pass.
- Live API smoke: health, features, tạo lá số, đọc chi tiết lá số, daily/monthly fortune, Tarot, conversation và AI explanation đều pass.
- `POST /api/explanations`: đã trả `201`, không còn lỗi `Chưa cấu hình nhà cung cấp AI`.
- Vercel production logs 5xx sau deploy: không có entry lỗi trong khoảng kiểm tra.
- UI desktop và mobile trên domain public: không console error/warning, không horizontal overflow.
- Git secret check: file nhạy cảm tracked chỉ còn `.env.example`; `.env` và `.env.local` bị ignore.

### Đánh Giá CEO/PM

- Trạng thái hiện tại: đủ điều kiện chạy demo public có kiểm soát.
- Chưa nên coi là production thương mại hoàn chỉnh vì quota đang dùng memory store, `AI_EXPLANATION_FREE_FOR_ALL=true` có rủi ro chi phí nếu public rộng, và annual report đang khóa theo entitlement.
- Face/Palm cần thêm vòng test riêng với ảnh thật và provider vision trước khi quảng bá như tính năng chính.
- Nên chuyển quota sang store bền vững như Upstash/Redis hoặc Supabase-backed quota trước khi chạy traffic lớn.
- Nên chuẩn hóa observability: dashboard lỗi API, cảnh báo 5xx, cảnh báo chi phí AI và checklist release ngắn cho mỗi lần deploy.

## Phụ Lục Sự Cố Lục Hào / AI 2026-07-13

### Mục Tiêu

- Điều tra chart `8bf22801-4093-487a-ae6b-e106d5d7094c` có luận giải AI sai ngữ cảnh.
- Fix lỗi production khiến Lục Hào không có dữ liệu quẻ khi runtime `xuanshu` không sẵn sàng trong serverless.
- Ngăn AI tạo/đọc cache luận giải trên snapshot bị `blocked`.
- Deploy lại demo public và kiểm chứng live.

### Việc Đã Làm

- Xác nhận root cause: chart là `liu-yao`, câu hỏi người dùng được lưu đúng, nhưng snapshot production bị `blocked` vì `XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE`, không có `snapshot.liuyao`.
- Thêm guard ở API explanations: snapshot `blocksExactReading=true` sẽ bị từ chối trước cache/provider để tránh sinh luận giải sai.
- Sửa UI trang chart detail: hệ không có bàn Tử Vi không còn hiện copy “chạm vào một cung”; snapshot blocked sẽ disable nút tạo luận giải và hiện cảnh báo.
- Thêm fallback Lục Hào trong `@ziweiai/astro-engine`: khi `xuanshu` runtime/bridge không khả dụng, engine vẫn tạo cấu trúc quẻ đủ dữ liệu cho demo, confidence `medium`, warning `XUANSHU_REFERENCE_RUNTIME_FALLBACK`.
- Sửa `vercel.json` để bundle `vendor/xuanshu-runtime`, runner bridge và `tsx` vào serverless function.
- Cập nhật chart cũ trong Supabase: thay snapshot blocked bằng snapshot Lục Hào hợp lệ và xoá cache explanation sai.
- Audit toàn bộ `chart_system=liu-yao` trên Supabase production, phát hiện và sửa thêm snapshot cũ cùng lỗi runtime unavailable.

### Kết Quả

- Deploy production mới: `dpl_9d8n6FuEKSBPC8ecAnbckxudsqnK`, alias `https://tuvitoantap.vercel.app`.
- Live smoke `POST /api/divinations`: trả `201`, có `snapshot.liuyao`, confidence `medium`, không còn `blocked`.
- Live smoke `POST /api/explanations`: trả `201`, provider `deepseek`, nội dung bám đúng câu hỏi/quẻ.
- Chart `8bf22801-4093-487a-ae6b-e106d5d7094c` hiện có:
  - `confidence_level=medium`
  - `hasLiuyao=true`
  - quẻ gốc `Khôn trên Khôn`
  - quẻ biến `Cấn trên Khôn`
  - hào động `Hào 6`
  - `explanationResults=0`, `explanationRequests=0` để người dùng tạo lại luận giải mới.
- Snapshot cũ `3daa745b-2389-4795-b824-a303d4ce3691` cũng đã được migrate:
  - `hasLiuyao=true`
  - quẻ gốc `Càn trên Khảm`
  - quẻ biến `Tốn trên Khảm`
  - hào động `Hào 4`
- Production audit sau migration: `totalLiuyao=2`, `brokenCount=0`.

### Verification

- `pnpm --filter @ziweiai/astro-engine test -- src/phase-3.test.ts`: pass, 36 tests.
- `pnpm --filter @ziweiai/astro-engine typecheck`: pass.
- `pnpm --filter @ziweiai/astro-engine build`: pass.
- `pnpm --filter @ziweiai/api test -- src/modules/explanations/services/explanations.service.test.ts`: pass, 402 tests.
- `pnpm --filter @ziweiai/web check`: pass, 0 errors/warnings.
- `pnpm build`: pass.
- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm test`: pass, workspace gồm API 402 tests, web 244 tests, contracts/core/astro-engine pass.
- `pnpm exec turbo run build --force`: pass, 5/5 build tasks, không dùng cache.
- `pnpm --filter @ziweiai/web exec playwright test smoke.spec.ts --workers=1`: pass.
- Live smoke production tạo Lục Hào + tạo AI explanation: `POST /api/divinations=201`, `POST /api/explanations=201`, provider `openai-compat`, nội dung bám câu hỏi/quẻ, smoke data đã xoá.

### Rủi Ro Còn Lại

- Fallback Lục Hào là hướng pragmatic cho demo; độ chuẩn canonic vẫn thấp hơn đường `xuanshu` đầy đủ. Khi ổn định production dài hạn, ưu tiên làm bridge `xuanshu` chạy chắc trong serverless hoặc chuyển API sang runtime backend dài hạn.
- Đã audit production hiện tại và không còn snapshot Lục Hào bị `blocked` do `XUANSHU_REFERENCE_RUNTIME_UNAVAILABLE`. Rủi ro còn lại là snapshot mới trong tương lai nếu fallback bị thay đổi mà không có regression test.
