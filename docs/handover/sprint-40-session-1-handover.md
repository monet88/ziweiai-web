# Báo Cáo & Tài Liệu Bàn Giao Sprint 40 — Session 1
**Dự Án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Mốc Phiên:** Sprint 40 — Session 1 (Ticket 40.1 + AI Connectivity & Vision Diagnostics)  
**Thời Điểm:** 08/09/2026  
**Commit Gốc:** `36b62e7`  
**Nhánh Làm Việc:** `main`

---

## 1. Mục Tiêu Phiên Làm Việc (Session Objectives)
1. **Thực hiện Ticket 40.1:** Đại tu toàn diện giao diện trang chủ (`apps/web/src/routes/(app)/+page.svelte`) theo ngôn ngữ thiết kế **Celestial Luxury (Hoàng Gia Huyền Bí, Đẳng Cấp)**, tái định vị thương hiệu từ tên gọi cũ sang **ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia**.
2. **Tối ưu phễu chuyển đổi & nạp XU:** Tinh gọn ma trận 16 bộ môn thuật số từ dạng dàn trải gây quá tải (Choice Overload) sang cấu trúc 4 tầng phễu tăng kích hoạt người dùng và khuyến khích nạp XU VietQR 1-chạm.
3. **Pre-check kết nối API LLM & Chẩn đoán Quét Bàn Tay (`/palm`):** Tìm nguyên nhân gốc rễ (Root Cause) khiến người dùng quét chỉ tay không chạy; kiểm tra toàn bộ logic codebase của các adapter/router AI xem có sai sót hay rủi ro bảo mật/lỗ tiền API không.
4. **Tư vấn chiến lược Google Login & Thưởng XU:** Phân tích hành vi theo `behavior-model-debugger` và bảo vệ tài chính chống lạm dụng token.

---

## 2. Các Công Việc Đã Thực Hiện & Thay Đổi Chi Tiết

### A. Giao Diện & Thương Hiệu ViOS (Ticket 40.1)
- **`apps/web/src/lib/theme/tokens.css`**:
  - Bổ sung bộ Design Tokens độc quyền phong cách **Celestial Luxury**:
    - `--celestial-gold: #ffd700`, `--celestial-gold-dark: #d4af37`, `--celestial-gold-light: #fff3a8`
    - `--celestial-gradient-gold: linear-gradient(135deg, #ffe066 0%, #d4af37 50%, #aa8010 100%)`
    - `--celestial-purple-deep: #110d22`, `--celestial-stardust-glow: 0 0 35px rgba(212, 175, 55, 0.25)`
- **`apps/web/src/lib/i18n/vi.ts`**:
  - Viết lại toàn bộ copy trang chủ sang văn phong trang trọng, uyên bác, đậm chất thuật số cung đình.
  - Xóa bỏ hoàn toàn định danh cũ mang cảm giác "hàng Trung Quốc dịch thô", định vị chuẩn xác thương hiệu **ViOS**.
- **`apps/web/src/routes/(app)/+page.svelte`**:
  - Tái cấu trúc trang chủ thành 4 tầng phễu chuyển đổi sắc nét:
    1. **Tầng 1 (Hero Astro Dial):** Vòng xoay thiên bàn 12 cung chuyển động hào quang 60fps GPU-accelerated, nút CTA mạ vàng quét sáng dẫn vào form lập lá số Tử Vi miễn phí trong 3 giây.
    2. **Tầng 2 (Thần Khí AI Tức Thì - Bento Grid):** 4 công cụ hot hit trải nghiệm nhanh (Xem Tướng Mặt, Xem Chỉ Tay, Bát Tự Hà Lạc, Gieo Quẻ Lục Hào).
    3. **Tầng 3 (Thiệp Vàng Khởi Vận & Điểm Danh):** Thẻ VIP hoàng kim nạp XU VietQR 1-chạm, tích hợp điểm danh nhận 5 XU mỗi ngày và giới thiệu bạn bè nhận thưởng.
    4. **Tầng 4 (Ma Trận 12 Bộ Môn Thuật Số):** Thu gọn 12 hệ vào 3 nhóm chủ đề lớn (Mệnh Lý & Chiêm Tinh, Bói Dịch & Quẻ Linh, Trực Giác & Bài Học) có Accordion toggle mượt mà.
