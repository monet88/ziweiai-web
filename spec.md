# Đặc Tả — Tử Vi Toàn Tập

## Quy Ước Ngôn Ngữ

Tài liệu này dùng tiếng Việt làm ngôn ngữ chính cho đặc tả sản phẩm, kỹ thuật và
vận hành. Tên công nghệ, endpoint, package, script, biến môi trường và thuật ngữ
chuẩn của hệ sinh thái phần mềm được giữ nguyên bằng English để tránh dịch sai
định danh, ví dụ: `SvelteKit`, `NestJS`, `Supabase`, `Vercel`, `API`, `AI`,
`provider`, `serverless`, `quota`, `migration`, `build`, `smoke test`.

Mọi phản hồi cho chủ dự án, ghi chú triển khai, mô tả tính năng và báo cáo kiểm
thử phải dùng tiếng Việt. Các thuật ngữ chuyên môn vẫn ưu tiên tiếng Việt khi
rõ nghĩa; chỉ giữ English cho định danh, tên công nghệ, lệnh, endpoint, package
hoặc khái niệm đã có chuẩn dùng chung.

## Tổng Quan

Tử Vi Toàn Tập là monorepo fullstack cho web app thuật số/tử vi tiếng Việt. Web chạy bằng SvelteKit SPA, API chạy bằng NestJS, Supabase làm xác thực/cơ sở dữ liệu, schema API dùng chung qua `@ziweiai/contracts`, và bộ máy tính lá số nằm trong các package chỉ dành cho server.

Bản demo công khai hiện tại: `https://tuvitoantap.vercel.app`.

## Công Nghệ

| Lớp | Công nghệ |
| --- | --- |
| Web | SvelteKit 2, Svelte 5 runes, Vite, TanStack Query |
| API | NestJS 11, Zod, Supabase JS |
| Auth/DB | Supabase anonymous auth + email/password |
| Engine | `@ziweiai/astro-engine`, `iztro`, `lunar-javascript`, `vendor/xuanshu-runtime` |
| AI | DeepSeek, OpenAI-compatible/OpenRouter |
| Triển khai demo | Vercel, SPA tĩnh + serverless `/api/[...path]` |
| Monorepo | pnpm workspace, Turbo, Node >= 22 |

## Kiến Trúc

```text
apps/web
  SvelteKit SPA
  Supabase client auth
  Typed API client
  UI state + TanStack Query

apps/api
  NestJS controllers/services
  Supabase persistence gateway
  Bộ định tuyến nhà cung cấp AI
  Quota/gate/history

packages/contracts
  Zod schemas + kiểu dữ liệu dùng chung cho API, lá số và lưu trữ

packages/astro-engine
  Tính toán lá số/quẻ chỉ chạy phía server

vendor/xuanshu-runtime
  Cầu nối môi trường chạy nội bộ cho Lục Hào / Đại Lục Nhâm / Kỳ Môn
```

## Luồng Người Dùng Chính

1. Người dùng vào `/`.
2. Web tạo hoặc lấy phiên Supabase.
3. Người dùng nhập thông tin sinh hoặc câu hỏi theo hệ thuật số.
4. Web gọi API:
   - `POST /charts` cho lá số sinh.
   - `POST /divinations` cho hệ quẻ/thời khắc.
5. API tính bản ghi lá số/quẻ bằng bộ máy phía server, sau đó lưu Supabase.
6. Web điều hướng đến `/charts/:chartId`.
7. Người dùng xem chi tiết, lịch sử, vận hạn, hội thoại hoặc tạo luận giải AI.
8. `POST /explanations` chỉ chạy khi bản ghi không có `blocksExactReading`.

## Phạm Vi Tính Năng

### Đã Hoàn Thành / Sẵn Sàng Demo

- Xác thực bằng phiên ẩn danh và email/password.
- Dashboard + birth form + tool hub.
- Chart detail và history.
- Tử Vi, Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn.
- Mang Phái, Hợp Hôn.
- Tarot, Lenormand, Dream, Stick, Almanac.
- MBTI.
- Luồng xem mặt/xem tay bằng vision AI.
- Daily/monthly fortune và annual report endpoint.
- Luận giải AI và hội thoại AI.
- Script triển khai demo Vercel: `pnpm deploy:vercel-demo`.

### Chưa Hoàn Chỉnh Cho Production

- Payment/VietQR/ledger/XU.
- Hạn mức bền vững và kiểm soát chi phí cho lưu lượng công khai lớn.
- Quan sát hệ thống và cảnh báo đầy đủ.
- Gia cố đường chuẩn cho cầu nối `xuanshu` trên serverless hoặc backend chạy lâu dài.
- Chính sách thương mại, hoàn tiền, điều khoản, quyền riêng tư và UX xoá dữ liệu cần hoàn thiện.

## Hợp Đồng API

Công khai:

- `GET /health`
- `GET /features`

Cần bearer auth:

