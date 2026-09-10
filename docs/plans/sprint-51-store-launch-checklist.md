# SPRINT 51: STORE LAUNCH CHECKLIST & HƯỚNG DẪN PHÁT HÀNH TOÀN CẦU
## (GOOGLE PLAY STORE & APPLE APP STORE)

- **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Phiên bản phát hành:** `1.0.0+1` (Version 1.0.0, Build Code 1)
- **Ngày lập:** 10/09/2026
- **Trạng thái:** Sẵn sàng đưa lên Google Play Console & Apple App Store Connect

---

## 1. TỔNG QUAN FILE ĐÓNG GÓI XUẤT XƯỞNG (RELEASE ARTIFACTS)

| Nền tảng | Định dạng | Đường dẫn file sau build | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Android (Google Play)** | `.aab` (Android App Bundle) | `apps/mobile/build/app/outputs/bundle/release/app-release.aab` | Upload lên Google Play Console (Internal/Closed/Production Track) |
| **Android (Direct Install)** | `.apk` (Release APK) | `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` | Cài đặt trực tiếp, phát hành Website/APK sideloading |
| **iOS (App Store)** | `.ipa` (iOS Archive) | `apps/mobile/build/ios/archive/Runner.xcarchive` | Upload qua Xcode / Transporter lên TestFlight & App Store Review |

---

## 2. GOOGLE PLAY STORE CHECKLIST (CH PLAY)

### ✦ Bước 1: Ký số ứng dụng (Signing Keystore)
- Nếu dùng Keystore riêng của Hoàng Triều:
  1. Tạo Keystore (nếu chưa có):
     ```bash
     keytool -genkey -v -keystore ~/hoangtrieu-upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
     ```
  2. Tạo file `apps/mobile/android/key.properties` từ mẫu `apps/mobile/android/key.properties.example`.
  3. Điền mật khẩu và đường dẫn tuyệt đối đến file `.jks`.
- *Lưu ý an toàn:* File `key.properties` và `*.jks` đã được `.gitignore` bảo vệ 100%, không lo rò rỉ.

### ✦ Bước 2: Biên dịch Android App Bundle (.aab)
```bash
cd apps/mobile
flutter build appbundle --release
```

### ✦ Bước 3: Thông tin niêm yết trên Google Play Console
1. **Tên ứng dụng:** Tử Vi Toàn Tập • Chiêm Tinh & Vận Khóa
2. **Mô tả ngắn (80 ký tự):** Khám phá bí ẩn vận mệnh, tử vi đẩu số hoàng triều và nhận Khí Vận Nhật Khóa.
3. **Mô tả chi tiết:**
   - Lập lá số Tử Vi chuẩn Khâm Thiên Giám 12 Cung Vị, sao đôi, tứ hóa.
   - Bói Kinh Dịch (Lục Hào 3 đồng xu), Bát Tự Hà Lạc, Chiêm quẻ Quan Thánh Đế Quân.
   - Luận giải vận trình kết hợp Trí Tuệ Nhân Tạo (AI) chuyên sâu.
   - Khí Vận Nhật Khóa 07:00 sáng và điểm danh nhận thưởng XU hàng ngày.
4. **Phân loại ứng dụng:** Phong cách sống (Lifestyle) / Sách & Tra cứu.
5. **URL Chính Sách Bảo Mật (Bắt buộc):**
   👉 `https://tuvitoantap.vercel.app/privacy-policy`

---

## 3. APPLE APP STORE CHECKLIST (IOS)

### ✦ Bước 1: Kiểm tra cấu hình Info.plist
- Đã cấu hình tên thương hiệu: `CFBundleDisplayName` = **Tử Vi Toàn Tập**.
- Đã khai báo đầy đủ Usage Descriptions:
  - `NSCameraUsageDescription`: "Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh diện mạo và chỉ tay phục vụ tính năng chiêm đoán nhân tướng hoàng triều."
  - `NSPhotoLibraryUsageDescription`: "Ứng dụng cần quyền truy cập thư viện ảnh để tải lên hình ảnh diện mạo và lưu trữ tài liệu lá số tử vi hoàng triều."

### ✦ Bước 2: Cấu hình In-App Purchases & RevenueCat trên App Store Connect
1. **Sản phẩm Đăng ký Tự động (Subscriptions):**
   - `ziweiai_monthly`: Gói Hoàng Triều Tháng (VIP)
   - `ziweiai_yearly`: Gói Hoàng Triều Năm (VIP Ưu Đãi)
   - `ziweiai_lifetime`: Gói Hoàng Triều Vĩnh Viễn
2. **Sản phẩm Tiêu hao (Consumable IAP):**
   - Các gói nạp XU chiêm bái (`xu_pack_10`, `xu_pack_50`, `xu_pack_100`).
3. Khai báo App-Specific Shared Secret vào biến `REVENUECAT_API_KEY_APP_STORE`.

### ✦ Bước 3: Đóng gói và Upload iOS Build
```bash
cd apps/mobile
flutter build ipa --release
```
Dùng **Apple Transporter** hoặc **Xcode Organizer** để phân phối lên TestFlight trước khi submit Production.

---

## 4. FIREBASE CLOUD MESSAGING (FCM) PRODUCTION SETUP

1. Truy cập Firebase Console (`https://console.firebase.google.com/`).
2. Tải file `google-services.json` đặt vào `apps/mobile/android/app/google-services.json`.
3. Tải file `GoogleService-Info.plist` đặt vào `apps/mobile/ios/Runner/GoogleService-Info.plist`.
4. Tạo Firebase Service Account JSON (dạng chuỗi rút gọn) và cấu hình vào biến môi trường:
   - Trên Vercel Production: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Biến bảo mật Cron: `CRON_SECRET`
5. Lịch phát sóng tự động: Vercel Cron sẽ gửi request `GET /api/notifications/cron/daily-morning` mỗi ngày lúc 00:00 UTC (07:00 AM giờ Việt Nam).

---

## 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ TRÊN SAMSUNG GALAXY A53

- **Thiết bị:** Samsung Galaxy A53 5G (SM_A536E)
- **Kết nối:** ADB không dây `192.168.1.17:35347`
- **Tiến trình:** PID `23755` (`com.ziweiai.ziweiai_mobile`)
- **Push Notification Banner:** Đã kích hoạt và render thành công thông điệp:  
  *Tiêu đề:* `Hoàng Triều Chiêm Tinh • Khí Vận Nhật Khóa`  
  *Nội dung:* `Khí vận hôm nay đã giáng hạ. Kính mời Đại Ka điểm danh nhận XU, chiêm bái lá số và nghênh đón cát lành!`  
  *Ảnh chụp màn hình:* Lưu tại file artifact `samsung_a53_push_test.png`.
