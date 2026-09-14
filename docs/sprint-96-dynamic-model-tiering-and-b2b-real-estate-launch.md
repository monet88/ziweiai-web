# SPRINT 96: DYNAMIC MODEL TIERING, B2B REAL ESTATE LAUNCH & SECURITY HARDENING

## 1. TỔNG QUAN SPRINT 96
- **Thời gian hoàn thành:** 14/09/2026
- **Trạng thái:** 100% HOÀN THÀNH — PRODUCTION READY
- **Branch:** `main` (Working tree clean, 1.016/1.016 unit/integration tests passed)
- **Cấu hình Security & Audit:** 0 vulnerabilities (`pnpm audit`), git remote sạch PAT, notification endpoints fail-closed an toàn tuyệt đối.

---

## 2. CÁC HẠNG MỤC THỰC THI CHÍNH

### 2.1. Xử Lý 3 Finding Bảo Mật Từ Codex Audit
1. **CRITICAL — Lộ GitHub PAT trong `.git/config`:**
   - Đã gỡ bỏ URL chứa credential; chuyển git remote về định danh HTTPS sạch: `https://github.com/galaxypro710-stack/ziweiai-web.git`.
   - *Khuyến nghị Đại Ka:* Thu hồi (Revoke/Rotate) token PAT cũ trong mục Settings -> Developer Settings -> Personal access tokens trên GitHub.
2. **HIGH — Notification Endpoint Fail-Open Khi Thiếu CRON_SECRET:**
   - Đã sửa tại `apps/api/src/modules/notifications/notifications.controller.ts`.
   - Khi môi trường `production` thiếu `CRON_SECRET`, controller ngay lập tức ném `UnauthorizedException` (Fail-Closed) thay vì cho phép request đi qua.
   - Viết 12/12 unit tests kiểm chứng hành vi môi trường test/dev và production.
3. **MEDIUM — 17 Dependency Security Advisories:**
   - Cấu hình `pnpm.overrides` trong `package.json` với semver an toàn:
     - `"undici": "^7.28.0"` (tránh v8 breaking change làm gãy `jsdom`).
     - `"js-yaml": "^4.3.2"`
     - `"vitest": "^4.1.11"`
     - `"@vitest/mocker": "^4.1.11"`
     - `"@vitest/coverage-v8": "^4.1.11"`
   - Kết quả `pnpm audit`: **No known vulnerabilities found (0 vulnerabilities)**.

---

### 2.2. Triển Khai Dynamic Model Tiering (Tiết Kiệm Thêm 60% Chi Phí Gemini)
- **Mục tiêu:** Phân tách rõ ràng tác vụ nhẹ (High Frequency Micro-tasks) và tác vụ chuyên sâu (Deep Reasoning Long-form Reports).
- **Cấu hình biến môi trường (`apps/api/src/config/env.ts`):**
  - `GEMINI_MODEL_LIGHT`: Mặc định `'gemini-2.0-flash-lite'` (0.075$/1M input tokens, 0.30$/1M output tokens).
  - `GEMINI_MODEL_DEEP`: Mặc định `'gemini-2.5-flash'` (0.15$/1M input tokens, 0.60$/1M output tokens).
- **Cơ chế định tuyến tự động:**
  - `gemini-explanation-provider.ts` tự động gán `tier: 'light'` cho các micro-features: `tarot-reading`, `lenormand-reading`, `sticks-reading`, `dream-interpretation`, `almanac-advice`, `mbti-reading` và toàn bộ hội thoại chat (`build-conversation-prompt`).
  - Tự động gán `tier: 'deep'` cho: Báo Cáo Năm (`annual-report`), Hồ Sơ Hoàng Gia Deluxe PDF (`dossier`), và phân tích toàn cảnh lá số nguyên bản.
  - Cho phép override rõ ràng qua `tier?: 'light' | 'deep'` tại `ai-feature-execution.orchestrator.ts`.

---

