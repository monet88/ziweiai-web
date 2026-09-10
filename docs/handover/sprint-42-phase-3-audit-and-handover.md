# BÀN GIAO SPRINT 42 — PHASE 3 & KIỂM TOÁN CODEBASE TOÀN DIỆN
## "Xuất File PDF Vector Offline Trực Tiếp & Watermark Bảo Mật Cá Nhân Hóa"

- **Thời gian bàn giao**: 09/09/2026
- **Branch**: `feature/sprint-42-deluxe-pdf-dossier`
- **Pull Request**: [PR #4: feat(sprint-42): Deluxe PDF Dossier (19 Pages Vector) & Print Engine Hardening](https://github.com/galaxypro710-stack/ziweiai-web/pull/4)
- **Rollback Anchor**: `7302863`
- **Latest Commit**: `5faece3`
- **Live Production URL**: `https://tuvitoantap.vercel.app`

---

## 1. TÓM TẮT MỤC TIÊU & YÊU CẦU

1. **Direct PDF Download**: Tải trực tiếp tệp `.pdf` chuẩn in ấn 19 trang A4 (210mm x 297mm) vector/raster sắc nét về máy, không thông qua hộp thoại Print.
2. **Personalized Security Watermark**: Vân chìm bảo mật hoàng triều nghiêng -25° mang tên thân chủ (`userName`) và mã số bảo chứng số hóa độc quyền (`VIOS-ROYAL-[MÃ]`) trên từng trang hồ sơ.
3. **Tuân thủ kỷ luật nghiêm ngặt**:
   - `/vibe-engineering-workflow`: 4 bước Pre-Check Gate.
   - `/vibe-git-manager`: Zero-Secret scan, safe branch, commit chuẩn và rollback anchor.
   - `/behavior-model-debugger`: Kiểm toán ma trận va chạm trạng thái và vòng đời thao tác người dùng.
   - Karpathy Guidelines: 0 lint errors, 0 typecheck errors, 100% unit tests passed.

---

## 2. TỔNG HỢP CÁC VIỆC ĐÃ HOÀN THÀNH

| Thành phần | File tác động | Mô tả công việc đã làm |
| :--- | :--- | :--- |
| **Thư viện** | `apps/web/package.json`<br/>`pnpm-lock.yaml` | Tích hợp `jspdf` và `html2canvas` cho Web. |
| **PDF Engine** | `apps/web/src/lib/features/dossier/dossier-pdf-exporter.ts` | Xây dựng pipeline xuất PDF offline client-side, dọn dẹp RAM tuần tự từng trang chống OOM, hỗ trợ `AbortSignal`. |
| **Progress UI** | `apps/web/src/lib/features/dossier/DossierExportProgressModal.svelte` | Modal tiến trình dát vàng Khâm Thiên Giám, Golden Track 0% &rarr; 100%, chi tiết tên từng trang và nút Hủy. |
| **Watermark & Modal** | `apps/web/src/lib/features/dossier/DeluxePdfDossierModal.svelte` | Tích hợp watermark chìm 19 trang, nút Tải PDF, binding xuất file tự động vượt qua giới hạn của Book Mode. |
| **Unit Tests** | `apps/web/src/lib/features/dossier/dossier-pdf-exporter.test.ts`<br/>`apps/web/src/lib/features/dossier/dossier.test.ts` | Viết 8 unit test mới kiểm tra toàn bộ luồng xuất PDF, format mã bảo chứng, slugify tiếng Việt và watermark integrity. |
| **Living Spec** | `implementation_notes.html` | Cập nhật tài liệu kiến trúc sống theo Karpathy Rule #5. |
| **Tài liệu tổng kết** | `docs/sprint-42-phase-3-summary.md`<br/>`docs/handover/sprint-42-phase-3-audit-and-handover.md` | Ghi chép toàn bộ báo cáo phân tích, kiểm toán hành vi và kết quả Quality Gates. |

---

## 3. KẾT QUẢ QUALITY GATES

- ✅ **Svelte Check**: `pnpm -F @ziweiai/web check` &rarr; `0 errors, 0 warnings`
- ✅ **ESLint**: `pnpm lint` &rarr; `0 errors, 0 warnings`
- ✅ **TypeScript**: `pnpm typecheck` &rarr; `10/10 tasks successful`
- ✅ **Web Unit Tests**: `pnpm -F @ziweiai/web test` &rarr; `54/54 passed (291 tests)`
- ✅ **Monorepo Tests**: `pnpm test` &rarr; `9/9 passed (100% tests)`
- ✅ **Production Build**: `pnpm -F @ziweiai/web build` &rarr; `Build pass (9.68s)`

---

## 4. BÁO CÁO KIỂM TOÁN CODEBASE & HÀNH VI

### 4.1. `/behavior-model-debugger`
- Đã kiểm tra và giải quyết triệt để va chạm giữa **Book Mode** (`display: none` trên 18 trang) và **Export Engine** bằng declarative class binding `class:is-exporting-pdf` dưới lớp overlay tiến trình.
- Đã kiểm tra và ngăn chặn hiện tượng tràn bộ nhớ RAM (OOM) trên thiết bị di động bằng cơ chế nén JPEG và reset kích thước canvas ngay sau mỗi trang.
- Đã xử lý ngắt ngang an toàn với `AbortController`, hoàn tác giao diện sạch sẽ khi bấm Hủy.

### 4.2. `/vibe-engineering-workflow`
- Logic đúng 100%, mã sạch, không còn unused CSS hay code thừa, bao quát toàn diện các trường hợp biên.

### 4.3. `/vibe-git-manager`
- Quét sạch secret trước khi commit.
- Rollback Anchor sẵn sàng: `7302863`.
- Commit và push an toàn lên GitHub, cập nhật trực tiếp vào PR #4.
