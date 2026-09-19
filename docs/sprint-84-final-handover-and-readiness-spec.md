# BÁO CÁO TỔNG KẾT & HANDOVER SPRINT 84: HOÀN TẤT THƯƠNG MẠI HÓA BÁN XU & BẢO MẬT ĐA TẦNG

> **Dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Giai đoạn**: **Sprint 84 — Commercial Launch Security Hardening & Monetization Ready**  
> **Thời điểm chốt**: 12/09/2026 (18:55 GMT+7)  
> **Trạng thái**: **GO FOR PAID LAUNCH (100% HOÀN TẤT & ĐÃ DEPLOY PRODUCTION)**  
> **Mốc Commit Git**: `f23ba8d` (Đã đồng bộ lên `origin/main` trên GitHub)  
> **Live Production**:
> - Web Domain Chính: `https://tuvitoantap.online`
> - Vercel Preview/Demo: `https://tuvitoantap.vercel.app`
> - Production Database: Supabase `nachzhkeuzwiqmbtelrp`
> - Vercel Deployment ID: `dpl_96ofRNnE8NqYSESavc4bkLuBriMJ`

---

## 1. MỤC TIÊU SPRINT 84

1. **Khắc phục triệt để các lỗ hổng kinh tế XU (P0/P1) được phát hiện qua đợt kiểm toán độc lập**:
   - Chặn đứng hoàn toàn nguy cơ client tự mint XU qua RPC hoặc bypass bảo mật trigger database.
   - Triệt tiêu 100% rủi ro race condition concurrent replay mint XU từ việc gọi lặp token quảng cáo.
   - Bắt buộc kiểm thực Server-side cho Ad Reward, cấu hình fail-closed an toàn.
   - Chuẩn hóa kế toán đa tiền tệ ngoại tệ (USD, EUR, GBP, JPY, CAD...) cho RevenueCat IAP.
2. **Nâng cấp tính năng ví người dùng (/wallet)**:
   - Xây dựng giao diện tra cứu thời gian thực "Lịch Sử Giao Dịch" nạp VietQR/SePay.
3. **Đồng bộ toàn diện môi trường thực tế**:
   - Áp dụng đầy đủ 35 database migrations lên Supabase Production.
   - Deploy bản build mới nhất lên Vercel Production và xác nhận metadata live đạt chuẩn.

---

## 2. NHỮNG VIỆC ĐÃ HOÀN THÀNH

### 2.1. Tầng Cơ Sở Dữ Liệu (Supabase / PostgreSQL)
- **Migration 000033 (`000033_commercial_launch_security_hardening.sql`)**:
  - Sửa hàm trigger `protect_profile_economic_columns()`, kiểm tra nghiêm ngặt JWT claim role (`auth.role()`), cưỡng chế revert mọi hành vi sửa `xu_balance`, `checkin_streak` từ client (`authenticated`, `anon`).
  - Xây dựng RPC atomic `process_revenuecat_payment`.
  - Cấp quyền RLS cho người dùng xem lịch sử nạp XU của chính mình.
- **Migration 000034 (`000034_secure_ad_reward_and_fix_accounting.sql`)**:
  - `REVOKE EXECUTE` hàm `claim_ad_reward` khỏi toàn bộ client roles, chỉ cấp quyền cho `service_role`.
  - Bỏ tham số `p_reward_amount` từ caller, khóa cứng hằng số `c_reward_amount = 5` XU trong database.
  - Tạo bảng `public.ad_reward_claims` với primary key `impression_id` để chống replay token.
  - Thêm 2 cột kế toán `currency` và `original_price` vào bảng `transactions`.
- **Migration 000035 (`000035_lock_ad_reward_race_condition.sql`)**:
  - **Triệt tiêu Race Condition Replay**: Chuyển đổi hàm `claim_ad_reward` sang cơ chế **Atomic Lock-by-Insert**. Lệnh `INSERT INTO ad_reward_claims ... ON CONFLICT (impression_id) DO NOTHING` thực hiện ngay dòng đầu tiên; nếu `NOT FOUND` thì lập tức trả về `ALREADY_CLAIMED` và ngắt hàm, hoàn toàn không chạm tới bước credit XU.

### 2.2. Tầng Backend API (NestJS)
- **`rewards.service.ts` & `rewards.controller.ts`**:
  - Bổ sung cơ chế **Fail-Closed** trên production: Nếu chưa có cờ `ENABLE_AD_REWARDS=true` (chưa có AdMob SSV), từ chối nhận thưởng và hướng dẫn user điểm danh hoặc nạp VietQR.
  - Bắt buộc impression ID có độ dài tối thiểu &ge; 8 ký tự, chặn đứng request rỗng hoặc bypass.
