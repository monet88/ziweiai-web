# Báo Cáo Bàn Giao: SPRINT 42 — PHASE 1
## Tính Năng: Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia Dạng PDF Cao Cấp (Deluxe PDF Dossier)

- **Thời gian hoàn thành**: 2026-09-09
- **Nhánh làm việc**: `feature/sprint-42-deluxe-pdf-dossier`
- **Rollback Anchor**: `3a7c9a1`
- **Commit triển khai**: `76b0620` (`feat(dossier): implement Sprint 42 Phase 1 Deluxe Royal PDF Dossier with 50 XU billing`)
- **Trạng thái**: ✅ 100% HOÀN THÀNH — VƯỢT QUA 4/4 VALIDATION GATES

---

### 1. Tổng Quan Mục Tiêu & Kết Quả Đạt Được

Sprint 42 Phase 1 giải quyết trọn vẹn bài toán thương mại hoá và trải nghiệm người dùng cao cấp cho hệ thống Tử Vi Toàn Tập (ViOS):
1. **Thiết kế Hồ sơ Mệnh Lý Hoàng Gia PDF 19 trang vector A4**:
   - Phong cách thiết kế Khâm Thiên Giám Đại Việt kết hợp thẩm mỹ tối giản hoàng gia sang trọng (mộc ấn son đỏ, viền chỉ vàng vector SVG, font chữ cổ điển có chân Serifs & Sans-serifs).
   - Tối ưu in ấn với chuẩn CSS `@media print` (`@page { size: A4 portrait; margin: 0; }`), xuất file PDF vector sắc nét 300 DPI mà không phụ thuộc vào thư viện nặng Puppeteer serverless gây quá tải dung lượng bundle Vercel (<50MB limit).
   - Cấu trúc 19 trang chuyên sâu:
     - **Trang 1**: Bìa Mộc Son Hoàng Gia, Quốc Huy ViOS, Tên đương số, Bát Tự Tứ Trụ, Mộc triện son "Khâm Thiên Giám Thần Phục".
     - **Trang 2**: Chiếu Thư Hoàng Gia & Mục lục phân định chi tiết toàn bộ hồ sơ.
     - **Trang 3**: Đại Đồ Bản Tử Vi 12 Cung toàn cảnh sắc nét vector, kèm ô Trung Cung đúc kết Âm Dương Ngũ Hành, Cục, Thân cư.
     - **Trang 4**: Cung Mệnh & Thân - Phân tích cốt cách, tâm tính, bản lĩnh và thiên mệnh căn cơ.
     - **Trang 5**: Tứ Trụ Bát Tự Chi Tiết (Năm, Tháng, Ngày, Giờ sinh, Can Chi, Thần Sát, Nạp Âm).
     - **Trang 6 - 16**: Luận giải chi tiết 11 Cung vị còn lại (Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ).
     - **Trang 17**: Thập Niên Đại Vận (Diễn trình 10 năm chuyển biến đại hạn cuộc đời).
     - **Trang 18**: Lưu Niên Bính Ngọ 2026 (Toàn cảnh biến động công danh, tài lộc, gia đạo năm hiện tại).
     - **Trang 19**: Lời Kết & Lạc Khoản, Mã QR Code bảo chứng xác thực lá số trực tuyến tại ViOS.

2. **Cơ chế Thu Phí & Mở Khóa Idempotent (50 XU)**:
   - Tích hợp trừ 50 XU vào tài khoản người dùng an toàn thông qua API backend NestJS `POST /charts/:id/dossier/unlock`.
   - Lưu trữ dấu vết mở khóa vĩnh viễn trên bảng `xu_transactions` với `transaction_type = 'pdf_dossier'` và `actor_email = 'chart:' + chartId`.
   - Mở khóa trọn đời (Idempotent): Khi người dùng đã thanh toán 50 XU cho lá số, các lần mở/in/tải sau đó hoàn toàn miễn phí (`alreadyUnlocked = true`, `xuCharged = 0`).
   - Kiểm tra số dư tức thời: Khi số dư dưới 50 XU, hiển thị Paywall Modal và hướng dẫn nạp XU ngay lập tức.

---

### 2. Chi Tiết Thay Đổi Kiến Trúc & Mã Nguồn

#### A. Packages Contracts (`packages/contracts`)
- File mới: `packages/contracts/src/dossier/pdf-dossier.ts`
  - `dossierStatusResponseSchema`: Kiểm tra lá số đã mở khóa chưa và chi phí XU.
  - `dossierUnlockRequestSchema`: Request mở khóa hồ sơ.
  - `dossierUnlockResponseSchema`: Phản hồi trạng thái sau mở khóa (số dư còn lại, xuCharged, alreadyUnlocked).
- Xuất khẩu trong: `packages/contracts/src/index.ts`.

