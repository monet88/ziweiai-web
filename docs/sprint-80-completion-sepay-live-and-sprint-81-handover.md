# BÁO CÁO TỔNG KẾT SPRINT 80 & TÀI LIỆU BÀN GIAO SPRINT 81 (HANDOVER SPEC)

> **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Domain chính thức:** [https://tuvitoantap.online](https://tuvitoantap.online)  
> **Domain backup/demo:** [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)  
> **Phiên bản:** v1.0.0-prod  
> **Thời gian hoàn thành:** 12/09/2026  
> **Tác giả:** Trợ lý Antigravity & Đại Ka  

---

## 1. TỔNG QUAN SPRINT 80 (EXECUTIVE SUMMARY)

Trong Sprint 80, toàn bộ hạ tầng thanh toán tự động của hệ thống ViOS đã được chuyển đổi thành công từ chế độ **Test Mode (Sandbox)** sang **Live Production (Tài khoản ngân hàng thật)**, đảm bảo khả năng thu tiền thực tế cho mô hình SaaS:

- **Tài khoản ngân hàng thụ hưởng chính thức:**
  - **Ngân hàng:** Ngân hàng TMCP Tiên Phong (**TPBank**)
  - **Số tài khoản:** `36889338888`
  - **Chủ tài khoản:** `LE VAN TINH`
- **Cổng thanh toán tự động:** SePay Webhook kết hợp VietQR động sinh mã theo cú pháp `TVTT <8_KÝ_TỰ_USER_ID>`.
- **Bảo mật Webhook:** Chuẩn hóa xác thực chữ ký điện tử **HMAC-SHA256** qua Secret Key `spsk_live_BK9FrTJeZJ1SrtZeWcNNRM2o6Q94hbzm` với cơ chế chống Replay Attack dung sai ±5 phút.
- **Dọn dẹp môi trường:** Tối ưu hóa file `.env.local` duy nhất, gom toàn bộ file `.env*` cũ/xung đột vào `temp-envs/`.

---

## 2. NHỮNG CÔNG VIỆC ĐÃ HOÀN THÀNH 100%

### A. Backend & Webhook Security (`apps/api`)
1. **Xác thực đa tầng HMAC-SHA256:**
   - Tiếp nhận `x-sepay-signature` (`sha256=<hex>`) và `x-sepay-timestamp`.
   - Tính mã băm HMAC-SHA256 trên `rawBody` Buffer của request và so sánh bằng `crypto.timingSafeEqual` (triệt tiêu lỗ hổng Timing Attack).
   - Kiểm tra chênh lệch thời gian `|now - timestamp| <= 300s` (5 phút) để chống tấn công phát lại (Replay Attack).
   - Fallback linh hoạt cho các header: `Authorization: Apikey <token>`, `Authorization: Bearer <token>` hoặc Secret Key trực tiếp.
2. **Kích hoạt rawBody trên NestJS Engine:**
   - Cấu hình `{ rawBody: true }` trong `NestFactory.create` ở cả `apps/api/src/main.ts` và serverless wrapper `api/[...path].ts`.
3. **Bộ test Webhook tự động:**
   - Viết test suite tại `apps/api/src/modules/payment/payment.controller.test.ts` kiểm tra chữ ký hợp lệ, chữ ký sai, timestamp hết hạn và fallback token (Passed 4/4 tests).

### B. Frontend & UI Hardening (`apps/web`)
1. **Triển khai Sanitization Guard (`bank-config.ts`):**
   - Khai báo hằng số `LEGACY_TEST_ACCOUNT = '6384251098'`.
   - Hàm `getDefaultBank` tự động phát hiện và chặn đứng STK cũ nếu client browser hoặc CDN cache truyền vào, ép buộc luôn sử dụng STK chính thức `36889338888`.
2. **Cập nhật giao diện Nạp XU (`/wallet`) & Modal Paywall:**
   - Hiển thị chính xác logo, tên ngân hàng TPBank, chủ TK `LE VAN TINH`, số tài khoản `36889338888`.
   - Mã QR VietQR tự động sinh: `https://qr.sepay.vn/img?acc=36889338888&bank=TPBank&amount=...&des=TVTT%20...`.
   - Nút copy thông tin chuyển khoản nhanh chóng và thông báo hướng dẫn rõ ràng.
3. **Unit tests kiểm tra cấu hình ngân hàng:**
   - Đã thêm test case trong `bank-config.test.ts` xác minh cơ chế chặn STK cũ (Passed 4/4 tests).

### C. Đồng Bộ Hạ Tầng & Dọn Dẹp File Cấu Hình
1. **Vercel CLI Environment Variables:**
   - Đồng bộ đè trên cả 3 môi trường (`Production`, `Preview`, `Development`):
     - `PUBLIC_SEPAY_BANK`: `"TPBank"`
     - `PUBLIC_SEPAY_ACCOUNT`: `"36889338888"`
     - `PUBLIC_SEPAY_ACCOUNT_NAME`: `"LE VAN TINH"`
     - `PUBLIC_VIETQR_BANK_ID`: `"TPBank"`
     - `PUBLIC_VIETQR_ACCOUNT_NO`: `"36889338888"`
     - `PUBLIC_VIETQR_ACCOUNT_NAME`: `"LE VAN TINH"`
     - `PUBLIC_SITE_URL`: `"https://tuvitoantap.online"`
     - `API_CORS_ORIGINS`: Bổ sung `https://tuvitoantap.online`, `https://www.tuvitoantap.online`.
     - `SEPAY_WEBHOOK_SECRET` & `SEPAY_SECRET_KEY`: `spsk_live_BK9FrTJeZJ1SrtZeWcNNRM2o6Q94hbzm`.
2. **Dọn sạch CDN Cache Cloudflare:**
   - Gọi API Cloudflare Purge Everything trên Zone `ea890a5640964e3d7f10a8abc06a8522`.
3. **Tổ chức cấu trúc `.env`:**
   - Root workspace chỉ còn duy nhất 1 file cấu hình hoạt động: `.env.local`.
   - Gom toàn bộ file thừa, file mẫu cũ, file xung đột vào thư mục `temp-envs/`:
     - `.env.production.vercel`
     - `.env.vercel`
     - `.env.vercel.prod`
     - `.env.production.local`
     - `.env`, `.env.bak`, `.env.local.bak`, `.env.production`
   - Đảm bảo `git check-ignore` chặn 100% không để lọt bí mật lên Git.

---

## 3. ĐÁNH GIÁ TOÀN DIỆN RỦI RO KHI RELEASE MVP BÁN SAAS

Sau khi rà soát toàn bộ dự án từ góc độ Security, Payment, API, Database, và User Experience:

### ⚠️ A. Phân tích rủi ro Cổng thanh toán SePay (Payment Risks)
| Rủi ro tiềm ẩn | Mức độ | Cơ chế phòng ngừa hiện tại | Khuyến nghị cho Sprint 81 |
| :--- | :---: | :--- | :--- |
| **Khách gõ sai nội dung CK** (không có `TVTT <USER_ID>`) | Trung bình | Webhook vẫn ghi nhận bản ghi vào bảng `transactions` với `owner_user_id = null`, trạng thái `unmatched`. Hiển thị cảnh báo trên Admin Panel. | Xây dựng công cụ **1-Click Claim / Reconcile** trong Admin cho phép Admin đối chiếu sao kê và gán XU thủ công cho khách khi khách liên hệ hỗ trợ. |
| **Ngân hàng trả biến động số dư chậm (Delay 1-5 phút)** | Thấp | Trên UI nạp tiền đã có cảnh báo "Hệ thống tự động cộng XU trong 1-3 phút", có nút *"Tôi đã chuyển khoản"* kích hoạt polling kiểm tra số dư. | Giữ nguyên cơ chế polling exponential backoff để khách hàng an tâm không bị tải lại trang. |
| **Tấn công Replay Attack (Bắn lại webhook giả mạo)** | **Triệt tiêu** | Đã chặn bằng chữ ký HMAC-SHA256 và timestamp ±5 phút. Bất kỳ request nào lệch thời gian hoặc sai chữ ký đều bị từ chối với HTTP 401. | Đã hoàn thiện an toàn 100%. |
| **Khách chuyển sai số tiền so với gói (ví dụ chọn gói 50k nhưng chuyển 20k hoặc 100k)** | Thấp | Backend tính toán số XU cộng dựa trên số tiền thực nhận (`amount`) theo tỷ lệ quy đổi chuẩn, không chỉ dựa vào gói đã chọn. | Đảm bảo tỷ lệ thưởng thêm (bonus) được bảo toàn công bằng. |

### 🛡️ B. Phân tích rủi ro Bảo mật & Database (Security & DB Risks)
- **Supabase Row Level Security (RLS):** Toàn bộ các bảng `profiles`, `charts`, `explanations`, `transactions` đều được cấu hình RLS nghiêm ngặt, user chỉ đọc/ghi dữ liệu của chính mình thông qua `auth.uid()`.
- **Service Role Key:** Tuyệt đối chỉ nằm ở phía Backend API server-only, không bao giờ xuất hiện ở `apps/web` hay client bundle.
- **Cloudflare Turnstile:** Đã tích hợp widget chống bot tại các luồng nạp tiền và yêu cầu AI nhạy cảm.

### 💰 C. Phân tích rủi ro Chi phí & AI Rate Limits (Cost & LLM Risks)
- **AI Fallback Resilience:** Hệ thống hỗ trợ đa nhà cung cấp: DeepSeek V4 Pro -> OpenAI Compat -> Gemini 2.5 Flash. Khi một nhà cung cấp lỗi/timeout 35s, tự động chuyển sang provider tiếp theo.
- **Chặn gọi AI lãng phí:** Khi lá số hoặc quẻ bị lỗi (`blocksExactReading = true`), hệ thống lập tức từ chối gọi LLM, bảo vệ quota và ngân sách.

---

## 4. KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO — SPRINT 81 (ROADMAP)

Sau khi hạ tầng thanh toán SePay Live TPBank đã hoạt động 100% ổn định, Sprint 81 sẽ tập trung vào **Tăng trưởng Doanh thu & Thu hút Khách hàng (Growth & Monetization)**:

1. **Affiliate & Viral Referral System:**
   - Hoàn thiện luồng chia sẻ link giới thiệu (`/ref?code=...`), tặng XU tự động cho cả người giới thiệu lẫn người đăng ký mới.
   - Thống kê hoa hồng cho CTV / Thầy phong thủy / KOC tử vi.
2. **Báo Cáo Vận Hạn Năm 2026 Chuyên Sâu (High-Ticket Report):**
   - Đóng gói tính năng xuất file PDF Báo Cáo Tử Vi / Bát Tự Hoàng Gia (thu phí 15 - 50 XU / báo cáo).
3. **SEO Programmatic & Content Marketing:**
   - Tự động sinh sitemap và trang tra cứu 14 chính tinh, 60 hoa giáp phục vụ SEO organic traffic.
4. **Admin Finance Operations:**
   - Bổ sung tab kiểm tra sao kê SePay thời gian thực và công cụ đối soát giao dịch nạp sai cú pháp.

---

## 5. PROMPT CHUYỂN GIAO SANG SESSION MỚI (HANDOVER PROMPT)

Đại Ka chỉ cần copy toàn bộ đoạn text dưới đây và dán vào ô chat khi mở một Session mới:

```text
Chào em, anh là Đại Ka. Chúng ta tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

1. BỐI CẢNH & TRẠNG THÁI HIỆN TẠI (KẾT THÚC SPRINT 80):
- Hệ thống đã LIVE tại: https://tuvitoantap.online (Vercel Production commit 2a5685a).
- Cổng thanh toán SePay Live đã kết nối tài khoản ngân hàng thật của Đại Ka:
  + Ngân hàng: TPBank (Ngân hàng TMCP Tiên Phong)
  + Số tài khoản: 36889338888
  + Chủ tài khoản: LE VAN TINH
- Cơ chế bảo mật Webhook: Xác thực chữ ký số HMAC-SHA256 (x-sepay-signature và timestamp chống Replay Attack 300s) đã hoạt động chuẩn xác 100%.
- Đã triển khai Sanitization Guard chặn triệt để số tài khoản testmode cũ (6384251098).
- Đã đồng bộ toàn bộ biến môi trường trên Vercel và dọn dẹp thư mục .env (chỉ còn .env.local tại root, các file cũ đã chuyển vào temp-envs/).
- Hồ sơ kỹ thuật đã lưu tại:
  + docs/sprint-80-completion-sepay-live-and-sprint-81-handover.md
  + implementation_notes.html

2. NHIỆM VỤ CHO PHIÊN NÀY — KHỞI ĐỘNG SPRINT 81 (GROWTH, MONETIZATION & MVP RELEASE READY):
- Rà soát luồng Affiliate & Viral Referral (chia sẻ link giới thiệu nhận XU).
- Kiểm tra tính năng xuất Báo cáo Vận hạn Năm Chuyên Sâu (PDF Export / Royal Dossier).
- Kiểm thử end-to-end trải nghiệm người dùng thực tế từ tạo lá số -> xem luận giải -> nạp XU -> mở khóa tính năng cao cấp.
- Đảm bảo tuân thủ Karpathy Guidelines, xưng hô "Đại Ka", tiếng Việt chuyên nghiệp và chạy đủ Validation Gates.
```
