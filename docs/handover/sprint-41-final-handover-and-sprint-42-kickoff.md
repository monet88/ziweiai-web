# Báo Cáo Bàn Giao Sprint 41 & Kế Hoạch Khởi Động Sprint 42

**Dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Ngày thực hiện**: 09/09/2026  
**Trạng thái Sprint 41**: ✅ **HOÀN THÀNH 100% (Phases 1 ➔ 6)**  
**Merge Pull Request**: ✅ **PR #3 đã sáp nhập vào `main`** (`0f2ef34`)  
**Live Production Deployment**: `dpl_EvjggXV5zPmE8xWZeCPt4LkGnNDR`  
**Live Production URL**: `https://tuvitoantap.vercel.app`  
**Nhánh khởi tạo Sprint 42**: `feature/sprint-42-deluxe-pdf-dossier`  
**Rollback Anchor Sprint 42**: `3a7c9a1`  
**Quy trình tuân thủ**: `/vibe-git-manager`, `/vibe-engineering-workflow`, `/behavior-model-debugger`

---

## 🎯 1. Mục Tiêu (Objectives)

1. **Tổng kết toàn diện Sprint 41**:
   - Đóng gói toàn bộ 6 phases phát triển của Sprint 41 (từ tối ưu Rate limit, khắc phục race condition điều hướng, khôi phục AI routing, minh bạch hóa chính sách giới thiệu, phòng thủ Anti-cheat Sybil, đến Trình tạo thiệp mời lan tỏa có QR không CORS và Turnstile Invisible Bot Guard).
   - Xác nhận việc hợp nhất Pull Request #3 vào nhánh `main` và triển khai sạch sẽ lên môi trường Production Vercel.
2. **Khởi động SPRINT 42 — PHASE 1**:
   - Mục tiêu trọng tâm: **Trụ Cột 1 — "Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia Dạng PDF Cao Cấp (Deluxe PDF Dossier)"**.
   - Biến lá số tử vi và báo cáo hàng năm thành tập tài liệu 15-20 trang PDF vector hoàng gia có thể in ấn hoặc lưu trữ trọn đời.
   - Kích hoạt nguồn doanh thu nạp XU đột phá (thu phí 50 - 100 XU / lần xuất bản).
3. **Thiết lập Handover Protocol & Prompt khởi tạo Session mới**:
   - Cung cấp prompt hoàn chỉnh để Đại Ka sao chép sang phiên làm việc tiếp theo mà không bị đứt đoạn ngữ cảnh hay nhầm lẫn tiến độ.

---

## 🛠️ 2. Việc Đã Làm (Work Done)

### 2.1. Đóng Gói Toàn Diện Sprint 41
- **Phase 1 & 2**: Chuẩn hóa Upstash Quota Counter Store với fallback In-Memory, bảo mật truy cập lá số qua UUID không thể đoán (`isOwner` permission gate).
- **Phase 3**: Khắc phục race condition điều hướng Sheet Navigation P0, tối ưu model AI Gemini Flash Latest.
- **Phase 4**: Tái cấu trúc bộ định tuyến AI Đa tầng (Gemini ➔ DeepSeek ➔ OpenRouter), nâng cấp trợ lý Khâm Thiên Giám với Smart Prompt Chips.
- **Phase 5**: Minh bạch hóa chính sách giới thiệu (giới hạn 5 lượt/ngày, 10 XU/lượt), cơ chế phòng vệ Sybil Attack (chặn email ảo dùng một lần Disposable Email).
- **Phase 6**:
  - Trình tạo thiệp mời chia sẻ Celestial Luxury với bộ sinh mã QR Model 2 Version 4 thuần TypeScript (loại bỏ hoàn toàn lỗi CORS / Canvas Tainted).
  - Tích hợp Cloudflare Turnstile Invisible Bot Guard bảo vệ form đăng ký và nút điểm danh nhận XU.
  - Phẫu thuật dọn sạch 16 lỗi linter (0 errors, 0 warnings).

### 2.2. Hợp Nhất Git & Triển Khai Production (`/vibe-git-manager`)
- Squash-merge thành công **Pull Request #3** vào `main` (`0f2ef34`).
- Đồng bộ nhánh `main` cục bộ trùng khớp hoàn toàn với `origin/main` (`git reset --hard origin/main`).
- Triển khai thành công lên Vercel Production:
  - **Deployment ID**: `dpl_EvjggXV5zPmE8xWZeCPt4LkGnNDR`.
  - **Alias**: `https://tuvitoantap.vercel.app`.
  - Smoke tests sống đạt tỷ lệ 100% (`/api/health`, `/api/features`, `/api/auth/turnstile/verify`).
- Tạo nhánh làm việc mới cho Sprint 42:
  ```bash
  git checkout -b feature/sprint-42-deluxe-pdf-dossier
  ```
  Rollback Anchor ghi nhận: `3a7c9a1`.

---

## 📊 3. Kết Quả Nghiệm Thu Sprint 41 (Results Matrix)

