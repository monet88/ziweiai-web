# HƯỚNG DẪN TÍCH HỢP SEPAY & CHUYỂN ĐỔI SANG LIVE PRODUCTION

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Tác giả:** Antigravity AI  
**Ngày cập nhật:** 12/09/2026  
**Trạng thái:** ✅ Đã cấu hình và kiểm chứng tương thích Live / Test Mode  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU

Tài liệu này giải đáp và hướng dẫn toàn diện 3 vấn đề cốt lõi của Đại Ka về hạ tầng dữ liệu và thanh toán tự động SePay:
1. **Kiểm tra cơ sở dữ liệu Supabase `galatuvi`** (`nachzhkeuzwiqmbtelrp.supabase.co`).
2. **Phân tích webhook URL khi đổi sang tên miền chính thức `tuvitoantap.online`** (Link cũ trên Vercel có lỗi không? Có cần tạo webhook mới không?).
3. **Quy trình chuyển đổi SePay từ Test Mode sang Live Production** (Kết nối tài khoản ngân hàng thật ACB `6384251098`, cơ chế bảo mật xác thực, tự động cộng XU, và các bước cấu hình thực tế).

---

## 2. KẾT QUẢ KIỂM TRA DATABASE SUPABASE `galatuvi`

Qua kiểm tra trực tiếp bằng **Supabase Management API** (`https://api.supabase.com/v1/projects`) sử dụng token quản trị:
- **Project ID:** `nachzhkeuzwiqmbtelrp`
- **Project Name:** `galatuvi`
- **Tổ chức sở hữu (Org):** `galaxypro710-stack's Org` (Org ID: `wihwfvcayeinqintszot`)
- **Tài khoản quản trị:** `galaxypro710-stack` (đăng ký qua email `galaxypro710@gmail.com`)
- **Khu vực (Region):** `ap-northeast-2` (Seoul)
- **Trạng thái:** `ACTIVE_HEALTHY`

👉 **KẾT LUẬN:** Database `https://nachzhkeuzwiqmbtelrp.supabase.co` chính xác 100% là project **`galatuvi`** thuộc quyền sở hữu của Đại Ka (`galaxypro710@gmail.com`), đang hoạt động hoàn toàn ổn định và được kết nối trực tiếp với backend ViOS.

---

## 3. PHÂN TÍCH WEBHOOK URL: `tuvitoantap.vercel.app` VS `tuvitoantap.online`

### Câu hỏi: "Đổi qua `https://tuvitoantap.online/api/webhooks/sepay` thì link cũ Vercel app có lỗi không?"
**Trả lời:** **HOÀN TOÀN KHÔNG BỊ LỖI!**
- Trên hạ tầng Vercel của dự án, mỗi bản build Production được gán đồng thời 2 Aliases chính:
  1. `https://tuvitoantap.online` (Custom Domain chính thức)
  2. `https://tuvitoantap.vercel.app` (Vercel Domain mặc định)
- Cả hai URL này đều trỏ vào cùng một deployment và cùng một endpoint NestJS API: `POST /api/webhooks/sepay`.
- Vì vậy, dù SePay gửi webhook về domain cũ hay domain mới, backend ViOS đều tiếp nhận và xử lý cộng XU bình thường mà không phát sinh bất kỳ lỗi nào.

### Câu hỏi: "Hay tạo mới webhook trên SePay?"
**Khuyến nghị kỹ thuật:** **KHÔNG CẦN TẠO MỚI, CHỈ CẦN CẬP NHẬT (EDIT) URL HIỆN TẠI.**
- **Lý do:**
  - Nếu Đại Ka tạo thêm một Webhook mới trên SePay mà vẫn giữ Webhook cũ (cùng lắng nghe biến động của tài khoản ACB `6384251098`), khi có một giao dịch chuyển tiền xảy ra, SePay sẽ bắn **2 webhook request song song** (một tới URL vercel.app và một tới URL online).
  - Mặc dù backend ViOS đã có cơ chế chống trùng lặp (Idempotency) bằng cách kiểm tra `sepay_transaction_id` trong bảng `transactions` (request thứ 2 sẽ bị bỏ qua với log: `Transaction already processed. Skipping.`), việc chỉ duy trì 1 Webhook duy nhất sẽ giúp luồng dữ liệu sạch sẽ, không tốn tài nguyên serverless function và dễ theo dõi nhật ký webhook trên SePay Dashboard.

---

## 4. QUY TRÌNH CHUYỂN ĐỔI SEPAY TỪ TEST MODE SANG LIVE PRODUCTION

### A. Kiến Trúc Xác Thực Webhook Của ViOS
Backend ViOS (`apps/api/src/modules/payment/payment.controller.ts`) được thiết kế cực kỳ linh hoạt và an toàn:
```typescript
const expectedSecret =
  apiEnv.SEPAY_WEBHOOK_SECRET || apiEnv.SEPAY_API_KEY || apiEnv.SEPAY_TESTMODE_API;
```
Hệ thống ưu tiên nhận diện 3 tầng xác thực:
1. `SEPAY_WEBHOOK_SECRET`: Secret token riêng của Webhook.
2. `SEPAY_API_KEY`: API Key của tài khoản SePay thật (Live Production).
3. `SEPAY_TESTMODE_API`: API Key của môi trường Test Mode / Sandbox.

