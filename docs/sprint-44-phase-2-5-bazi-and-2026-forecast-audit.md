# SPRINT 44 — PHASE 2.5: BÁT TỰ TỨ TRỤ & VẬN KHÍ 2026 BÍNH NGỌ
## AUDIT CODEBASE, KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI HOÀNG GIA

- **Ngày khởi tạo**: 09/09/2026
- **Dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web` / `apps/mobile`)
- **Nhánh làm việc**: `feature/sprint-44-mobile-royal-redesign`
- **Màn hình Stitch MCP**: `041e4565c7124a10b969df277fd9e4b3` (Resource: `projects/1561298019822402065/screens/041e4565c7124a10b969df277fd9e4b3`)
- **Phương pháp thực thi**: Tuân thủ nghiêm ngặt `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger`.

---

## 1. MỤC TIÊU DỰ ÁN (PROJECT OBJECTIVE)

Hiện thực hóa Màn hình 5 trong bộ 6 màn hình Stitch MCP Cung Đình: **Bát Tự Tứ Trụ & Vận Khí Năm 2026 Bính Ngọ** vào ứng dụng di động Flutter (`apps/mobile`), mang lại trải nghiệm mệnh lý cung đình chuẩn phong cách Hoàng Gia (Royal Celestial Edition):

1. **Bảng Tứ Trụ Tiên Thiên 4 Cột (Four Pillars Matrix)**:
   - 4 Cột đối xứng trực quan: **Trụ Năm**, **Trụ Tháng**, **Trụ Ngày**, **Trụ Giờ**.
   - Mỗi cột hiển thị đầy đủ: Thiên Can, Địa Chi, Thập Thần (Chính Quan, Thất Sát, Thiên Tài, Chính Tài, Thiên Ấn, Chính Ấn, Thực Thần, Thương Quan, Tỷ Kiên, Kiếp Tài).
   - **Nhật Chủ (Day Master)** tại Trụ Ngày được làm nổi bật với hào quang vàng hoàng kim (`goldGlow`), viền `goldBright` và huy hiệu "Nhật Chủ".
   - Tàng Can (Ẩn Can trong Địa Chi) và Vòng 12 Trường Sinh (Trường Sinh, Lâm Quan, Đế Vượng, Suy, Bệnh, Tử, Mộ, Tuyệt...).

2. **Thanh Đo Cân Bằng Ngũ Hành & Định Tam Thần (Five Elements & Deities)**:
   - Đo lường chính xác tỷ lệ phân bổ của 5 nguyên tố: **Kim, Mộc, Thủy, Hỏa, Thổ**.
   - Phân tích tương quan Vượng/Nhược của bản mệnh.
   - Định danh bộ ba thần quyết định cuộc đời:
     - **Chân Dụng Thần**: Nguyên tố cứu rỗi, cân bằng bản mệnh (ví dụ: Thổ).
     - **Hỷ Thần**: Nguyên tố tương trợ, gia tăng cát khí (ví dụ: Kim).
     - **Kỵ Thần**: Nguyên tố xung khắc cần tiết chế, đề phòng (ví dụ: Hỏa).

3. **Vận Khí Lưu Niên 2026 Bính Ngọ (Year 2026 Forecast)**:
   - Phân tích tương tác giữa Thiên Can Bính Hỏa & Địa Chi Ngọ Hỏa năm 2026 với Tứ Trụ và Nhật Chủ của thân chủ.
   - Đánh giá 4 trụ cột vận trình then chốt qua điểm số và lời giải:
     - **Sự nghiệp & Công danh** (Thăng trầm, cơ hội chuyển biến).
     - **Tài chính & Tiền tài** (Chính tài, hoạnh tài, dòng tiền).
     - **Tình cảm & Gia đạo** (Đào hoa, hòa hợp, hôn nhân).
     - **Sức khỏe & Bình an** (Hỏa khí vượng, ngũ hành tiêu hao).

4. **Khâm Thiên Giám Ngự Phê & Nút Hành Động Thumb-Zone 48dp**:
   - Thẻ luận giải sâu bằng AI bản quyền Khâm Thiên Giám (mở khóa 5 XU).
   - Nút hành động nổi bật "👑 MỞ HỒ SƠ BÁT TỰ HOÀNG GIA 17 TRANG" kích thước $\ge 48\text{dp}$.

---

## 2. CODEBASE AUDIT (HIỆN TRẠNG ỨNG DỤNG)

### 2.1. Kiểm Tra Cấu Trúc `apps/mobile`
- **Thư mục hiện có**:
  - `lib/features/home/`: Đã hoàn thiện Bento Grid hoàng gia (Phase 2.1). Card "Bát Tự Tứ Trụ" đã có trên UI nhưng chưa có route `/bazi` kết nối.
  - `lib/features/charts/`: Tử Vi Đẩu Số 12 Cung và Modal Bottom Sheet (Phase 2.2).
  - `lib/features/iching/`: Lục Hào Chiêm Bốc 3D Khang Hy (Phase 2.3).
  - `lib/features/stick/`: Linh Xăm Quan Thánh 3D & Thoại Bôi Âm Dương (Phase 2.4).
- **Phần Bát Tự**: Chưa có module `lib/features/bazi/`.
- **Hệ thống Design System**: Đã có `AppTheme`, `RoyalColors`, `CelestialShadows`, `RoyalDecorations`, `GoldDivider` sẵn sàng để tái sử dụng tối đa mà không gây phân mảnh CSS hay tokens.

### 2.2. Kiểm Tra Contracts & Models
- `packages/contracts/src/chart/bazi-terms.ts` đã chuẩn hóa toàn bộ:
  - Can: Giáp, Ất, Bính, Đinh, Mậu, Kỷ, Canh, Tân, Nhâm, Quý.
  - Chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi.
  - Ngũ hành: Kim, Mộc, Thủy, Hỏa, Thổ.
  - Thập thần: Tỷ Kiên, Kiếp Tài, Thực Thần, Thương Quan, Thiên Tài, Chính Tài, Thất Sát, Chính Quan, Thiên Ấn, Chính Ấn, Nhật Chủ.
- Sẽ ánh xạ trực tiếp các thuật ngữ này vào model Flutter `bazi_models.dart`.

---

## 3. CÁC CÔNG VIỆC ĐÃ THỰC HIỆN (ACCOMPLISHMENTS)

1. **Domain & Data Layer**:
   - [`apps/mobile/lib/features/bazi/data/models/bazi_models.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/bazi/data/models/bazi_models.dart):
     - `BaziPillarData`: Trụ (tên trụ, can, chi, hành can, hành chi, thập thần, tàng can, trường sinh, cờ `isDayMaster`).
     - `ElementRatio`: Tỷ lệ ngũ hành, tên, màu sắc, phần trăm, trạng thái (Cực Vượng, Vượng, Bình Hòa, Hưu Tù, Bất Cập).
     - `DeityDefinition`: Chân Dụng Thần, Hỷ Thần, Kỵ Thần kèm mô tả phong thủy chi tiết.
     - `ForecastPillar`: Điểm số (0-100), đánh giá cát hung, lời bàn sự nghiệp / tài chính / tình duyên / sức khỏe.
     - `BaziChartData`: Tổng hợp đầy đủ thông tin đương số, Tứ Trụ, Ngũ Hành, Tam Thần và Vận hạn 2026.
   - [`apps/mobile/lib/features/bazi/data/repositories/bazi_repository.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/bazi/data/repositories/bazi_repository.dart):
     - Triển khai `getBaziChart`: cung cấp dữ liệu Bát Tự mẫu hoàng gia chuẩn xác (Đương số Hoàng Nam, Nhật Chủ Tân Kim, Dụng Thần Thổ, Hỷ Thần Thủy, Kỵ Thần Hỏa).
     - Triển khai `requestAiExplanation`: trả về bài sớ Khâm Thiên Giám Ngự Phê chuyên sâu cách cục Quan Ấn Tương Sinh và bí chỉ khai vận 2026.
   - [`apps/mobile/lib/features/bazi/providers/bazi_provider.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/bazi/providers/bazi_provider.dart):
     - Quản lý state qua `Notifier<BaziState>` và `NotifierProvider`.
     - Tự động tải chart khi khởi tạo, đồng bộ và trừ 5 XU ví (`walletBalanceProvider`) khi mở khóa bài luận giải AI.

