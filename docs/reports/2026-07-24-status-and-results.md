# Báo Cáo Tiến Độ & Kết Quả Dự Án Tử Vi Toàn Tập (2026-07-24)

**Repository:** `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`  
**Branch:** `main` @ `6334e13` (Đã push sạch lên `origin/main`)  
**Demo Production:** `https://tuvitoantap.vercel.app`

---

## 1. Mục Tiêu (Goals)

- **P0**: Đảm bảo toàn bộ code local được push an toàn lên GitHub (`origin/main`).
- **P0**: Phát hiện và xử lý triệt để bug xác thực Webhook SePay/RevenueCat trên môi trường serverless Vercel demo.
- **P0**: Xác nhận endpoint Webhook hoạt động chính xác với cờ `@Public()`, trả về đúng HTTP 401 do controller xử lý khi token sai/thiếu.
- **P0**: Thực hiện Live Smoke Test kiểm tra số dư XU và tính chống nạp đúp (Idempotency) trên DB Production.
- **P0**: Đảm bảo 100% Unit Tests & Playwright Smoke Tests vượt qua mà không gây ra bất kỳ regression nào.

---

## 2. Việc Đã Làm (Completed Work)

### 🔮 Core Engine & System Architecture
- Phân tách kiến trúc nghiêm ngặt:
  - `@ziweiai/astro-engine`: Server-only engine tính toán lá số (không lọt client bundle).
  - `@ziweiai/contracts`: Nguồn sự thật duy nhất chứa các schema Zod request/response.
  - `apps/web`: SvelteKit frontend cho UI & client auth.
  - `apps/api`: NestJS backend xử lý AI providers, database, quota & payment.
- Tích hợp 10+ hệ thuật số: Tử Vi, Lục Hào, Bát Tự Mệnh Lý, Tarot, MBTI, Tướng Mặt, Tướng Tay, Lenormand, Giải Mộng, Xin Xăm, Lịch Âm Dương.
- Xây dựng AI Router đa tầng với fallback tự động (DeepSeek, OpenAI, Gemini), chặn `blocksExactReading` để tránh lãng phí token.

### 💰 Referral Growth Loop & Ví XU / SePay Webhook
- Hoàn thiện Referral Growth Loop: sanitize mã giới thiệu dạng UPPERCASE (`AB12CD34`), tự động cộng +15 XU cho Referee và +10 XU cho Referrer khi điểm danh lần đầu.
- Tích hợp cổng thanh toán VietQR / SePay: tự động sinh QR chuyển khoản ngân hàng theo cú pháp `TVTT <8-char-uuid>`.
- **Fix Bug Webhook Auth (`PaymentController`)**:
  - Gắn `@Public()` decorator cho `handleSepayWebhook` và `handleRevenueCatWebhook`.
  - Giúp webhook từ SePay bypass qua `SupabaseAuthGuard` toàn cục mà vẫn bảo mật qua cờ kiểm tra Bearer `SEPAY_WEBHOOK_SECRET`.
  - Viết 100% unit test bổ sung cho controller.

### 🧪 Live Testing & Git Hygiene
- Authenticate & push thành công toàn bộ local commits (`7f0e462`…`6334e13`) lên `origin/main`.
- Đảm bảo giữ vệ sinh git repository: Không commit `skills-lock.json`, `.agents/` hay bất kỳ secrets nào.
- Viết và chạy script Live Webhook Smoke Test (`scripts/test_sepay_live_smoke.ts`):
  - Tạo tài khoản anonymous trên Supabase thật.
  - Bắn mock SePay webhook với nội dung `TVTT <short_uuid>`.
  - Kiểm tra XU tự động nhảy +20 XU (khi nạp 20,000 VNĐ).
  - Bắn lặp lại webhook với cùng `referenceCode` -> Xác nhận Idempotency ngăn chặn nạp đúp 100%.

---

## 3. Kết Quả (Results)

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| **Git Push** | **PASS** | `6334e13` trên `origin/main` |
| **API Unit Tests** | **PASS (427/427)** | 100% pass |
| **Webhook Auth Fix** | **PASS** | Controller nhận đúng 401 khi thiếu/sai Bearer secret |
| **Live Webhook Smoke** | **PASS** | +20 XU đúng kỳ vọng, Idempotency chống nạp đúp |
| **Clean Up Test Data** | **PASS** | Tự động xoá anon test user trên Supabase Prod |
