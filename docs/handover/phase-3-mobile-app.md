# Phase 3: Mobile App - Foundation & Initialization

## 1. Mục tiêu (Goals)
- Mở rộng Tử Vi Toàn Tập từ Web SaaS sang Mobile App (Android/iOS) bằng Flutter.
- Đạt **MVP 1 (Feature Parity với Web)**: Hỗ trợ người dùng nhập thông tin sinh, gọi API để tạo lá số, và hiển thị Tử Vi Board 12 Cung.
- Tái sử dụng tối đa Logic từ `@ziweiai/api` (Backend), đảm bảo tính đồng nhất dữ liệu thông qua REST API thay vì viết lại Logic ở Mobile.

## 2. Công việc đã thực hiện
- **Khởi tạo Framework:** Đã tạo project Flutter `apps/mobile` (Package: `com.ziweiai.mobile`).
- **Thư viện & Kiến trúc (Riverpod & Dio):**
  - Cài đặt `flutter_riverpod` để quản lý State (sử dụng `Notifier` thay vì `StateNotifier` cũ).
  - Cài đặt `dio` cho HTTP Client, tích hợp Interceptor để tự động đính kèm `Bearer token` của Supabase Auth.
  - Cài đặt `json_serializable` để generate Models (`BirthInput`, `CreateChartRequest`) map chuẩn xác 100% với DTO của Backend (`@ziweiai/contracts`).
- **Khởi tạo Cấu trúc dự án (Feature-first):**
  - `core`: Chứa `env` (biến môi trường), `api` (Dio client), `router` (go_router), và `theme` (Paper-calm design token).
  - `features`: Module hoá tính năng, hiện đã có `charts` và `home`.
- **Dựng Home Screen (Form):**
  - Form nhập Ngày, Tháng, Năm, Giờ sinh, Giới tính, Loại lịch.
  - Xử lý Action gọi lên `chartsRepository.createChart()` để test luồng mạng.

## 3. Kết quả hiện tại
- Ứng dụng đã Build thành công (`No issues found!`), khắc phục triệt để các lỗi dependency (Riverpod) và UI deprecation của Flutter 3.30+.
- Có thể kết nối và chạy thẳng lên máy thực tế (Samsung A53) thông qua ADB qua địa chỉ mạng nội bộ.
- Core Foundation hoàn toàn vững chắc để bơm UI Board 12 Cung và các Feature tiếp theo.

## 4. Những phần công việc còn lại (Chuẩn bị cho `/goal`)
1. **Hoàn thiện UI Board 12 Cung:** Vẽ lưới tử vi theo phong cách Paper-calm.
2. **Supabase Auth UI:** Xây dựng luồng Đăng ký/Đăng nhập.
3. **Màn chi tiết cung & Tích hợp AI:** Gọi endpoint giải đoán (Explanations) và hiển thị streaming text.
4. **Monetization (Ví XU):** Xây dựng Wallet UI trên Mobile (có thể tích hợp RevenueCat).
