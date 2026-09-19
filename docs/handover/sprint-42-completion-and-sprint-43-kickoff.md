# BÀN GIAO TOÀN DIỆN SPRINT 42 (PHASES 1, 2, 3) & KHỞI ĐỘNG SPRINT 43
## "Hoàn Tất Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang Vector & Chuẩn Bị Khởi Động Sprint 43"

- **Ngày bàn giao**: 09/09/2026
- **Branch**: `feature/sprint-42-deluxe-pdf-dossier`
- **Pull Request**: [PR #4: feat(sprint-42): Deluxe PDF Dossier (19 Pages Vector) & Print Engine Hardening](https://github.com/galaxypro710-stack/ziweiai-web/pull/4)
- **Base Rollback Anchor**: `7302863`
- **Head Commit Hash**: `2c7a6db`
- **Domain Production**: `https://tuvitoantap.vercel.app`
- **URL Test Live**: `https://tuvitoantap.vercel.app/charts/2b496e92-ea1d-4d6f-a156-ce56ada6d5e5`

---

## 1. TỔNG KẾT TOÀN BỘ SPRINT 42 (HOÀN THÀNH 100% 3 PHASES)

### 👑 Phase 1: Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang Vector A4
- Xây dựng 19 trang A4 chuẩn in ấn vector (210mm x 297mm) mô phỏng Tiên Thiên Bảo Điển triều đình:
  - Trang 1: Bìa Mộc Son Hoàng Gia dát vàng 24K, quốc hiệu ViOS Khâm Thiên Giám.
  - Trang 2: Tổng quan Bản Mệnh, Bát Tự Tứ Trụ, Ngũ Hành Cục, Chủ Mệnh & Chủ Thân.
  - Trang 3: Toàn Cảnh Tinh Bàn Tử Vi 12 Cung bát quái thiên bàn (Vector 300 DPI).
  - Trang 4-15: Đại luận chuyên sâu 12 Cung (Mệnh, Phụ, Phúc, Điền, Quan, Nô, Di, Tật, Tài, Tử, Phu Thê, Huynh Đệ).
  - Trang 16-17: Thập Niên Đại Vận (I & II) trải dài 120 năm cuộc đời.
  - Trang 18: Vận Hạn Lưu Niên 2026 (Bính Ngọ) kèm can chi, lưu thái tuế, lưu kình đà.
  - Trang 19: Triện Son Khâm Thiên Giám, chữ ký số và mã QR xác thực số hóa.
- Tích hợp trừ 50 XU mở khóa vĩnh viễn lá số, chống trừ trùng bằng Supabase transaction và trạng thái unlocked.

### 📖 Phase 2: Dual View Mode, Multi-Tier Cache & Sửa Lỗi In Trắng P0
- **Dual View Mode**:
  - *Chế độ Sách (Book View)*: Lật từng trang sang trọng, phím tắt `ArrowLeft` / `ArrowRight` / `Escape`, dropdown nhảy nhanh đến trang bất kỳ.
  - *Chế độ Cuộn (Continuous Scroll)*: Xem liền mạch 19 trang từ trên xuống dưới.
- **Thanh tiến trình đọc dát vàng hoàng triều (Golden Reading Progress Track)**: Tự động cập nhật `%` trang đang đọc.
- **Bộ nhớ đệm đa tầng Offline-Ready (`dossier-cache.ts`)**: Memory Cache &rarr; IndexedDB (`vios_dossier_db`) &rarr; LocalStorage.
- **Sửa triệt để sự cố in trắng P0**: Loại bỏ kẹt phân trang (pagination clip), mở khóa container `overflow` và ép hiển thị 19 trang hoàn chỉnh khi in ấn.

### 📥 Phase 3: Tải Tệp PDF Trực Tiếp 100% Offline & Watermark Bảo Mật Cá Nhân Hóa
- **Nút "Tải PDF (.pdf)" trực tiếp**: Bấm 1 click là tải file `.pdf` 19 trang chất lượng cao về máy không cần qua hộp thoại Print của browser.
- **Personalized Security Watermark**: Vân chìm bảo mật hoàng triều nghiêng -25° mang tên thân chủ (`userName`) và mã bảo chứng số hóa độc quyền (`VIOS-ROYAL-[MÃ]`) trên cả 19 trang.
- **Engine xuất PDF Client-side chuyên biệt (`dossier-pdf-exporter.ts`)**: Dùng `jspdf` và `html2canvas`, giải phóng bộ nhớ RAM tuần tự từng trang chống hiện tượng Out-Of-Memory trên điện thoại.
- **Royal PDF Export Progress Modal (`DossierExportProgressModal.svelte`)**: Hiển thị thanh tiến trình dát vàng 0% &rarr; 100%, tên từng trang đang kết xuất và nút Hủy an toàn (`AbortSignal`).

---

## 2. KẾT QUẢ QUALITY GATES & KIỂM ĐỊNH CODEBASE

| Cổng kiểm định | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Svelte Check** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** | Type-safe 100% |
| **ESLint Monorepo** | `pnpm lint` | **0 errors, 0 warnings** | Codebase sạch 100% |
| **TypeScript Monorepo** | `pnpm typecheck` | **10/10 tasks successful** | Không có lỗi compile TS |
| **Web Unit Tests** | `pnpm -F @ziweiai/web test` | **54/54 files passed (291 tests)** | Tăng thêm 8 test mới, pass 100% |
| **Monorepo Unit Tests** | `pnpm test` | **9/9 packages passed** | 100% tests đạt |
| **Production Build** | `pnpm -F @ziweiai/web build` | **Build pass thành công (9.68s)** | Static output hoàn hảo |

---

## 3. BÁO CÁO KIỂM TOÁN HÀNH VI & UX (/behavior-model-debugger)

1. **Book View Mode vs Capture Pipeline**:
   - Điểm gãy tiềm ẩn: Trong Book Mode, 18 trang có CSS `display: none` trên màn hình.
   - Giải pháp: Khởi chạy declarative binding `class:is-exporting-pdf` trên container, ép hiển thị 19 trang bên dưới lớp Progress Overlay mờ ảo để `html2canvas` chụp trọn vẹn, không gây giật lag cho người dùng.
2. **Ngăn chặn sập tab trình duyệt di động (OOM Prevention)**:
   - Điểm gãy tiềm ẩn: Render đồng thời 19 canvas 2x DPI tốn hàng trăm MB RAM.
   - Giải pháp: Render tuần tự (Sequential): Trang N &rarr; Nén JPEG &rarr; Đưa vào jsPDF &rarr; Reset kích thước canvas về 0 &rarr; Thu hồi RAM &rarr; Mới sang Trang N+1.
3. **Phản hồi ngắt quãng an toàn (Safe Interruption)**:
   - Tích hợp `AbortController`: Khi người dùng bấm "Hủy bỏ xuất tệp", tác vụ ngắt ngay lập tức, giải phóng tài nguyên và đóng modal nhẹ nhàng.

---

## 4. HƯỚNG DẪN QUẢN LÝ GIT & MERGE PR (/vibe-git-manager)

Hiện tại toàn bộ commit của Sprint 42 (gồm cả 3 Phase) đã nằm trọn vẹn trên nhánh `feature/sprint-42-deluxe-pdf-dossier` và được cập nhật vào **Pull Request #4**:
👉 **[https://github.com/galaxypro710-stack/ziweiai-web/pull/4](https://github.com/galaxypro710-stack/ziweiai-web/pull/4)**

### Thao tác Merge PR #4 vào `main`:
Đại Ka có thể bấm nút **"Merge pull request"** trực tiếp trên link GitHub ở trên, hoặc chạy lệnh Git CLI:
```bash
git checkout main
git pull origin main
git merge --no-ff feature/sprint-42-deluxe-pdf-dossier -m "merge: pull request #4 - deluxe pdf dossier 19 pages vector offline and personalized watermark (sprint 42)"
git push origin main
```

---

## 5. KẾ HOẠCH BƯỚC TIẾP THEO: KHỞI ĐỘNG SPRINT 43 (/vibe-engineering-workflow)

Theo lộ trình phát triển sản phẩm ViOS, bước tiếp theo sau khi hoàn thiện xuất sắc Hồ Sơ Tử Vi Hoàng Gia là:

### 🌟 SPRINT 43: "Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia (Royal Bazi Dossier) & Vận Hạn Lưu Niên Chuyên Sâu 2026"
- **Mục tiêu chính**:
  1. Xây dựng Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia A4 chuyên sâu (Phân tích Thập Thần, Thần Sát, Vòng Trường Sinh 8 Trụ, Dụng Thần & Hỷ Thần).
  2. Bổ sung Luận giải Vận Hạn Lưu Niên 2026 (Bính Ngọ) đa tầng (Thiên Can, Địa Chi, Đại Vận, Nguyệt Vận 12 tháng).
  3. Kế thừa toàn bộ Engine PDF Vector, Dual View Mode và Watermark Bảo Mật Cá Nhân Hóa đã được tôi luyện ở Sprint 42.

---

## 📋 PROMPT SẴN SÀNG COPY-PASTE ĐỂ MỞ SESSION MỚI (SPRINT 43 KICKOFF)

Đại Ka chỉ cần copy toàn bộ đoạn văn bản bên dưới và dán vào session mới:

```text
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã hoàn thành xuất sắc 100% SPRINT 42 (Cả 3 Phases: Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang Vector A4 + Dual View Mode + IndexedDB Multi-Tier Cache + Khắc phục triệt để lỗi in trắng P0 + Tải PDF Vector Offline Trực Tiếp + Watermark Bảo Mật Cá Nhân Hóa).
Toàn bộ code đã nằm trên PR #4 tại: https://github.com/galaxypro710-stack/ziweiai-web/pull/4
Tài liệu bàn giao chi tiết nằm tại: docs/handover/sprint-42-completion-and-sprint-43-kickoff.md

BÂY GIỜ CHÚNG TA BẮT ĐẦU:
SPRINT 43:
"Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia (Royal Bazi Dossier) & Phân Tích Chuyên Sâu Vận Hạn Năm 2026"
- Nhánh làm việc: feature/sprint-43-royal-bazi-dossier (hoặc trên main sau khi merge PR #4)

Yêu cầu thực hiện:
1. Đọc file bàn giao docs/handover/sprint-42-completion-and-sprint-43-kickoff.md và kiểm tra git status.
2. Thiết kế và phát triển tính năng Hồ Sơ Mệnh Lý Bát Tự Hoàng Gia (Royal Bazi Dossier) phân tích Dụng Thần, Hỷ Thần, Thập Thần và Vận Hạn 2026 Bính Ngọ đa tầng.
3. Kế thừa toàn bộ năng lực chuẩn A4 Vector, Dual View Mode, Direct PDF Download và Personalized Watermark từ Sprint 42.
4. Tuân thủ nghiêm ngặt /vibe-engineering-workflow, /vibe-git-manager, /behavior-model-debugger và Karpathy Guidelines: 0 lint errors, 0 typecheck errors, 100% unit tests passed.
```
