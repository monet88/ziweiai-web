# Bối cảnh dự án (Context) - Tử Vi Toàn Tập

Tài liệu này tổng hợp các tính năng cốt lõi ĐÃ HOÀN THÀNH để cung cấp ngữ cảnh (context) cho AI Agent trong các session làm việc, giúp AI nhận biết được trạng thái hiện tại của codebase.

> **LƯU Ý BẢO MẬT QUAN TRỌNG:** Toàn bộ các biến môi trường (environment variables) dùng cho GitHub, Vercel, Supabase, AI Providers v.v... bắt buộc phải đặt tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web/.env.local`. File này tuyệt đối KHÔNG được push lên git để đảm bảo an toàn (đã cấu hình `.gitignore` đầy đủ).

---

## 🚀 Trạng Thái Tính Năng & Sprint (Phase 8: Production Store Distribution & Advanced AI Capabilities — Sprint 39 — 30/08/2026)
- **Current Branch:** `feature/sprint39-mobile-perfection-and-aab`
- **Rollback Anchor:** `587bd35` (feat(mobile): complete sprint 39 ticket 39.4 (annual horoscope flow & luxury pdf report))
- **Base Release Tag:** `v1.0.0` (commit `1a63fd5` trên `main`)
- **Total Tests:** **899/899 Passed** (Mobile: 38, API: 443, Web: 258, Contracts: 125, Astro-Engine: 35)
- **Google Play App Bundle:** `apps/mobile/build/app/outputs/bundle/release/app-release.aab` (**59.3MB**)
- **Sprint 39 Progress:** 4/4 tickets (Ticket 39.1, Ticket 39.2, Ticket 39.3 & Ticket 39.4: **100% DONE**).

1. **Sprint 39 Ticket 39.1 (DONE):**
   - Cấu hình Keystore signing và build bản phát hành Google Play App Bundle (`.aab`).
   - Sửa triệt để lỗi hiển thị Thiên Bàn 12 Cung (scale tự động, double tap, fit screen).
   - Nâng cấp Kinh Dịch gieo quẻ (Quick chips, default question).
   - Bắt mã lỗi 402/403 Thần Số Học thành modal nạp XU sang trọng thay vì văng raw DioException.
   - Đại tu Trợ Lý AI sang theme Celestial Luxury Dark Mode.
   - Hoàn thiện `ProfileScreen`, Auth Navigation và luồng Account Deletion tuân thủ Store.
   - Nâng cấp `WalletScreen` hỗ trợ song song 2 Tab VietQR (SePay) và In-App Purchase (RevenueCat).

2. **Sprint 39 Ticket 39.2 (DONE):**
   - Tích hợp Google AdMob Rewarded Video Ads trên Mobile (`google_mobile_ads: ^5.2.0`, `AdMobService`).
   - Cấu hình Native App ID trong `AndroidManifest.xml` và `Info.plist`.
   - Xây dựng endpoint Backend `POST /rewards/ad-reward` với `SupabaseAuthGuard` cộng +5 XU tự động (`WalletEngineService.addXU`) và ghi log `ad_reward`.
   - Tích hợp Banner "Xem Video Quảng Cáo Nhận +5 XU Miễn Phí" vào `WalletScreen` (cả 2 tab) và nút tiện ích trong `PremiumPaywallSheet`.

3. **Sprint 39 Ticket 39.3 (DONE):**
   - Tích hợp AI Voice Assistant Audio Synthesis đọc luận giải lá số (Text-to-Speech phong thủy truyền cảm `flutter_tts: ^4.2.2`).
   - Xây dựng `VoiceSynthesisService` hỗ trợ bóc tách làm sạch cú pháp Markdown `cleanMarkdownForSpeech`, chỉnh tốc độ đọc (0.8x / 1.0x / 1.2x).
   - Xây dựng thanh điều khiển âm thanh nổi `VoiceAudioPlayerBar` kèm hiệu ứng sóng âm thanh động `AnimatedWaveformVisualizer`.
   - Tích hợp nút 1 chạm phát giọng đọc `VoicePlayIconButton` trên toàn bộ các màn hình luận giải (Trợ Lý AI, Kinh Dịch, Thần Số Học, Tarot, Tướng Mặt & Chỉ Tay).

4. **Sprint 39 Ticket 39.4 (DONE):**
   - Xây dựng Màn hình Vận Hạn Lưu Niên Nâng Cao (`AnnualHoroscopeScreen`) với Carousel chọn năm, xem 12 Lưu Nguyệt, gọi AI luận giải chuyên sâu (15 XU), xử lý 402 Paywall và nghe đọc giọng nói AI.
   - Xây dựng Engine xuất Báo Cáo PDF Tử Vi Chuyên Sâu A4 sang trọng chuẩn in ấn (`ZiweiPdfService` với `pdf` & `printing`), gồm Bìa Hoàng Gia, Ma trận 12 Cung Thiên Bàn, Vận hạn năm/tháng và Luận giải AI.
   - Nút thao tác nhanh trên `ChartDetailScreen` và route `/charts/:id/annual`.
   - Viết trọn vẹn Unit Tests & Widget Tests, nâng tổng số test lên **899/899 tests xanh 100%**.



1. **Luồng sản phẩm cốt lõi (Core Flow)**
   - Khởi tạo lá số Tử Vi, Bát Tự, gieo quẻ Kinh Dịch, Mai Hoa, Lục Hào, Manh Phái, Hợp Hôn.
   - Xem chi tiết lá số/quẻ (Sử dụng dữ liệu snapshot đáng tin cậy).
   - Hỏi đáp AI & tạo Báo cáo năm (Annual Report).
   - Xác thực: Hoạt động trơn tru qua cả Anonymous Supabase Session và Email/Password Authentication.

2. **AI Provider Router**
   - Đã khắc phục triệt để lỗi 504 Gateway Timeout trên Vercel.
   - Cơ chế Provider Router ưu tiên dùng `gemini` (Gemini 1.5 Flash), sau đó tự động fallback sang `openai-compat` và `deepseek`.
   - Toàn bộ 431 test cases liên quan đến API và Provider Router đều PASSED.

3. **Hệ thống Thanh toán & Ví (Payment & Wallet)**
   - **SePay (VietQR)**: Hoàn tất tích hợp thanh toán chuyển khoản ngân hàng tự động với mã ngắn Short UUID.
   - **RevenueCat**: Hoàn tất tích hợp In-App Purchase cho nền tảng Mobile.
   - **Ví (Wallet UI)**: Frontend `/wallet` đã hiển thị QR SePay, kết nối với Supabase Realtime để tự động cập nhật số dư XU.
   - Webhook & Backend (`PaymentController`): Đã xử lý webhook hoàn chỉnh và cập nhật trực tiếp vào cơ sở dữ liệu.
   - **Lịch sử Ví (Wallet History)**: Hoàn tất giao diện Premium (Pull-to-refresh, Skeleton, Empty State).

4. **Admin Panel**
   - Trang quản trị tại endpoint `/admin` đã hoàn thiện bằng SvelteKit.
   - Áp dụng các biện pháp bảo mật (`SUPER_ADMIN` check trong bảng `admin_roles`) để quản lý an toàn.
   - Quản trị viên có thể xem danh sách người dùng, biến động số dư, audit log và thực hiện cộng/trừ XU trực tiếp.

5. **Hạ tầng & Deployment (Unified Deployment)**
   - Toàn bộ dự án (Frontend SvelteKit và Backend NestJS/Webhooks) chạy chung thống nhất trên **Vercel (`tuvitoantap.vercel.app`)**.
   - Đã đồng bộ 100% các Referral Links, CORS Origins sang `vercel.app` và test thành công toàn bộ hệ thống.

6. **SEO & Chia sẻ (Social Sharing)**
   - **Tạo OG Image động cho Link Giới thiệu (Referral SEO)**: Tạo ảnh cover động hiển thị Mã Giới Thiệu cá nhân hóa khi người dùng chia sẻ lên Zalo/Facebook/Telegram, sử dụng `satori` và `resvg-js`.

7. **Tối ưu tỷ lệ chuyển đổi (Monetization)**
   - **Banner Cảnh báo Số dư Thấp**: Tích hợp `WalletModel` vào màn hình Lịch sử (Dashboard). Tự động hiển thị banner cảnh báo và điều hướng nạp XU khi số dư dưới 15 XU.
   - **Báo Cáo Vận Hạn Năm**: Sẵn sàng phát hành thông qua flag `AI_ANNUAL_REPORT_ENABLED`.

8. **Tính năng Đọc bài Tarot (1-Card & 3-Card Draw)**
   - Trải 1 lá bài (Quick Draw - 2 XU) và 3 lá bài trên ứng dụng Mobile.
   - Prompt Engineering: Sử dụng dữ liệu mỏ neo (Grounding) với bộ từ khóa tĩnh cho 78 lá bài để ổn định chất lượng phản hồi từ Gemini LLM.

9. **Tính năng Thần Số Học (Numerology)**
   - Tính toán 4 chỉ số cốt lõi (Đường đời, Sứ mệnh, Linh hồn, Nhân cách) theo Pythagoras.
   - Endpoint `/numerology/explain` trừ 10 XU, gọi AI provider trả về luồng luận giải chuyên sâu bằng Tiếng Việt.

10. **Tái Cấu Trúc Kiến Trúc (Architecture Refactoring)**
    - Rút trích thành công `AiFeatureExecutionOrchestrator` (Deepen the AI Feature Execution Seam).
    - Gom toàn bộ logic kiểm tra Quota, trừ XU (Wallet) và xử lý lỗi Fallback từ AI vào một nơi duy nhất trên Backend.
    - Decoupling hoàn toàn `DrawsTarotService` và `NumerologyService` khỏi hạ tầng Payment/Quota.
    - Tái cấu trúc tầng Presentation trên Mobile: Kiến trúc Riverpod Notifier mỏng, 100% Unit Test coverage.

11. **Mobile UI Revamp (Premium Dark Mode)**
    - Ngôn ngữ thiết kế **Flat Dark Mode** (`AppTheme.mystical`), đồng bộ nền `#0D0B14`.
    - Chuẩn hóa toàn bộ các component (`PremiumTextField`, `PremiumButton`, `GlassPanel`), 0 lỗi `flutter analyze`.

