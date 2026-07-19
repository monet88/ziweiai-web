# Handover: Fix Lỗi Production & Phân Tích Payment UI (Phase 4)

## 1. Mục Tiêu (Goal)
- **Fix lỗi Production trên Vercel Demo:** Giải quyết tình trạng API trả về lỗi `402 (Payment Required)` và `504 (Gateway Timeout)` khi người dùng trải nghiệm tính năng tạo Báo cáo năm và Hỏi đáp AI.
- **Phân tích bức tranh Payment:** Đánh giá mức độ hoàn thiện của hệ thống Billing hiện tại để chuẩn bị cho quá trình xây dựng giao diện nạp XU (Payment UI) sắp tới.

## 2. Công Việc Đã Thực Hiện (Work Done)
- **Khắc phục lỗi 402 (Payment Required):**
  - **Vấn đề:** Các Service (`ExplanationBillingService`, `AnnualReportService`, `ConversationsService`) gọi hàm trừ XU dù ở môi trường Demo (người dùng không có XU sẽ bị chặn 402).
  - **Giải pháp:** Cập nhật logic trong các file Service. Bổ sung việc kiểm tra biến môi trường `apiEnv.AI_EXPLANATION_FREE_FOR_ALL`. Nếu bật cờ này, hệ thống sẽ tự động bypass toàn bộ cơ chế trừ XU.
- **Khắc phục lỗi 504 (Gateway Timeout):**
  - **Vấn đề:** Giới hạn thời gian mặc định của Vercel Serverless Function quá ngắn (10s), dẫn đến timeout khi gọi AI LLM.
  - **Giải pháp:** Chỉnh sửa file cấu hình `vercel.json` ở root. Bổ sung `"maxDuration": 60` cho API block.
- **Triển khai (Deploy):** Đẩy mã nguồn đã sửa đổi lên Vercel (`build-lecg5sb0s-galaxypro710-7060s-projects.vercel.app`) qua Vercel CLI.
- **Phân tích Hệ thống Payment (Theo mô hình Ask-Matt):**
  - **Backend (API):** Hoàn thiện 90%. Đã có `PaymentController` (nhận Webhook từ SePay), `PaymentService` (quy đổi 1.000đ = 1 XU và cập nhật Database qua hàm RPC `add_xu`).
  - **Frontend (Web):** Thiếu UI. Route `/pricing` đang là trang Placeholder.

## 3. Kết Quả (Result)
- Trạng thái hệ thống: Ổn định trên Vercel Demo, không còn dính các lỗi 402, 504.
- Codebase đã được chuẩn bị sẵn sàng cho bước đi tiếp theo: Xây dựng Giao diện Thanh toán (Payment UI).

## 4. Kế Hoạch Cho Session Tiếp Theo (Next Steps)
- Tạm dừng Phase 4 (Sentry/Langfuse) để dồn lực xử lý **Payment UI** (Hiển thị số dư XU, Bảng giá nạp XU, Tích hợp quét mã VietQR/SePay, Supabase Real-time update số dư).
- Tham chiếu: `/implement Payment UI`.
