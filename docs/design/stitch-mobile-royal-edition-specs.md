# THIẾT KẾ GIAO DIỆN MOBILE FLUTTER BẰNG STITCH MCP
## "ViOS - Tử Vi Toàn Tập Mobile (Royal Celestial Edition)"

- **Ngày khởi tạo**: 09/09/2026
- **Branch**: `feature/sprint-44-mobile-royal-redesign`
- **Stitch Project ID**: `1561298019822402065`
- **Stitch Resource**: `projects/1561298019822402065`
- **Design System Asset**: `assets/78f564958fed4508a3d59b8fe0b9db81` (Tên: `Royal Celestial Tu Vi`)

---

## 1. MÀN HÌNH ĐẦU TIÊN: ROYAL MYSTICAL HOME DASHBOARD

- **Screen ID**: `fc2849fed4634609a4d5701f2d48c0fe`
- **Resource Name**: `projects/1561298019822402065/screens/fc2849fed4634609a4d5701f2d48c0fe`
- **Screenshot URL**: [Xem hình ảnh thiết kế thực tế tại Google Cloud](https://lh3.googleusercontent.com/aida/AEtjO1XpZ8TWtnSFaHeWmYftAKzYLcoTrELMfLzKTV7vZ1mS8Xtz7ExaFp4n7G3HPgMMBHQIwCJXwi9DIy17lb2vgZP_RcDxmcgbJM2T82NXrOZgnC1SqMtmEKw3-hJuuVppmCHVpCCy7ELEfyczbgawSVotIQ55ySe9wg6mtV1HdSywmAQgY-VOn5tpoO24MM9kN0qKAXs5KZoxVxZFZsuW112eLpznuW9hgofQfE5cKtCQgq16SqIOT5KoFA)
- **Kích thước thiết kế**: `780 x 2914 px` (Chuẩn Retina Mobile Touch-first).

---

## 2. BẢNG MÃ MÀU VÀ DESIGN TOKENS CHUẨN HOÀNG GIA CHO FLUTTER

```dart
class RoyalColors {
  // Cosmic Foundations (Nền vũ trụ vô tận)
  static const Color cosmicVoid = Color(0xFF08060F);      // Nền chính tối sâu
  static const Color deepAstralNavy = Color(0xFF141026);  // Khung chứa lớn & App Bar
  static const Color nebulaChamber = Color(0xFF1A1333);   // Card nổi bề mặt

  // Imperial Gold (Kim sắc hoàng triều)
  static const Color imperialGold = Color(0xFFE8C37D);    // Vàng hoàng gia chính
  static const Color solarFlareGold = Color(0xFFFFDF79);  // Vàng phát sáng rực rỡ
  static const Color agedBronze = Color(0xFFC59A45);      // Đồng cổ viền cạnh

  // Imperial Accents (Sắc lệnh & Cát tinh)
  static const Color cinnabarCrimson = Color(0xFF8B1D1D); // Mộc son triều đình / Sát tinh
  static const Color cinnabarLight = Color(0xFFB82B2B);   // Đỏ son tương tác
  static const Color nephriteJade = Color(0xFF1D6355);    // Ngọc bích cát tinh
  static const Color etherealJade = Color(0xFF298A77);    // Ngọc bích phát sáng
}
```

---

## 3. CÁC PHÂN ĐOẠN TRÊN MÀN HÌNH HOME MỚI

1. **Top App Bar**:
   - Logo Triện Son Khâm Thiên Giám phát quang vàng + Quốc hiệu "ViOS · Khâm Thiên Giám".
   - Huy hiệu ví hoàng triều `50 XU` kèm nút nạp nhanh `+` và chuông thông báo.
2. **Thẻ Bản Mệnh Cung Đình (Greeting & Lunar Status)**:
   - Chào thân chủ: "Kính chào Thân Chủ Hoàng Nam (Mệnh Kiếm Phong Kim, Cung Khảm)".
   - Trạng thái thiên tượng: "Trăng non · Cát Tinh Thượng Chiếu".
3. **Hero Banner Vận Khí Năm 2026 Bính Ngọ**:
   - Viền hoa văn vàng rực rỡ, phân tích thiên can Bính Hỏa & địa chi Ngọ Hỏa.
   - Thẻ mini: "Thái Tuế Tọa Ngọ" | "Thiên Lộc Vượng Cung" | "Lục Hợp Mùi".
   - Nút hành động nổi bật: `Xem Vận Trình 2026 👑`.
4. **Lưới Dịch Vụ Cốt Lõi (Core Services Grid 2x2)**:
   - `👑 Tử Vi Đẩu Số`: Lập tinh bàn 12 cung & Tải hồ sơ 19 trang A4 (108 tinh diệu).
   - `📜 Bát Tự Tứ Trụ`: Định Chân Dụng Thần, Hỷ Thần, 8 Đại Vận & Thần Sát (Tử Bình).
   - `🪙 Lục Hào Chiêm Bốc`: Gieo quẻ 3 đồng xu 3D Càn Long, luận quẻ biến.
   - `🎋 Xăm Quan Thánh`: Lắc ống xăm linh nghiệm, 100 quẻ Thánh Đế.
5. **Widget Lịch Vạn Niên Hoàng Đạo (Daily Almanac)**:
   - Can chi ngày, giờ hoàng đạo, việc nên làm (xanh ngọc) và việc kiêng cữ (đỏ son).
6. **Thanh Điều Hướng Đáy 5 Tab (Sticky Bottom Navigation)**:
   - Trang Chủ | Mệnh Bàn | Chiêm Bốc | Lịch Số | Thân Chủ.
