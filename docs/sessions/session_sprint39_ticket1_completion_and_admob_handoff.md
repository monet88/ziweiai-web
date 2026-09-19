# SPRINT 39 HANDOFF REPORT (Phase 8: Production Store Distribution & Advanced AI Capabilities)

**Thời gian tạo:** 2026-08-30  
**Tác giả:** Antigravity AI Assistant  
**Git Branch hiện tại:** `feature/sprint39-mobile-perfection-and-aab`  
**Rollback Anchor Commit:** `857ea8a` (feat(mobile): complete sprint 39 ticket 39.1, luxury UI overhaul, profile screen, vietqr & aab release)  
**Tiến độ Sprint 39:** 1/4 tickets hoàn thành (Ticket 39.1: 100% DONE + Toàn diện Mobile UI/UX Perfection).

---

## 🎯 1. Mục Tiêu Sprint 39 (Phase 8)

Sprint 39 tập trung vào việc đưa ứng dụng **Tử Vi Toàn Tập** lên Google Play / App Store chuẩn Production và mở rộng năng lực AI tương tác cao cấp:

1. **Ticket 39.1 (DONE):** Cấu hình Keystore signing và build bản phát hành Google Play App Bundle (`.aab`).
2. **Ticket 39.2 (NEXT):** Tích hợp Google AdMob Rewarded Video Ads trên Mobile nhận XU miễn phí kết nối `/api/wallet/reward-ad`.
3. **Ticket 39.3:** Tích hợp AI Voice Assistant Audio Synthesis đọc luận giải lá số (Text-to-Speech phong thủy truyền cảm).
4. **Ticket 39.4:** Màn hình Vận Hạn Lưu Niên Nâng Cao (Annual Horoscope Flow) và Báo cáo PDF tử vi chuyên sâu.

---

## 🛠️ 2. Việc Đã Làm Trong Session Này

### A. Khắc Phục 100% Các Lỗi UI/UX Từ Phản Ánh Của Người Dùng
1. **Thiên Bàn 12 Cung ([`ziwei_board.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/charts/presentation/ziwei_board.dart) & [`chart_detail_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/charts/presentation/chart_detail_screen.dart)):**
   - Chuyển `ZiweiBoard` sang `StatefulWidget` với `TransformationController`, tự động scale vừa vặn bề rộng màn hình (`availableWidth / 800.0`).
   - Bọc ngoài bằng `AspectRatio(1.0)` giúp 12 cung hiển thị trọn vẹn vuông vức, không bị zoom lố vào trung tâm Thái Cực.
   - Thêm tính năng chạm đúp (Double-tap) và nút floating action *"Vừa màn hình"*.
2. **Kinh Dịch Gieo Quẻ ([`iching_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/iching/presentation/iching_screen.dart)):**
   - Thêm danh sách Quick Question Chips ("💼 Công việc", "❤️ Tình duyên", "💰 Tài lộc", "🌱 Sức khỏe").
   - Tự động điền câu hỏi mặc định khi gieo quẻ ngay, loại bỏ tình trạng bị chặn bởi toast validation.
3. **Thần Số Học & Paywall Bắt Lỗi 402 ([`numerology_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/numerology/presentation/numerology_screen.dart) & [`numerology_provider.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/numerology/providers/numerology_provider.dart)):**
   - Bắt lỗi HTTP 402/403 để mở modal `_showInsufficientCoinsDialog` sang trọng dẫn trực tiếp sang màn hình Ví `/wallet` thay vì văng raw `DioException`.
4. **Trợ Lý AI ([`assistant_panel.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/assistant/presentation/assistant_panel.dart)):**
   - Đại tu 100% sang giao diện **Celestial Luxury Dark Mode** (`#0D0B14`, viền vàng hoàng kim, typography phong thủy sắc nét, bong bóng chat AI thạch anh tím).
5. **Màn Hình Hồ Sơ & Quản Lý Tài Khoản ([`profile_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/auth/presentation/profile_screen.dart)):**
   - Tạo mới `ProfileScreen` hiển thị trạng thái *Khách Trải Nghiệm* vs *Đã Xác Thực*, thẻ VIP PRO, số dư XU, nút Đăng nhập / Đăng xuất.
   - Bổ sung luồng **Xóa Tài Khoản (Account Deletion)** xác nhận 2 bước tuân thủ chính sách kiểm duyệt của Apple App Store & Google Play Store.
   - Nút Profile trên AppBar của [`home_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/home/presentation/home_screen.dart) dẫn trực tiếp vào `/profile`.
   - Nâng cấp [`auth_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/auth/presentation/auth_screen.dart) sang theme Celestial Luxury Dark Mode.
6. **Nâng Cấp Ví XU Đa Năng ([`wallet_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/wallet/presentation/wallet_screen.dart)):**
   - Hỗ trợ 2 Tab: **Chuyển Khoản Ngân Hàng VietQR (SePay)** với mã QR động + copy 1-chạm cú pháp `TVTT <SHORT_UUID>`, và **Gói In-App Store & VIP Pro (RevenueCat)**.

