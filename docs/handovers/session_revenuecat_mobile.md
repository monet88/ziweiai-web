# Handover: Tích hợp Hệ thống Thanh toán In-App Purchases (RevenueCat)

**Thời gian hoàn thành:** July 2026
**Mục tiêu:** Tích hợp giải pháp In-App Purchase bằng RevenueCat để mua XU trên Mobile App (Flutter), đồng bộ bảo mật lên Backend (NestJS) qua Webhook và Database (Supabase).

## 1. Pre-Check & Phân Tích Tổng Quan

Trước khi khép lại session, dưới đây là kết quả kiểm tra chất lượng (Pre-check) của tính năng:

### 1.1 Logic đúng chưa? (✅ Đã đạt)
- **Tầng Database**: Bảng `transactions` đã có ràng buộc `CHECK` đảm bảo mỗi giao dịch (SePay hoặc RevenueCat) không bao giờ bị dẫm chân lên nhau. Đã có RPC `add_xu` chạy trong môi trường ACID.
- **Tầng Backend**:
  - `PaymentController`: Bắt đúng webhook POST từ RevenueCat, xác thực bằng `REVENUECAT_WEBHOOK_SECRET` (tránh request giả mạo).
  - `PaymentService`: Đã triển khai tính năng **Idempotency** (Chống lặp request - nếu webhook gửi lại lần 2 do nghẽn mạng thì không bị cộng đúp XU). Mã Code tự động map `product_id` (ví dụ `package_100_xu` -> cộng 100 XU) rất an toàn, không phụ thuộc vào `price`.
- **Tầng Mobile**:
  - SDK đã config chạy đa nền tảng (App Store & Play Store).
  - Tự động map `session.user.id` của Supabase thành `app_user_id` của RevenueCat.
  - Tự động fetch gói (Offerings) từ Dashboard thay vì hardcode giá.

### 1.2 Workflow ổn chưa? (✅ Rất mượt)
1. User mở app -> Đăng nhập (ẩn danh hoặc email) -> Supabase cấp `user_id`.
2. Mobile App gọi `Purchases.logIn(user_id)`.
3. User vào Ví XU -> App fetch Offerings từ Apple/Google qua RevenueCat và hiển thị.
4. User nhấn Mua -> Xác thực FaceID/Vân tay -> Apple trừ tiền.
5. RevenueCat nhận tin báo thành công -> Bắn Webhook HTTP POST về server NestJS.
6. NestJS xác thực Webhook -> Dùng `user_id` để query và gọi RPC cộng XU trong Supabase.

### 1.3 Thiếu tính năng gì? (⚠️ Minor)
- Hiện tại là hệ thống "Consumable" (tiêu hao - XU). Theo chính sách của Apple, Consumables không bắt buộc có nút **"Restore Purchases"** (Khôi phục thanh toán). Tuy nhiên, đôi khi reviewer của Apple vẫn "bắt bẻ". Nếu bị reject, ta chỉ cần gắn thêm 1 nút nhỏ gọi `Purchases.restorePurchases()`.
- Chưa cấu hình Webhook URL ở môi trường Production.

### 1.4 Rủi ro tiềm ẩn?
- **Rủi ro rớt mạng lúc Webhook bắn:** RevenueCat có cơ chế tự động retry liên tục trong vài ngày nếu server của bạn down. Ta đã cài đặt cơ chế *Idempotency*, nên bạn không lo XU bị cộng 2 lần.
- **Rủi ro người dùng Anonymous:** Nếu người dùng đang dùng Anonymous account, mua XU, sau đó họ quyết định Link với Email. May mắn thay, kiến trúc Auth của Supabase giữ nguyên `user_id` khi Linking, nên XU sẽ không bao giờ bị mất!

---

## 2. Các việc bạn (User) cần làm trước khi Deploy (Manual Setup)

1. **Dashboard RevenueCat (https://app.revenuecat.com):**
   - Tạo Project cho 2 nền tảng iOS và Android.
   - Lấy 2 chuỗi API Key dán vào `.env` của Mobile (`REVENUECAT_API_KEY_APP_STORE`, `REVENUECAT_API_KEY_PLAY_STORE`).
   - Tạo các Products & Offerings. Đặt ID của Product bắt buộc chứa số XU (VD: `xu_package_100`, `xu_package_500`...) vì backend regex theo số này để cộng XU.
   - Thêm Webhook URL (VD: `https://api.tuvitoantap.com/webhooks/revenuecat`).
   
2. **Dashboard Backend (.env.local / Vercel Env):**
   - Tạo một mật khẩu ngẫu nhiên cho Webhook. Đặt biến `REVENUECAT_WEBHOOK_SECRET=chuoi_bi_mat_cua_ban`.
   - Lấy chuỗi này dán vào ô Authorization của Webhook trên RevenueCat theo định dạng: `Bearer chuoi_bi_mat_cua_ban`.

---

## 3. Lệnh để bắt đầu Session Mới

Dưới đây là Prompt Handoff bạn có thể copy/paste vào khung chat mới để Agent tiếp tục dự án:

```text
Tiếp tục dự án Tử Vi Toàn Tập (Mobile App Flutter). 
Ở session trước, chúng ta đã hoàn thành việc code toàn bộ kiến trúc thanh toán In-App Purchases qua RevenueCat (Bạn có thể đọc file docs/handovers/session_revenuecat_mobile.md để nắm context).

Mục tiêu session mới:
1. ... (Bạn có thể tự điền việc muốn làm, ví dụ: "Tích hợp tính năng Notification")
2. ... (Ví dụ: "Tối ưu hoá hiệu năng cho màn hình Chart")
Hãy đọc qua docs rồi /ask-matt để gợi ý bước đi tiếp theo.
```
