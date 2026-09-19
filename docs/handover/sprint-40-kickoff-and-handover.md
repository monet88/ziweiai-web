# Tài Liệu Bàn Giao (Handover) & Định Hướng Sprint 40

**Dự án:** Tử Vi Toàn Tập (`ziweiai-web` & `apps/mobile`)  
**Ngày bàn giao:** 08/09/2026  
**Chuyển giao từ:** Sprint 39 (Production Hardening & Release)  
**Khởi động:** **Sprint 40 — Celestial Luxury UI Overhaul, Retail Conversion & Strategic Elevation**  
**Quy chuẩn áp dụng:** `/vibe-engineering-workflow`, `/vibe-git-manager`, `/behavior-model-debugger`, `/frontend-design`, `/mobile-design`

---

## 1. Tóm Tắt Trạng Thái Hiện Tại (Current Baseline)

* **Production Live:** [**`https://tuvitoantap.vercel.app`**](https://tuvitoantap.vercel.app)
* **Git Anchor:** Commit [`c619fe7`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web) trên nhánh `main` (Working tree clean, 100% đồng bộ với `origin/main`).
* **Hạ tầng & Chất lượng:**
  * 8/8 Validation Gates pass xanh 100% (Vitest 703/703, Turbo build 6/6, Svelte-check 0 errors, ESLint 0 warnings, Playwright E2E smoke pass, Flutter analyze 0 errors).
  * Webhook SePay & RevenueCat đã được cấu hình Fail-Closed bảo vệ doanh thu.
  * Truy vấn B-Tree UUID range search và chống lạm dụng xem quảng cáo (Daily cap = 5) đã hoạt động trực tiếp trên production.

---

## 2. Đánh Giá Toàn Diện & Góp Ý Thẳng Thắn (Multi-Role Perspective)

### 2.1. Góc Nhìn CEO / Startup Founder (Tăng trưởng & Monetization)
* **Điểm yếu chí mạng hiện tại:** Giao diện còn quá "kỹ thuật" và "phẳng" (flat/simple). Trong ngành tâm linh/phong thủy cao cấp, **niềm tin đến từ tính thẩm mỹ độc bản (Aesthetic Trust)**. Khách hàng sẵn sàng trả 50.000đ – 200.000đ cho một bản luận giải nếu giao diện mang lại cảm giác huyền bí, trang trọng như được tư vấn bởi bậc thầy phong thủy hoàng gia.
* **Tối ưu hóa Phễu Chuyển Đổi (Conversion Funnel):**
  * Không ép trả phí ngay từ đầu. Áp dụng cơ chế **"Teaser Hook"**: cho xem miễn phí tổng quan tính cách và 1-2 điểm đặc biệt trong lá số. Khi đến phần trọng tâm (Vận hạn kiếm tiền, Đại vận 10 năm, Hạn tam tai), hiển thị Paywall thẻ vàng hoàng kim với nút nạp VietQR 1-chạm hoặc In-App Purchase.

### 2.2. Góc Nhìn Product Manager (Cấu trúc & Giảm tải nhận thức)
* **Hội chứng "Bội thực tính năng" (Feature Overload):**
  * Web có tới 17 hệ thuật số hiển thị dàn trải, khiến người dùng phổ thông bị rối loạn (Paralysis of Choice).
* **Giải pháp tái cấu trúc thông tin (Information Architecture):**
  * Nhóm lại thành 3 tầng phễu rõ ràng:
    1. **Trụ cột Bản Mệnh:** Tử Vi 12 Cung & Bát Tự (Dành cho người muốn hiểu sâu vận mệnh).
    2. **Gieo Quẻ Tức Thì:** Kinh Dịch, Tarot, Rút Xăm (Dành cho người cần lời khuyên ngay lập tức).
    3. **Thị Giác & Giác Quan:** AI Quét Tướng Mặt & Chỉ Tay (Tính năng viral dễ chia sẻ mạng xã hội).
    4. Gom các hệ học thuật phức tạp (Đại Lục Nhâm, Kỳ Môn, Mang Phái) vào tab "Nghiên Cứu Chuyên Sâu".

### 2.3. Góc Nhìn Frontend/Mobile Designer (Nâng cấp giao diện Celestial Luxury)
* **Tone màu chủ đạo:** Chuyển dịch từ tông tối đơn sắc sang **Celestial Luxury Dark Mode**:
  * Nền: Thạch anh tím sâu thẳm `#0b0914` kết hợp `#141026`.
  * Ánh sáng: Gradient Vàng Hoàng Kim (Celestial Gold: `#ffd700` đến `#d4af37`).
  * Chất liệu: Glassmorphism mờ viền sáng (`backdrop-filter: blur(16px); border: 1px solid rgba(212,175,55,0.2)`).
  * Chuyển động (Motion): Bụi sao lấp lánh (Stardust particles), hiệu ứng quay vòng Thái Cực tinh tế khi AI đang giải quẻ.
* **Trải nghiệm Mobile:**
  * Bảng 12 cung Tử Vi trên điện thoại cần có chế độ xem lướt dạng **Card Carousel** (Cung Mệnh -> Thân -> Quan -> Tài) song song với chế độ Thiên Bàn toàn cảnh.

### 2.4. Góc Nhìn Tester & Retail User (Thực dụng & Ngôn ngữ)
* **Bình dân hóa kết quả:** Giảm bớt các thuật ngữ Hán Việt khô cứng, bổ sung phần **"Lời Khuyên Thực Tiễn (Actionable Advice)"** ở đầu mỗi luận giải:
  * Tháng này có nên nhảy việc không?
  * Tuần này hướng tài lộc ở đâu?
  * Màu sắc & con số may mắn trong ngày.

---

## 3. Mục Tiêu Sprint 40 (Sprint 40 Backlog & Goals)

1. **Ticket 40.1 (Frontend Design):** Đại tu trang chủ Web (`apps/web`) theo phong cách **Celestial Luxury**: Hero section tinh tế, hiệu ứng các vì sao (starfield), thẻ tính năng nổi khối viền vàng phong thủy.
2. **Ticket 40.2 (Mobile Luxury Polish):** Hoàn thiện trải nghiệm Card Carousel cho Thiên Bàn 12 Cung trên mobile và bổ sung animation lắc ống xăm phong thủy.
3. **Ticket 40.3 (Conversion Teaser Paywall):** Tối ưu hóa giao diện Paywall & nạp XU trên Web/Mobile thành dạng thiệp hoàng gia sang trọng, kích thích tỷ lệ chuyển đổi nạp VietQR/In-App Purchase.
4. **Ticket 40.4 (Live AI Smoke & Retention):** Thực hiện bài test AI live trên production và tích hợp thông báo đẩy (FCM) nhắc lịch may mắn hàng ngày.

---

## 4. Prompt Mẫu Cho Session Mới (Copy & Paste)

Đại Ka chỉ cần copy toàn bộ đoạn prompt bên dưới dán vào session mới để tiếp tục mạch công việc mượt mà:

```text
Chào em, chúng ta tiếp tục dự án Tử Vi Toàn Tập (ziweiai-web). 
Hiện tại hệ thống đã hoàn thành Sprint 39 và đang deploy ổn định tại https://tuvitoantap.vercel.app (commit c619fe7).

Hãy đọc kỹ tài liệu bàn giao tại docs/handover/sprint-40-kickoff-and-handover.md và tuân thủ các quy tắc trong AGENTS.md, /vibe-engineering-workflow, /vibe-git-manager, /behavior-model-debugger, /frontend-design, /mobile-design.

Mục tiêu của session này:
Bắt đầu SPRINT 40: TẬP TRUNG ĐẠI TU GIAO DIỆN CELESTIAL LUXURY (PREMIUM, ĐẲNG CẤP, HUYỀN BÍ HOÀNG GIA), TINH GỌN CẤU TRÚC TRANG CHỦ ĐỂ TĂNG TỶ LỆ CHUYỂN ĐỔI NGƯỜI DÙNG VÀ NẠP XU.

Hãy triển khai Ticket 40.1: Nâng cấp toàn diện giao diện trang chủ Web (apps/web/src/routes/(app)/+page.svelte) và Theme tokens sang phong cách Celestial Luxury sang trọng, ấn tượng mạnh với người dùng ngay từ cái nhìn đầu tiên.
```