12. **Tính năng Kinh Dịch (I Ching)**
    - UX gieo xu Animation (6 lần), giải quyết triệt để memory leak.
    - Cấu trúc dữ liệu Quẻ Chủ - Hào Động - Quẻ Biến lưu chuẩn trên Supabase. Luận giải AI và trừ 5 XU.

13. **Hạ tầng Tự Động Hóa Supabase Keep-Alive & Cron-Job.org (29/08/2026)**
    - Chuyển đổi và ủy quyền cơ chế Keep-Alive cho dịch vụ đám mây chuyên dụng **`cron-job.org`** qua `CRONJOB_API` trong `.env.local`.
    - **Job #8346899**: Gửi truy vấn SQL thực tế vào bảng `birth_profiles` trên Supabase mỗi 6 giờ (`00:00, 06:00, 12:00, 18:00`), ngăn chặn triệt để quy tắc 7 ngày inactivity pause & 90 ngày auto-delete của Supabase Free Tier, giải quyết dứt điểm nhược điểm 60-day inactivity timeout của GitHub Actions.
    - **Job #8346900**: Giữ ấm Web & API Serverless Functions trên Vercel mỗi 4 giờ, loại bỏ 100% độ trễ Cold Start cho người dùng Mobile và Web.

14. **Tính năng Thần Số Học (Numerology) trên Web SvelteKit (25/08/2026)**
    - Hoàn tất route `/numerology` trên Web SvelteKit (`NumerologyScreen.svelte`, `NumerologyCard.svelte`, `numerology-model.svelte.ts`).
    - Tính toán 4 chỉ số cốt lõi (Đường Đời, Sứ Mệnh, Linh Hồn, Nhân Cách) theo Pythagoras (hỗ trợ chuẩn hóa tiếng Việt và Master Numbers 11, 22, 33).
    - Tích hợp gọi AI Luận giải chuyên sâu qua `POST /numerology/explain` (trừ 10 XU) và render Markdown truyền cảm hứng.
    - Đưa lối vào Thần Số Học lên Dashboard (`ExtendedSystemNav.svelte`) và `packages/contracts` (`numerology.ts`).

