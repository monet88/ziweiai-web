# SPRINT 48: TAM HỢP HOÀNG GIA (IMPERIAL SYNERGY)
## HỒ SƠ PHÂN TÍCH HÀNH VI, KIẾN TRÚC HỢP NHẤT & KẾ HOẠCH THỰC THI 3 PHASE

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web` / `apps/mobile`)  
**Sprint:** 48 ("Tam Hợp Hoàng Gia" — Duyên Định Cung Đình, Ngự Phán Toàn Năng & Ngự Báo Mỗi Ngày)  
**Nhánh Git:** `feature/sprint-48-imperial-synergy`  
**Rollback Anchor:** `8e8dc57` (Commit hoàn thành 100% Sprint 47)  
**Trạng thái:** SẴN SÀNG KHỞI ĐỘNG (READY FOR KICKOFF)  

---

### I. MỤC TIÊU SPRINT 48 (STRATEGIC GOALS)

Hợp nhất toàn bộ 3 trụ cột giá trị cao nhất theo quyết định của Đại Ka vào nền tảng Mobile:

1. **Vertical 1: Duyên Định Cung Đình (Astrological Compatibility / Synastry)**:
   - Module tính toán mức độ hòa hợp giữa 2 người: Tình duyên, Vợ chồng, Hợp tác làm ăn, Bạn bè.
   - Thuật toán phối hợp 4 yếu tố cốt lõi:
     - **Ngũ Hành Nạp Âm**: Tương sinh, tương khắc, tương hòa.
     - **Cung Phi Bát Trạch**: Sinh Khí, Diên Niên, Thiên Y, Phục Vị (Cát) vs Tuyệt Mệnh, Họa Hại, Lục Sát, Ngũ Quỷ (Hung).
     - **Thiên Can Hợp/Phá**: Giáp Kỷ hợp thổ, Ất Canh hợp kim...
     - **Địa Chi Tam Hợp/Lục Hợp/Tứ Hành Xung**: Tý Sửu lục hợp, Thân Tý Thìn tam hợp...
   - Điểm số Cung Đình (thang điểm 100) và bài vịnh luận giải tương hợp.
   - Thẻ ảnh 9:16 Cung Đình "Duyên Định Kỳ Phùng" xuất sắc để chia sẻ lên Zalo/Facebook Story kèm QR Code.

2. **Vertical 2: Ngự Phán Phòng Toàn Năng (Global AI Divination Chat)**:
   - Mở rộng từ `AssistantPanel` (vốn phụ thuộc 1 lá số đơn lẻ) thành **Ngự Phán Phòng Độc Lập** (`divination_chat_screen.dart`).
   - Cho phép người dùng đàm đạo tự do với Khâm Thiên Giám AI về mọi sự vụ huyền học: Vận hạn năm nay, đặt tên con hợp tuổi, phong thủy nhà ở, ngày lành khai trương.
   - Giao diện thư phòng hoàng gia cổ phong, cơ chế streaming mượt mà, tích hợp nút phát âm thanh câu trả lời tức thì bằng AI Voice.

3. **Vertical 3: Khâm Thiên Giám Ngự Báo (Daily Horoscope & Local Notification Engine)**:
   - Màn hình xem Vận Khí Hôm Nay (`daily_horoscope_screen.dart`): Giờ hoàng đạo, việc nên làm, kiêng kỵ, hướng xuất hành hỷ thần/tài thần.
   - Dịch vụ thông báo nội bộ thiết bị (`local_notification_service.dart`): Tự động lên lịch nhắc vận khí mỗi sáng lúc 7:00 AM (không cần backend server push, offline-first, bảo mật tuyệt đối).

---

### II. BÁO CÁO AUDIT HÀNH VI & MA TRẬN VA CHẠM (/behavior-model-debugger)

Sau khi audit toàn bộ codebase `apps/mobile/lib/features/`, các điểm va chạm bất biến (Invariant Collisions) đã được mô hình hóa và giải quyết như sau:

| STT | Va chạm tiềm ẩn (Invariant Collision) | Nguyên nhân gốc rễ (Root Cause) | Giải pháp thiết kế & Xử lý triệt để |
| :---: | :--- | :--- | :--- |
| **1** | **Xung đột Audio giữa Chat AI & Zen Soundscape** | Người dùng đang bật nhạc thiền `isZenMode` mà AI Chat bắt đầu đọc câu trả lời thì 2 âm thanh phát đè lên nhau. | Tích hợp cơ chế **Audio Ducking**: Trong `VoiceSynthesisService`, khi phát tin nhắn chat thì tạm pause hoặc hạ volume Zen nền, phát xong tự phục hồi. |
| **2** | **Xung đột Trừ XU khi Spam Chat hoặc Xem Tương Hợp** | Người dùng gửi liên tục tin nhắn hoặc đổi ngày sinh liên tục khiến tài khoản bị trừ nhiều lần ngoài ý muốn. | - Tính điểm tương hợp & xem 80 quẻ: **MIỄN PHÍ**.<br>- Luận giải AI chuyên sâu 2 người: **15 XU** (bắt buộc hiện Dialog xác nhận).<br>- Chat AI: **1 XU / 1 câu hỏi**, hiển thị số dư XU trực tiếp trên thanh Input. |
| **3** | **Xung đột Deep-linking từ Thông báo Buổi Sáng** | Bấm thông báo đẩy mà không biết chuyển hướng về đâu, rơi vào màn hình Home chung. | Khai báo route `/daily-horoscope` độc lập; payload thông báo kích hoạt `router.push('/daily-horoscope')`. |
| **4** | **RenderFlex Overflow trên Thẻ 9:16 Cặp Đôi** | Tên 2 người quá dài hoặc danh sách sao xung hợp chiếm quá nhiều chiều cao màn hình nhỏ. | Bọc `Flexible`, `ListView.shrinkWrap` và cố định viewBox tỷ lệ chuẩn `AspectRatio(aspectRatio: 9 / 16)` cho thẻ xuất ảnh. |

---

### III. LỘ TRÌNH TRIỂN KHAI 3 PHASE (/vibe-engineering-workflow)

Theo chuẩn **Nhóm 3 (Clear & Large)**, dự án chia làm 3 Phase tuần tự:

- **Phase 1: Duyên Định Cung Đình (Compatibility & Royal Share Card)**
  - Thuật toán `compatibility_calculator.dart` (Can, Chi, Mệnh, Cung Phi).
  - Giao diện `compatibility_screen.dart` và Thẻ Story 9:16 `royal_compatibility_card.dart`.
  - Bộ kiểm thử tự động `compatibility_test.dart`.
- **Phase 2: Ngự Phán Phòng Toàn Năng (Global Realtime AI Chat)**
  - Màn hình `divination_chat_screen.dart` độc lập với thanh Input Cung Đình.
  - Tích hợp Voice Readout & Audio Ducking với `VoiceAudioPlayerBar`.
  - Bộ kiểm thử tự động `divination_chat_test.dart`.
- **Phase 3: Khâm Thiên Giám Ngự Báo (Daily Horoscope & Local Notification)**
  - Thuật toán giờ hoàng đạo & hướng xuất hành ngày hôm nay `daily_horoscope_calculator.dart`.
  - Màn hình `daily_horoscope_screen.dart` & Banner tại `HomeScreen`.
  - `local_notification_service.dart` lên lịch nhắc vận khí mỗi sáng.
  - Bộ kiểm thử tự động `daily_horoscope_test.dart`.

---

### IV. AN TOÀN MÃ NGUỒN & ROLLBACK (/vibe-git-manager)

- **Base Anchor Commit**: `8e8dc57` (Sprint 47).
- **Working Branch**: `feature/sprint-48-imperial-synergy`.
- **Secret Hygiene**: Sử dụng Local Notification thay vì Cloud FCM để tránh commit private service account keys hoặc Firebase credentials.