- `POST /charts`
- `GET /charts/:id`
- `POST /charts/:id/horoscope`
- `GET /charts/:id/daily`
- `GET /charts/:id/monthly`
- `POST /charts/:id/annual-report`
- `POST /divinations`
- `POST /explanations`
- `GET /history`
- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /conversations/:id/messages`
- `POST /conversations/:id/messages/stream`
- `POST /draws/tarot`
- `POST /draws/lenormand`
- `POST /draws/stick`
- `POST /dreams/interpret`
- `POST /almanac/select`
- `POST /vision/face`
- `POST /vision/palm`
- `DELETE /vision/results/:id`
- `POST /quizzes/mbti`
- `POST /pairings`

Mọi request/response shape phải đến từ `@ziweiai/contracts`. Web phải parse API responses qua Zod schemas trước khi dùng làm app state.

## Tóm Tắt Mô Hình Dữ Liệu

Các persisted records chính:

- `birth_profiles`
- `chart_snapshots`
- `divination_context`
- `explanation_requests`
- `explanation_results`
- `history_views`
- `conversations`
- `conversation_messages`
- vision/history/fortune-related tables từ API migrations

Ownership:

- Mỗi bản ghi được giới hạn theo `owner_user_id` của Supabase.
- Sai chủ sở hữu không được làm lộ sự tồn tại của bản ghi.
- Người dùng ẩn danh được hỗ trợ qua phiên ẩn danh Supabase.

## Quy Tắc AI

- Luận giải AI phải bị chặn nếu `snapshot.calculationConfidence.blocksExactReading=true`.
- Lỗi nhà cung cấp AI trả lỗi API có kiểu rõ ràng như `PROVIDER_TIMEOUT` hoặc `PROVIDER_UNAVAILABLE`.
- Prompt và kết quả phải giữ tiếng Việt, tránh để lọt chữ Hán/Chinese thô ra UI.
- AI phải dùng dữ liệu lá số/quẻ có cấu trúc, không chỉ dựa vào câu hỏi tự do của người dùng.

## Quy Tắc Runtime Lục Hào

Lục Hào dùng cầu nối `xuanshu` khi môi trường chạy khả dụng. Nếu cầu nối hoặc môi trường chạy không khả dụng trong demo serverless, bộ máy trả về bản ghi dự phòng có cấu trúc:

- `chartSystem = liu-yao`
- `calculationConfidence.level = medium`
- `blocksExactReading = false`
- có `snapshot.liuyao`
- warning có `XUANSHU_REFERENCE_RUNTIME_FALLBACK`

Đường dự phòng này chấp nhận được cho độ ổn định demo, nhưng bản vận hành chính thức nên gia cố cầu nối `xuanshu` thật hoặc chuyển API sang backend chạy lâu dài ổn định hơn.

## Bất Biến Bảo Mật

1. `apps/web` không được import bộ máy chỉ dành cho server:
   - không `@ziweiai/core`
   - không `@ziweiai/astro-engine`
   - không `iztro`
   - không `lunar-javascript`
2. Chỉ env vars tiền tố `PUBLIC_*` được lộ ra browser.
3. Không commit:
   - `.env`, `.env.local`, real env files
   - Supabase service role keys
   - JWT secrets
   - khóa nhà cung cấp AI
   - Firebase/Google credentials
   - private keys/certs
   - kết quả build
   - `.agent`, `.agents`, `.claude`, `.gemini`
   - `apk`, `aab`, `ipa`, `mp4`, release media artifacts
4. Frontend UI không được chứa ký tự Hán/Chinese.

## Cổng Kiểm Chứng

Trước khi coi công việc code/triển khai là xong:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm exec turbo run build --force
pnpm --filter @ziweiai/web exec playwright test smoke.spec.ts --workers=1
```

Với thay đổi vào demo production:

```bash
pnpm deploy:vercel-demo
npx --yes vercel@latest inspect https://tuvitoantap.vercel.app --token "$VERCEL_GALAXY"
```

Smoke test live khuyến nghị:

1. Tạo phiên ẩn danh.
2. `POST /api/divinations` với `chartSystem=liu-yao`.
3. Xác nhận `snapshot.liuyao` tồn tại và `blocksExactReading=false`.
4. `POST /api/explanations`.
5. Xác nhận HTTP `201`, metadata nhà cung cấp tồn tại, kết quả nhắc đến ngữ cảnh câu hỏi hoặc dữ liệu quẻ.
6. Xoá dữ liệu smoke test khỏi Supabase nếu tạo bằng script xác minh service-role.

## Rủi Ro Hiện Tại

- Demo hiện chạy API bằng Vercel serverless; tác vụ AI dài và cầu nối môi trường chạy phù hợp hơn với API host chạy lâu dài.
- Chi phí AI có thể tăng nếu flag/hạn mức miễn phí còn quá thoáng khi mở lưu lượng công khai.
- Tính năng vision cần thêm QA bằng ảnh thật trước khi marketing như tính năng trả phí chính.
- Một số tài liệu story cũ vẫn mô tả trạng thái planned/harness-era; ưu tiên tin
  `README.md`, `docs/product/*`, `docs/TEST_MATRIX.md`, và `docs/reports/*`
  mới nhất.
