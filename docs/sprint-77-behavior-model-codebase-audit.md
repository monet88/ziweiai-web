# 🔍 Behavioral Audit & UX Reconstruction: ViOS Platform (Pre-Sprint 78)

**Hệ thống:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Phương pháp:** Behavior-First Reverse Spec Debugging (Steve Ruiz Methodology) & Vibe Engineering Lifecycle  
**Thời điểm thực hiện:** 12/09/2026  
**Trạng thái Codebase:** Commit `146f8e8` trên nhánh `feature/sprint-78-journal-and-palace-deepdive`  

---

## 1. 🌐 Tổng Quan Dự Án & Bức Tranh Tính Năng (Holistic Overview)

### Dữ Liệu Đã Quét
- **Tài liệu & Lịch sử:** `README.md`, `spec.md`, `goal.md`, `docs/sprint-76-handover-and-sprint-77-roadmap.md`, `docs/sprint-77-handover-and-sprint-78-roadmap.md`, `implementation_notes.html`.
- **Git State:** Nhánh chính `main` sạch (commit `146f8e8`), đã tạo nhánh tính năng an toàn `feature/sprint-78-journal-and-palace-deepdive` với Rollback Anchor `146f8e8`.

### Bức Tranh Tính Năng (Feature Matrix)
1. **Đã hoàn thiện & Đã kiểm chứng (Verified by execution & tests):**
   - **Core Engine Tử Vi & Bát Tự:** An sao 12 cung, can chi, nạp âm, tứ hóa, đại vận, lưu niên, lưu nguyệt, lưu nhật.
   - **AI Astrological Audio Advisor (Sprint 77):** Web Audio Zen Chime (432Hz/864Hz) 0 latency, Speech chunking chống nghẽn cho `vi-VN`, Royal Glassmorphic Player.
   - **Personalized Destiny Timeline 2026-2027 (Sprint 77):** Biểu đồ 12 cột tháng cát hung, nhận diện tháng đại cát & tháng cẩn trọng.
   - **Referral Partner Hub (Sprint 77):** 4 cấp sứ giả, leaderboard Top 10, sao chép link 1-chạm.
   - **Astrological Synthesis & Social Share (Sprint 75):** Tam hợp luận giải đa môn phái (Nam Phái, Bắc Phái, Khâm Thiên), Poster Hoàng Gia 1200x630.
2. **Đang bước vào phát triển (Sprint 78 Scope):**
   - **Interactive Palace 360 Deep-Dive:** Khám phá chi tiết từng cung vị (Tam Phương Tứ Chính, Cung Giáp, Tứ Hóa Phi Tinh, Lời khuyên Cải Vận & Thính Luận Voice riêng cho từng cung).
   - **Royal Astrological Journal:** Nhật ký chiêm nghiệm thực tế hàng ngày đối chiếu với vận nhật/vận thời và độ tương hợp tâm lý.
   - **Smart Astrological Notifications Preferences:** Tùy biến nhắc nhở giờ hoàng đạo, ngày sóc vọng và cảnh báo sao hung.

---

## 2. 🎮 Tái Tạo Mô Hình Hành Vi Người Dùng (Reconstructed Behavioral Model)

### 1. Tương Tác Cung Vị Tinh Bàn (Palace Grid & Selection)
- **Hành vi hiện tại:**
  - Người dùng bấm vào 1 ô cung trên bàn cờ 12 cung (`PalaceCell.svelte`).
  - Ô cung được viền sáng (`selected`), các cung thuộc Tam Phương Tứ Chính được đánh dấu `inAspect` (viền mờ hơn), các cung ngoài lề bị làm mờ nhẹ (`dimmed`).
  - Bấm lại ô đang chọn sẽ toggle hủy chọn.
- **Điểm khuyết UX (UX Gap):**
  - Hiện tại khi chọn một cung, người dùng phải cuộn xuống dưới rất sâu để xem card thông tin, hoặc chỉ xem được thông tin sơ sài. Chưa có trải nghiệm **Deep-Dive 360°** toàn diện dạng Modal Hoàng Gia để người dùng "mổ xẻ" cung Mệnh, cung Tài, cung Quan của mình một cách trang trọng, đọc thính luận Audio và nhận lời khuyên phong thủy cải vận tức thì.