- **`payment.service.ts`**:
  - Xóa bỏ hoàn toàn fallback thanh toán 2 bước.
  - Xây dựng bảng tỷ giá ngoại tệ FX đầy đủ (USD, EUR, GBP, JPY, CAD, AUD, SGD, THB, KRW). Fallback an toàn `amountVnd = 0` kèm log cảnh báo nếu gặp ngoại tệ lạ.
- **`divination-chat.service.ts` & `annual-report.service.ts`**:
  - Loại bỏ hoàn toàn rủi ro double-charge XU bằng cách thiết lập Single Authority rõ ràng (interceptor trừ XU ở controller, service truyền `cost = 0`).
  - Sửa bug hoàn tiền đủ 15 XU cho báo cáo năm khi gặp sự cố AI provider.
- **`llm-exchange.ts`**:
  - Bổ sung trần `MAX_PROMPT_INPUT_CHARS = 16000` (~4000 tokens) chống DoS chi phí token Gemini 2.5 Flash.

### 2.3. Tầng Frontend Web (SvelteKit 5)
- **Trang `/wallet`**:
  - Tích hợp tab switcher giữa `[Nạp XU VietQR]` và `[Lịch Sử Giao Dịch]`.
  - Hiển thị bảng lịch sử nạp tiền VietQR: Ngày giờ, Mã giao dịch, Số tiền VNĐ, Số XU nhận được và Trạng thái hoàn thành.
- **Metadata Public (`app.html`)**:
  - Đồng bộ nội dung OpenGraph/Twitter Card thành "Điểm danh nhận 5 XU mỗi ngày" chuẩn xác.

### 2.4. Công Cụ Kiểm Toán Độc Lập & Vận Hành
- **`scripts/verify-production-db.js`**: Bổ sung kiểm tra HTTP status 200, xác minh trực tiếp định nghĩa hàm và quyền hạn trên PostgreSQL production.
- **`docs/operations/google-cloud-budget-and-gemini-pricing-guide.md`**: Cẩm nang thiết lập Budget Alert 500k VNĐ và phân tích biên lợi nhuận gộp >94% cho Gemini 2.5 Flash.

---

## 3. KẾT QUẢ KIỂM CHỨNG & NGHIỆM THU

### 3.1. Verification Gates
- **API Unit Tests**: **87/87 test files PASS** (544/544 tests passed).
- **API Typecheck & Build**: NestJS build 0 errors.
- **Web Svelte-Check**: **0 errors, 0 warnings**.
- **Web Unit Tests**: **79/79 test files PASS** (413/413 tests passed).
- **Turbo Monorepo Typecheck**: **10/10 tasks PASS** trên 7 packages.
- **Production Database Verification**: **PASS 100%** tất cả các tiêu chí an ninh P0 và kế toán P1.

### 3.2. Live Production Smoke Test
- Deploy thành công lên Vercel Production (`dpl_96ofRNnE8NqYSESavc4bkLuBriMJ`).
- `curl -sS https://tuvitoantap.online/api/health` ➔ `{"status":"ok"}`.
- `curl -sS https://tuvitoantap.vercel.app/api/features` ➔ `200 OK` (Toàn bộ 10 thuật số hoạt động).
- `curl -sS https://tuvitoantap.online/ | grep -o 'Điểm danh nhận [0-9]* XU mỗi ngày'` ➔ `Điểm danh nhận 5 XU mỗi ngày` (Metadata live đã khớp 100%).

---

## 4. ĐÁNH GIÁ BEHAVIOR MODEL & TRẠNG THÁI HỆ THỐNG

Theo phương pháp luận **Behavior-First Reverse Spec**:
1. **User Mental Model - Nạp XU**: Người dùng quét mã VietQR -> Webhook SePay gọi RPC nguyên tử -> Tiền vào ví tức thì -> Xem được lịch sử ngay tại tab Lịch Sử Giao Dịch -> Không có hiện tượng trừ nhầm, nạp trùng hay mất tiền.
2. **User Mental Model - Điểm danh & Xem Ad**: Điểm danh nhận đúng 5 XU/ngày; tính năng xem quảng cáo fail-closed an toàn cho đến khi kết nối AdMob SSV chính thức, không phát sinh kẹt trạng thái hay duplicate replay minting.
3. **User Mental Model - Tra cứu Thuật Số**: Sử dụng tính năng tiêu hao XU minh bạch theo đúng catalog giá, có cơ chế auto-refund 100% nếu AI timeout hoặc lỗi kết nối.

**KẾT LUẬN: SPRINT 84 CHÍNH THỨC HOÀN THÀNH VÀ ĐÓNG LẠI THÀNH CÔNG.**
