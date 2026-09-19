# Báo Cáo Tổng Hợp: Sprint 42 — Phase 1
## Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia Dạng PDF Cao Cấp (Deluxe PDF Dossier) & Thanh Toán 50 XU

- **Dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Ngày hoàn thành**: 2026-09-09
- **Nhánh triển khai**: `feature/sprint-42-deluxe-pdf-dossier`
- **Rollback Anchor**: `3a7c9a1`
- **Latest Commit**: `80e2458`
- **Trạng thái**: ✅ **100% HOÀN THÀNH — PRODUCTION DEPLOYED**
- **Production URL**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)
- **Deployment ID**: `dpl_8ZFVFSorQsBM3mgBERfVbbXzpMds`

---

## 1. 🎯 Mục Tiêu (Objective)

Trong tiến trình phát triển của ViOS, sau khi đã hoàn thiện hạ tầng Lập lá số + Luận giải AI + Nạp XU tự động (SePay QR) + Referral Viral + Anti-cheat (Sprint 41), bài toán then chốt tiếp theo của **Sprint 42** là **Tối đa hóa Doanh thu (Revenue Acceleration) & Nâng tầm Trải nghiệm Người Dùng (Premium Delight)**.

### Mục tiêu cụ thể của Phase 1:
1. **Thiết kế Hồ sơ Mệnh Lý Hoàng Gia PDF Cao Cấp (15 - 20 trang chuẩn in ấn A4 vector)**:
   - Mang đậm mỹ cảm Khâm Thiên Giám Đại Việt: Quốc ấn son đỏ, vương miện mạ vàng, đồ bản tinh tế, phong cách quý phái.
   - Luận giải toàn diện: Cung Mệnh - Thân, Tứ Trụ Bát Tự chi tiết, 12 Cung chức, Thập Niên Đại Vận và Lưu Niên Bính Ngọ 2026.
   - Giải pháp in ấn và xuất PDF vector sắc nét 300 DPI mà **không làm phình Serverless Bundle của Vercel** (vượt ngưỡng 50MB).
2. **Cơ chế Thu Phí & Mở Khóa An Toàn 50 XU (Idempotent Billing)**:
   - Tích hợp kiểm tra số dư ví XU của người dùng tại trang lá số `/charts/[chartId]`.
   - Trừ 50 XU khi người dùng mở khóa hồ sơ lần đầu tiên.
   - Mở khóa vĩnh viễn (Idempotent): Các lần mở, xem, in ấn hoặc tải lại sau đó hoàn toàn miễn phí.
   - Tự động kích hoạt Paywall Modal nếu tài khoản chưa đủ 50 XU.
3. **Khảo sát Công nghệ & Môi trường**:
   - Khảo sát 2 kho mã nguồn `colbymchenry/codegraph` và `abhigyanpatwari/GitNexus`.
   - Đảm bảo tuân thủ nghiêm ngặt 3 workflows: `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger`.
   - Vượt qua 4 validation gates: Contracts, API, Web, Typecheck, Svelte diagnostics và Playwright smoke test.

---

## 2. 🧠 Phân Tích Kỹ Thuật & Kiến Trúc (Technical Analysis & Architecture)

### 2.1. Kiến Trúc In Ấn Vector Phía Client (Client-Side Vector Print vs Serverless Puppeteer)
- **Vấn đề cốt lõi**: Việc triển khai Puppeteer / Chromium trên môi trường Vercel Serverless Function thường kéo theo binary Chromium kích thước > 45MB - 120MB, dễ chạm trần giới hạn 50MB của Vercel và gây lỗi Cold Start kéo dài 10 - 15 giây.
- **Giải pháp tối ưu của ViOS**:
  - Tận dụng sức mạnh kết xuất đồ họa vector của trình duyệt hiện đại qua HTML5 + CSS `@media print`.
  - Thiết lập thuộc tính `@page { size: A4 portrait; margin: 0; }` cùng cơ chế ngắt trang tuyệt đối `break-after: page; page-break-after: always;`.
  - Khi người dùng bấm "In hoặc Xuất PDF", trình duyệt gọi trực tiếp API in hệ thống (`window.print()`), cho phép xuất file PDF vector nguyên bản với độ phân giải siêu nét (300+ DPI), giữ nguyên màu sắc hoàng gia và không tốn bất kỳ tài nguyên máy chủ hay dung lượng bundle nào.
  - Serverless Function của API giữ ở mức cực kỳ tinh gọn: chỉ **7.87 MB**!