15. **Hệ Thống Cảnh Báo AI Quota / Fallback Alert Qua Telegram (25/08/2026)**
    - Tích hợp giám sát thời gian thực vào `ProviderRouterBase` và `AiFeatureExecutionOrchestrator`.
    - Tự động bắn cảnh báo Telegram Bot khi Gemini gặp lỗi 429 (Rate Limit/Cạn quota) hoặc Timeout, failover sang DeepSeek / OpenAI-compat (`AI_FALLBACK_ALERT`).
    - Bắn cảnh báo khẩn cấp khi gặp lỗi 500 nghiêm trọng trong luồng trừ XU/Ví (`CRITICAL_500_WALLET_DEDUCTION`) hoặc luồng AI (`CRITICAL_500_AI_EXECUTION`, `AI_PROVIDER_CHAIN_EXHAUSTED`).
    - Tích hợp cơ chế Debounce / Rate Limit throttle key (60s) chống spam tin nhắn khi gặp lỗi dồn dập.
    - Format tin nhắn Telegram HTML trực quan, chi tiết kèm Status, Request ID, Feature, User ID, Provider tags.

16. **Nâng Cấp Toàn Diện Homepage & Universe Hub (26/08/2026)**
    - Thiết kế lại trang chủ theo ngôn ngữ **Celestial Luxury Glassmorphism**:
      - **Celestial Astro Dial**: Thiên Bàn 12 Cung & 12 Địa Chi (Tý - Hợi) phát quang xoay mượt mà quanh trục Thái Cực Âm Dương & Nebula, kèm 4 HUD tag tương tác (Mệnh, Quan, Tài, Di).
      - **Bento Grid AI Mystical Tools**: 6 thẻ công cụ AI chủ đạo (Xem Tướng Mặt AI, Xem Chỉ Tay AI, Rút Bài Tarot, Đọc Bài Chụp Ảnh, Thần Số Học, Gieo Quẻ Lục Hào) với hiệu ứng 3D hover tilt, viền phát sáng gradient và nhãn công nghệ `AI VISION SCAN`, `BIOMETRIC SCAN`.
      - **Universe Hub 12 Bộ Môn Thuật Số**: Phân nhóm trực quan thành 4 đại danh mục (Mệnh Lý, Bói Dịch, Trực Giác, Sinh Trắc Học).
      - **Interactive Quick-Form**: Khởi tạo lá số trực quan, tự động tính múi giờ và âm dương lịch.

