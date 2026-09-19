# Báo Cáo Hoàn Thành Sprint 67 & Handoff Chuyển Giao Sprint 68

- **Dự Án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Phiên Bản**: **Sprint 67 (Hoàn thành 100%)** $\rightarrow$ Chuẩn bị khởi động **Sprint 68**
- **Thời Gian**: 11/09/2026
- **Trạng Thái Git**:
  - Đã commit và fast-forward merge nhánh `feat/royal-bazi-poster-modal` vào `main`.
  - Đã push toàn bộ lên GitHub `origin/main`.
  - Working tree: Clean, 0 uncommitted changes.
- **Commit Hashes Sprint 67**:
  - `a9cd189`: `feat(web): implement royal bazi poster modal and fix profile data hydration`
- **GitHub Repo**: [galaxypro710-stack/ziweiai-web](https://github.com/galaxypro710-stack/ziweiai-web)
- **Production URL**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)
- **Live Test URL**: [https://tuvitoantap.vercel.app/charts/ea569e7d-122c-49e3-b6f3-449db42debb0](https://tuvitoantap.vercel.app/charts/ea569e7d-122c-49e3-b6f3-449db42debb0) (Status: **● Ready**, HTTP/2 200)

---

## 1. Vấn Đề Được Giải Quyết Trong Sprint 67

Dựa trên điều tra hành vi người dùng (/behavior-model-debugger) trên lá số Bát Tự thực tế [ea569e7d-122c-49e3-b6f3-449db42debb0](https://tuvitoantap.vercel.app/charts/ea569e7d-122c-49e3-b6f3-449db42debb0):
1. **Lỗi điều hướng Modal xuất ảnh**:
   - Khi người dùng bấm nút `"Xuất Poster"` (`.btn-royal-poster`) trên lá số Bát Tự, hệ thống bị ép trỏ vào `RoyalPosterModal.svelte` (vốn là template 12 Cung dành riêng cho Tử Vi Đẩu Số).
   - Hệ thống chưa có component `RoyalBaziPosterModal.svelte` cho Bát Tự.
2. **Lỗi 12 ô màu đen kịt & dữ liệu trống rỗng**:
   - Snapshot Bát Tự (`ba-zi`) không chứa mảng `palaces` của Tử Vi nên toàn bộ 12 ô cung bị hiển thị màu đen trống rỗng.
   - Bát Tự 4 Trụ hiển thị `N/A • N/A • N/A • N/A` do đọc sai cấu trúc snapshot.
3. **Lỗi ngày tháng & Rò rỉ ký tự Hán thô (Violating AGENTS.md Invariant)**:
   - Dương lịch hiển thị `Dương Lịch: N/A` do thiếu fallback sang `birth.resolvedDateTime?.date`.
   - Âm lịch hiển thị chuỗi Hán thô `Âm Lịch: 一九九〇年八月二十` do chưa được lọc qua hàm chuẩn hóa `formatStructuredLunarDate` / `normalizeLegacyLunarDate`.

---

## 2. Chi Tiết Công Việc Đã Hoàn Thành

### A. Tầng Component Poster Bát Tự Hoàng Gia
* **`apps/web/src/lib/features/poster/RoyalBaziPosterModal.svelte`** (Component MỚI):
  - Khung Canvas Hoàng Gia 780px cố định (hỗ trợ xuất ảnh PNG High-DPI 2x Retina 1560px).
  - Khung viền thếp vàng hoàng cung, 4 góc đính bảo hoa `✦`, nền cẩm thạch huyền bí tông nâu đen hoàng gia (`#0b0906`).
  - Tiêu đề: `BẢN ĐỒ MỆNH LÝ BÁT TỰ HOÀNG GIA` • `ViOS Imperial Bazi Codex • Tiên Thiên Tứ Trụ Toàn Thư`.
  - Khối Profile Đương Số: Tên đương số, Giới tính, Dương Lịch (DD/MM/YYYY), Âm Lịch (chuẩn hóa tiếng Việt, loại bỏ 100% chữ Hán), Nhật Chủ, Bản Thể Thần, Dụng Thần, Hỷ Thần, Kỵ Thần, Nạp Âm Mệnh.
  - **Bảng Tứ Trụ Tiên Thiên 4 Cột Hoàng Cung**:
    - Trụ Năm, Trụ Tháng, Trụ Ngày (Nhật Chủ viền kép vàng kim hoàng gia `#ffd700` nổi bật trung tâm kèm huy hiệu `NHẬT CHỦ`), Trụ Giờ.
    - Hàng Thập Thần Can, Thiên Can, Địa Chi (tô màu theo Ngũ Hành chuẩn), Tàng Can & Thập Thần, Vòng Trường Sinh, Nạp Âm.
  - **Thanh đo Cân Bằng Ngũ Hành**: Kim, Mộc, Thủy, Hỏa, Thổ kèm tỷ lệ phần trăm trực quan.
  - **Tứ Phụ Cung & Thần Sát**: Thai Nguyên, Thai Tức, Mệnh Cung, Thân Cung và danh sách Thần Sát cát hung tiêu biểu.
  - **Dải Vòng Đại Vận 10 Năm**: 8 bước Đại Vận tiên thiên với Can Chi, Thập Thần và bước tuổi.
  - **Triện Chu Sa Khâm Thiên Giám**: Con dấu đỏ chu sa "BÁT TỰ TOÀN TẬP" và khẩu quyết: « Âm Dương Thuận Lý • Cương Nhu Tương Tế • Phúc Thọ Vẹn Toàn ».
  - Footer chứa mã chứng thư số hoàng gia `VIOS-BAZI-XXXXXXXX` và watermark bản quyền `https://tuvitoantap.vercel.app`.
  - Nút Tải Ảnh PNG (High-DPI 2x Retina) và Chia Sẻ trực tiếp qua Web Share API (kèm fallback tải ảnh).

### B. Tầng Định Tuyến Màn Hình Chi Tiết
* **`apps/web/src/lib/features/chart/ChartDetailScreen.svelte`**:
  - Import `RoyalBaziPosterModal`.
  - Cập nhật logic điều hướng modal:
    ```svelte
    {#if isPosterModalOpen && detail.snapshot}
      {#if detail.chartSystem === 'liu-yao'}
        <RoyalLiuyaoPosterModal ... />
      {:else if detail.chartSystem === 'ba-zi'}
        <RoyalBaziPosterModal ... />
      {:else}
        <RoyalPosterModal ... />
      {/if}
    {/if}
    ```

### C. Tầng Chuẩn Hóa Dữ Liệu & Bảo Vệ Ngôn Ngữ
* **`apps/web/src/lib/features/chart/chart-display.ts`**:
  - Export hàm `formatStructuredLunarDate` để chuẩn hóa cả đối tượng âm lịch lẫn chuỗi legacy chữ Hán sang tiếng Việt.
* **`apps/web/src/lib/features/dossier/bazi-dossier-interpretations.ts`**:
  - Áp dụng `formatStructuredLunarDate` cho `lunarDateText`, chuyển chuỗi Hán `一九九〇年八月二十` thành `20/08/1990 Canh Ngọ`.
* **`apps/web/src/lib/features/dossier/dossier-interpretations.ts`**:
  - Bổ sung fallback cho `solarDate` từ `birth.resolvedDateTime?.date`.
  - Bổ sung `formatStructuredLunarDate` cho `lunarDate`.
  - Bổ sung fallback cho `baziYear`, `baziMonth`, `baziDay`, `baziHour` từ `snapshot.bazi.pillars`.
* **`apps/web/src/lib/features/poster/royal-poster-exporter.ts`**:
  - Bổ sung hàm `formatBaziPosterFileName(userName, dayMaster)` và hỗ trợ hệ `'bazi'` trong `formatDivinationPosterFileName`.

---

## 3. Verification Gates (100% Đạt Chuẩn)

1. **Svelte Check**:
   ```bash
   pnpm -F @ziweiai/web check
   # Result: svelte-check found 0 errors and 0 warnings
   ```
2. **Web Unit Tests**:
   ```bash
   pnpm -F @ziweiai/web test
   # Result: 66 test files passed, 363/363 tests passed
   ```
3. **API Unit Tests**:
   ```bash
   pnpm -F @ziweiai/api test
   # Result: 84 test files passed, 520/520 tests passed
   # TỔNG TOÀN MONOREPO: 883/883 TESTS PASSED
   ```
4. **Code Quality Linting**:
   ```bash
   pnpm lint
   # Result: 0 errors, 0 warnings
   ```
5. **Monorepo Typecheck**:
   ```bash
   pnpm typecheck
   # Result: 10/10 tasks successful
   ```
6. **Production Build**:
   ```bash
   pnpm exec turbo run build --force
   # Result: 6/6 packages built thành công (0 cache, 100% fresh)
   ```
7. **Playwright E2E Smoke**:
   ```bash
   pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
   # Result: 1 passed (16.3s)
   ```
8. **Live Production Smoke & Health Checks**:
   - Vercel Deployment ID: `dpl_8tMvLQguwey6sPX8m2A2UiKb1YjD`
   - Production Alias: `https://tuvitoantap.vercel.app`
   - Health Check: `curl -sS https://tuvitoantap.vercel.app/api/health` $\rightarrow$ `status: ok`
   - Features Check: `curl -sS https://tuvitoantap.vercel.app/api/features` $\rightarrow$ `HTTP 200 OK`
   - Live Chart Route: `curl -sI https://tuvitoantap.vercel.app/charts/ea569e7d-122c-49e3-b6f3-449db42debb0` $\rightarrow$ `HTTP/2 200 OK`

---

## 4. Prompt Khởi Động Cho Sprint 68 (Copy-Paste)

Khi mở session mới tiếp theo, Đại Ka chỉ cần gửi đoạn prompt dưới đây:

```markdown
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã HOÀN THÀNH 100% SPRINT 67 & DEPLOY PRODUCTION THÀNH CÔNG:
1. Royal Bazi Poster Modal: Xây dựng mới hoàn toàn modal xuất Poster Bát Tự Tứ Trụ Hoàng Gia 780px cố định (High-DPI 2x Retina 1560px), bảng 4 cột Tứ Trụ làm nổi bật Trụ Ngày Nhật Chủ viền vàng kép, ngũ hành tiên thiên, tứ phụ cung, đại vận và dấu triện đỏ Khâm Thiên Giám.
2. Route Dispatch Fix: Điều hướng chính xác `ba-zi` vào RoyalBaziPosterModal trong ChartDetailScreen, loại bỏ triệt để lỗi 12 ô cung đen trống rỗng do nhầm sang template Tử Vi.
3. Profile Data Hydration & Zero-Han Invariant: Chuẩn hóa toàn diện ngày dương lịch (DD/MM/YYYY) và ngày âm lịch qua `formatStructuredLunarDate`, quét sạch 100% ký tự chữ Hán thô (như 一九九〇年...) ra khỏi giao diện.
4. Toàn bộ verification gates đạt 100%:
   - Svelte check: 0 errors, 0 warnings
   - Web tests: 363/363 passed
   - API tests: 520/520 passed (Tổng 883 unit tests toàn monorepo)
   - Lint & Typecheck: 0 errors, 10/10 tasks passed
   - Playwright E2E: Passed (16.3s)
   - Production URL: https://tuvitoantap.vercel.app (Status: ● Ready)
5. Tài liệu bàn giao đầy đủ tại: docs/sprint-67-royal-bazi-poster-and-data-hydration.md

Hôm nay chúng ta sẽ BẮT ĐẦU SPRINT 68:
Hãy đọc docs/sprint-67-royal-bazi-poster-and-data-hydration.md, kiểm tra git status và đề xuất kế hoạch triển khai Sprint 68 cho tôi! /vibe-engineering-workflow /vibe-git-manager /behavior-model-debugger
```
