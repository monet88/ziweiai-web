# Kế Hoạch Triển Khai: SePay Realtime Notification, Admin Manual Reconciliation & AI Progress Bar

**Ngày lập:** 2026-07-24  
**Quyết định:** Đã được người dùng phê duyệt đồng ý triển khai  
**Mục tiêu:** Nâng cao trải nghiệm người dùng khi nạp XU (phản hồi tức thì), cung cấp công cụ vận hành cho Admin khi user gõ sai cú pháp chuyển khoản, và tối ưu cảm nhận thời gian chờ khi AI sinh luận giải lá số.

---

## 🛠️ Hạng Mục 1: Thông Báo Realtime & Toast khi Nạp XU Thành Công

### 1.1 Mục tiêu
- Khi người dùng nạp tiền qua VietQR / SePay, ngay khi webhook SePay xử lý thành công ở backend, màn hình người dùng lập tức hiển thị thông báo Toast Banner nổi:
  > *"🎉 Nạp XU thành công! +20 XU đã được cộng vào tài khoản."*
- Số dư XU trên Header / Wallet tự động nhảy số mà không cần reload trang hay bấm kiểm tra thủ công.

### 1.2 Phân tích Kỹ thuật
- **Frontend Layer (`apps/web`)**:
  - Dùng Supabase Realtime Client (`supabase.channel('public:wallets')`) lắng nghe sự thay đổi (`UPDATE`) trên dòng dữ liệu ví của `user_id` hiện tại.
  - Khi phát hiện `balance` tăng, gọi Toast Notification Service để hiển thị banner chúc mừng & phát hiệu ứng nhảy số dư XU.
- **Backend Layer (`apps/api`)**:
  - `PaymentService` giữ nguyên logic ghi log `transactions` và gọi RPC `add_xu(user_id, amount)`. Do Postgres trigger / Supabase realtime đã tự động phát sự kiện `UPDATE` trên bảng `wallets`, backend không cần sửa đổi lớn.

---

## 🛠️ Hạng Mục 2: Trang Admin Tra Cứu Chuyển Khoản Sai Cú Pháp (Manual Reconciliation)

### 2.1 Mục tiêu
- Khi người dùng chuyển khoản nhưng quên hoặc gõ sai nội dung `TVTT <8-char-uuid>` (ví dụ gõ nhầm `TTVT 123` hay tên cá nhân), webhook vẫn ghi nhận giao dịch nhưng `user_id` sẽ bị `null` (unmatched).
- Xây dựng trang quản trị `/admin/transactions` giúp Admin:
  1. Tra cứu nhanh các giao dịch bị trôi (`user_id IS NULL`).
  2. Gán thủ công giao dịch cho Email/User ID của người dùng khi nhận phản ánh.
  3. Hệ thống tự động gọi RPC `add_xu` cộng XU cho user và đánh dấu giao dịch đã được xử lý (reconciled).

### 2.2 Phân tích Kỹ thuật
- **Contracts (`packages/contracts`)**:
  - Định nghĩa `reconcileTransactionSchema`: `{ transactionId: string, targetUserIdOrEmail: string, note?: string }`.
- **API (`apps/api`)**:
  - Bổ sung `AdminModule` với `AdminGuard` (xác thực email thuộc `ADMIN_EMAILS`).
  - Endpoint `GET /api/admin/unmatched-transactions`: Lấy danh sách giao dịch chưa gán.
  - Endpoint `POST /api/admin/reconcile-transaction`: Gán `user_id` và kích hoạt RPC `add_xu`.
- **Web UI (`apps/web`)**:
  - Route `/admin/transactions` dành riêng cho Admin với bảng dữ liệu, ô tìm kiếm và modal "Cộng XU thủ công".

---

## 🛠️ Hạng Mục 3: Progress Bar Từng Bước Cho AI Explanation (AI Progress UX)

### 3.1 Mục tiêu
- Khi người dùng bấm "Xem luận giải AI" cho lá số Tử Vi / Lục Hào, thời gian chờ sinh văn bản từ LLM là 15s - 30s.
- Thay thế spinner tròn tĩnh bằng **AI Step-by-Step Progress Bar** có chuyển động mượt mà và thông điệp động theo thời gian:
  1. **0s - 3s (25%)**: `🔮 Đang an sao & nạp dữ liệu lá số...`
  2. **3s - 10s (55%)**: `☯️ Đang phân tích cát hung & tương quan ngũ hành...`
  3. **10s - 22s (85%)**: `📜 AI đang lập bài luận chi tiết & tổng hợp lời khuyên...`
  4. **>22s (95%)**: `✨ Sắp hoàn tất, đang tinh chỉnh kết quả...`
  5. **Khi API hoàn tất (100%)**: Smooth fade-out và hiển thị bài luận.

### 3.2 Phân tích Kỹ thuật
- **Component (`apps/web/src/lib/components/AIExplanationLoader.svelte`)**:
  - Thiết kế UI glassmorphism kết hợp thanh progress mượt (CSS transition `width 0.5s ease`).
  - Sử dụng `setInterval` tự động điều khiển phần trăm & thông điệp stage nếu request kéo dài.
- **Tích hợp (`apps/web/src/routes/charts/[id]/+page.svelte`)**:
  - Gắn component loader vào khu vực hiển thị kết quả khi `isLoadingExplanation = true`.

---

## 📋 Kế Hoạch Triển Khai (Execution Slices)

| Slice | Công việc | Verification Criteria |
|---|---|---|
| **Slice 1** | **AI Progress Bar Component** | UI hiển thị progress 4 giai đoạn sinh động khi bấm luận giải AI, tự động chuyển 100% khi nhận response. |
| **Slice 2** | **Supabase Realtime Toast XU** | Bắn mock webhook làm biến động wallet -> UI tự động nảy Toast thông báo "+XU" realtime. |
| **Slice 3** | **Admin Manual Reconciliation** | Route `/admin/transactions` cho phép Admin tìm giao dịch chưa gán và bấm cộng XU thủ công thành công. |
