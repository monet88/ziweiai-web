# HƯỚNG DẪN HOÀN THIỆN REVENUECAT IAP & ĐÓNG GÓI PHÁT HÀNH STORE

> **Dự án:** ViOS — Tử Vi Toàn Tập Mobile (Flutter)  
> **Phiên bản:** 1.0  
> **Áp dụng cho:** Android (Google Play Store) & iOS (Apple App Store)

---

## 1. Kiến Trúc In-App Purchase Với RevenueCat

Hệ thống đã có sẵn kiến trúc client hoàn chỉnh trong:
- `apps/mobile/lib/features/subscription/providers/subscription_provider.dart`
- `apps/mobile/lib/core/providers/paywall_provider.dart`
- `apps/mobile/lib/features/wallet/presentation/wallet_screen.dart`

### 1.1. Cấu Hình Sản Phẩm Trên Store

#### Google Play Console (Android):
1. Vào **Monetize > Products > Subscriptions**:
   - `tuvi_pro_monthly`: Gói Đăng Ký Tháng (VD: 99.000 VNĐ / tháng).
   - `tuvi_pro_yearly`: Gói Đăng Ký Năm (VD: 699.000 VNĐ / năm).
2. Vào **Monetize > Products > One-time products**:
   - `tuvi_pro_lifetime`: Gói Trọn Đời (VD: 1.499.000 VNĐ một lần).

#### App Store Connect (iOS):
1. Vào **App > Subscriptions > Subscription Group (Tử Vi Pro)**:
   - `com.ziweiai.monthly`: Monthly Auto-Renewable Subscription.
   - `com.ziweiai.yearly`: Annual Auto-Renewable Subscription.
2. Vào **In-App Purchases**:
   - `com.ziweiai.lifetime`: Non-Consumable Purchase.

### 1.2. Cấu Hình Trên RevenueCat Dashboard
1. **Entitlement Identifier:** `tử_vi_toàn_tập_pro`
2. **Offering (Default):**
   - Package `$rc_monthly` -> Trỏ vào `tuvi_pro_monthly` (Android) & `com.ziweiai.monthly` (iOS).
   - Package `$rc_annual` -> Trỏ vào `tuvi_pro_yearly` (Android) & `com.ziweiai.yearly` (iOS).
   - Package `$rc_lifetime` -> Trỏ vào `tuvi_pro_lifetime` (Android) & `com.ziweiai.lifetime` (iOS).
3. **API Keys:**
   - Cập nhật key thật của App Store (`appl_...`) và Play Store (`goog_...`) vào `.env` của mobile:
     ```env
     REVENUECAT_API_KEY_APP_STORE=appl_xxxxxxxxxxxxxxxxxxxx
     REVENUECAT_API_KEY_PLAY_STORE=goog_xxxxxxxxxxxxxxxxxxxx
     ```
4. **Webhook Server Đồng Bộ:**
   - Cấu hình Webhook URL: `https://tuvitoantap.online/api/webhooks/revenuecat`
   - Authorization Header: Bearer Token bí mật cấu hình trên server.
   - Sự kiện theo dõi: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`.

---

## 2. Danh Mục Kiểm Tra Đóng Gói Phát Hành Store (Release Checklist)

### 2.1. Cấu Hình Định Danh Ứng Dụng (Bundle ID / Package Name)
- **Android Package Name:** `com.ziweiai.ziweiai_mobile`
- **iOS Bundle Identifier:** `com.ziweiai.ziweiaiMobile`
- **Tên Ứng Dụng (Display Name):** `Tử Vi Toàn Tập`
- **Phiên bản hiện tại:** `1.0.0+1` (trong `pubspec.yaml`)

### 2.2. Android App Signing (Google Play)
1. Tạo Release Keystore:
   ```bash
   keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Tạo file `android/key.properties` (được bảo vệ trong `.gitignore`):
   ```properties
   storePassword=MAT_KHAU_KEYSTORE
   keyPassword=MAT_KHAU_KEY
   keyAlias=upload
   storeFile=upload-keystore.jks
   ```
3. Lệnh build Android App Bundle (AAB):
   ```bash
   cd apps/mobile
   flutter build appbundle --release
   ```
   File xuất xưởng: `build/app/outputs/bundle/release/app-release.aab`

### 2.3. iOS App Signing (App Store)
1. Trong Xcode / Apple Developer Portal:
   - Đăng ký Bundle ID: `com.ziweiai.ziweiaiMobile`.
   - Bật Capabilities: **In-App Purchase**, **Push Notifications**, **Sign in with Apple**.
2. Lệnh build iOS Archive / IPA:
   ```bash
   cd apps/mobile
   flutter build ipa --release
   ```

### 2.4. Yêu Cầu Tuân Thủ & Chính Sách Store (Compliance & Guidelines)
1. **Apple Guideline 5.1.1(v) — Account Deletion:**  
   Ứng dụng bắt buộc phải có tính năng xóa tài khoản trực tiếp trong app nếu hỗ trợ đăng ký.  
   *Trạng thái:* Đã hoàn thiện trong `apps/mobile/lib/features/auth/presentation/profile_screen.dart` (Gửi yêu cầu xóa tới Supabase Auth).
2. **Chính Sách Quyền Riêng Tư (Privacy Policy):**  
   URL: `https://tuvitoantap.online/privacy-policy` (Đã public trên Web MVP).
3. **Điều Khoản Dịch Vụ (Terms of Service / EULA):**  
   URL: `https://tuvitoantap.online/terms` (Áp dụng chuẩn Apple Standard EULA đối với Subscription).
4. **Google Play Data Safety Form:**  
   - Khai báo thu thập: Email, User ID (để quản lý tài khoản và ví XU).
   - Khai báo bên thứ ba: Google AdMob (Advertising), Firebase (Crashlytics/Messaging), RevenueCat (Thanh toán).
   - Mã hóa truyền tải: 100% qua HTTPS/TLS.

---

## 3. Lộ Trình Triển Khai Kiểm Thử Trước Khi Submit

1. **Tuần 1:** Kiểm thử nội bộ (Internal Testing Track):
   - Google Play: Mời 5-10 testers kiểm thử luồng mua gói License Sandbox.
   - TestFlight (Apple): Đưa bản build lên TestFlight và test giao dịch sandbox với Sandbox Apple ID.
2. **Tuần 2:** Đánh giá độ ổn định Crashlytics và đối soát doanh thu sandbox trên RevenueCat.
3. **Tuần 3:** Nộp duyệt chính thức (Submit for Review) lên App Store và Google Play Store.