- **`apps/web/src/routes/(app)/charts/+page.svelte`**:
  - Xóa bỏ file `+page.server.ts` (redirect 307 cũ gây lỗi điều hướng nhảy sang `/history`), tạo màn hình lập lá số Tử Vi độc lập `SystemChartScreen ('zi-wei-dou-shu')`, đồng bộ chuẩn chỉ với các route `/bazi`, `/liuyao`, `/qimen`.

---

### B. Chẩn Đoán & Khắc Phục Lỗi LLM / Quét Bàn Tay (`/palm`)

#### 🔍 Nguyên nhân gốc rễ đã xác định:
1. **Client Gating (Anonymous Lock):** Mặc định khách vào web ở chế độ Ẩn danh. Tại `VisionScreen.svelte:L227` nút submit bị set `disabled={model.isAnonymous || !model.imageFile}`, khiến nút bị xám mờ, người dùng chọn ảnh xong click không có phản ứng gì (tưởng web bị đơ).
2. **Backend bỏ qua `.env.local`:** Hàm nạp env của NestJS (`apps/api/src/config/env.ts` và `dev-server.cjs`) chỉ đọc duy nhất file `.env`, hoàn toàn không đọc `.env.local` nơi nhà phát triển điền API key.
3. **Sai tên model Gemini mặc định:** `GEMINI_MODEL` bị đặt là `gemini-3.5-flash` (tên model không tồn tại trên Google AI Studio, dẫn đến lỗi 404 Not Found từ Google API).
4. **Lỗi logic trong BillingInterceptor:** `RequireXU` kiểm tra `request.user?.sub` trong khi NestJS auth gán user vào `request.authenticatedUser.userId`.

#### 🛠️ Các sửa đổi kỹ thuật đã áp dụng:
- **`apps/api/src/config/env.ts`**:
  - Bổ sung logic tự động nạp cả `.env.local` khi chạy runtime (`process.env.NODE_ENV !== 'test'`), cho phép `.env.local` override cấu hình mà không làm lệch mock trong unit test.
  - Đổi default `GEMINI_MODEL` từ `gemini-3.5-flash` thành **`gemini-2.5-flash`** chuẩn Google AI Studio.
- **`apps/api/scripts/dev-server.cjs`**:
  - Bổ sung nạp `.env.local` trước khi nạp `.env`.
- **`apps/api/src/common/interceptors/billing.interceptor.ts`**:
  - Khắc phục tham chiếu `userId = user?.userId ?? user?.sub`, đảm bảo hệ thống trừ XU chính xác khi gọi AI.
- **`apps/web/src/lib/features/vision/VisionScreen.svelte`**:
  - Nâng cấp UX: Khi người dùng chưa đăng nhập, nút submit không bị disabled xám xịt nữa mà chuyển thành nút vàng hoàng kim: **"Đăng nhập để luận giải Chỉ Tay"** (hoặc Tướng Mặt), click chuyển hướng mượt mà sang `/sign-in`.

---

### C. Phân Tích & Kiểm Soát Ngân Sách API (Unit Economics & Fraud Prevention)
- **Thuật toán 100% FREE (Chi phí API = 0đ):** An sao Tử Vi (`iztro`), Bát Tự, Thần Số Học, Gieo quẻ Kinh Dịch, Mai Hoa, Kỳ Môn, Đại Lục Nhâm, Rút bài Tarot/Lenormand/Xin Xăm chạy nội bộ bằng `@ziweiai/astro-engine`.
- **Tính năng gọi LLM (Có tính phí token):**
  - Text AI: Gemini 2.5 Flash / DeepSeek V4 tốn ~10đ – 15đ/lần. Hệ thống trừ 10 XU (1.000đ) $\rightarrow$ **Biên lợi nhuận gộp 98%**.
  - Vision AI: Quét chỉ tay / khuôn mặt tốn ~25đ – 40đ/lần. Hệ thống trừ 10 XU (1.000đ) $\rightarrow$ **Biên lợi nhuận gộp 96%**.