### 2.2. Chiến Lược Giao Dịch Idempotent Cho Ví XU
- **Nguyên lý bất biến**: Mỗi lá số chỉ trừ 50 XU một lần duy nhất cho một tài khoản.
- **Hiện thực hóa**:
  - Mở rộng phương thức `WalletEngineService.deductXU` trên backend NestJS để nhận thêm tham số `actorEmail?: string`.
  - Khi trừ XU cho hồ sơ PDF, hệ thống ghi bản ghi giao dịch vào bảng `xu_transactions` với `transaction_type = 'pdf_dossier'` và `actor_email = 'chart:' + chartId`.
  - Khi người dùng gửi yêu cầu mở khóa, backend kiểm tra trước xem đã có bản ghi nào khớp điều kiện trên chưa. Nếu đã có, trả về ngay `alreadyUnlocked = true`, `xuCharged = 0` mà không gọi trừ XU.

---

## 3. 🛠️ Việc Đã Làm (Work Executed)

### 3.1. Contracts Layer (`packages/contracts`)
- Tạo schema Zod `packages/contracts/src/dossier/pdf-dossier.ts`:
  - `dossierStatusResponseSchema`: Kiểm tra trạng thái đã mở khóa và mức phí.
  - `dossierUnlockRequestSchema`: Dữ liệu yêu cầu mở khóa.
  - `dossierUnlockResponseSchema`: Phản hồi trạng thái sau khi mở khóa.
- Xuất khẩu toàn bộ qua `packages/contracts/src/index.ts`.

### 3.2. Backend API Layer (`apps/api`)
- Cập nhật `WalletEngineService` (`apps/api/src/modules/wallet/wallet-engine.service.ts`):
  - Hỗ trợ lưu trữ tham chiếu ngữ cảnh `actorEmail` (ví dụ `chart:<chartId>`) vào `xu_transactions`.
- Xây dựng module mới `apps/api/src/modules/dossier/`:
  - `dossier.service.ts`: Xử lý nghiệp vụ kiểm tra idempotent, kiểm tra quyền sở hữu lá số, trừ 50 XU và ghi log.
  - `dossier.controller.ts`: 2 endpoints RESTful:
    - `GET /charts/:id/dossier/status`: Lấy trạng thái mở khóa.
    - `POST /charts/:id/dossier/unlock`: Mở khóa hồ sơ bằng 50 XU.
  - `dossier.module.ts`: Đăng ký vào `app.module.ts`.
  - `dossier.service.test.ts`: Bộ 6 unit tests bao phủ 100% các nhánh nghiệp vụ.

### 3.3. Frontend Web Layer (`apps/web`)
- Tạo API client `apps/web/src/lib/api-client/dossier.ts`.
- Tạo Reactive Model `apps/web/src/lib/features/dossier/dossier-model.svelte.ts`:
  - Quản lý trạng thái mở khóa, số dư ví, tự động kích hoạt Paywall Modal khi thiếu XU.
- Xây dựng bộ giải đoán chuyên sâu `apps/web/src/lib/features/dossier/dossier-interpretations.ts`:
  - Tổng hợp dữ liệu bát tự, tính chất sao, đại vận và lưu niên 2026.
