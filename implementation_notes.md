# Implementation Notes & Architecture Decisions

## Decisions Made During SePay & Admin Dashboard Refactoring

### 1. SePay Wallet Engine Short UUID Matching
- **Decision**: Refactored `processSePayDeposit` in `apps/api/src/modules/wallet/wallet-engine.service.ts` from Supabase PostgREST `.ilike('user_id', ...)` to fetching active `user_id` records and matching via `String.prototype.startsWith` in Node.js memory.
- **Rationale**: PostgREST rejects PostgreSQL pattern matching operators (`~~*`) on strict UUID type columns. In-memory matching provides 100% type safety and zero SQL syntax errors.

### 2. Admin Load Function Array Handling
- **Decision**: Updated `apps/web/src/routes/(app)/admin/+page.ts` and `transactions/+page.ts` to normalize array responses with `Array.isArray(res) ? res : (res?.users || [])`.
- **Rationale**: `AdminService.listUsers` returns a raw JSON array `User[]` instead of `{ users: User[] }`.

### 3. Vercel Serverless Function CORS Policy (`origin: true`)
- **Decision**: Updated `app.enableCors` in both `api/[...path].ts` and `apps/api/src/main.ts` to `origin: true` with allowed HTTP methods (`GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`).
- **Rationale**: Cloudflare Pages (`https://tuvitoantap.pages.dev`) communicates directly with Vercel API (`https://tuvitoantap.vercel.app`). Dynamic CORS origin callbacks in NestJS serverless functions failed preflight OPTIONS checks when requested from `tuvitoantap.pages.dev`. Reflecting the request origin with `origin: true` eliminates cross-origin blocking while keeping preflights 100% compliant.

## Decisions Made During Sprint 41 (AI Explanation UX & SePay Real-time)

### 1. Markdown Parser Extension & Strict XSS Safety
- **Decision**: Mở rộng `markdown-blocks.ts` để hỗ trợ `blockquote` (`> ...`), `divider` (`---`, `***`), và `table` (`| ... |`) bằng thuần parser Svelte data structures, không dùng `{@html}` hay thư viện bên ngoài.
- **Rationale**: Bảo toàn nguyên tắc bảo mật tối thượng của ViOS (chặn đứng mọi nguy cơ HTML Injection / XSS từ LLM response), đồng thời mang lại trải nghiệm thị giác hoàng gia với bảng kẻ chỉ 24K, trích dẫn kính ngọc bích và đạn danh sách sao vàng.

### 2. Dual-Channel Topup Event Synchronization (Realtime + Fast Polling 2.5s)
- **Decision**: Lưu trữ `lastTopupEvent` trong `wallet-model.svelte.ts` và kích hoạt tự động khi phát hiện `newBalance > previousBalance` từ cả Supabase Realtime channel lẫn chu kỳ polling 2.5s (khi `!document.hidden`).
- **Rationale**: Đảm bảo tốc độ phản hồi < 3s cho người dùng sau khi quét VietQR, loại bỏ rủi ro rớt kết nối WebSocket trên thiết bị di động (do tắt màn hình hoặc chuyển trạm phát sóng 4G/5G).

### 3. Auspicious / Inauspicious Analysis (Cát Hung Vận Số)
- **Decision**: Tạo component `AuspiciousSummaryCard.svelte` phân tích từ khóa tâm linh và cấu trúc bài luận để tách 2 nhóm "Cát Lành & Vượng Khí" và "Cần Lưu Ý & Phòng Tránh", kèm huy hiệu Vận Khí Cốt Lõi (Đại Cát, Bình Hòa, Tiết Chế).
- **Rationale**: Giúp người dùng nắm bắt thần tốc các điểm cốt tủy trong 5 giây đầu tiên trước khi đọc chi tiết bài sớ 2000 chữ.

## Decisions Made During Phase 1: Money Flow & Auto-Refund Hardening

### 1. Reversible Money Flow & Automatic Refunds
- **Decision**: Toàn bộ các luồng trừ XU (`deductXU`) trong `ExplanationsService`, `ConversationsService`, `AnnualReportService`, và `RequireXU` Interceptor đều được trang bị cơ chế Auto-Refund tức thì (`addXU(..., 'ai_refund')`) khi phát sinh lỗi downstream (LLM timeout 504, provider unavailable 502, quota exceeded 429, hoặc network failure).
- **Rationale**: Bảo vệ quyền lợi tài chính tuyệt đối cho thân chủ. Thân chủ chỉ bị tính phí khi nhận được kết quả luận giải hoàn chỉnh; không bao giờ bị mất XU khi hạ tầng AI gặp sự cố.