### 2.3. Ra Mắt Combo Bính Ngọ 2026 & Pivot B2B Cho Chuyên Viên Bất Động Sản, Xây Dựng
1. **Phân tích chiến lược của Đại Ka:**
   - Nhóm chuyên viên BĐS, nhà thầu xây dựng và chủ doanh nghiệp có nhu cầu tử vi, phong thủy động thổ, khai móng, hướng đất, chọn ngày nhập trạch cao nhất và sẵn sàng chi ngân sách lớn.
   - Nhu cầu tặng quà đẳng cấp: In ấn xuất bản **Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang PDF** đóng bìa trao tay cùng sổ hồng và chìa khóa nhà tạo niềm tin và khẳng định vị thế.
2. **Cấu hình gói cước mới (`apps/web/src/lib/features/payment/pricing-config.ts`):**
   - **Gói Combo "Bính Ngọ Khởi Sắc 2026" (Seasonal):**
     - Giá: **79.000đ** -> Nhận **100 XU** (Tặng Báo Cáo Vận Hạn Năm 2026 trọn đời + 85 XU tự do).
     - Badge đỏ son: `"BÍNH NGỌ 2026"`.
   - **Gói VIP Chuyên Viên BĐS, Xây Dựng & Doanh Nghiệp (B2B):**
     - Giá: **790.000đ** -> Nhận **1.000 XU** (Giá sỉ ưu đãi 790đ/XU, tiết kiệm 50%).
     - Tương đương: Xuất 20 cuốn Hồ Sơ Hoàng Gia 19 Trang PDF hoặc 330 câu hỏi chuyên sâu.
     - Badge tím xanh thượng lưu: `"GÓI DOANH NGHIỆP / BĐS"`.
3. **Backend SePay Webhook Matching Engine (`apps/api/src/modules/payment/payment.service.ts`):**
   - Số tiền >= 790.000đ -> Quy đổi **1.000 XU** (B2B Enterprise).
   - Số tiền >= 79.000đ -> Quy đổi **100 XU** (Combo Bính Ngọ).
   - Đảm bảo tính toán độc lập, không xung đột với các ngưỡng nạp hiện có (100k, 200k, 500k).
4. **Giao diện Người Dùng Sang Trọng:**
   - **Trang chủ (`apps/web/src/routes/(app)/+page.svelte`):** Thêm Tầng Landing B2B chuyên biệt với 3 giá trị trụ cột (Tư Vấn Động Thổ, Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang, Gói Sỉ 1.000 XU).
   - **Trang Bảng Giá (`apps/web/src/routes/(app)/pricing/+page.svelte`):** Thêm Banner đặc quyền B2B Enterprise và các thẻ gói cước có hiệu ứng gradient tím xanh.
   - **Trang Ví XU (`apps/web/src/routes/(app)/wallet/+page.svelte`):** Tích hợp đầy đủ badge và kích hoạt 1-click quét mã VietQR tự động.

---

## 3. THÔNG SỐ KIỂM CHỨNG & VERIFICATION GATES

| Verification Gate | Lệnh Kiểm Tra | Kết Quả |
| :--- | :--- | :--- |
| **Svelte Check** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** |
| **Turbo Typecheck** | `pnpm typecheck` | **10/10 tasks successful (0 errors)** |
| **Monorepo Test Suite** | `pnpm test` | **1.016/1.016 tests passed** (API: 586, Web: 430) |
| **Security Audit** | `pnpm audit` | **0 vulnerabilities found** |

---

## 4. BÀN GIAO & KHUYẾN NGHỊ VẬN HÀNH CHO ĐẠI KA
1. **GitHub PAT:** Đại Ka vui lòng vào GitHub `Settings -> Developer settings -> Personal access tokens` để xóa/thu hồi token cũ đã từng được lưu cục bộ.
2. **Triển khai Production:**
   - Khi deploy Vercel demo, chỉ cần chạy lệnh chuẩn: `pnpm deploy:vercel-demo`.
   - Đảm bảo biến `CRON_SECRET` đã được cấu hình trong Vercel Environment Variables để các tác vụ thông báo tự động (Cron job) hoạt động trơn tru.
