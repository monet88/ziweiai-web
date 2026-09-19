# BÀN GIAO SPRINT 42 (PHASES 1 & 2 + P0 PRINT FIX) & KHỞI ĐỘNG SPRINT 42 PHASE 3

- **Thời gian bàn giao**: 09/09/2026
- **Branch**: `feature/sprint-42-deluxe-pdf-dossier`
- **Pull Request**: [PR #4: feat(sprint-42): Deluxe PDF Dossier (19 Pages Vector) & Print Engine Hardening](https://github.com/galaxypro710-stack/ziweiai-web/pull/4)
- **Latest Commit**: `6aa7234`
- **Vercel Production Deployment**: `dpl_9ZGCcKcU1ph1KZ7vuahYaffPihMo`
- **Domain Production**: `https://tuvitoantap.vercel.app`
- **URL Test Live**: `https://tuvitoantap.vercel.app/charts/2b496e92-ea1d-4d6f-a156-ce56ada6d5e5`

---

## 1. TỔNG QUAN CÔNG VIỆC ĐÃ HOÀN THÀNH (100%)

### Phase 1: Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia PDF 19 Trang Vector A4
- **Thiết kế & Kiến trúc**: Xây dựng `dossier-generator.ts` và `DeluxePdfDossierModal.svelte` chuẩn hóa 19 trang A4 vector (210mm x 297mm):
  - Trang 1: Bìa Mộc Son Hoàng Gia dát vàng 24K, quốc hiệu ViOS Khâm Thiên Giám.
  - Trang 2: Tổng quan Bản Mệnh, Ngũ Hành, Âm Dương, Cục, Chủ Mệnh & Chủ Thân.
  - Trang 3: Toàn Cảnh Tinh Bàn Tử Vi 12 Cung bát quái thiên bàn.
  - Trang 4-15: Chi tiết chuyên sâu 12 Cung (Mệnh, Phụ, Phúc, Điền, Quan, Nô, Di, Tật, Tài, Tử, Phu Thê, Huynh Đệ) kèm phân tích chính tinh miếu hãm, phụ tinh, tứ hóa và luận giải đại ý.
  - Trang 16-17: Thập Niên Đại Vận (I & II) trải dài 120 năm cuộc đời.
  - Trang 18: Vận Hạn Lưu Niên 2026 (Bính Ngọ) kèm can chi, lưu thái tuế, lưu lộc tồn, lưu kình đà.
  - Trang 19: Triện Son Khâm Thiên Giám, chữ ký số và mã QR bảo chứng số hóa.
- **Thanh toán & Idempotency**: Tích hợp trừ 50 XU mở khóa vĩnh viễn lá số, chống trừ trùng bằng Supabase transaction và trạng thái unlocked.

### Phase 2: Dual View Mode, Multi-Tier Cache & Chia Sẻ Bảo Chứng
- **Dual View Mode**: Hỗ trợ chuyển đổi mượt mà giữa:
  - *Chế độ Sách (Book View)*: Lật từng trang sang trọng, phím tắt `ArrowLeft` / `ArrowRight` / `Escape`, dropdown nhảy nhanh đến trang bất kỳ.
  - *Chế độ Cuộn (Continuous Scroll)*: Xem liền mạch 19 trang từ trên xuống dưới.
- **Thanh tiến trình đọc dát vàng hoàng triều (Golden Reading Progress Track)**: Tự động cập nhật `%` trang đang đọc.
- **Bộ nhớ đệm đa tầng Offline-Ready (`dossier-cache.ts`)**:
  - Tầng 1: In-Memory Memory Cache.
  - Tầng 2: IndexedDB (`vios_dossier_db` / `dossier_snapshots`) lưu trữ hồ sơ bền vững offline.
  - Tầng 3: LocalStorage Fallback.
- **Chia sẻ liên kết trực tuyến**: Tích hợp Web Share API + fallback Clipboard copy link bảo chứng lá số trực tuyến `/charts/[chartId]`.

### Sự Cố P0: Khắc Phục Triệt Để Lỗi In Trắng (Print Blank Page & Pagination Clip)
- **Vấn đề ban đầu**:
  - Bấm "In sớ / Lưu PDF" tại khối Luận giải lá số chỉ ra 1 trang trắng tinh, lấp ló dòng chữ *"2. Sự Nghiệp Và Tài Lộc"* ở đáy trang 1.
  - Bấm "In / Lưu PDF" tại Hồ Sơ Hoàng Gia bị trang in trắng xóa toàn bộ.
- **Nguyên nhân gốc**:
  1. *Lá số 12 cung chiếm hết trang 1*: Khối `.board-section` cao 800px không bị ẩn khi in, đẩy bài luận giải xuống đáy trang 1.
  2. *Kẹt phân trang (Pagination Clip)*: `.screen` trong `AppScaffold.svelte` có `overflow-x: hidden; min-height: 100dvh;`. Trình duyệt Chrome/Safari khóa cứng phân trang thành 1 trang duy nhất, cắt bỏ hoàn toàn các trang sau.
  3. *Màu chữ tàng hình*: Màu chữ xám nhạt `#d1d5db` và `-webkit-text-fill-color: transparent` biến mất trên nền giấy in trắng.
  4. *Selector DOM sai trong Dossier*: Rule `:global(body > *:not(.dossier-overlay))` ẩn `div.app-content-wrapper` chứa toàn bộ ứng dụng SvelteKit. Đồng thời rule `.mode-book .dossier-page:not(.is-active)` làm ẩn 18 trang còn lại.
- **Giải pháp áp dụng**:
  - Gắn class `printing-explanation-scroll` và `printing-deluxe-dossier` vào `document.body` khi in.
  - Mở khóa toàn bộ `overflow` và `height` trên các container cha (`html, body, .app-content-wrapper, .screen, .container, .detail-page`).
  - Ẩn hoàn toàn bàn lá số và các thành phần giao diện web khi in sớ.
  - Thêm **Header Bản Sớ Trang Trọng** ở đầu sớ in với đầy đủ thông tin đương số, ngày giờ sinh Âm Dương lịch, Mệnh, Cục, triện bảo chứng ViOS Engine.
  - Định dạng màu in đen tuyền `#111827`, tiêu đề đồng son `#78350f`, bảng biểu và trích dẫn trang nhã, phân trang mượt mà qua nhiều trang A4.
  - Ép hiển thị trọn vẹn **19 trang A4 vector** trong Hồ Sơ Hoàng Gia kể cả khi đang ở chế độ Sách.

---

## 2. KẾT QUẢ AUDIT CODEBASE & QUALITY GATES

| Tiêu chuẩn kiểm tra | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Svelte Check** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** | Type-safe 100% |
| **Linting** | `pnpm lint` | **0 errors, 0 warnings** | ESLint clean |
| **Typecheck Monorepo**| `pnpm typecheck` | **10/10 tasks successful** | Không có lỗi compile TS |
| **Unit Tests Web** | `pnpm -F @ziweiai/web test` | **53/53 passed (283 tests)** | 100% test web đạt |
| **Unit Tests Monorepo**| `pnpm test` | **9/9 tasks successful** | Toàn bộ backend + frontend passed |
| **Production Build** | `pnpm -F @ziweiai/web build`| **Build pass (9.28s)** | Static output clean |
| **Vercel Deployment** | `pnpm deploy:vercel-demo` | **Success (dpl_9ZGCcKcU1ph1KZ7vuahYaffPihMo)** | Live production |

---

## 3. THAO TÁC GIT & PULL REQUEST

Toàn bộ commit đã được push lên GitHub và tạo Pull Request chính thức:
- **Pull Request URL**: **[https://github.com/galaxypro710-stack/ziweiai-web/pull/4](https://github.com/galaxypro710-stack/ziweiai-web/pull/4)**
- **Source Branch**: `feature/sprint-42-deluxe-pdf-dossier`
- **Target Branch**: `main`

### Hướng dẫn Merge PR:
Đại Ka có thể merge trực tiếp trên giao diện GitHub qua link trên, hoặc chạy lệnh:
```bash
git checkout main
git pull origin main
git merge --no-ff feature/sprint-42-deluxe-pdf-dossier -m "merge: pull request #4 from feature/sprint-42-deluxe-pdf-dossier"
git push origin main
```

---

## 4. BƯỚC TIẾP THEO (NEXT STEPS) & PROMPT CHO SESSION MỚI

Hiện tại chúng ta đã hoàn thành xuất sắc **Sprint 42 Phase 1** và **Sprint 42 Phase 2**, cùng với **P0 Print Engine Hardening**.

### Các lựa chọn tiếp theo:
1. **Sprint 42 — Phase 3: "Tải Tệp PDF Vector Offline Trực Tiếp (Direct PDF Download via jsPDF / html2canvas-free or Headless Serverless)"**:
   - Thêm nút tải trực tiếp file `.pdf` chất lượng cao về máy không cần thông qua hộp thoại in của trình duyệt.
   - Thêm watermark chìm bảo mật mang tên thân chủ.
2. **Sprint 43: "Chuyên Sâu Hạn Năm 2026 & Bát Tự Hoàng Gia (Royal Bazi Dossier)"**:
   - Mở rộng Hồ sơ Hoàng Gia cho hệ Bát Tự (Bình giải Thần Sát, Thập Thần, Vòng Trường Sinh 8 Trụ).

---

### PROMPT SẴN SÀNG COPY-PASTE ĐỂ MỞ SESSION MỚI:

```text
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã hoàn thành xuất sắc 100% SPRINT 42 PHASES 1 & 2 (Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang Vector A4 + Dual View Mode + IndexedDB Cache + Khắc phục triệt để lỗi in trắng P0).
Code đã được push lên GitHub và tạo PR #4 tại: https://github.com/galaxypro710-stack/ziweiai-web/pull/4
Bản live production đang chạy ổn định tại: https://tuvitoantap.vercel.app
Tài liệu bàn giao chi tiết nằm tại: docs/handover/sprint-42-phase-2-handover-and-sprint-43-kickoff.md

BÂY GIỜ CHÚNG TA BẮT ĐẦU:
SPRINT 42 — PHASE 3:
"Xuất File PDF Vector Offline Trực Tiếp & Watermark Bảo Mật Cá Nhân Hóa"
- Branch làm việc: feature/sprint-42-deluxe-pdf-dossier (hoặc sau khi merge PR #4 vào main)

Yêu cầu thực hiện:
1. Đọc file bàn giao docs/handover/sprint-42-phase-2-handover-and-sprint-43-kickoff.md và kiểm tra git status.
2. Thiết kế và phát triển tính năng tải trực tiếp file PDF (.pdf) vector/raster chất lượng cao về thiết bị của người dùng (Direct Download) không cần qua hộp thoại Print của browser.
3. Tích hợp watermark chìm tinh tế bảo mật mang tên thân chủ và mã số bảo chứng trên từng trang hồ sơ.
4. Tuân thủ nghiêm ngặt /vibe-engineering-workflow, /vibe-git-manager, /behavior-model-debugger và Karpathy Guidelines: 0 lint errors, 0 typecheck errors, 100% unit tests passed.
```