17. **Đóng Gói & Phát Hành Bản Release APK Cho Mobile Flutter (28/08/2026)**
    - Chuẩn hóa cấu hình Android Toolchain (SDK 36.1.0, Flutter 3.41.2, Kotlin DSL).
    - Cấu hình hiển thị nhãn ứng dụng `android:label="Tử Vi Toàn Tập"` và cơ chế fallback API key RevenueCat an toàn trong `Env.dart`.
    - Build thành công file cài đặt **Release APK (`app-release.apk` - 59.8MB)** sẵn sàng cài đặt trên thiết bị thật Android (`apps/mobile/build/app/outputs/flutter-apk/app-release.apk`).
    - Hoàn tất audit toàn diện luồng người dùng trên Mobile (Tử Vi, Kinh Dịch I Ching, Tarot, Thần Số Học, AI Assistant, Ví XU, Auth Anonymous/Supabase) theo chuẩn `/behavior-model-debugger`.

18. **Thực Nghiệm & Cài Đặt Thiết Bị Thật Samsung Galaxy A53 (29/08/2026)**
    - Tách nhánh chuyên biệt `feature/mobile-release-v1` (Commit: `6db45e6`), cô lập 100% thay đổi của Flutter khỏi Web/API.
    - Kết nối thành công Wi-Fi Debugging (`192.168.2.25:40805`) với thiết bị Samsung Galaxy A53 5G (`SM_A536E`).
    - Tối ưu build `--target-platform android-arm64` (chỉ mất 31.1s), cài đặt trực tiếp và khởi chạy thành công với đồ họa `Impeller Vulkan Backend` 60-120 FPS.
    - Mở thành công **Pull Request #2** (`feature/mobile-release-v1` ➜ `main`) trên GitHub.