- **Chốt chặn chống lạm dụng:**
  - Cột `xu_balance` mặc định khởi tạo = 0 XU (chống clone acc cày XU).
  - Điểm danh mỗi ngày 5 XU khóa cứng bằng DB transaction `FOR UPDATE` theo giờ VN.
  - Quota trần cố định: tối đa 5 lượt vision/ngày/user (`API_VISION_REQUESTS_PER_DAY_PER_USER = 5`).
  - Google OAuth đã tích hợp sẵn tại `auth-store.svelte.ts` và `/sign-in`.

---

## 3. Kết Quả Kiểm Thử Toàn Diện (Validation Gates)

Tất cả các cổng kiểm thử nghiêm ngặt đều đạt **100% PASS**:

| Cổng Kiểm Thử | Lệnh Thực Thi | Kết Quả | Ghi Chú |
| :--- | :--- | :--- | :--- |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | ✅ PASSED | 0 errors |
| **API Unit Tests** | `pnpm -F @ziweiai/api test` | ✅ PASSED | **73/73 files (445/445 tests)** |
| **Web Svelte Check**| `pnpm -F @ziweiai/web check` | ✅ PASSED | **0 errors, 0 warnings** |
| **Web Unit Tests** | `pnpm -F @ziweiai/web test` | ✅ PASSED | **47/47 files (258/258 tests)** |
| **Web Build** | `pnpm -F @ziweiai/web build` | ✅ PASSED | Static build thành công |

---

## 4. Kế Hoạch Tiếp Theo (Sprint 40 — Session 2)
1. **Ticket 40.2: Mobile Polish:** Tối ưu hóa hiển thị responsive cho trang chủ mới và màn hình Quét Chỉ Tay/Tướng Mặt trên các thiết bị màn hình nhỏ (iPhone SE, Android 360px - 390px).
2. **Ticket 40.3: Production Deployment & Smoke Test:**
   - Deploy bản cập nhật lên Vercel Production (`pnpm deploy:vercel-demo`).
   - Kiểm tra live smoke test: kiểm tra health endpoint, đăng nhập Google, lập lá số và quét bàn tay thực tế trên production.

---

## 5. Prompt Chuyển Tiếp Cho Session Mới (Next Session Kickoff Prompt)

Đại Ka có thể sao chép đoạn prompt dưới đây để dán vào session mới:

```text
Chào em, tiếp tục dự án Tử Vi Toàn Tập (ziweiai-web). 
Chúng ta đang ở SPRINT 40. Ở Session 1, chúng ta đã hoàn thành xuất sắc Ticket 40.1 (Đại tu giao diện Celestial Luxury trang chủ ViOS, sửa route /charts) và khắc phục toàn bộ các lỗi liên quan đến kết nối LLM / quét bàn tay / nạp env / billing interceptor (đã pass 100% 73/73 test API và 47/47 test Web). Chi tiết đọc tại docs/handover/sprint-40-session-1-handover.md.

BÂY GIỜ BẮT ĐẦU SPRINT 40 — SESSION 2:
1. Tiếp tục Ticket 40.2: Mobile View Polish cho Trang chủ mới và giao diện Vision (/palm, /face) trên màn hình cảm ứng nhỏ (<375px).
2. Kiểm tra lại lần cuối và thực hiện Ticket 40.3: Deploy lên Vercel Demo Production qua `pnpm deploy:vercel-demo` và thực hiện Live Smoke Test theo AGENTS.md.
Hãy tuân thủ nghiêm ngặt Karpathy Guidelines, /vibe-engineering-workflow, /vibe-git-manager và báo cáo rõ ràng từng bước.
```
