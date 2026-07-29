# Báo Cáo Rà Soát Thương Hiệu ViOS & Redesign Trang Ví XU (/wallet)

> **Ngày thực hiện:** 25/07/2026  
> **Dự án:** Tử Vi Toàn Tập (ViOS)  
> **Tác giả:** Antigravity AI Pair Programmer  

---

## 1. Mục Tiêu (Goals)

1. **Rà soát Thương hiệu ViOS**:
   - Loại bỏ hoàn toàn tên thương hiệu cũ `ziweiai` trên giao diện header topbar trang chủ.
   - Đồng bộ hiển thị logo và biểu tượng chính thức **ViOS** (`ViOSLogo`) trên toàn bộ ứng dụng.

2. **Rà soát & Hoàn thiện Tính năng Ví XU (`/wallet`)**:
   - Khắc phục các thiếu sót về trải nghiệm người dùng, bảng quy đổi giá trị XU, và hướng dẫn tính năng.
   - Thêm widget điểm danh hàng ngày (+5 XU) với trạng thái nhận thưởng trực quan.
   - Thêm bảng tra cứu chi phí sử dụng XU cho từng hệ thuật số (Luận giải AI, Xem Tướng, Quẻ Dịch, Tarot...).
   - Bổ sung nút chia sẻ 1-click mã giới thiệu qua **Zalo, Facebook, Telegram** và Sao chép Link.
   - Cảnh báo bảo mật và bảo vệ số dư cho tài khoản vãng lai (Anonymous).

3. **Redesign Trang `/wallet` Tinh Gọn & Chuyên Nghiệp**:
   - Xây dựng giao diện 2 cột glassmorphism hiện đại với ambient glow sắc vàng kim.
   - Thẻ Khung Thanh Toán VietQR SePay sticky tự động cập nhật mã QR và thông tin chuyển khoản theo gói được chọn.
   - Nút "Sao chép tất cả thông tin CK" 1-tap giúp người dùng chuyển khoản nhanh trên app ngân hàng.

---

## 2. Phân Tích Pre-Check Trực Thuộc Hệ Thống (System Audit)

### 🔹 Logic Hệ Thống & API Contract
- **Ví XU & Transaction Ledger**: API backend NestJS (`WalletEngineService`) xử lý nạp XU qua webhook SePay (`TVTT <shortUuid>`) và RevenueCat IAP. Việc cộng/trừ XU được thực thi nguyên tử (atomically) qua PostgreSQL RPC `log_xu_transaction` và `add_xu`.
- **Điểm danh Hàng ngày**: Hàm RPC `daily_checkin` kiểm tra mốc thời gian theo giờ Việt Nam (`Asia/Ho_Chi_Minh`), tự động cộng +5 XU và xử lý mã giới thiệu lần đầu nếu có.
- **Xác thực & Session**: `WalletBalance` và `/wallet` tự động nhận biết tài khoản Email vs Anonymous, không làm rò rỉ dữ liệu giữa các phiên.

### 🔹 Luồng Trải Nghiệm Người Dùng (User Workflow)
1. **Nav Topbar**: Người dùng click vào Logo ViOS hoặc Nút `Ví & Điểm danh` ở topbar để truy cập `/wallet`.
2. **Trang `/wallet`**:
   - Xem nhanh **Số dư XU hiện tại** & **Thực hiện Điểm danh 1-tap (+5 XU)**.
   - Xem cảnh báo nếu đang dùng phiên vãng lai.
   - Chọn gói XU muốn nạp (20 XU, 50 XU, 120 XU, 600 XU).
   - Quét mã VietQR hoặc bấm **"Sao chép tất cả thông tin CK"** để chuyển khoản trên App Ngân hàng.
   - Bấm **"Tôi đã chuyển khoản"** để kiểm tra số dư ngay lập tức (Realtime notification qua Supabase WebSocket).
   - Chia sẻ link giới thiệu sang **Zalo / Facebook / Telegram** để nhận thưởng +10 XU.

