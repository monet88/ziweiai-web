# TÀI LIỆU BÀN GIAO SPRINT 44 (PHASE 1) & KHỞI ĐỘNG PHASE 2
## VIOS — TỬ VI TOÀN TẬP: FLUTTER MOBILE ROYAL CELESTIAL REDESIGN

> **Mã dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Nhánh làm việc**: `feature/sprint-44-mobile-royal-redesign`  
> **Giai đoạn hiện tại**: **SPRINT 44 — PHASE 1 HOÀN TẤT 100%**  
> **Giai đoạn kế tiếp**: **SPRINT 44 — PHASE 2 (XÂY DỰNG FLUTTER WIDGETS THEO BLUEPRINT STITCH MCP)**  
> **Kính gửi**: Đại Ka  
> **Ngày lập**: 09/09/2026  
> **Commit hash mới nhất**: `3fcce28` (Đã push lên `origin/feature/sprint-44-mobile-royal-redesign`)

---

## I. TỔNG KẾT SPRINT 44 — PHASE 1 (NHỮNG GÌ ĐÃ LÀM VÀ KẾT QUẢ)

### 1. Mục Tiêu Phase 1
- Đánh giá kiến trúc `browser-use` vs ViOS monorepo.
- Audit 26 tuyến Web `tuvitoantap.vercel.app` để xác định khoảng cách UX/UI trên Mobile App.
- Kết nối Stitch MCP để tạo dự án và sinh trọn bộ 6 Màn hình cốt lõi di động Hoàng Gia.
- Đồng bộ Design Tokens và Touch Target Ergonomics vào `apps/mobile`.
- Đảm bảo 100% test pass và zero lint error.

### 2. Việc Đã Làm (What Was Done)
1. **Thẩm định `browser-use`**:
   - Khảo sát mã nguồn thư viện `browser-use` và kết luận: **Không cài đặt vào monorepo**.
   - Lý do: Tránh làm phình to monorepo với runtime Python độc lập; chi phí token LLM Vision cao; repo đã có Playwright E2E + Chrome DevTools MCP + Browser Subagent đáp ứng hoàn hảo mọi yêu cầu tự động hóa và visual audit.
2. **Audit 26 Web Routes vs Mobile Screens**:
   - Đối soát chi tiết các trang web hiện hữu (`/`, `/charts`, `/iching`, `/dossier`, `/bazi`, `/divination/guan-yin`, `/wallet`) với các màn hình mobile cũ.
   - Phát hiện các bất cập về Touch Target nhỏ (< 48dp), giao diện 12 Cung khó thao tác và tính thẩm mỹ chưa đạt chuẩn hoàng gia Khâm Thiên Giám.