#### B. API Backend (`apps/api`)
- Sửa đổi `WalletEngineService.deductXU`:
  - Cho phép nhận tham số tuỳ chọn `actorEmail?: string` để lưu ngữ cảnh `chart:<chartId>` khi trừ XU.
- Module mới `apps/api/src/modules/dossier/`:
  - `dossier.service.ts`: Logic nghiệp vụ kiểm tra trạng thái mở khóa idempotent từ `xu_transactions`, trừ 50 XU an toàn, ném mã lỗi HTTP 402 nếu thiếu XU.
  - `dossier.controller.ts`: Endpoint `GET /charts/:id/dossier/status` và `POST /charts/:id/dossier/unlock` bảo vệ qua JWT / Anonymous Session.
  - `dossier.module.ts`: Đăng ký vào `apps/api/src/app.module.ts`.
  - `dossier.service.test.ts`: 6 test cases bao phủ toàn diện (kiểm tra status, mở khóa lần đầu, mở khóa lặp lại idempotent, kiểm tra lỗi thiếu XU, xử lý lỗi không tìm thấy chart).

#### C. Web Frontend (`apps/web`)
- `apps/web/src/lib/api-client/dossier.ts`: Client API tương tác với endpoint dossier.
- `apps/web/src/lib/features/dossier/dossier-model.svelte.ts`: Model quản lý reactive state mở khóa, tích hợp kiểm tra số dư với `walletModel` và mở Paywall khi thiếu tiền.
- `apps/web/src/lib/features/dossier/dossier-interpretations.ts`: Engine sinh giải đoán chuyên sâu cho 12 cung, tứ trụ bát tự, thập niên đại vận và lưu niên 2026.
- `apps/web/src/lib/features/dossier/DeluxePdfDossierModal.svelte`: Modal trình diễn 19 trang A4 vector phong cách hoàng gia, hỗ trợ in ra PDF hoặc xem trước toàn màn hình.
- `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`: Tích hợp nút hành động "Hồ Sơ Hoàng Gia" (50 XU) kèm icon vương miện mạ vàng trên thanh công cụ lá số.
- `apps/web/src/lib/features/dossier/dossier.test.ts`: Unit test frontend kiểm tra logic model dossier.

---

### 3. Kết Quả Kiểm Tra Chất Lượng (Validation Gates)

1. **Contracts Gate**:
   - `pnpm -F @ziweiai/contracts test`: 18/18 test suites passed (135 tests).
   - `pnpm -F @ziweiai/contracts build`: Thành công.
2. **API Backend Gate**:
   - `pnpm -F @ziweiai/api test`: 77/77 test suites passed (477 tests). Bao gồm 6 tests mới của `dossier.service.test.ts`.
   - `pnpm -F @ziweiai/api build`: Thành công.
3. **Web Frontend Gate**:
   - `pnpm -F @ziweiai/web test`: 52/52 test suites passed (279 tests).
   - `pnpm -F @ziweiai/web check`: 0 errors, 0 warnings.
   - `pnpm -F @ziweiai/web build`: Thành công.
4. **Whole Repo Validation**:
   - `pnpm lint`: 0 errors, 0 warnings (`eslint . --max-warnings=0`).
   - `pnpm typecheck`: 10/10 tasks successful across 7 packages.
   - `pnpm test`: 891/891 unit tests passed (100%).
   - Playwright smoke test: 1 passed.

---

### 4. Đánh Giá Khảo Sát Hai Repositories (Theo Yêu Cầu Đại Ka)

1. **`colbymchenry/codegraph`**:
   - Phiên bản hiện tại: `v1.5.0` (đã cài tại `/Users/gray/.npm-global/bin/codegraph`).
   - Đã được tích hợp vào Phase 0 của quy trình chẩn đoán hệ thống `.agents/skills/behavior-model-debugger/SKILL.md`.
   - Thư mục cache `.codegraph/` đã được bảo vệ trong `.gitignore`.
2. **`abhigyanpatwari/GitNexus`**:
   - Phiên bản hiện tại: `v1.6.3` (đã cài tại `/Users/gray/.npm-global/bin/gitnexus`).
   - Thư mục cache `.gitnexus/` đã được thêm vào `.gitignore` để giữ git tree sạch sẽ tuyệt đối.
3. **Skills & Customizations**:
   - Đầy đủ 45 agent skills trong `.agents/skills` của repo phục vụ phát triển, debug, test và deploy tự động.

---

### 5. Hướng Dẫn Vận Hành & Kế Hoạch Tiếp Theo

- Nhánh đã sẵn sàng để tạo PR hoặc tiếp tục Phase 2 của Sprint 42:
  - **Sprint 42 — Phase 2**: Tối ưu hóa tải trang & lưu cache PDF Dossier phía client bằng IndexedDB.
  - **Sprint 42 — Phase 3**: Mở rộng xuất bản hồ sơ cho các hệ thuật số khác (Bát Tự Hà Lạc, Kỳ Môn Độn Giáp, Quẻ Kinh Dịch).
