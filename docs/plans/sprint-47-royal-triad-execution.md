# SPRINT 47: TAM BẢO CUNG ĐÌNH (THE IMPERIAL TRIAD)
## TÀI LIỆU PHÂN TÍCH, THIẾT KẾ HÀNH VI & KẾT QUẢ THỰC THI HOÀN HẢO

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web` / `apps/mobile`)  
**Sprint:** 47 ("Tam Bảo Cung Đình" — Referral Viral Loop, Thần Số Học & Cung Đình Zen Soundscape)  
**Nhánh Git:** `feature/sprint-47-royal-triad`  
**Rollback Anchor:** `b1bfe47` (Commit kết thúc Sprint 46)  
**Trạng thái:** 100% HOÀN THÀNH & TOÀN BỘ QUALITY GATES ĐẠT CHUẨN (77/77 flutter tests, 0 analyze issues, 478/478 API tests, 0 web errors)  
**Quy chuẩn áp dụng:**  
- `/vibe-engineering-workflow` (Master Smart Router, Single Ticket Scope, Pre-Check 4 Bước)  
- `/behavior-model-debugger` (Steve Ruiz Behavioral Model & Invariant Collision Matrix)  
- `/vibe-git-manager` (Zero-Leak Git, Branching & Recovery Protocol)  

---

## I. MỤC TIÊU SPRINT 47 (GOALS & OBJECTIVES)

Hợp nhất toàn bộ 3 phương án chiến lược của Đại Ka thành một Đại Hội Sprint toàn diện:

1. **Vertical 1 (Đại Tiệc Cung Đình — Referral Viral Loop & Social Share Cards)**:
   - Xây dựng màn hình Giới Thiệu Bạn Bè (`referral_screen.dart`).
   - Render thẻ ảnh Phong Thủy Cung Đình (chuẩn tỉ lệ 9:16 Story) chứa mã giới thiệu và QR Code tải app sắc nét bằng `RepaintBoundary`.
   - Hỗ trợ chia sẻ Native thông qua `share_plus` (`SharePlus.instance.share`) chia sẻ file ảnh PNG trực tiếp qua Zalo, Messenger, Facebook Stories.
   - Cho phép nhập mã giới thiệu nhận ngay +20 XU tức thì, có pháo hoa `ConfettiWidget` và dialog chúc mừng hoàng gia.
2. **Vertical 2 (Huyền Số Học — Thần Số Học Pythagoras & Tra Cứu Sim/Biển Số Xe)**:
   - Nâng cấp màn hình `numerology_screen.dart` thành dạng 2 Tab Cung Đình:
     - **Tab 1: Thần Số Pythagoras**: Tính toán và hiển thị trực quan Số Chủ Đạo (Life Path), Số Sứ Mệnh (Destiny), Số Linh Hồn (Soul Urge), Số Nhân Cách (Personality), kết nối AI Luận giải (10 XU).
     - **Tab 2: Sim Số & Biển Số Xe Phong Thủy** (`feng_shui_number_tab.dart`): Tra cứu 80 quẻ linh số phong thủy cổ truyền, ngũ hành của số điện thoại và biển số xe, đưa ra đánh giá Cát/Hung và bài phú giải quẻ.
3. **Vertical 3 (Ngự Âm Cung Đình — Zen Soundscapes & Voice Hybrid)**:
   - Tích hợp chế độ "Khí Âm Thiền Định" (Zen Mode) trong `voice_synthesis_service.dart` (`isZenMode`, `toggleZenMode()`).
   - Nâng cấp `VoiceAudioPlayerBar`: Thêm chip toggle `ZEN` (Icon chuông thiền `Icons.spa_rounded` mạ vàng ánh kim) giúp người dùng kích hoạt âm hưởng thiền định làm nền thanh tịnh cho giọng đọc luận giải AI.

---

## II. MA TRẬN VA CHẠM HÀNH VI ĐÃ XỬ LÝ (/behavior-model-debugger)

1. **Va chạm Audio Playback vs Tab Switching & Modals**:
   - `VoiceAudioPlayerBar` được dock ở `bottomNavigationBar` của cả `bazi_screen.dart`, `royal_dossier_screen.dart`, và `numerology_screen.dart`.
   - Trạng thái âm thanh được điều phối bởi Riverpod Provider toàn cục, cho phép người dùng vừa nghe luận giải vừa chuyển tab tra cứu Sim Số hoặc mở Thẻ Share Referral mà không bị ngắt tiếng hay crash `MissingPluginException`.
2. **Va chạm Referral Self-Invite & Empty Code**:
   - `ReferralService.redeemReferralCode()` chặn người dùng tự nhập mã giới thiệu của chính mình (`myCode == code`).
   - Bắt lỗi mã rỗng hiển thị SnackBar cảnh báo kịp thời.
3. **Va chạm Layout Tràn Khung (RenderFlex Overflow) trên Màn hình Hẹp**:
   - Thẻ `RoyalReferralCard` bọc `Flexible` và `TextOverflow.ellipsis` cho nhãn quà tặng, bảo đảm co giãn tự nhiên từ màn hình nhỏ (330px) đến máy tính bảng hoặc khi xuất ảnh Retina 3x.
4. **Va chạm Quota & Insufficient XU**:
   - Luận giải cơ bản Thần Số Học và Tra cứu Sim Số hoàn toàn MIỄN PHÍ.
   - Khi bấm AI luận giải chi tiết (10 XU), nếu số dư không đủ sẽ mở Dialog chuyển tiếp mượt mà sang `WalletScreen`.

---

## III. CHI TIẾT CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH (WHAT WAS DONE)

### 1. Module Referral Viral Loop (Phase 1):
- `apps/mobile/lib/features/referral/services/referral_service.dart`: Quản lý lấy mã giới thiệu cá nhân, đếm lượt giới thiệu và XU nhận được, gọi API nhận thưởng.
- `apps/mobile/lib/features/referral/widgets/royal_referral_card.dart`: Thẻ ảnh 9:16 Cung Đình viền mạ vàng 2 lớp, 4 góc họa tiết Khâm Thiên Giám, tích hợp `QrImageView` và logic chụp ảnh qua `RepaintBoundary`.
- `apps/mobile/lib/features/referral/presentation/referral_screen.dart`: Giao diện Đại Tiệc Cung Đình hoàn chỉnh, banner thống kê, xem trước thiệp mời, nút chia sẻ native, nút chép mã và ô nhập mã nhận 20 XU có pháo hoa chúc mừng.
- `apps/mobile/lib/core/router/app_router.dart`: Đăng ký route `/referral`.
- `apps/mobile/lib/features/wallet/presentation/wallet_screen.dart`: Tích hợp Banner "Mời Tri Kỷ Kết Duyên — Tặng Ngay +20 XU" dẫn trực tiếp tới `/referral`.

### 2. Module Thần Số Học & Phong Thủy Sim/Biển Số Xe (Phase 2):
- `apps/mobile/lib/features/numerology/domain/feng_shui_number_calculator.dart`: Thuật toán 80 quẻ phong thủy Đông Phương, phân tích ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ) và đánh giá Cát/Hung kèm lời khuyên phong thủy.
- `apps/mobile/lib/features/numerology/presentation/feng_shui_number_tab.dart`: Màn hình tra cứu Sim Số & Biển Số Xe với Card kết quả phong cách Cung Đình hoàng kim.
- `apps/mobile/lib/features/numerology/presentation/numerology_screen.dart`: Tái cấu trúc thành 2 Tab Cung Đình ("Thần Số Pythagoras" và "Sim & Biển Số"), gắn `VoiceAudioPlayerBar` ở thanh đáy.

### 3. Module Ngự Âm Cung Đình Zen Soundscape (Phase 3):
- `apps/mobile/lib/core/services/voice_synthesis_service.dart`: Thêm trường `isZenMode` vào `VoicePlayerState` và hàm `toggleZenMode()` trong `VoiceSynthesisService`.
- `apps/mobile/lib/core/presentation/widgets/voice_audio_player_bar.dart`: Thêm chip toggle `ZEN` mạ vàng ánh kim với icon `Icons.spa_rounded` và thông báo SnackBar khi kích hoạt.

### 4. Hệ Thống Kiểm Thử Tự Động (Tests):
- `apps/mobile/test/features/referral/referral_test.dart`: (Mới - 6 tests) Kiểm tra ReferralService, RoyalReferralCard, ReferralScreen UI và validation mã rỗng.
- `apps/mobile/test/features/numerology/feng_shui_number_test.dart`: (Mới - 4 tests) Kiểm tra FengShuiNumberCalculator và giao diện FengShuiNumberTab.
- `apps/mobile/test/features/voice/voice_widget_test.dart`: Cập nhật kiểm tra nút `ZEN` và icon `Icons.spa_rounded`.
- `apps/mobile/test/features/voice/voice_synthesis_service_test.dart`: Bổ sung kiểm tra `isZenMode` và `toggleZenMode()`.

---

## IV. BẢNG BẰNG CHỨNG KIỂM CHỨNG CHẤT LƯỢNG (TEST EVIDENCE)

| Gate / Module | Lệnh Kiểm Tra | Kết Quả | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **Mobile Widget & Unit Tests** | `cd apps/mobile && flutter test` | **77/77 tests passed** (tăng từ 66 lên 77) | **PASS (100%)** |
| **Mobile Static Analysis** | `cd apps/mobile && flutter analyze` | **0 issues found** | **PASS (100%)** |
| **Contracts Build** | `pnpm -F @ziweiai/contracts build` | **Clean build** | **PASS (100%)** |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **0 errors** | **PASS (100%)** |
| **API Unit & Service Tests** | `pnpm -F @ziweiai/api test` | **77/77 files, 478/478 tests passed** | **PASS (100%)** |
| **Web Diagnostics** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** | **PASS (100%)** |

---

## V. PRE-CHECK 4 BƯỚC (/vibe-engineering-workflow)

- [x] **1. Logic Correctness**: Toàn bộ 77 Flutter tests và 478 API tests đều vượt qua 100%. Các tính toán phong thủy, chia sẻ thẻ 9:16 và Zen mode đều hoạt động chuẩn xác.
- [x] **2. Workflow & Code Cleanliness**: Không để lại biến/import thừa, không dùng deprecated API, code format tuân thủ đúng chuẩn monorepo.
- [x] **3. Missing Features & Edge Cases**: Xử lý đầy đủ trường hợp tự nhập mã ref, mất mạng, textfield rỗng, tràn flex trên màn hình hẹp.
- [x] **4. Latent Risks & Security**: Không commit token hay secret, không có memory leak trong animation controller.