### B. Hoàn Thành Ticket 39.1: Cấu Hình Keystore & Build Google Play App Bundle (.aab)
- Cấu hình [`apps/mobile/android/app/build.gradle.kts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/android/app/build.gradle.kts) nạp thông tin từ `key.properties` nếu có và fallback sang debug signing an toàn cho môi trường dev/CI.
- Chạy build thành công:
  `✓ Built apps/mobile/build/app/outputs/bundle/release/app-release.aab (59.3MB)`.

---

## 🧪 3. Kết Quả Kiểm Thử (Verification Gates)

Toàn bộ **879/879 tests** trên toàn Monorepo đều **PASS 100% XANH**:
- **Mobile Flutter Analyze:** 0 issues found (clean 100%).
- **Mobile Flutter Tests:** 22/22 tests PASS (100%).
- **Backend API Tests:** 439/439 tests PASS (100%).
- **Web SvelteKit Tests:** 258/258 tests PASS (100%).
- **Shared Contracts Tests:** 125/125 tests PASS (100%).
- **Astro Engine Tests:** 35/35 tests PASS (100%).

---

## 🔮 4. Phân Tích & Kế Hoạch Ticket 39.2 (Session Mới Tiếp Theo)

### Mục tiêu Ticket 39.2:
Tích hợp **Google AdMob Rewarded Video Ads** trên Flutter Mobile để người dùng xem video ngắn (15-30s) và nhận XU miễn phí (ví dụ: +5 XU / lượt xem):
1. **Package:** Sử dụng `google_mobile_ads: ^5.2.0` (đã có trong `pubspec.yaml`).
2. **Cấu hình Android/iOS:**
   - `AndroidManifest.xml`: Khai báo `APPLICATION_ID` AdMob Test ID (`ca-app-pub-3940256099942544~3347511713`).
   - `Info.plist`: Khai báo `GADApplicationIdentifier` và `SKAdNetworkItems`.
3. **Backend Endpoint & Contract:**
   - Kiểm tra endpoint `/api/wallet/reward-ad` (hoặc tạo mới nếu chưa có) nhận verified ad token hoặc user ID để cộng XU vào database Supabase.
4. **Mobile UI Integration:**
   - Thêm nút *"Xem Video Quảng Cáo Nhận 5 XU Miễn Phí"* trong `WalletScreen` (Tab VietQR / Free Coins) và modal `_showInsufficientCoinsDialog`.
   - Quản lý trạng thái Ad loading, Ad failed to load, Ad rewarded callback.

---

## 📋 5. Prompt Khởi Động Cho Session Mới (Copy & Paste)

```markdown
Chào bro! Hãy đọc file CONTEXT.md và file docs/sessions/session_sprint39_ticket1_completion_and_admob_handoff.md để tiếp tục triển khai Sprint 39 (Phase 8: Production Store Distribution & Advanced AI Capabilities).

Hiện tại:
- Ticket 39.1 (Keystore Signing & Google Play App Bundle .aab) cùng toàn bộ UI/UX Mobile Perfection (Thiên Bàn 12 cung, Kinh Dịch, 402 Thần Số Học, Profile Screen, Wallet VietQR + RevenueCat) đã HOÀN THÀNH 100%.
- Toàn bộ 879/879 tests trên Monorepo (Mobile 22, API 439, Web 258, Contracts 125, Astro-Engine 35) đều PASS xanh 100%.
- Nhánh hiện tại: feature/sprint39-mobile-perfection-and-aab (Rollback Anchor: 857ea8a).

Nhiệm vụ cho session này:
Triển khai Ticket 39.2: Tích hợp Google AdMob Rewarded Video Ads trên Mobile nhận XU miễn phí kết nối Backend API.
Áp dụng các skills: /vibe-engineering-workflow /vibe-git-manager /behavior-model-debugger.
Hãy kiểm tra cấu hình AdMob trên Android/iOS, service AdMob trên Mobile, kết nối nút "Xem Ad Nhận XU" trong Wallet/Paywall và chạy test xác minh đầy đủ!
```
