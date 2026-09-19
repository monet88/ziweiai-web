# Báo Cáo Bàn Giao (Handoff): Kế Hoạch Nâng Cấp Toàn Diện Giao Diện Mobile "Celestial Luxury" (Sprint 37 - Phase 6)

> **Thời gian:** 30/08/2026  
> **Dự án:** Tử Vi Toàn Tập (ViOS) — `galaxypro710-stack/ziweiai-web`  
> **Giai đoạn tiếp theo:** **Sprint 37 — Phase 6: Mobile UI/UX Overhaul & Celestial Luxury Revamp**  
> **Nhánh Git hiện tại:** `feature/mobile-release-v1` (Base Commit: `4da2e71`)  
> **Pull Request:** [GitHub PR #2](https://github.com/galaxypro710-stack/ziweiai-web/pull/2)  
> **Phương pháp áp dụng:** `/vibe-engineering-workflow` | `/behavior-model-debugger` | `/mobile-design` | `/ui-ux-designer`  

---

## 🧭 1. Đánh Giá Hiện Trạng & Lý Do Cần Nâng Cấp (UI/UX Gap Analysis)

Hiện tại, ứng dụng Mobile Flutter đã hoàn thiện 100% về mặt Logic, State Management (Riverpod), Backend Integration và Build APK, tuy nhiên:
1. **Giao diện còn cơ bản (Simple / Utility-first):** Chưa toát lên vẻ huyền bí, sang trọng và choáng ngợp như bản Web SvelteKit (Trang chủ Celestial Luxury, Thiên Bàn xoay 3D, Bento Grid AI Mystical Tools).
2. **Thiếu cảm giác chiều sâu (Spatial Depth & Glassmorphism):** Các thẻ (`Card`, `GlassPanel`) còn mang cảm giác phẳng (flat), viền chưa có hiệu ứng phát quang (Glow Gradient Border) và hiệu ứng đổ bóng ánh tím huyền ảo.
3. **Thiếu phản hồi xúc giác (Haptic Feedback & Micro-Interactions):** Chưa có rung nhẹ tinh tế khi lật bài Tarot, gieo đồng xu Kinh Dịch hay chọn các cung Tử Vi.
4. **Bottom Bar & Header:** Thanh điều hướng còn ở dạng thanh đáy tiêu chuẩn, chưa phải dạng **Floating Pill Glassmorphism** lơ lửng hiện đại.

---

## 💎 2. Bộ Kỹ Năng (Skills) Tối Ưu Cho Thiết Kế Mobile Flutter

Để biến Mobile Flutter thành một tác phẩm nghệ thuật cao cấp, các skills chủ đạo cần kích hoạt bao gồm:

| Skill | Vai Trò & Ứng Dụng Trong Flutter |
| :--- | :--- |
| **`/mobile-design`** | Thiết kế chuẩn Mobile-First (Touch ergonomics, 120Hz fluid layouts, safe-area, dynamic keyboard avoidance). |
| **`/ui-ux-designer`** | Xây dựng hệ thống Design System (Bảng màu Mystical Celestial, typography phong cách cổ điển huyền bí, component hierarchy). |
| **`/antigravity-design-expert`** | Tạo hiệu ứng chiều sâu không gian (Glassmorphism, Gradient Border Glow, Nebula Shimmer, Floating HUDs). |
| **`/behavior-model-debugger`** | Rà soát va chạm trạng thái, tối ưu phản hồi giác quan (Haptics, Micro-animations, Sound effects, Zero ANR). |
| **`/vibe-engineering-workflow`** | Điều hướng công việc theo từng micro-ticket rõ ràng, chạy Verification Gates trên máy thật. |

---

## 🎨 3. Giải Pháp Thiết Kế: "Celestial Luxury Mobile Design System"

### A. Bảng Màu & Ánh Sáng Vũ Trụ (Color Palette & Lighting)
- **Nền Deep Cosmos:** `#08060F` chuyển tiếp mượt mà sang `#120E24`.
- **Ánh Kim Cát Tường (Imperial Gold):** Gradient từ `#FFDF79` ➜ `#D4AF37` ➜ `#996515` dùng cho viền phát sáng, icon và nút bấm chính.
- **Ánh Huyền Bí Tinh Vân (Nebula Glow):** Màu tím huyền ảo `#7C4DFF` và xanh ngọc bảo `#00E5FF` làm điểm nhấn ánh sáng nền.
- **Glassmorphism 2.0:** Kính mờ siêu thực với `BackdropFilter` làm mờ 20px, phủ màu đen trong suốt 40% và viền vàng kim 1px.

### B. Bento Grid Thuật Số Trên `HomeScreen` (Đồng Bộ Bản Web)
- Chuyển đổi màn hình chính thành **Bento Grid tương tác 3D**:
  - Thẻ lớn nổi bật: **Tử Vi Đẩu Số AI** (Thiên Bàn xoay nhẹ với ánh hào quang trung tâm).
  - Thẻ đôi: **Kinh Dịch Lục Hào** (Đồng xu 3D mạ vàng) & **Tarot Huyền Bí** (Quạt bài phản quang).
  - Thẻ nhãn công nghệ: **Nhân Tướng Học AI Scan** & **Chỉ Tay Biometric Scan**.
  - Thẻ **Thần Số Học Pythagoras** & **Xin Xăm Quán Âm**.

### C. Nâng Cấp Tương Tác Giác Quan (Haptics & Micro-Animations)
- Tích hợp `HapticFeedback.lightImpact()` khi chạm vào thẻ, `mediumImpact()` khi tung xu hoặc lật bài.
- Hiệu ứng **Particle sao lấp lánh (Starfield)** chạy ngầm nhẹ nhàng tối ưu CPU bằng CustomPainter.
- **Floating Pill Bottom Navigation Bar:** Thanh điều hướng đáy lơ lửng bo tròn phủ kính mờ mạ vàng.

---

## 📊 4. Bảng Kế Hoạch Sprint 37 (Phase 6)

| Hạng Mục / Ticket | Mô Tả Thực Hiện | Trạng Thái |
| :--- | :--- | :---: |
| **Ticket 1: Design Tokens & Theme Revamp** | Nâng cấp `AppTheme.dart`, chuẩn hóa `CelestialGradients`, `GlassPanel2_0`, `FloatingNavBar`. | ⏳ Sẵn sàng |
| **Ticket 2: Bento Grid HomeScreen** | Thiết kế lại `HomeScreen` theo ngôn ngữ Bento Grid Celestial Luxury, hỗ trợ Haptic Feedback. | ⏳ Sẵn sàng |
| **Ticket 3: Tử Vi Thiên Bàn Interactive Dial** | Nâng cấp `ZiweiBoard` với hiệu ứng chọn cung phóng to chi tiết và viền hào quang phát sáng. | ⏳ Sẵn sàng |
| **Ticket 4: Kinh Dịch 3D & Tarot Visual Polish** | Nâng cấp hiệu ứng đồng xu 3D chân thực và lật mở bài Tarot phản quang. | ⏳ Sẵn sàng |
| **Ticket 5: Live Device Verify (Galaxy A53)** | Build và cài đặt trực tiếp lên Samsung A53 để thẩm định độ mượt 120 FPS. | ⏳ Sẵn sàng |

---

## 🚀 5. Prompt Khởi Động Cho Session Mới (Next Session Prompt)

Đại Ka hãy copy toàn bộ đoạn dưới đây và dán vào session mới để tiếp tục ngay:

```text
Chào bro! Hãy đọc file CONTEXT.md và file docs/sessions/session_mobile_premium_ui_redesign_handoff.md để tiếp tục triển khai Sprint 37 (Phase 6: Mobile UI/UX Overhaul & Celestial Luxury Revamp).

Hiện tại:
- Web SvelteKit và Backend API đang hoạt động ổn định trên https://tuvitoantap.vercel.app.
- Cơ sở dữ liệu Supabase được bảo vệ vĩnh viễn 24/7/365 qua Cron-Job.org API (Job #8346899 & #8346900).
- Mobile Flutter v1.0.0 (Release APK 59.8MB) đã pass 19/19 tests và test thành công trên Samsung Galaxy A53.
- Pull Request #2 (feature/mobile-release-v1 -> main) đang mở trên GitHub.

Mục tiêu Sprint 37 (Phase 6):
Nâng cấp toàn diện giao diện Mobile Flutter từ mức "khá đơn giản" lên đẳng cấp "Celestial Luxury Glassmorphism" (Đồng bộ với bản Web: Nền Deep Cosmos, Bento Grid Thuật Số, Viền Vàng Hoàng Gia phát sáng, Haptic Feedback rung tinh tế, Floating Pill NavBar).

Hãy áp dụng các skills:
- /vibe-engineering-workflow
- /behavior-model-debugger
- /mobile-design
- /ui-ux-designer
- /antigravity-design-expert

Bắt đầu thực hiện Ticket 1: Nâng cấp Design System (AppTheme, CelestialGradients, GlassPanel 2.0, Floating Pill NavBar) và thiết kế lại HomeScreen theo Bento Grid Celestial Luxury.
```
