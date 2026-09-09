# SPRINT 46 FINAL HANDOVER & SPRINT 47 KICKOFF

**Project:** ViOS — Tử Vi Toàn Tập (`ziweiai-web` / `apps/mobile`)  
**Sprint:** 46 ("Ngự Phán Hoàng Gia" — Royal Voice Audio & Consumable In-App Purchase Sync)  
**Status:** 100% COMPLETE & VERIFIED  
**Date:** 2026-09-09  
**Anchor Commit:** `9b3d5ad` (Sprint 45 base)  
**Branch:** `feature/sprint-46-iap-and-voice-royal`  

---

## I. MỤC TIÊU SPRINT 46 & THÀNH QUẢ ĐẠT ĐƯỢC

Trong Sprint 46, toàn bộ 2 Vertical cốt lõi theo đề xuất "Ngự Phán Hoàng Gia" đã được triển khai trọn vẹn và kiểm chứng nghiêm ngặt:

### 1. Vertical 1: Khí Âm Hoàng Gia — Voice Audio Cung Đình
- **Mục tiêu**: Đưa trải nghiệm luận giải âm thanh (TTS / AI Voice) vào các màn hình cao cấp nhất của Mobile.
- **Thực thi**:
  - Tích hợp thanh điều khiển phát âm thanh `VoiceAudioPlayerBar` dạng floating/docked ở `bottomNavigationBar` của:
    - **Bát Tự Tứ Trụ** (`bazi_screen.dart`).
    - **Hồ Sơ Cung Đình 19 Trang PDF Preview** (`royal_dossier_screen.dart`).
  - Trang bị nút `VoicePlayIconButton` trực tiếp tại các card quan trọng:
    - Card Vận khí 2026 Bính Ngọ (`bazi_screen.dart`).
    - Card Khâm Thiên Giám Ngự Phê (`bazi_screen.dart`).
    - Header của từng trang sách trong 19 trang Hồ sơ Cung Đình (`royal_dossier_screen.dart`).
  - Nâng cấp `voice_synthesis_service.dart`: Chuyển khởi tạo `flutter_tts` sang dạng Lazy Initialization, bọc `catchError` an toàn khi dispose method channel để bảo đảm 100% headless tests và offline fallback không bao giờ crash app.

### 2. Vertical 2: Bách Khoa Tiền Tệ & In-App Purchase Consumable Packs
- **Mục tiêu**: Hoàn thiện dòng tiền StoreKit (iOS) / Google Play Billing (Android) cho gói XU, kết nối RevenueCat Webhook với NestJS Payment Service.
- **Thực thi**:
  - **NestJS API (`payment.service.ts`)**:
    - Mở rộng xử lý webhook RevenueCat cho tất cả các mã định danh sản phẩm consumable: `vios_xu_20`, `vios_xu_50`, `vios_xu_100`, `vios_xu_120`, `vios_xu_500`, `vios_xu_600`, `vios_xu_2000`.
    - Viết unit tests kiểm chứng cộng XU chính xác cho các gói lẻ và gói ưu đãi (4/4 tests pass).
  - **Mobile Wallet (`wallet_screen.dart`)**:
    - Render danh sách gói nạp In-App Store sang trọng: Gói Khởi Tâm (20 XU), Gói Nhập Môn (50 XU), Gói Cung Đình (120 XU), Gói Đại Thừa (600 XU).
    - Thêm fallback packages sang trọng hiển thị tức thì khi offline hoặc RevenueCat sandbox chưa sẵn sàng, chống hiện tượng spinner quay vô tận (Timeout 2s).
    - Khắc phục navigation pop an toàn bằng `Navigator.of(ctx).pop()`.

---

## II. BẰNG CHỨNG KIỂM CHỨNG CHẤT LƯỢNG (TEST EVIDENCE)

Tất cả các Quality Gates nghiêm ngặt nhất của Monorepo đều vượt qua 100%:

| Gate / Module | Lệnh Kiểm Tra | Kết Quả | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **Mobile Widget & Unit Tests** | `cd apps/mobile && flutter test` | **66/66 tests passed** (tăng từ 61 lên 66) | PASS (100%) |
| **Mobile Static Analysis** | `cd apps/mobile && flutter analyze` | **0 issues found** | PASS (100%) |
| **Contracts Build** | `pnpm -F @ziweiai/contracts build` | **Build completed cleanly** | PASS (100%) |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **0 errors** | PASS (100%) |
| **API Unit & Service Tests** | `pnpm -F @ziweiai/api test` | **77/77 files, 478/478 tests passed** | PASS (100%) |
| **Web Diagnostics** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** | PASS (100%) |

