# Bối cảnh dự án (Context) - Tử Vi Toàn Tập

Tài liệu này tổng hợp các tính năng cốt lõi ĐÃ HOÀN THÀNH để cung cấp ngữ cảnh (context) cho AI Agent trong các session làm việc, giúp AI nhận biết được trạng thái hiện tại của codebase.

> **LƯU Ý BẢO MẬT QUAN TRỌNG:** Toàn bộ các biến môi trường (environment variables) dùng cho GitHub, Vercel, Supabase, AI Providers v.v... bắt buộc phải đặt tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web/.env.local`. File này tuyệt đối KHÔNG được push lên git để đảm bảo an toàn (đã cấu hình `.gitignore` đầy đủ).

---

## 🚀 Trạng Thái Tính Năng & Sprint (Phase 5: Mobile Release & Production Hardening - Sprint 36 - 28/08/2026)

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

---

## 📊 Trạng Thái Kiểm Thử (Verification Gates)
- **Shared Contracts Build & Test**: ✅ `pnpm -F @ziweiai/contracts build && pnpm -F @ziweiai/contracts test` (16/16 files, 125 tests passed)
- **Backend API**: ✅ `pnpm -F @ziweiai/api test` (72/72 files, 439 tests passed)
- **Web SvelteKit**: ✅ `pnpm -F @ziweiai/web check` (0 errors) & `pnpm -F @ziweiai/web test` (47/47 files, 258 tests passed)
- **Playwright E2E**: ✅ `smoke.spec.ts` & `us-043-numerology.spec.ts` (100% Passed)
- **Mobile Flutter**: ✅ `flutter analyze` (0 issues), `flutter test` (19/19 tests passed), `flutter build apk --release` (SUCCESS - 59.8MB), `Live Install Samsung A53` (SUCCESS)
- **Vercel Demo Smoke**: ✅ `https://tuvitoantap.vercel.app` (HTTP 200 Root, API health, API features, SPA routes)
- **GitHub Action Keep-Alive**: ✅ `Run #12 SUCCESS`

---

## ⚓ Rollback Anchor & Backup
- **Base Commit Hash**: `713530f`
- **Safe Rollback Point**: `git reset --hard 713530f` (Chỉ dùng sau khi đã xác nhận và lưu backup stash)

---

## ⏳ Các Hạng Mục Tiếp Theo (Next Steps)
- Kiểm thử cài đặt APK trên thiết bị thật Android.
- Khảo sát mở rộng thêm các kênh phân phối / App Store khi có yêu cầu.

---

## 🛡️ Quy Tắc Phát Triển (Development Rules)
- Mọi tính năng lớn mới bắt buộc phải rẽ nhánh (new branch) và tạo PR theo `/vibe-engineering-workflow` và `/vibe-git-manager`.
- File `.env.local` là nguồn sự thật cho toàn bộ API key/Token, tuyệt đối KHÔNG commit vào Git.
- Cập nhật lại file `CONTEXT.md` sau mỗi session hoặc khi hoàn thành mốc tính năng quan trọng.