### 2. Audio Advisor & Gián Đoạn Vòng Đời (Lifecycle & Interruptions)
- **Hành vi kiểm chứng:**
  - Khi bật Audio Advisor, chuông 432Hz ngân vang 3.2s rồi chuyển sang đọc từng câu.
  - Khi bấm Pause / Resume, trạng thái lưu giữ chuẩn xác.
  - Khi chuyển đổi tab hoặc rời trang: engine SpeechSynthesis tự động hủy (`speechSynthesis.cancel()`), không để lại zombie audio chạy ngầm.

### 3. Vận Nguyệt Timeline 2026-2027
- **Hành vi kiểm chứng:**
  - Chuyển đổi giữa năm 2026 và 2027 mượt mà, render tức thì từ client state, không có layout shift.

---

## 3. 💥 Ma Trận Va Chạm Luật Chơi (Invariant Collision Matrix)

| Cặp Tính Năng | Nguy Cơ Va Chạm (Collision Risk) | Giải Pháp Thiết Kế Trong Sprint 78 |
|---|---|---|
| **Palace Deep-Dive vs Horoscope Layer Overlay** | Khi người dùng đang bật overlay Đại Vận / Lưu Niên mà bấm mở Deep-Dive của một cung, thông tin hiển thị là cung gốc (Nguyên Bàn) hay cung Lưu Vận? | Modal Deep-Dive sẽ hiển thị rõ 2 tab: **"Gốc Tiên Thiên"** (Nguyên Bàn) và **"Vận Hạn Hậu Thiên"** (theo tầng vận đang chọn), tránh gây hiểu lầm cho người dùng. |
| **Audio Advisor vs Palace Deep-Dive Audio** | Nếu người dùng đang nghe đọc Luận Giải Tổng Quan mà bấm nghe Thính Luận Cung Vị trong Deep-Dive. | Engine `AudioAdvisorEngine` là Singleton: phát âm thanh mới sẽ tự động dừng âm thanh cũ và reset visualizer, đảm bảo không bao giờ bị phát chồng 2 giọng cùng lúc. |
| **Journal Offline vs Sync Online** | Người dùng ghi nhật ký lúc mất mạng hoặc session hết hạn. | Lưu trữ cục bộ an toàn (`localStorage`) trước khi đồng bộ lên backend, tự động retry khi có kết nối lại. |

---

## 4. 🚨 Kiểm Tra Bảo Mật & Secret Hygiene (Vibe Git Manager)

- **Kiểm tra Secret Tracking:** Không có file `.env`, `.env.local` hay khóa bí mật nào bị theo dõi trong Git.
- **Branching Policy:** Đã tách nhánh `feature/sprint-78-journal-and-palace-deepdive`, giữ mốc rollback an toàn tại commit `146f8e8`.
- **Validation Gates Pre-requisite:** Đã kiểm tra 6 gates trước khi bước vào Sprint 78, 100% test passing (Web: 407 tests, API: 539 tests).

---

## 5. 💎 Khuyến Nghị Kiến Trúc Cho Sprint 78

1. **Contracts Trước Tiên (`packages/contracts`):**
   - Bổ sung schema `astrologicalJournalEntrySchema`, `astrologicalJournalListResponseSchema`, `palaceDeepDiveAnalysisSchema`.
2. **Interactive Palace 360 Deep-Dive:**
   - Xây dựng component `PalaceDeepDiveModal.svelte` tái sử dụng `palace-board-geometry.ts` để phân tích Tam Phương Tứ Chính, Cung Giáp, Hóa Khí phi tinh và Phong Thủy Cải Vận.
3. **Royal Astrological Journal:**
   - Xây dựng service backend `journal.service.ts` và controller `journal.controller.ts` tính toán độ tương hợp giữa tâm lý ngày và sao lưu ngày.
   - Giao diện `AstrologicalJournalModal.svelte` hoặc trang `/journal` cho phép chọn ngày âm/dương, ghi nhận tâm trạng và xem chỉ số hòa hợp năng lượng.