| Tiêu chuẩn kiểm định | Kết quả thực tế | Trạng thái |
| :--- | :---: | :---: |
| **Monorepo Linting** | `eslint . --max-warnings=0` | ✅ **0 errors, 0 warnings (100% Clean)** |
| **Monorepo Typecheck** | `turbo run typecheck` | ✅ **10/10 tasks successful (7 packages)** |
| **Contracts Tests** | `packages/contracts` | ✅ **18/18 test files passed (135 tests)** |
| **Backend API Tests** | `apps/api` | ✅ **76/76 test files passed (471 tests)** |
| **Frontend Web Tests** | `apps/web` | ✅ **51/51 test files passed (277 tests)** |
| **Svelte 5 Diagnostics** | `svelte-check` | ✅ **0 errors, 0 warnings** |
| **Tổng số Automated Tests** | Toàn bộ monorepo | ✅ **883 / 883 tests PASSED (100%)** |
| **Hạ tầng máy chủ** | Vercel Serverless + Supabase | ✅ **100% Serverless Cloud-Native (0 VPS)** |

---

## 🚀 4. Kế Hoạch SPRINT 42 — PHASE 1: DELUXE PDF DOSSIER

### 4.1. Tên Tính Năng
**"Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia Dạng PDF Cao Cấp (Deluxe PDF Dossier)"**

### 4.2. Yêu Cầu Chức Năng & UX
1. **Nút Hành Động Trên Trang Lá Số (`/charts/[chartId]`)**:
   - Thêm nút "Xuất Bản Hồ Sơ PDF Hoàng Gia" tại thanh công cụ hành động.
   - Hiển thị nhãn giá: `50 XU` (kèm biểu tượng hoàng kim).
   - Kiểm tra số dư ví XU của người dùng; nếu không đủ thì tự động bật modal nạp XU VietQR.
2. **Cấu Trúc Hồ Sơ PDF (15 - 20 Trang Chuẩn In Ấn)**:
   - **Trang Bìa (Cover Page)**: Nền giấy điệp cổ điển, khung viền hoàng gia dát vàng, tiêu đề "HỒ SƠ MỆNH LÝ TOÀN THƯ", họ tên, ngày giờ sinh âm dương, triện son đỏ "ViOS Khâm Thiên Giám".
   - **Trang 2: Tổng Quan Bản Mệnh**: Bảng tóm tắt Mệnh, Cục, Thân, Âm Dương, Ngũ Hành nạp âm, Chủ Mệnh, Chủ Thân.
   - **Trang 3: Toàn Cảnh Tinh Bàn 12 Cung**: Tinh bàn đồ họa vector sắc nét (sử dụng SVG vector rendering chuẩn in A4 300 DPI).
   - **Trang 4 - 15: Đại Luận Chi Tiết 12 Cung**: Phân tích chuyên sâu từng cung (Mệnh, Huynh Đệ, Phu Thê, Tử Tức, Tài Bạch, Tật Ách, Thiên Di, Nô Bộc, Quan Lộc, Điền Trạch, Phúc Đức, Phụ Mẫu).
   - **Trang 16 - 18: Thập Niên Đại Vận & Lưu Niên Bính Ngọ 2026**.
   - **Trang Cuối**: Lời chúc phúc và mã QR xác thực hồ sơ số hóa.
3. **Kiến Trúc Kỹ Thuật (Architecture & Performance)**:
   - Giải pháp tạo PDF không làm phình Serverless Function của Vercel (tránh vượt ngưỡng 50MB bundle):
     - **Tùy chọn A (Khuyến nghị cho Frontend/Client)**: Tạo template in ấn chuẩn `@media print` và xuất PDF vector trực tiếp qua `html2canvas` / `jsPDF` hoặc trình in trình duyệt tối ưu hóa khổ A4.
     - **Tùy chọn B (Backend PDF Service)**: Endpoint `POST /api/charts/:id/export-pdf` sử dụng template SSR kết hợp thư viện PDF vector nhẹ nhàng (ví dụ `pdfkit` / `@react-pdf/renderer` hoặc Puppeteer serverless tối ưu).

---

## 📋 5. PROMPT KHỞI ĐỘNG SESSION MỚI (DÀNH CHO ĐẠI KA)

*(Đại Ka chỉ cần copy toàn bộ đoạn dưới đây và dán vào khung chat của Session mới)*

```markdown
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã hoàn thành xuất sắc 100% SPRINT 41 (Phases 1 -> 6), đã merge PR #3 vào main và deploy live production tại https://tuvitoantap.vercel.app (Deployment ID: dpl_EvjggXV5zPmE8xWZeCPt4LkGnNDR).
Tài liệu bàn giao chi tiết nằm tại: docs/handover/sprint-41-final-handover-and-sprint-42-kickoff.md

BÂY GIỜ CHÚNG TA BẮT ĐẦU:
SPRINT 42 — PHASE 1:
"Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia Dạng PDF Cao Cấp (Deluxe PDF Dossier)"
- Branch làm việc: feature/sprint-42-deluxe-pdf-dossier (đã tách từ main)
- Rollback Anchor: 3a7c9a1

Yêu cầu thực hiện:
1. Đọc file bàn giao docs/handover/sprint-41-final-handover-and-sprint-42-kickoff.md và kiểm tra git status.
2. Thiết kế và phát triển tính năng Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia PDF (15-20 trang chuẩn A4 vector, bìa mộc son hoàng gia, chi tiết 12 cung + lưu niên 2026).
3. Tích hợp thanh toán phí 50 XU khi xuất bản hồ sơ PDF tại trang lá số /charts/[chartId].
4. Tuân thủ 3 workflows: /vibe-git-manager, /vibe-engineering-workflow, /behavior-model-debugger.
5. Vượt qua 4 validation gates (Contracts, API, Web, Typecheck, Svelte diagnostics) và deploy Vercel demo.
Báo cáo tiến độ và bắt đầu ngay giúp tôi!
```