### 2. Snapshot Reliability Invariant Gate
- **Decision**: Tạo helper dùng chung `assertChartSnapshotEligibleForAi` trong `apps/api/src/common/entitlement/ai-snapshot-eligibility.ts` để chặn đứng trường hợp lá số chưa đủ độ tin cậy (`blocksExactReading: true`) với mã lỗi chuẩn `INVALID_INPUT` (400) trước khi tiêu tốn tài nguyên hay trừ XU, áp dụng đồng bộ cho cả Hỏi đáp AI (`conversations`) và Báo cáo năm (`annual-report`).
- **Rationale**: Đảm bảo AI chỉ hoạt động trên snapshot đạt độ chính xác tử vi tối thiểu, bảo toàn chất lượng luận giải và uy tín của hệ thống.

## Decisions Made During Phase 2: Chart Privacy & Shared Access Invariant

### 1. Unguessable UUID v4 Public Shared Read Access
- **Decision**: Hỗ trợ xem lá số được chia sẻ (`GET /charts/:id`) và tính vận hạn (`POST /charts/:id/horoscope`) cho khách vãng lai hoặc người nhận link bằng cách fallback sang `findPublicChartSnapshotById(chartId)` khi người gọi không phải là chủ sở hữu (`owner_user_id`). Trả về cờ phân quyền `isOwner: boolean` trong response (`true` cho chủ sở hữu, `false` cho khách xem).
- **Rationale**: Giải quyết triệt để lỗi 404 NOT_FOUND khi người dùng A bấm nút "Chia Sẻ" gửi link cho người dùng B. Vì UUID v4 có không gian $2^{122}$ khả năng (hoàn toàn unguessable, chống brute-force), việc cấp quyền READ qua direct link bảo đảm tính tiện dụng trong khi vẫn giữ lá số riêng tư (không index công khai hay liệt kê trong public listing).

### 2. Strict Privilege Isolation (Bảo vệ tài nguyên & XU của chủ lá số)
- **Decision**: Khi `isOwner === false`:
  - Khách xem được toàn bộ lá số 12 cung, can chi, sao, can thiệp vận hạn (`computeHoroscope`), và các bài luận giải AI đã được tạo sẵn bởi chủ sở hữu.
  - Lịch sử xem (`history_views`) được ghi cho caller hiện tại, tuyệt đối không làm ô nhiễm lịch sử của chủ lá số.
  - **Chặn đứng mọi hành vi kích hoạt trừ XU**: Ẩn nút tạo/tạo lại luận giải tổng quan (`explanation`), ẩn nút báo cáo năm (`annual-report`), và ẩn Trợ lý AI cá nhân (`AssistantPanel`) thay bằng thông báo lịch thiệp mời tạo lá số riêng.
  - Tầng API giữ vững nguyên tắc: mọi mutation tạo mới (`createExplanation`, `createConversation`, `createAnnualReport`) đều yêu cầu quyền sở hữu của `ownerUserId`. Khách không thể mạo danh hoặc gây tốn kém XU của chủ lá số.

### 3. Verification & Reliability Metrics
- **Contracts Build**: `@ziweiai/contracts` build thành công, schema tương thích ngược 100% với `isOwner.default(true)`.
- **Backend Unit Tests**: 75/75 files passed (458 tests) — bổ sung 3 unit tests mới cho shared chart & privacy access.
- **Frontend Unit Tests**: 50/50 files passed (272 tests) — bổ sung unit test `chart-detail-shared-access.test.ts`.
- **Svelte Check**: 0 errors, 0 warnings.
- **API Build**: Clean build with zero TypeScript errors.

## Decisions Made During Phase 3: Quota Infrastructure & Tiering Hardening

### 1. Resilient Memory Fallback cho Upstash Redis REST
- **Decision**: Tích hợp `MemoryQuotaCounterStore` làm fallback cục bộ bên trong `UpstashRestQuotaCounterStore`. Khi Upstash gặp sự cố mạng (network down, timeout, HTTP 500), thay vì chỉ fail-open mù quáng (`count: 0, allowed: true`), hệ thống chuyển tiếp sang bộ đếm in-memory của instance để chặn đứng việc spam lặp đi lặp lại từ cùng một IP/User.
- **Decision**: Cập nhật `createQuotaCounterStore` factory: nếu `QUOTA_STORE_DRIVER=upstash` nhưng biến môi trường `QUOTA_UPSTASH_REST_URL` hoặc `QUOTA_UPSTASH_REST_TOKEN` chưa được cấu hình, hệ thống log warning và tự động fallback an toàn sang `MemoryQuotaCounterStore` thay vì ném exception gây crash quá trình bootstrap serverless.
- **Rationale**: Bảo vệ sự sống còn (resilience) của API trên môi trường serverless (Vercel) và các môi trường dev/staging, đồng thời ngăn chặn thất thoát tài nguyên AI token khi dịch vụ Redis bên ngoài gặp trục trặc.

