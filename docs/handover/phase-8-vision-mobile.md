# Phase 8: Triển khai Native UI Vision AI trên Flutter

## 1. Mục tiêu (Goal)
Thay thế màn hình WebView hiện tại của tính năng Vision AI (Tarot, Xem Tướng, Chỉ Tay) bằng giải pháp **Native UI** trên Flutter. Điều này giúp cải thiện trải nghiệm người dùng (nhanh hơn, mượt hơn, tự nhiên hơn), khắc phục sự cố upload ảnh qua WebView và xử lý nén ảnh ngay trên thiết bị để vượt qua giới hạn 4MB của API backend.

## 2. Công việc đã thực hiện (Work Done)
1. **Thiết lập thư viện (Dependencies):**
   - Thêm `image_picker` để lấy ảnh từ camera/thư viện.
   - Thêm `image_cropper` để crop ảnh theo ý muốn.
   - Thêm `flutter_image_compress` nén ảnh xuống dưới chuẩn 4MB.
   - Thêm `flutter_markdown` để render kết quả narrative đẹp mắt.
2. **Kiến trúc dữ liệu (Data & Logic):**
   - Tạo `VisionRepository` tích hợp thư viện `Dio` giúp gọi POST `/vision/:kind` dưới dạng `MultipartFile`.
   - Cấu hình `VisionNotifier` bằng Riverpod 2.0 (NotifierProvider) để quản lý state (Loading/Data/Error).
3. **Giao diện & Điều hướng (UI & Navigation):**
   - Cập nhật `HomeScreen` thay đổi hành vi bấm nút tính năng: sử dụng `context.push` điều hướng tới native screen.
   - Tạo `VisionInputScreen` hỗ trợ người dùng upload ảnh, crop, và nhập câu hỏi tuỳ chọn. Tích hợp nút trừ XU có logic loading.
   - Tạo `VisionResultScreen` hiển thị trả lời Markdown và BoxShadow thẩm mỹ.
4. **Bảo trì & Fix lỗi cuối cùng:**
   - Hoàn thiện parse API Error từ `DioException` để thông báo lỗi (vd "Không đủ XU") trực quan tới người dùng.
   - Cập nhật tự động refresh số dư trong `walletBalanceProvider` sau khi trừ XU.
   - Sửa mọi lints (bao gồm `url_launcher` unused import và `withOpacity` deprecated).
5. **Cấu hình Repo (.gitignore):**
   - Bổ sung cấu hình `.gitignore` chặn an toàn thư mục rác AI, tệp tin dung lượng lớn (`.apk`, `.mp4`, `.ipa`) và tệp bảo mật (key, env).
   - Đảm bảo giữ lại bộ kĩ năng AI trong `.agents/skills` và `.agents/AGENTS.md`.

## 3. Kết quả (Result)
- Ứng dụng Mobile đã sẵn sàng chạy Native Vision AI hoàn chỉnh, trơn tru.
- `flutter analyze` báo 0 issues, code quality tốt.
- Tất cả thay đổi đã được commit vào dự án an toàn không lẫn tệp rác hay credentials.
- Test pre-check kỹ càng: Nén ảnh vượt qua giới hạn 4MB, bóc tách lỗi API hợp lệ, refresh wallet hoàn hảo.