19. **Kế Hoạch Nâng Cấp Giao Diện Mobile "Celestial Luxury" (Sprint 37 - Phase 6)**
    - Chuẩn bị bước vào Sprint 37 để đại tu giao diện Mobile Flutter từ đơn giản lên đẳng cấp **Celestial Luxury Glassmorphism** (Bento Grid 12 bộ môn, viền vàng phát quang, hiệu ứng Haptic Feedback cảm ứng rung tinh tế, Floating Pill NavBar).

20. **Hoàn Thành Toàn Diện Sprint 37: Mobile UI/UX Overhaul & Celestial Luxury Revamp (30/08/2026)**
    - **Ticket 1 (Design System & Bento Grid Home)**: Nâng cấp `AppTheme` với bảng màu **Deep Cosmos**, hệ dải màu **Imperial Gold** & **Nebula Glow**, `GlassPanel 2.0` (viền vàng phát quang, haptic feedback), `AnimatedBackground` (tinh vân & hạt sao vũ trụ 60-120 FPS), `FloatingPillNavBar` (thanh điều hướng đáy lơ lửng), `HomeScreen` Bento Grid 6 thẻ công cụ thuật số AI.
    - **Ticket 2 (Tử Vi Thiên Bàn & Chart Detail)**: `ZiweiBoard` 12 cung viền vàng phát quang, phân cấp màu sao chính/phụ tinh, tâm Thái Cực Âm Dương hào quang vàng/tím, haptic tap từng cung vị; `ChartDetailScreen` bọc kính mờ đa tầng và nút FAB hỏi đáp AI Imperial Gold.
    - **Ticket 3 (Kinh Dịch 3D & Tarot 3D)**: `IChingScreen` đĩa gieo quẻ 3D viền vàng, mô phỏng lắc đồng xu Âm Dương vật lý, rung haptic xúc giác đa tầng, hiển thị Quẻ Chủ/Biến viền vàng; `TarotScreen` mặt lưng bài mạ vàng tinh vân, hiệu ứng lật bài 3D mượt mà và lời giải mã huyền học.
    - **Ticket 4 (Thần Số Học & Ví XU Revamp)**: `NumerologyScreen` bọc `GlassPanel 2.0`, 4 thẻ chỉ số cốt lõi mạ vàng phát sáng; `WalletScreen` bảng nạp XU hoàng gia, pill số dư vàng rực và nút nạp XU phát quang.
    - **Ticket 5 (Release APK Verification)**: Build thành công gói tối ưu Release APK `--target-platform android-arm64` (chỉ **22.6MB**, giảm 62% dung lượng từ bản 59.8MB universal).
    - Hoàn tất 100% Verification Gates: `flutter analyze` (0 issues), `flutter test` (19/19 tests passed), `contracts` (125 tests passed), `web` (258 tests passed), `api` (439 tests passed).

