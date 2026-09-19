# Handoff Report: Security Audit & Monetization

## 1. Ngữ cảnh (Context)
Dự án "Tử Vi Toàn Tập" vừa hoàn thành phase **Monetization (Tích hợp Thanh Toán & Nạp XU)**. Core product flow hiện tại:
- Lập lá số tử vi/xem tướng -> Gọi AI phân tích -> Bị chặn nếu thiếu XU -> Nạp XU qua ví (SePay QR trên Web hoặc RevenueCat trên Mobile) -> Tiếp tục gọi AI.

## 2. Mục tiêu của phiên làm việc tiếp theo
Thực hiện **Security Audit** toàn diện hệ thống Payment và các rủi ro bảo mật (chống hack số dư, bypass AI paywall, v.v.). Đặc biệt kiểm tra Supabase RLS và NestJS API guards.

## 3. Các File/Modules cần tập trung Audit
### Backend (NestJS - `apps/api`)
- **Trừ XU & Gọi AI**: `apps/api/src/modules/explanations/services/explanation-billing.service.ts` và `apps/api/src/modules/vision-shared/vision-analysis.service.ts` (Nơi kiểm tra và ném lỗi 402 `INSUFFICIENT_FUNDS`).
- **Database & RPC (Chống Race Condition)**: `apps/api/src/database/supabase-persistence.gateway.ts` (Các phương thức `deductXu`, `addXu` gọi thẳng vào RPC của Supabase).
- **Thanh toán & Cộng XU**: Bất cứ logic nào liên quan đến nạp tiền (nếu có hook từ SePay/RevenueCat trên server).

### Database (Supabase)
- Cần review lại các hàm RPC (Remote Procedure Call) để đảm bảo transaction ACID khi trừ XU.
- Row Level Security (RLS) của bảng `users` và `wallets` (hoặc nơi lưu trữ XU) xem user có thể tự sửa số dư qua API client không.

### Frontend (Web & Mobile - Bề mặt tấn công)
- `apps/web/src/lib/api-client/fetch-json.ts` (Nơi bắt lỗi 402).
- `apps/web/src/routes/(app)/wallet/+page.svelte` (Giao diện nạp XU).
- `apps/mobile/lib/features/wallet/` (Tích hợp `Purchases.getOfferings` của RevenueCat).
- `apps/mobile/lib/features/assistant/presentation/assistant_panel.dart` (Bắt lỗi 402 từ stream AI).

## 4. Hướng dẫn (Instructions for Next Agent)
1. Hãy bắt đầu bằng cách gọi skill `/security-audit` và đọc file này.
2. Kiểm tra sâu vào kiến trúc **Supabase RPC + RLS** để đảm bảo không ai có thể can thiệp số dư (hack double-spend, race-condition).
3. Đề xuất các cải tiến về Kiến trúc nếu phát hiện nợ kỹ thuật (Technical Debt) thông qua kỹ năng `/improve-codebase-architecture` hoặc `/backend-security-coder`.
4. (Optional) Nếu sếp yêu cầu thêm Admin Dashboard, hãy chuyển hướng sang dùng lệnh `/wayfinder`.
