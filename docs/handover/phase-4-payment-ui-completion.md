# Handoff: Hoàn thiện Payment UI (Phase 4.1)

## 1. Mục tiêu đã hoàn thành
- Xây dựng giao diện trang `/pricing` với 3 mức nạp XU (10, 50, 100).
- Tích hợp tạo mã VietQR động dựa trên cấu hình Environment Variables (`PUBLIC_VIETQR_BANK_ID`, `PUBLIC_VIETQR_ACCOUNT_NO`, `PUBLIC_VIETQR_ACCOUNT_NAME`).
- Triển khai `WalletBalance.svelte` để hiển thị số dư XU thời gian thực trên Header (mobile) và Sidebar (desktop).
- Thiết lập Supabase Realtime thông qua `wallet-model.svelte.ts` để cập nhật số dư XU tức thì khi webhook backend được gọi (lắng nghe thay đổi trên bảng `profiles`).
- Chặn người dùng ẩn danh (Anonymous) nạp tiền: Yêu cầu đăng nhập trước khi hiển thị QR code, tránh rủi ro nạp tiền vào tài khoản tạm thời.

## 2. Chi tiết kỹ thuật & Khắc phục lỗi
- **Vercel Build Error (`MISSING_EXPORT`)**: Trong quá trình deploy, Vercel báo lỗi không tìm thấy các export `PUBLIC_VIETQR_*` do thiếu biến môi trường lúc build. Đã khắc phục bằng cách chuyển từ import tĩnh (`$env/static/public`) sang import động (`$env/dynamic/public`) trong `apps/web/src/lib/env.ts` và gắn giá trị dummy mặc định nếu thiếu.
- **Bảo mật Anonymous**: Trang `pricing/+page.svelte` đã kiểm tra `auth.isAnonymous` và trả về component `EmptyStateCard` nếu người dùng chưa đăng nhập.

## 3. Rủi ro tiềm ẩn (Đã mitigate)
- *Thanh toán nhầm tài khoản ẩn danh*: Đã chặn trực tiếp trên UI.
- *Web socket chết*: `wallet-model` dùng TanStack query kết hợp Supabase Realtime channel. Nếu channel ngắt kết nối, người dùng F5 vẫn fetch lại XU mới nhất qua RPC `get_profile_by_id`.

## 4. Công việc tiếp theo (Phase 4.2 - Observability)
Hệ thống hiện tại cần cơ chế theo dõi lỗi, hiệu năng, và chi phí AI. Do đó, mục tiêu của session tới là:
- **Sentry**: Tích hợp Sentry cho Frontend (SvelteKit) để log client errors và Web Vitals. Tích hợp Sentry cho Backend (NestJS) để bắt các lỗi 5xx.
- **Langfuse**: Gắn Langfuse vào Vercel AI SDK và quá trình gọi OpenAI/Gemini để phân tích token usage, prompt cost, và response latency.
- Cần tuân thủ quy trình `/grill-with-docs` để thiết kế kiến trúc Observability chuẩn.