---

## III. DANH SÁCH TẬP TIN THAY ĐỔI (SURGICAL CHANGES)

### Backend API:
1. `apps/api/src/modules/payment/payment.service.ts`: Thêm regex & logic cộng XU linh hoạt cho `vios_xu_20`, `vios_xu_50`, `vios_xu_120`, `vios_xu_600`.
2. `apps/api/src/modules/payment/payment.service.test.ts`: Bổ sung test cases cho các gói XU consumable qua RevenueCat webhook.

### Mobile Application:
3. `apps/mobile/lib/core/services/voice_synthesis_service.dart`: Lazy init TTS engine, headless-safe method channel error suppression.
4. `apps/mobile/lib/features/bazi/presentation/bazi_screen.dart`: Dock `VoiceAudioPlayerBar` và nút `VoicePlayIconButton` cho Vận hạn & Ngự phê.
5. `apps/mobile/lib/features/dossier/presentation/royal_dossier_screen.dart`: Tích hợp Voice Bar và phát đọc từng trang trong 19 trang Hồ sơ Cung Đình.
6. `apps/mobile/lib/features/wallet/presentation/wallet_screen.dart`: Cung cấp UI In-App Store hoàng gia, fallback offline cards, timeout chống treo spinner.
7. `apps/mobile/test/features/voice/voice_widget_test.dart`: (Mới) Bộ test tự động cho `VoiceAudioPlayerBar` và `VoicePlayIconButton`.
8. `apps/mobile/test/features/wallet/wallet_iap_test.dart`: (Mới) Bộ test tự động cho In-App Store Packages và Fallback UI.

---

## IV. ĐỀ XUẤT ĐỊNH HƯỚNG SPRINT 47 (KICKOFF PROPOSALS)

Bước sang Sprint 47, hệ thống ViOS đã có đầy đủ:
- Bát Tự, Tử Vi, Kỳ Môn, Lục Hào, Mai Hoa, Tarot, Chỉ Tay, Nhân Tướng.
- Hồ sơ Vector PDF 19 trang Cung Đình siêu nét.
- Giọng đọc luận giải âm thanh tại chỗ.
- Hệ thống nạp XU qua QR SePay và StoreKit/Google Play IAP.

Để đưa ViOS lên đỉnh cao thương mại và trải nghiệm người dùng, kính trình Đại Ka 3 phương án cho **Sprint 47**:

### 🎯 Phương án A: "Khâm Thiên Giám Live Audio Streaming" (Edge AI Voice)
- Nâng cấp giọng đọc từ Web Speech / Mobile TTS mặc định sang ElevenLabs / OpenAI TTS HD streaming trực tiếp từ backend NestJS.
- Thêm hiệu ứng âm thanh cổ phong (nhạc thiền, tiếng chuông cổ tự, tiếng đàn tranh nhẹ nhàng làm nhạc nền).
- Cache audio binary trên Supabase Storage để tiết kiệm chi phí và tải tức thì.

### 🎯 Phương án B: "Đại Tiệc Cung Đình" — Referral Viral Loop & Social Share Cards trên Mobile
- Mang toàn bộ tính năng Referral Share Card đã có trên Web lên Flutter Mobile: Tạo card ảnh phong thủy tuyệt đẹp chứa mã giới thiệu kèm QR tải app để share lên Zalo, Messenger, Facebook Stories.
- Tích hợp Native Deep Linking (AppsFlyer hoặc Supabase Dynamic Links) để khi bạn bè quét QR/nhấp link sẽ tự động mở app và tặng ngay XU cho cả hai.

### 🎯 Phương án C: "Thần Số Học & Phong Thủy Sim Số/Biển Số Xe" (Mở rộng Huyền học ứng dụng cao)
- Thêm module Thần Số Học (Pythagoras & Chaldean) và Tra cứu Phong Thủy Số Điện Thoại / Biển Số Xe hợp mệnh theo Bát Tự.
- Tích hợp thẳng vào Hồ sơ 19 trang để tăng giá trị thương phẩm.

---
*Kính chúc Đại Ka một buổi tối an lành, rực rỡ và tràn đầy thành công!*
