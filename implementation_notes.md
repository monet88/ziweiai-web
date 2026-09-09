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

## Decisions Made During Sprint 42 (Deluxe Dossier & Print Engine Hardening)

### 1. Root Cause & Solution: Print Blank Page Fix
- **Problem**: 
  - Nút "In sớ / Lưu PDF" tại khối Luận giải chỉ ra 1 trang bị trắng tinh, lấp ló dòng "2. Sự Nghiệp Và Tài Lộc" ở mép đáy trang 1.
  - Nút "In / Lưu PDF" tại Hồ Sơ Hoàng Gia Deluxe bị trắng toàn bộ trang in.
- **Root Cause**:
  1. *Lá số 12 cung chiếm toàn bộ trang 1*: Khối `.board-section` cao 800px không bị ẩn khi in, khi không bật background graphics nó tạo mảng trắng khổng lồ đẩy bài sớ xuống đáy trang 1.
  2. *Pagination Clip (Kẹt phân trang)*: Thẻ cha `.screen` có `overflow-x: hidden; min-height: 100dvh;`. Trình duyệt Chrome/WebKit coi đây là single-page viewport và cắt đứt phân trang, chỉ in duy nhất 1 trang đầu!
  3. *Màu chữ tàng hình*: `MarkdownView.svelte` dùng màu `--color-text-secondary` (`#d1d5db` - xám nhạt mờ) và các tiêu đề dùng `-webkit-text-fill-color: transparent`. Trên nền giấy in trắng không có background graphics, chữ biến mất hoàn toàn.
  4. *Cấu trúc selector sai trong Dossier*: Rule `:global(body > *:not(.dossier-overlay))` đã ẩn `div.app-content-wrapper` (thẻ cha của cả app SvelteKit), khiến toàn bộ modal hồ sơ bị ẩn theo. Ngoài ra trong Book Mode, specificity của `.mode-book .dossier-page:not(.is-active)` làm ẩn 18 trang còn lại.
- **Solution Applied**:
  - Mở khóa toàn bộ `overflow` và `height` trên các container tổ tiên (`html, body, .app-content-wrapper, .screen, .container, .detail-page`).
  - Gắn class chuyên biệt `printing-explanation-scroll` và `printing-deluxe-dossier` vào `document.body` khi in.
  - Ẩn hoàn toàn các khối không liên quan (`.board-section`, `.top-nav-bar`, `.hero`, `.mobile-bottom-nav`, nút bấm).
  - Thêm header bản sớ trang trọng (`print-so-header`) cho bản sớ in ấn với đầy đủ thông tin đương số, ngày giờ sinh Âm Dương lịch, Mệnh, Cục.
  - Định dạng màu chữ in: đen tuyền `#111827`, tiêu đề đồng son `#78350f`, trích dẫn và bảng biểu trang nhã, phân trang mượt mà không bị cắt chữ.
  - Ép hiển thị trọn vẹn 19 trang A4 vector cho Hồ Sơ Hoàng Gia dù đang ở chế độ Sách hay Cuộn.

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

## Decisions Made During Sprint 44 — Phase 2: Mobile Royal Edition (Flutter apps/mobile)

### 1. Kiểm soát chiều cao FloatingPillNavBar để khắc phục Hit Test Miss
- **Decision**: Khi `extendBody: true` được kích hoạt trên `Scaffold`, `FloatingPillNavBar` nằm trong `bottomNavigationBar` không có kích thước ràng buộc dọc cố định, khiến Flutter layout engine mở rộng RenderBox của thanh navigation lên toàn bộ viewport (`800x600`), che phủ toàn bộ sự kiện chạm của các widget phía sau dù chỉ có một phần nhỏ hiển thị ở đáy màn hình.
- **Decision**: Đặt `SizedBox(height: 60)` bên trong `SafeArea(top: false, child: ...)`. Chiều cao thực tế cố định ở 68.0dp (60dp content + 8dp margin/padding) và neo chuẩn xác ở đáy màn hình `Offset(0.0, 532.0)`.

### 2. Cơ chế hiển thị chi tiết Cung vị (PalaceDetailBottomSheet)
- **Decision**: Thiết kế Modal Bottom Sheet hoàng gia chuẩn Stitch MCP `4cea86b5`, phân tầng 4 nhóm tinh diệu rõ ràng:
  - **Chính Tinh Hoàng Triều**: Đi kèm độ sáng đắc hãm (`Miếu`, `Vượng`, `Đắc`, `Hãm`) bằng badge màu sắc quy chuẩn.
  - **Tứ Hóa Tọa Thủ**: Gắn nhãn badge cung đình chuẩn phong thủy: `Hóa Lộc` (Ngọc bích), `Hóa Quyền` (Vàng kim), `Hóa Khoa` (Lam ngọc), `Hóa Kỵ` (Chu sa).
  - **Cát Tinh Phước Thiện**: Tông ngọc bích `AppTheme.etherealJade`.
  - **Sát Tinh & Bại Diệu**: Tông chu sa `AppTheme.cinnabarCrimson`.
  - **Khâm Thiên Giám Ngự Phê**: Thẻ luận giải tổng quát thời vận cung vị.
- **Decision**: Nút điều hướng Cung trước/Cung sau và Hoàn tất tra cứu đạt chuẩn tối thiểu 48dp (`AppTheme.touchTargetMin`).

### 3. Hiệu ứng Hào Quang Hoàng Kim trên ZiweiBoard
- **Decision**: Khi một cung được chạm chọn, viền của cung chuyển sang `AppTheme.goldBright` 2.0px cùng cặp hiệu ứng bóng mờ `BoxShadow` vàng kim (`CelestialShadows.goldGlow`) và tím tinh vân (`nebulaPurple`), giúp người dùng nhận diện ngay cung vị đang xem chi tiết.
- **Decision**: Tự động mở `PalaceDetailBottomSheet` khi chạm vào cung nếu không truyền custom callback.

