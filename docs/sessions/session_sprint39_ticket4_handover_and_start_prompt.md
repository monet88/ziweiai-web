# TÀI LIỆU BÀN GIAO (HANDOVER) & PROMPT CHO SESSION TIẾP THEO

**Giai đoạn:** **PHASE 8: Production Store Distribution & Advanced AI Capabilities**  
**Sprint:** **Sprint 39 (Tiến độ: 3/4 tickets đã xong — 75%)**  
**Hạng mục kế tiếp:** **Ticket 39.4: Màn hình Vận Hạn Lưu Niên Nâng Cao (Annual Horoscope Flow) & Báo Cáo PDF Tử Vi Chuyên Sâu**  
**Git Branch hiện tại:** `feature/sprint39-mobile-perfection-and-aab`  
**Rollback Anchor mới nhất:** Commit `79cb2c8` (`feat(mobile): complete sprint 39 ticket 39.2 (admob) and ticket 39.3 (voice synthesis)`)  
**Tổng số tests PASSED:** **890/890 Tests Xanh 100%** (Mobile: 29, API: 443, Web: 258, Contracts: 125, Astro-Engine: 35)

---

## 🎯 1. TỔNG QUAN TIẾN ĐỘ SPRINT 39 (PHASE 8)

1. **Ticket 39.1 (100% DONE):**
   - Keystore signing & Google Play App Bundle `.aab` (59.3MB).
   - Đại tu UI/UX Mobile Luxury Perfection (Thiên Bàn 12 Cung, Kinh Dịch, Profile Screen, Account Deletion, VietQR SePay & RevenueCat Paywall).
2. **Ticket 39.2 (100% DONE):**
   - Tích hợp Google AdMob Rewarded Video Ads trên Mobile (`google_mobile_ads: ^5.2.0`, `AdMobService`).
   - Kết nối Backend API `POST /rewards/ad-reward` cộng +5 XU vào tài khoản.
   - Thêm banner xem ad nhận XU trong `WalletScreen` và `PremiumPaywallSheet`.
3. **Ticket 39.3 (100% DONE):**
   - Tích hợp AI Voice Assistant Audio Synthesis (`flutter_tts: ^4.2.2`, `VoiceSynthesisService`).
   - Xây dựng thanh phát âm thanh Celestial Luxury `VoiceAudioPlayerBar` (Animated Sound Waveform).
   - Nút 1 chạm nghe đọc `VoicePlayIconButton` trên toàn bộ các màn hình luận giải (Trợ Lý AI, Kinh Dịch, Thần Số Học, Tarot, Tướng Mặt / Chỉ Tay).
4. **Ticket 39.4 (HẠNG MỤC CHO SESSION MỚI):**
   - Màn hình Vận Hạn Lưu Niên Nâng Cao (Annual Horoscope Flow / Báo Cáo Năm).
   - Xuất Báo Cáo PDF Tử Vi Chuyên Sâu định dạng A4 sang trọng (kèm biểu đồ, giải đoán 12 cung, vận hạn 12 tháng).

---

## 📋 2. PROMPT SẴN SÀNG CHO SESSION TIẾP THEO

Đại Ka chỉ cần copy toàn bộ đoạn text dưới đây và dán vào session mới:

```markdown
Chào bro! Hãy đọc file CONTEXT.md và file docs/sessions/session_sprint39_ticket4_handover_and_start_prompt.md để tiếp tục triển khai Sprint 39 (Phase 8: Production Store Distribution & Advanced AI Capabilities).

Hiện tại:
- Sprint 39 đã hoàn thành 3/4 tickets (Ticket 39.1, 39.2, 39.3) đạt 100% chuẩn chỉ.
- Toàn bộ 890/890 tests trên Monorepo (Mobile 29, API 443, Web 258, Contracts 125, Astro-Engine 35) đều PASS xanh 100%.
- Nhánh hiện tại: feature/sprint39-mobile-perfection-and-aab (Commit Anchor: 79cb2c8).

Nhiệm vụ cho session này:
Triển khai Ticket 39.4: Màn hình Vận Hạn Lưu Niên Nâng Cao (Annual Horoscope Flow) & Báo Cáo PDF Tử Vi Chuyên Sâu để hoàn tất 100% Sprint 39.
Áp dụng các skills: /vibe-engineering-workflow  /vibe-git-manager  /behavior-model-debugger.
Hãy kiểm tra flow tạo báo cáo năm trên API/Web, xây dựng màn hình Annual Horoscope trên Mobile, tính năng xuất file PDF Tử Vi chuyên sâu sang trọng chuẩn in ấn và chạy full test suite verification gates!
```