- Phát triển giao diện cao cấp `apps/web/src/lib/features/dossier/DeluxePdfDossierModal.svelte`:
  - Thiết kế 19 trang chuẩn A4 vector: Bìa mộc son hoàng gia, chiếu thư mục lục, đại đồ bản 12 cung toàn cảnh, 12 cung chi tiết, thập niên đại vận, lưu niên Bính Ngọ 2026, triện son lạc khoản và mã QR bảo chứng.
  - Tối ưu CSS `@media print` cho in ấn chuẩn A4.
- Gắn nút hành động trên `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`:
  - Nút "Hồ Sơ Hoàng Gia" (50 XU) mạ vàng sang trọng trên thanh công cụ lá số.
- Viết unit test frontend: `apps/web/src/lib/features/dossier/dossier.test.ts`.

### 3.4. Khảo Sát Hai Kho Mã Nguồn
1. **`colbymchenry/codegraph`**:
   - Đã cài đặt phiên bản CLI `v1.5.0` tại `/Users/gray/.npm-global/bin/codegraph`.
   - Đã tích hợp sẵn vào quy trình Phase 0 của `.agents/skills/behavior-model-debugger/SKILL.md`.
   - `.codegraph/` đã được ignore an toàn trong `.gitignore`.
2. **`abhigyanpatwari/GitNexus`**:
   - Đã cài đặt phiên bản CLI `v1.6.3` tại `/Users/gray/.npm-global/bin/gitnexus`.
   - Đã bổ sung `.gitnexus/` vào `.gitignore` để bảo đảm repository không bị dính file rác.

---

## 4. 📈 Kết Quả Đạt Được (Results & Verification Evidence)

### 4.1. Kết Quả Kiểm Tra Tự Động (Validation Gates)
| Hạng Mục | Lệnh Thực Thi | Kết Quả Thực Tế | Trạng Thái |
| :--- | :--- | :---: | :---: |
| **Contracts** | `pnpm -F @ziweiai/contracts test` | 18/18 suites passed (135 tests) | ✅ ĐẠT |
| **API Backend** | `pnpm -F @ziweiai/api test` | 77/77 suites passed (477 tests) | ✅ ĐẠT |
| **Web Frontend** | `pnpm -F @ziweiai/web test` | 52/52 suites passed (279 tests) | ✅ ĐẠT |
| **Svelte 5 Diagnostics** | `pnpm -F @ziweiai/web check` | 0 errors, 0 warnings | ✅ ĐẠT |
| **Monorepo Linting** | `pnpm lint` (`eslint . --max-warnings=0`) | 0 errors, 0 warnings | ✅ ĐẠT |
| **Monorepo Typecheck** | `pnpm typecheck` | 10/10 tasks successful (7 packages) | ✅ ĐẠT |
| **Tổng Unit Tests** | `pnpm test` | **891 / 891 tests passed (100%)** | ✅ ĐẠT |
| **Playwright E2E Smoke**| `tests/e2e/smoke.spec.ts` | 1 passed | ✅ ĐẠT |

### 4.2. Kết Quả Triển Khai Production Vercel
- **Deployment Status**: READY
- **Deployment ID**: `dpl_8ZFVFSorQsBM3mgBERfVbbXzpMds`
- **Production Alias**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)
- **API Serverless Bundle Size**: `7.87 MB` (cực nhẹ và an toàn).
- **Production Smoke Verification**:
  - `GET /api/health` ➔ `{"service":"ziweiai-api","status":"ok","version":"0.1.0"}`
  - `GET /api/features` ➔ Đầy đủ 10/10 features.

### 4.3. Quản Lý Git & Phân Nhánh
- **Nhánh làm việc**: `feature/sprint-42-deluxe-pdf-dossier`
- **Commit hash**:
  - `76b0620`: `feat(dossier): implement Sprint 42 Phase 1 Deluxe Royal PDF Dossier with 50 XU billing`
  - `80e2458`: `docs(handover): record Sprint 42 Phase 1 completion and live Vercel deployment`
- Đã đẩy (push) hoàn chỉnh lên remote GitHub `origin/feature/sprint-42-deluxe-pdf-dossier`.