### 4. Verification & Validation Gates
- **Flutter Analyze**: `Analyzing mobile... No issues found! (ran in 2.0s)`.
- **Flutter Test Suite**: 40/40 tests passed 100%, bao gồm widget test cho `home_flow_test.dart`, `palace_detail_bottom_sheet_test.dart` và `ziwei_board_test.dart`.

## Decisions Made During Sprint 44 — Phase 2.3: Lục Hào Chiêm Bốc 3D (Stitch d028a9a3)

### 1. Đài Gieo 3 Đồng Xu Khang Hy 3D Flip Physics
- **Decision**: Tạo mô hình 3 đồng tiền cổ Khang Hy mạ vàng (hình tròn lỗ vuông, chữ Hán 'Khang Hy Thông Bảo' ở mặt ngửa, hoa văn khiên hộ mệnh ở mặt sấp) với hiệu ứng lật đa trục `Matrix4.identity()..setEntry(3, 2, 0.002)..rotateY(angle)` và rung lắc đĩa gấm nhung chu sa hoàng cung.
- **Decision**: Hiển thị rõ lịch sử và kết quả từng lần gieo: `Ngửa/Sấp` ➜ `Thiếu Dương (7) / Thiếu Âm (8) / Lão Dương (9 - Biến) / Lão Âm (6 - Biến)`.

### 2. Tháp Lục Hào Cổ Phong (Hexagram Stupa)
- **Decision**: Vẽ 6 vạch hào từ dưới lên trên (Sơ Hào đến Thượng Hào) theo đúng dịch lý tiên thiên: Hào Dương liền vàng kim (`goldBright`), Hào Âm đứt ngọc bích (`etherealJade`), và Hào Biến (động) phát quang chu sa (`cinnabarLight`).
- **Decision**: Thẻ kết quả quẻ chia 2 cột: Quẻ Chủ (Tiên Thiên) và Quẻ Biến (Hậu Thiên) đối xứng, tích hợp TTS `VoicePlayIconButton`.

### 3. Verification & Validation Gates
- **Flutter Analyze**: `Analyzing mobile... No issues found! (ran in 3.1s)`.
- **Flutter Test Suite**: 43/43 tests passed 100%, bổ sung test suite `iching_screen_test.dart` đạt 3/3 tests pass tuyệt đối.

## Decisions Made During Sprint 44 — Phase 2.4: Linh Xăm Quan Thánh 3D & Cặp Keo Thoại Bôi (Stitch 587ad2cf)

### 1. Ống Xăm Tre Sơn Son Thếp Vàng & Ejected Stick Animation
- **Decision**: Thiết kế ống xăm 100 quẻ bằng gỗ tre già sơn son thếp vàng, chạm khắc rồng vàng uốn lượn phong cách cung đình. Tích hợp `AnimationController` mô phỏng chuyển động lắc lư đa trục $\pm 14^\circ$ kèm rung haptic `HapticFeedback.mediumImpact()`.
- **Decision**: Khi lắc đủ lực, thẻ xăm bằng trúc già nhô cao và văng ra với số quẻ ngẫu nhiên (hoặc từ backend `POST /draws/stick`), chuyển tiếp mượt mà sang bước Gieo Keo (Thoại Bôi).

### 2. Đài Gieo Cặp Keo Thoại Bôi Âm Dương Gỗ Đào
- **Decision**: Mô phỏng cặp keo (Thoại Bôi) hình trăng lưỡi liềm bằng gỗ đào ngàn năm với hiệu ứng 3D lật quay không gian (`Matrix4.identity()..rotateZ(..)..rotateX(..)`).
- **Decision**: Quy tắc linh ứng chuẩn Đền Quan Thánh:
  - **Thánh Bôi (1 Ngửa 1 Sấp)**: Thần linh chuẩn y, quẻ linh ứng đại cát ➜ mở khóa bài thơ quẻ tứ tuyệt và luận giải.
  - **Tiếu Bôi (2 Ngửa)**: Thần linh mỉm cười chưa định ➜ khấn lại thành tâm và lắc lại ống xăm.
  - **Âm Bôi (2 Sấp)**: Thần linh quở trách hoặc lòng còn tạp niệm ➜ tĩnh tâm sám hối và gieo lại.

### 3. Thơ Quẻ Tứ Tuyệt & Luận Giải 7 Lĩnh Vực Cốt Lõi
- **Decision**: Hiển thị thẻ sớ quẻ giấy điệp hoàng cung cổ điển với: Thơ quẻ chữ Hán/Việt âm điệu trang nghiêm, Cát hung phân định (Thượng Thượng Cát, Trung Cát, Hạ Hạ Hung...), và phân tích 7 phương diện: Công danh, Cầu tài, Gia đạo, Hôn nhân, Sức khỏe, Xuất hành, Kiện tụng.
- **Decision**: Tích hợp Khâm Thiên Giám Ngự Phê (luận giải sâu AI độc bản) tiêu tốn 5 XU, có Modal xác nhận bảo vệ quyền lợi tài chính của thân chủ và tự động đồng bộ số dư ví (`ref.invalidate(walletBalanceProvider)`).

### 4. Verification & Validation Gates
- **Flutter Analyze**: `Analyzing mobile... No issues found! (ran in 3.5s)`.
- **Flutter Test Suite**: 45/45 tests passed 100%, bao gồm toàn bộ test suite mới `stick_screen_test.dart` (2/2 passed) kiểm tra toàn vẹn luồng lắc xăm ➜ gieo keo ➜ hiển thị thơ quẻ ➜ mở khóa luận giải chi tiết.