2. **Presentation Layer**:
   - [`apps/mobile/lib/features/bazi/presentation/bazi_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/bazi/presentation/bazi_screen.dart):
     - Thiết kế theo chuẩn Stitch MCP `041e4565c7124a10b969df277fd9e4b3`:
       - Top Bar hoàng gia với nút quay lại 48dp chuẩn accessibility và huy hiệu số dư ví XU.
       - Thẻ đương số hoàng cung với huy hiệu Nhật Chủ phát quang vàng hoàng kim.
       - Bảng Tứ Trụ Tiên Thiên 4 cột đối xứng (Năm, Tháng, Ngày, Giờ) với cột Trụ Ngày nổi bật hiệu ứng `CelestialShadows.goldGlow`.
       - Thước đo cân bằng Ngũ Hành 5 màu phong thủy và lưới tỷ lệ phần trăm trực quan.
       - Thẻ Tam Thần Định Mệnh: Chân Dụng Thần (Thổ), Hỷ Thần (Thủy), Kỵ Thần (Hỏa).
       - Khối Vận Khí Năm 2026 Bính Ngọ: 4 trụ cột vận hạn (Sự nghiệp 88, Tài chính 82, Tình cảm 75, Sức khỏe 70).
       - Khâm Thiên Giám Ngự Phê: CTA mở khóa 5 XU kèm Dialog xác nhận và bài sớ Markdown triện son ngự bút.
       - Nút lớn Thumb-zone 52dp "👑 MỞ HỒ SƠ BÁT TỰ HOÀNG GIA 17 TRANG".

3. **Routing & Navigation**:
   - Đăng ký route `/bazi` trong [`apps/mobile/lib/core/router/app_router.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/core/router/app_router.dart).
   - Cập nhật sự kiện chạm `onTap` của thẻ "Bát Tự Tứ Trụ" trên Bento Grid [`apps/mobile/lib/features/home/presentation/home_screen.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/lib/features/home/presentation/home_screen.dart) điều hướng trực tiếp tới `/bazi`.

4. **Widget Testing & Verification Gates**:
   - Tạo mới test suite [`apps/mobile/test/features/bazi/presentation/bazi_screen_test.dart`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/mobile/test/features/bazi/presentation/bazi_screen_test.dart) (2/2 passed 100%).
   - Kiểm thử toàn bộ codebase `apps/mobile`:
     - `flutter analyze`: **0 errors, 0 warnings (ran in 3.1s)**.
     - `flutter test`: **47/47 tests PASS 100% (ran in 12s)**.

---

## 4. KẾT QUẢ ĐẠT ĐƯỢC (ACTUAL RESULTS)

- **Hoàn thành 5/6 màn hình Stitch MCP Cung Đình**:
  1. ✅ Màn 1: Royal Home Dashboard (`fc2849fe`)
  2. ✅ Màn 2: Lá Số Tử Vi 12 Cung & Bottom Sheet (`4cea86b5`)
  3. ✅ Màn 3: Lục Hào Chiêm Bốc 3D Khang Hy (`d028a9a3`)
  4. ✅ Màn 5: Bát Tự Tứ Trụ & Vận Khí 2026 Bính Ngọ (`041e4565`)
  5. ✅ Màn 6: Linh Xăm Quan Thánh 3D & Thoại Bôi (`587ad2cf`)
- **Chất lượng code**: Clean Architecture, phân tách rõ ràng Domain / Data / Presentation, 100% type-safe.
- **Bảo mật & Tài chính**: Cơ chế trừ XU có dialog xác nhận bảo vệ quyền lợi thân chủ, zero secrets lọt ra ngoài.

---

## 5. BƯỚC KẾ TIẾP (NEXT STEP)

- **Phase 2.6: Hồ Sơ Mệnh Lý Hoàng Gia Mobile Reader (Stitch Screen ID: `baa0f9c74fbf4402b01cfaa9d55aec3a`)**:
  - Trình đọc hồ sơ mệnh lý 19 trang vector phong cách Sách Cổ Triều Đình trên mobile.
  - Hỗ trợ chế độ Sách Lật (Book Flip) hoặc Cuộn Dọc (Continuous Scroll).
  - Triện son 3D ngự bút, Thủy ấn cá nhân hóa chống sao chép và xuất PDF di động.

