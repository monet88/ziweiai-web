# Session Handover: Cloudflare Default, US-016 Annual Report, Admin Protection & Settings UI Polish

**Ngày thực hiện**: 2026-07-24  
**Project**: ZiweiAI / Tử Vi Toàn Tập  
**Branch hiện tại**: `main` (commit `9788736`)  

---

## 1. Tóm Tắt Mục Tiêu & Công Việc Đã Hoàn Thành

1. **Chuyển Cloudflare Pages Làm Mặc Định**:
   - URL mặc định chính thức: [https://tuvitoantap.pages.dev](https://tuvitoantap.pages.dev)
   - Cấu hình file `apps/web/static/_redirects` cho SPA routing (`/* /index.html 200`).
   - Sửa độ tương phản Dark Theme (bộ biến `[data-theme="dark"]` đầy đủ trong `tokens.css`).

2. **Chẩn Đoán & Khắc Phục Lỗi Google OAuth**:
   - Sửa lỗi redirect về `http://localhost:3000` bằng cách whitelist domain `https://tuvitoantap.pages.dev/*` trong Supabase Auth Redirect URLs.

3. **Phân Quyền & Bảo Vệ Đường Dẫn Admin (`/admin/*`)**:
   - Thêm Admin Layout Guard (`apps/web/src/routes/(app)/admin/+layout.ts`) ngắt ngay các phiên ẩn danh (Anonymous) hoặc chưa đăng nhập, redirect 303 về `/sign-in`.
   - Cập nhật 5 load handlers ở các trang con admin để redirect 303 về Trang chủ (`/`) khi nhận `401 Unauthorized` hoặc `403 Forbidden`.

4. **Phát Triển Tính Năng Báo Cáo Vận Hạn Năm (US-016)**:
   - Port engine vận ngày/tháng server-side (0 token AI, thuần tiếng Việt).
   - Báo cáo năm LLM Markdown tiếng Việt (gate kép entitlement + quota 2 lượt/ngày/user + cache DB `annual_reports`).
   - Tích hợp 4 components: `DailyFortuneCard.svelte`, `MonthlyFortuneCard.svelte`, `AnnualReportButton.svelte`, `AnnualReportModal.svelte`.

5. **Thiết Kế Lại Giao Diện Cài Đặt (`/settings`)**:
   - Thiết kế lại theo hệ thống Token `tokens.css`, hỗ trợ mượt mà Light/Dark Mode.
   - Thẻ thông tin danh tính (Email / Anonymous status badge), thẻ Affiliate Referral (tự động sinh link động `https://tuvitoantap.pages.dev/?ref=xxx`), và thẻ Khu vực nguy hiểm (Modal xác nhận xoá tài khoản).

6. **Bảo Mật `.gitignore` & Sửa Lỗi Email Spam**:
   - Chặn tuyệt đối `.env`, `.env.*`, keys, credentials, service role keys, và file dung lượng lớn (`*.apk`, `*.aab`, `*.mp4`...).
   - Giữ lại các kỹ năng AI Agent trong `.agents/skills/`, `.agents/workflows/`, `.agents/AGENTS.md`.
   - Đã đồng bộ Git Config local về `user.name="galaxypro710-stack"` và `user.email="galaxypro710@gmail.com"`, khắc phục triệt để rò rỉ mail lỗi từ GitHub Actions & Vercel.

---

## 2. Kết Quả Kiểm Thử & Deploy (Validation & Deployment)

- **Typecheck**: `pnpm typecheck` → 10/10 packages successful (0 errors).
- **Web Unit Tests**: `pnpm -F @ziweiai/web test` → 43/43 test files passed (251 tests).
- **API Unit Tests**: `pnpm -F @ziweiai/api test` → 70/70 test files passed (430 tests).
- **Svelte Check**: `svelte-check` → 0 errors, 0 warnings.
- **Deploy Live Cloudflare Pages**: [https://tuvitoantap.pages.dev](https://tuvitoantap.pages.dev) (Release hash `55269632`).
- **Deploy Live Vercel Backend**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app) (Status: ● Ready).

---

## 3. Lập Kế Hoạch Cho Session Tiếp Theo: Tích Hợp Nạp XU SePay Trực Tiếp Tại `/wallet`

Trong session tiếp theo, chúng ta sẽ phát triển hệ thống **Thanh toán & Nạp XU tự động qua SePay (VietQR / Webhook)** tại trang Ví XU (`/wallet`):

### Kiến Trúc Cần Phát Triển:
1. **Frontend Ví XU (`apps/web/src/lib/features/payment/`)**:
   - Giao diện chọn gói nạp XU (ví dụ: 50 XU / 50.000đ, 120 XU / 100.000đ...).
   - Hiển thị VietQR Code động tích hợp mã chuyển khoản duy nhất (ví dụ: `TUVIXU <USER_ID_8_CHAR>`).
   - Cơ chế Real-time polling / WebSocket lắng nghe kết quả nạp XU để tự động cập nhật số dư ví tức thì mà không cần F5.

2. **Backend Webhook Handler (`apps/api/src/modules/payments/`)**:
   - Endpoint `POST /api/payments/sepay/webhook` nhận thông báo từ SePay.
   - Xác thực Webhook API Key / Secret để chống giả mạo request.
   - Tự động cộng XU vào tài khoản người dùng (`profiles.xu_balance`), ghi nhật ký giao dịch (`transactions` table), và bắn sự kiện WebSocket/SSE báo thành công.

---

## 4. Prompt Mẫu Mở Session Mới Dành Cho Người Dùng

> "Chào bạn, tiếp tục dự án Tử Vi Toàn Tập tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`. 
> Đã hoàn tất Báo cáo Vận hạn Năm (US-016), bảo vệ trang Admin, thiết kế lại trang Settings, và deploy bản mới nhất lên Cloudflare Pages (`https://tuvitoantap.pages.dev`). 
> Đọc tài liệu handover `docs/handover/session-2026-07-24-full-features-handoff.md` và `AGENTS.md`. 
> Dùng `/ask-matt` lập kế hoạch và triển khai tích hợp thanh toán SePay VietQR tự động nạp XU tại trang Ví (`/wallet`)."