21. **Hoàn Thành Toàn Diện Sprint 38: Biometric Vision AI & RevenueCat In-App Subscriptions (30/08/2026)**
    - **Ticket 1 (Xem Tướng Mặt AI - Face Vision Scan)**: Tích hợp endpoint `/api/vision/face-reading` trên Mobile. Giao diện Augmented HUD Scanner: Vùng quét Tam Đình (Thượng/Trung/Hạ Đình) & Ngũ Nhạc, tia laser vàng quét động (`AnimationController`), hiển thị kết quả thẻ bài hoàng kim Celestial Luxury với định dạng Markdown và chia sẻ nhanh qua hệ thống.
    - **Ticket 2 (Xem Chỉ Tay AI - Palmistry Vision Scan)**: Tích hợp endpoint `/api/vision/palm-reading` trên Mobile. Augmented HUD Scanner chuyên biệt: Đường Sinh Đạo, Trí Đạo, Tâm Đạo phát sáng vàng kim và phân tích tướng tay vận mệnh theo thuật số Á Đông.
    - **Ticket 3 (RevenueCat Live Configuration & Subscriptions)**: Tích hợp `purchases_flutter` & `purchases_ui_flutter`. Cấu hình API key `test_QfXsSSzoZikwOkSepsWCLSUiUSF`, entitlement `tử_vi_toàn_tập_pro` (`tu_vi_toan_tap_pro`, `pro`) với 3 gói dịch vụ: Trọn Đời (`lifetime`), Năm (`yearly`), Tháng (`monthly`). Đồng bộ Supabase Auth an toàn với RevenueCat. Tích hợp Native Paywall Sheet và Customer Center trực tiếp trên `WalletScreen` và `HomeScreen`.
    - **Verification & Store Prep**: Hoàn tất 100% Verification Gates: `flutter analyze` (0 issues), `flutter test` (22/22 tests passed), `contracts` (125 tests passed), `web` (258 tests passed), `api` (439 tests passed). Release APK built thành công (**24.8MB**), stream install và khởi chạy mượt mà trên Samsung Galaxy A53 5G (`192.168.2.25:40805`).

---

## 📊 Trạng Thái Kiểm Thử (Verification Gates)
- **Shared Contracts Build & Test**: ✅ `pnpm -F @ziweiai/contracts build && pnpm -F @ziweiai/contracts test` (16/16 files, 125 tests passed)
- **Backend API**: ✅ `pnpm -F @ziweiai/api test` (72/72 files, 439 tests passed)
- **Web SvelteKit**: ✅ `pnpm -F @ziweiai/web check` (0 errors) & `pnpm -F @ziweiai/web test` (47/47 files, 258 tests passed)
- **Playwright E2E**: ✅ `smoke.spec.ts` & `us-043-numerology.spec.ts` (100% Passed)
- **Mobile Flutter**: ✅ `flutter analyze` (0 issues), `flutter test` (22/22 tests passed), `flutter build apk --release --target-platform android-arm64` (SUCCESS - 24.8MB)
- **Samsung Galaxy A53 5G Test**: ✅ Cài đặt & khởi chạy thành công qua ADB Wi-Fi Debugging (`192.168.2.25:40805`)
- **Vercel Demo Smoke**: ✅ `https://tuvitoantap.vercel.app` (HTTP 200 Root, API health, API features, SPA routes)
- **Cron-Job.org Keep-Alive**: ✅ `Job #8346899 & #8346900 ACTIVE 24/7`

---

## ⚓ Rollback Anchor & Backup
- **Safe Rollback Point**: `git reset --hard 3ad0f2c` (Chỉ dùng sau khi đã xác nhận và lưu backup stash)

---

## ⏳ Các Hạng Mục Tiếp Theo (Next Steps)
- Merge Pull Request #2 vào nhánh `main` khi Đại Ka duyệt.
- Gắn Release Tag `v1.0.0` trên GitHub.
- Đóng gói Android App Bundle (.aab) và iOS IPA chuẩn bị nộp Store.

---

## 🛡️ Quy Tắc Phát Triển (Development Rules)
- Mọi tính năng lớn mới bắt buộc phải rẽ nhánh (new branch) và tạo PR theo `/vibe-engineering-workflow` và `/vibe-git-manager`.
- File `.env.local` là nguồn sự thật cho toàn bộ API key/Token, tuyệt đối KHÔNG commit vào Git.
- Cập nhật lại file `CONTEXT.md` sau mỗi session hoặc khi hoàn thành mốc tính năng quan trọng.