3. **Kết nối Stitch MCP — 6 Signature Mobile Screens**:
   - **Stitch Project ID**: `1561298019822402065` (`ViOS - Tử Vi Toàn Tập Mobile Royal Edition`)
   - **Design System Asset**: `assets/78f564958fed4508a3d59b8fe0b9db81` (`Royal Celestial Tu Vi`)
   - **6 Màn hình chất lượng cao**:
     - `Home Dashboard` (Screen ID: `fc2849fe`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1XpZ8TWtnSFaHeWmYftAKzYLcoTrELMfLzKTV7vZ1mS8Xtz7ExaFp4n7G3HPgMMBHQIwCJXwi9DIy17lb2vgZP_RcDxmcgbJM2T82NXrOZgnC1SqMtmEKw3-hJuuVppmCHVpCCy7ELEfyczbgawSVotIQ55ySe9wg6mtV1HdSywmAQgY-VOn5tpoO24MM9kN0qKAXs5KZoxVxZFZsuW112eLpznuW9hgofQfE5cKtCQgq16SqIOT5KoFA)
     - `Lá Số Tử Vi 12 Cung` (Screen ID: `4cea86b5`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1VBUscklMyDSKb7IuDfgPydcAX31nCMeMOXf0vXai-K1b9YVsuR55roAa-XCRNRJFgNBcAh_1_0iMePJ4-UzaS47exQJLbWMJLW-q1nW6MBuOaGTyejTpKkLcRzlJTMuctTPQMYIQLQNkrAoy9bp4fb4fd-WdWnalSzQS1Zz8jkTJr4ZOdz-jF_fZDhfbBC6QNBzj8edVCgaxLY2jl6-iWLYhDYN_HE25krt9qUz6UeVG-TUfRAAwfKWkY)
     - `Lục Hào Chiêm Bốc 3D` (Screen ID: `d028a9a3`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1UAoK20eYENsvc78Fc_SMmmMhM9JTqNNBbb2TDzN5RgbG3hejTSNpLylQzkJZtE5MUveXWJu20O5ybHGlRtku5EeBrldwXBgEQmYxDZnqI8P_mvXwJbV4Lb5-W4FHi0ToITOTKMzI1Bl3tEiY5FPf-yzLlVHZpEJz87zneadXxuZBQXZP6UaRZiXNW5ffJebPYoAKLWKVDzpdGVPSUq7NhuVra6YMztRSrQtFF4nx8UM5oaCspCqvl9-g)
     - `Hồ Sơ Mệnh Lý 19 Trang` (Screen ID: `baa0f9c7`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1UmzvpzuV94iDQG8PBiCA6nBwAm5g_dnEOAqLXXRTj1S14qg-n7FMiTFNEre7xjVNSL9fjFtEAX26rxkffjEjRp3snRnjvZC5dV3vSu2Gcivsniw9zgPpMa_I_hIzvmAs_i8Sz0-iPF97PpEuMik1jSh3CGmm9LnTgWL7QWtuUl5BHULAur7VvrYFF5z-ay2FTTbZG6QvldE-HhEvNJe7MZ4qu_aFZJDUjU0sRBozEo9ygRJxsOTFssMVs)
     - `Bát Tự Tứ Trụ & Vận Khí 2026` (Screen ID: `041e4565`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1WQCM_g8OkK21Rwa3uziB6rF3N-XdtMWjl55RE_492H1r4t6IqjnPZfyUoyQf6oQybMA8kJihLVHc6ufKbpdo6dtOxmoeUMyz-ggAHWBj1ftrUOTH_QRkjZT2JfIuTLdX53nVlOKsFdX4B6qyQpJ0KVjnlb7u6ZdJl80iBwfzmeiQYBbjiyhxR0UgYow3wS0l1dj2S9L-hdnoyoykUKW6hlP_LBi8Y0yJdRCw8l4TYtOkIWo-PGE_UHG9g)
     - `Xăm Quan Thánh Lắc Ống 3D` (Screen ID: `587ad2cf`) — [Xem ảnh](https://lh3.googleusercontent.com/aida/AEtjO1X_UdqfuG6R-anHkp6G41_zVVsfq1-mMjd_N1Ig9BY9kqGHYN_U-GPniy44WD3Jr3ms9Ek_h9JfpF9RBDkfsIs4mI5-3JjDJBx3SdglQTzK2C9A7SDgdzor9srJ3Fsupz-J2G9BEeqVKU2DOPvJJRwMtrTXwqLwGhMT1xcKGraBQS_2x5rGbMtVbbcCauvrQnQhIgiBEippBhJU0Xwo7LiPISZde4wg2QgLhVmDi4DcoDH9gJ8JTVtkKbM)
4. **Cập nhật Flutter Codebase**:
   - Bổ sung màu Chu Sa `cinnabarCrimson`, Ngọc Bích `nephriteJade`, gradients hoàng kim và hằng số `touchTargetMin = 48.0` vào `apps/mobile/lib/core/theme/app_theme.dart`.
5. **Biên soạn tài liệu đặc tả & báo cáo**:
   - `docs/design/stitch-mobile-royal-edition-specs.md`
   - `docs/sprint-44-mobile-royal-redesign-and-audit.md`

### 3. Kết Quả Kiểm Thử (Verification Results)
- `flutter analyze`: **No issues found!** (ran in 1.7s).
- `flutter test`: **38/38 tests passed** (100% pass).
- Git: Commit `3fcce28` đã được push an toàn lên `origin/feature/sprint-44-mobile-royal-redesign`.

---

## II. QUY TRÌNH GIT & PULL REQUEST

- **Nhánh hiện tại**: `feature/sprint-44-mobile-royal-redesign`
- **Tình trạng mã nguồn**: Toàn bộ code sạch sẽ, không có uncommitted changes.
- **Link tạo Pull Request trên GitHub**:  
  👉 [https://github.com/galaxypro710-stack/ziweiai-web/pull/new/feature/sprint-44-mobile-royal-redesign](https://github.com/galaxypro710-stack/ziweiai-web/pull/new/feature/sprint-44-mobile-royal-redesign)

---

## III. KẾ HOẠCH BƯỚC TIẾP THEO: SPRINT 44 — PHASE 2
**Mục tiêu**: Bắt tay chuyển hóa 6 màn hình thiết kế Stitch MCP thành Code Flutter Widgets thực tế trong `apps/mobile`:

1. **Phase 2.1: Tái Cấu Trúc Home Dashboard Mobile**:
   - Dựng widget Bento-grid Hoàng Gia với `cinnabarCrimson` & `imperialGold`.
   - Tích hợp thẻ Nhật Chiêu Hoàng Đạo và điều hướng nhanh 48dp.
2. **Phase 2.2: Nâng Cấp Lá Số Tử Vi 12 Cung & Bottom Sheet**:
   - Cải tiến `ZiweiBoard` theo tỉ lệ vàng, thêm hiệu ứng viền Tứ Hóa phát quang.
   - Thêm Modal Bottom Sheet khi chạm vào từng cung để tra cứu sao và luận giải nhanh.
3. **Phase 2.3: Chiêm Bốc 3D Lục Hào & Lắc Ống Xăm Quan Thánh**:
   - Dựng giao diện gieo 3 đồng xu Khang Hy động và ống thẻ tre tương tác lắc cảm biến.

---

## IV. PROMPT MẪU CHO ĐẠI KA MỞ SESSION MỚI (COPY & PASTE)

Khi Đại Ka mở một session chat mới, chỉ cần copy toàn bộ đoạn prompt dưới đây gửi vào:

```markdown
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã hoàn thành xuất sắc 100% SPRINT 44 (PHASE 1: Audit 26 Web Routes, Thẩm Định browser-use, Thiết Kế 6 Màn Hình Mobile Hoàng Gia Qua Stitch MCP & Đồng Bộ Flutter Theme Tokens).
Toàn bộ code và tài liệu đã được commit & push tại nhánh: feature/sprint-44-mobile-royal-redesign (Commit 3fcce28).
Tài liệu bàn giao chi tiết nằm tại: docs/handover/sprint-44-phase-1-handover-and-phase-2-kickoff.md và docs/sprint-44-mobile-royal-redesign-and-audit.md.

BÂY GIỜ CHÚNG TA BẮT ĐẦU:
SPRINT 44 — PHASE 2:
"Hiện Thực Hóa 6 Màn Hình Mobile Hoàng Gia Chuẩn Stitch MCP Vào Codebase Flutter (apps/mobile)"
- Nhánh làm việc tiếp tục: feature/sprint-44-mobile-royal-redesign

Yêu cầu thực hiện:
1. Đọc file bàn giao docs/handover/sprint-44-phase-1-handover-and-phase-2-kickoff.md và docs/design/stitch-mobile-royal-edition-specs.md.
2. Kiểm tra git status và xác nhận branch sạch sẽ.
3. Triển khai Phase 2.1: Cải tiến Home Dashboard di động theo thiết kế Stitch (Screen ID: fc2849fe) với Bento Grid, Nhật Chiêu Hoàng Đạo, chuẩn Touch Target 48dp.
4. Triển khai Phase 2.2: Nâng cấp màn hình Lá Số Tử Vi 12 Cung (Screen ID: 4cea86b5) với Modal Bottom Sheet tra cứu chi tiết từng cung mệnh.
5. Chạy flutter analyze và flutter test bảo đảm 100% pass, zero errors.

/vibe-engineering-workflow /vibe-git-manager /mobile-design /mobile-developer /behavior-model-debugger
```