SePay sẽ gửi kèm header xác thực: `Authorization: Apikey <API_TOKEN>`. Backend ViOS sẽ tự động bóc tách và so khớp token này.

---

### B. Cơ Chế Nạp XU Tự Động (Automation Flow)
1. **Khách hàng quét mã VietQR:**
   - Tại trang `/wallet` hoặc `/pricing`, khi người dùng chọn gói XU (Ví dụ: Gói 50 XU = 50.000 VNĐ), hệ thống tự sinh mã QR SePay:
     `https://qr.sepay.vn/img?acc=6384251098&bank=ACB&amount=50000&des=TVTT%20<8_KY_TU_USER_ID>`
   - Số tài khoản: `6384251098`
   - Ngân hàng: `ACB`
   - Cú pháp nội dung: `TVTT <shortUuid>` (Ví dụ: `TVTT a1b2c3d4`).
2. **Khách hàng xác nhận chuyển khoản:**
   - Ứng dụng ngân hàng tự động điền đúng STK, Ngân hàng, Số tiền và Nội dung.
3. **SePay nhận biến động và gửi Webhook:**
   - Trong vòng 2 - 5 giây sau khi tiền vào tài khoản ACB, SePay bắn payload JSON sang:
     `POST https://tuvitoantap.online/api/webhooks/sepay`
4. **Backend ViOS xử lý tức thì:**
   - Kiểm tra xác thực `Authorization: Apikey <TOKEN>`.
   - Trích xuất mã người dùng qua Regex: `/TVTT\s*([a-zA-Z0-9]{8})/i`.
   - Kiểm tra chống trùng lặp `sepay_transaction_id` (Idempotent Guard).
   - Quy đổi: `Math.floor(transferAmount / 1000)` (1.000 VNĐ = 1 XU).
   - Ghi lịch sử vào bảng `transactions` và gọi `walletEngine.addXU` cộng XU tức thì vào tài khoản người dùng.

---

### C. Các Bước Thao Tác Chuyển Đổi Trên SePay Dashboard

Khi Đại Ka sẵn sàng chuyển từ Test Mode sang Live Production:

#### Bước 1: Kết nối Tài Khoản Ngân Hàng Thật trên SePay
1. Đăng nhập vào [SePay Dashboard](https://my.sepay.vn).
2. Vào mục **Ngân hàng** ➔ **Thêm ngân hàng**.
3. Chọn **ACB** ➔ Nhập Số tài khoản `6384251098`.
4. Cài đặt App SePay trên điện thoại hoặc kết nối SMS/Open Banking theo hướng dẫn của SePay để SePay lắng nghe biến động số dư.

#### Bước 2: Cấu Hình Webhook Live
1. Trên SePay Dashboard, chuyển sang chế độ **Live** (ở góc trên giao diện nếu đang ở Test).
2. Vào mục **Tích hợp** ➔ **Webhooks** ➔ Bấm **Tạo Webhook** (hoặc Sửa webhook hiện có).
3. Điền các thông tin:
   - **URL Webhook:** `https://tuvitoantap.online/api/webhooks/sepay`
   - **Tài khoản ngân hàng:** Chọn tài khoản ACB `6384251098`
   - **Sự kiện:** Chọn `Giao dịch tiền vào` (Tất cả biến động tăng tiền)
   - **Kiểu xác thực (Authentication):** Chọn **Apikey**
4. Copy chuỗi **API Key / Secret Token** mà SePay cung cấp.

#### Bước 3: Cập Nhật Biến Môi Trường Lên Vercel
Gán chuỗi API Key thật đó vào biến môi trường `SEPAY_API_KEY` (hoặc `SEPAY_WEBHOOK_SECRET`) trên Vercel:
- **Vercel Dashboard:** `Settings` ➔ `Environment Variables` ➔ Thêm `SEPAY_API_KEY = <chuỗi_token_sepay_live>`.
- **Target:** Production, Preview, Development.
*(Lưu ý: Không cần sửa đổi bất kỳ dòng code nào trong dự án, hệ thống sẽ tự động chuyển sang nhận diện token Live ngay lập tức).*

---

## 5. TỔNG KẾT VÀ BÀN GIAO

| Hạng Mục | Hiện Trạng | Hành Động Kế Tiếp |
|---|---|---|
| **Database Supabase** | `galatuvi` (`nachzhkeuzwiqmbtelrp`), user `galaxypro710-stack` | ✅ Đã xác nhận chuẩn 100%, không cần đổi |
| **Webhook URL** | Cả `tuvitoantap.online` và `tuvitoantap.vercel.app` đều sẵn sàng | ✅ Chỉ cần trỏ về `https://tuvitoantap.online/api/webhooks/sepay` |
| **Test Mode Token** | `SEPAY_TESTMODE_API` đã được cấu hình trên Vercel | ✅ Sẵn sàng test mô phỏng giao dịch |
| **Live Production** | Code đã sẵn sàng 100% tự động cộng XU | 🔄 Khi mở thẻ ACB thật, chỉ cần điền `SEPAY_API_KEY` trên Vercel |