### 2. Tách Bạch Quota & Rate Limit (Anonymous IP vs Authenticated User)
- **Decision**: Mở rộng `QuotaRule` với trường `anonDailyLimit?: number`. Khi cấu hình, khách ẩn danh sẽ chịu hạn mức theo ngày riêng biệt (thường nghiêm ngặt hơn, dựa trên IP), trong khi người dùng đăng nhập áp dụng `dailyLimit` (dựa trên User ID hoặc DB counter).
- **Decision**: Chuẩn hóa định dạng key cho khách ẩn danh: `anon:${featureKey}:ip:${ipAddress}:${dayKey}`, duy trì backward compatibility với các tiền tố legacy (`anon-chart`, `anon-explanation`, `anon-conversation`).
- **Decision**: Trong `QuotasService`, rate-limit trượt theo phút (`assertSlidingWindow`) chỉ áp dụng cho `user:${userId}` khi caller là tài khoản đã xác thực có `userId` thật (`!isAnonymous && userId`), tránh xung đột và ô nhiễm bucket bộ nhớ của khách ẩn danh.

### 3. Verification & Test Metrics
- **API Quota Tests**: 5/5 files passed (35 tests) — bổ sung 4 unit tests mới xác thực resilient memory fallback, graceful factory fallback và phân tầng `anonDailyLimit`.
- **API Total Test Suite**: 75/75 files passed (462/462 tests).
- **API Typecheck & Build**: Pass 100% không lỗi.
- **Web Check & Tests**: 50/50 files passed (272/272 tests), 0 diagnostics errors/warnings.

## Decisions Made During Phase 6: Viral Referral Card Generator & Invisible Turnstile Protection

### 1. Pure TypeScript Zero-Dependency QR Matrix Generator
- **Decision**: Xây dựng bộ sinh ma trận QR Model 2 (Version 4, ECC Level M, chuẩn ISO/IEC 18004) thuần TypeScript đặt tại `apps/web/src/lib/features/referral/qr-matrix.ts`.
- **Rationale**: 
  - Tránh làm phình `node_modules` và tránh lệ thuộc mạng tải package từ npm.
  - Hoạt động 100% offline, tính toán ma trận boolean `boolean[][]` chỉ mất < 2ms trên CPU.
  - Ngăn ngừa hoàn toàn rủi ro browser security `Tainted Canvas`: Khi vẽ mã QR thuần túy qua các hình khối Canvas (`fillRect`), canvas giữ trạng thái sạch 100%, cho phép xuất ảnh PNG chất lượng cao (`toDataURL`) và sao chép trực tiếp vào clipboard (`ClipboardItem`) mà không bao giờ bị dính lỗi CORS.

### 2. Celestial Luxury Viral Referral Card Generator
- **Decision**: Tạo component `ViralReferralCardModal.svelte` với đồ họa phong cách hoàng kim huyền bí (Cosmic Indigo & Celestial Gold):
  - Kích thước xuất ảnh Retina 2x: 800 x 1120 px.
  - Tích hợp viền mạ vàng kép, hoa văn 4 góc hoàng gia, biểu tượng ViOS, quà tặng +10 XU khai vận và mã QR quét tức thì.
  - Hỗ trợ đa dạng hành vi chia sẻ: Tải file `.png`, Copy ảnh vào clipboard (Ctrl+V vào Zalo/Telegram), Native Web Share API và 3 nút chia sẻ nhanh Zalo / Facebook / Telegram.
  - Nút kích hoạt nổi bật trong section Tiếp thị liên kết của trang `/wallet`.

### 3. Cloudflare Turnstile Bot Defense với Graceful Fallback
- **Decision**: Bảo vệ vô hình 2 cửa ngõ trọng yếu:
  - Form Đăng Ký Tài Khoản (`/sign-in` mode `sign-up`) qua endpoint `POST /api/auth/turnstile/verify`.
  - Endpoint Điểm Danh Nhận XU (`/rewards/checkin`) nhận `turnstileToken` và kiểm tra qua `TurnstileService`.
- **Decision**: Triển khai cơ chế Graceful Fallback:
  - Nếu biến môi trường `TURNSTILE_SECRET_KEY` chưa được cấu hình (local dev hoặc test CI): tự động bypass kèm log warning.
  - Client component `TurnstileWidget.svelte` có safety timeout 4 giây: nếu mạng người dùng chặn script Cloudflare, hệ thống không làm treo nút bấm của người dùng.
- **Rationale**: Đảm bảo bảo vệ chống botnet tự động mà không gây gián đoạn dịch vụ (Zero Downtime, Zero False Negatives).

### 4. Verification & Validation Gates
- **Contracts**: 18 test files, 135 tests passed.
- **Backend API**: 76 test files, 471 tests passed. Typecheck pass 100%.
- **Frontend Web**: 51 test files, 277 tests passed. Svelte-check 0 errors, 0 warnings.
- **Playwright E2E**: 2 passed (100%) cho `viral-referral-and-turnstile.spec.ts` và 2 passed (100%) cho `anti-cheat-referral.spec.ts`.


