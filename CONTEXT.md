# Bối cảnh dự án (Context) - Tử Vi Toàn Tập

Tài liệu này tổng hợp các tính năng cốt lõi ĐÃ HOÀN THÀNH để cung cấp ngữ cảnh (context) cho AI Agent trong các session làm việc, giúp AI nhận biết được trạng thái hiện tại của codebase.

> **LƯU Ý BẢO MẬT QUAN TRỌNG:** Toàn bộ các biến môi trường (environment variables) dùng cho GitHub, Vercel, Supabase, AI Providers v.v... bắt buộc phải đặt tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web/.env.local`. File này tuyệt đối KHÔNG được push lên git để đảm bảo an toàn.

## 🚀 Các tính năng đã hoàn thiện (Cập nhật: 29/07/2026)

1. **Luồng sản phẩm cốt lõi (Core Flow)**
   - Khởi tạo lá số Tử Vi, gieo quẻ.
   - Xem chi tiết lá số/quẻ (Sử dụng dữ liệu snapshot đáng tin cậy).
   - Hỏi đáp AI & tạo Báo cáo năm (Annual Report).
   - Xác thực: Hoạt động trơn tru qua cả Anonymous Supabase Session và Email/Password Authentication.

2. **AI Provider Router**
   - Đã khắc phục triệt để lỗi 504 Gateway Timeout trên Vercel.
   - Cơ chế Provider Router ưu tiên dùng `gemini` (Gemini 1.5 Flash), sau đó mới tới `openai-compat` và `deepseek`.
   - Toàn bộ 439 test cases liên quan đến Provider Router đều PASSED.

3. **Hệ thống Thanh toán & Ví (Payment & Wallet)**
   - **SePay (VietQR)**: Hoàn tất tích hợp thanh toán chuyển khoản ngân hàng tự động.
   - **RevenueCat**: Hoàn tất tích hợp In-App Purchase cho nền tảng Mobile.
   - **Ví (Wallet UI)**: Frontend `/wallet` đã hiển thị QR SePay, kết nối với Supabase Realtime để tự động cập nhật số dư XU.
   - Webhook & Backend (`PaymentController`): Đã xử lý webhook hoàn chỉnh và cập nhật trực tiếp vào cơ sở dữ liệu.
   - **Lịch sử Ví (Wallet History)**: Hoàn tất giao diện Premium (Pull-to-refresh, Skeleton, Empty State) trên nhánh `feat/wallet-history`. Đã Merge vào main.

4. **Admin Panel**
   - Trang quản trị tại endpoint `/admin` đã hoàn thiện bằng SvelteKit.
   - Đã áp dụng các biện pháp bảo mật (service_role bypass) để quản lý an toàn.

5. **Hạ tầng & Deployment (Unified Deployment)**
   - Đã loại bỏ Cloudflare Pages (`pages.dev`), quy toàn bộ dự án (Frontend SvelteKit và Backend NestJS/Webhooks) về chạy chung thống nhất trên **Vercel (`tuvitoantap.vercel.app`)**.
   - Đã đồng bộ 100% các Referral Links, CORS Origins sang `vercel.app` và test thành công toàn bộ hệ thống.

6. **SEO & Chia sẻ (Social Sharing)**
   - **Tạo OG Image động cho Link Giới thiệu (Referral SEO)**: Đã hoàn thiện tính năng tạo ảnh cover động hiển thị Mã Giới Thiệu cá nhân hóa khi người dùng chia sẻ lên Zalo/Facebook/Telegram, sử dụng `satori` và `resvg-js`.

7. **Tối ưu tỷ lệ chuyển đổi (Monetization)**
   - **Banner Cảnh báo Số dư Thấp**: Đã tích hợp `WalletModel` vào màn hình Lịch sử (Dashboard). Tự động hiển thị banner cảnh báo và điều hướng nạp XU khi số dư dưới 15 XU.
   - **Báo Cáo Vận Hạn Năm**: Đã kiểm tra sẵn sàng phát hành công chúng (thông qua flag `AI_ANNUAL_REPORT_ENABLED`).

4. **Tính năng Đọc bài Tarot (1-Card Draw)**
   - **Phạm vi (Scope):** Trải 1 lá bài (V1) trên ứng dụng Mobile.
   - **Thu phí (Monetization):** Trừ 2 XU/lần rút (tích hợp chặt chẽ với Wallet History và hệ thống báo lỗi 402/403).
   - **Prompt Engineering:** Sử dụng dữ liệu mỏ neo (Grounding) với bộ từ khóa tĩnh cho 78 lá bài để ổn định chất lượng phản hồi từ Gemini LLM.

## ⏳ Đang triển khai (In Progress)
- Hiện tại nhánh `feat/tarot-reading` đã hoàn thành, chuẩn bị merge hoặc chuyển qua tính năng mới.

## ⏳ Các tính năng CHƯA LÀM (Pending Tasks)
- Tiếp tục phát triển các tính năng chia sẻ, SEO mở rộng hoặc các công cụ phân tích khác (nếu cần).