### 🔹 Rủi Ro Tiềm Ẩn & Biện Pháp Chống Đỡ (Risk Assessment & Mitigation)
| Rủi ro tiềm ẩn | Mức độ | Giải pháp phòng ngừa đã cài đặt |
| :--- | :--- | :--- |
| **Mất số dư XU tài khoản vãng lai khi xoá cache** | Trung bình | Đã thêm Banner Cảnh báo nổi bật ở đầu trang `/wallet` hướng dẫn liên kết Email trước khi nạp. |
| **Trùng lặp webhook SePay** | Thấp | API backend đã cài Idempotency Check theo `sepay_transaction_id` trong table `transactions`. |
| **Rò rỉ bộ nhớ từ Realtime Channel** | Thấp | `wallet-model.svelte.ts` sử dụng mô hình Singleton Listener với biến đếm `activeSubscriptions`. |
| **Lỗi Copy Clipboard trên di động cũ** | Thấp | Kiểm tra môi trường `if (!browser) return; navigator.clipboard.writeText(...)` an toàn. |

---

## 3. Các Việc Đã Làm (Completed Work)

1. **Branding Audit**:
   - File: `apps/web/src/routes/(app)/+page.svelte`
   - Thay thế `<a class="brand" href={resolve('/')}>ziweiai</a>` bằng `<a class="brand-link" href={resolve('/')}><ViOSLogo size="sm" showTagline={false} /></a>`.
   - Cập nhật CSS `.brand-link` căn chỉnh linh hoạt với topbar navigation.

2. **Wallet Redesign & Feature Upgrades**:
   - File: `apps/web/src/routes/(app)/wallet/+page.svelte`
   - Thiết kế lại 100% giao diện trang `/wallet`:
     - **Header Hero Overview**: Hiển thị số dư XU lớn, badge phân loại thành viên, widget điểm danh nhanh.
     - **XU Package Grid**: 4 gói nạp kèm nhãn thưởng `+20% XU` & `Bán chạy`.
     - **XU Feature Cost Table**: Bảng quy đổi minh bạch chi phí từng tính năng.
     - **Referral & Social Share**: Input mã giới thiệu + nút chia sẻ Zalo/FB/Telegram.
     - **Sticky VietQR Payment Box**: Khung SePay QR viền phát sáng, bảng thông tin CK có nút copy từng dòng & copy tất cả, live pulse indicator.

3. **Tài Liệu Hướng Dẫn & Living Spec**:
   - File: `implementation_notes.html` (Đã cập nhật theo Karpathy Behavioral Guidelines).
   - File: `docs/wallet-vios-branding-audit-report.md` (Báo cáo tổng kết hiện tại).

---

## 4. Kết Quả & Verification (Testing Evidence)

### 🟢 Web Verification Gates
```bash
pnpm -F @ziweiai/web check
```
➔ **Kết quả:** `0 errors, 16 warnings` (chỉ có cảnh báo a11y không ảnh hưởng build/chức năng).

```bash
pnpm -F @ziweiai/web test
```
➔ **Kết quả:** **43 test files / 248 tests PASSED 100%**.

### 🟢 API Verification Gates
```bash
pnpm -F @ziweiai/api typecheck
```
➔ **Kết quả:** **0 errors**.

```bash
pnpm -F @ziweiai/api test
```
➔ **Kết quả:** **71 test files / 439 tests PASSED 100%**.

---

## 5. Đánh Giá Theo Matt's Framework (/ask-matt)

- **Tracer Bullet & Spec Conformance**: Mọi yêu cầu từ người dùng về thay thương hiệu `ziweiai` ➔ `ViOS` và nâng cấp toàn bộ trang `/wallet` đã hoàn thành trọn vẹn, đúng kiến trúc dự án Tử Vi Toàn Tập.
- **Context Hygiene & Clean Code**: Không để lại biến/import mồ côi (`orphans`). Tất cả các thay đổi đều nằm trong đường dẫn chuẩn của monorepo.
- **Trạng thái**: **DONE & VERIFIED**.
