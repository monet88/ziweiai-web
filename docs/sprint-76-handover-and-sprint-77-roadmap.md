# Sprint 76 Handover & Sprint 77 Roadmap — Tử Vi Toàn Tập (ViOS)

## 1. Tóm Tắt Toàn Diện Sprint 75 & Sprint 76

Trong hai sprint liên tiếp vừa qua, hệ thống **ViOS — Tử Vi Toàn Tập (`ziweiai-web`)** đã hoàn thành 100% hai cột mốc lớn:

### A. Sprint 75: Advanced AI Astrological Synthesis & Enhanced Social Sharing
- **Mục tiêu:**
  1. Xây dựng module **Đại Bản Luận Giải Tổng Hợp Tam Môn Phái (Astrological Synthesis)**: Kết hợp Tử Vi Đẩu Số (Thiên Đạo), Bát Tự Hà Lạc (Địa Đạo) và Thần Số Học Pythagoras (Nhân Đạo) với chỉ số đồng thuận Consensus Score (0-100%), điểm tương hỗ (Resonance), hóa giải mâu thuẫn (Tension Resolution) và kế hoạch hành động cải vận (Action Plan).
  2. Xây dựng **Enhanced Social Sharing Studio**: Trình xuất Poster Hoàng Gia hỗ trợ 3 tỉ lệ vàng (Story 9:16, Vuông 1:1, Cổ điển 3:4), nút chia sẻ 1-chạm (Facebook, Zalo, Telegram, Web Share API) và vòng lặp tự lan tỏa (Referral Loop) với `?ref=<userId_or_shortCode>`.
  3. Monetization gate: Yêu cầu 15 XU (`RequireXU(15)`), in-memory cache theo `chartId`, hỗ trợ xem lại miễn phí sau lần đầu.
- **Việc đã làm:**
  - Định nghĩa contract schema trong `packages/contracts/src/synthesis/synthesis.ts`.
  - Xây dựng backend module `apps/api/src/modules/synthesis/` (Controller, Service, Prompt Builder, Unit Tests).
  - Xây dựng frontend module `apps/web/src/lib/features/synthesis/` (`AstrologicalSynthesisModal.svelte`, `SynthesisScoreRadar.svelte`, `synthesis-api.ts`).
  - Xây dựng social share studio `apps/web/src/lib/features/poster/EnhancedSocialShareModal.svelte` và `poster-social-actions.ts`.
  - Tích hợp nút "Luận Giải Tam Hợp VIP" và modal chia sẻ đa tỉ lệ vào `ChartDetailScreen.svelte`.

### B. Sprint 76: Deep Codebase Audit, Security Hardening, Performance & A11y Polish
- **Mục tiêu:**
  - Tổng kiểm tra an ninh, rà soát lỗ hổng, dọn dẹp bộ nhớ, tối ưu hóa bundle size và nâng cao chuẩn trợ năng (A11y).
- **Việc đã làm:**
  1. **Bảo Mật & Quản Lý Bộ Nhớ In-Memory (Anti-OOM):**
     - Nâng cấp `synthesisCache` trong `SynthesisService` thành **Bounded TTL Cache** (`MAX_SYNTHESIS_CACHE_ENTRIES = 200`, `TTL = 24h`), áp dụng lazy eviction khi đọc và xóa FIFO khi đầy dung lượng.
     - Xác nhận không có API key / secret nào bị commit vào git history.
     - Rà soát chống IDOR và đảm bảo dữ liệu cô lập theo tenant/user.
  2. **Kiểm Tra Ranh Giới Kiến Trúc Monorepo (AGENTS.md):**
     - Đã rà soát `apps/web`: 100% tuân thủ ranh giới, không import `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro` hay `lunar-javascript`.
  3. **Tối Ưu Hiệu Năng & Code-Splitting:**
     - Chuyển `html2canvas` từ static import sang dynamic import `import('html2canvas')` trong `royal-poster-exporter.ts`, giúp giảm hơn 200KB bundle tải ban đầu cho client.
  4. **Nâng Cấp Trải Nghiệm Giao Diện, A11y & Phím Tắt:**
     - Bổ sung `role="dialog"`, `aria-modal="true"`, `aria-labelledby` và nhãn `aria-label` chi tiết cho toàn bộ các nút chia sẻ mạng xã hội.
     - Bổ sung xử lý phím tắt `Escape` để đóng modal tức thời.

---

## 2. Kết Quả Kiểm Thử & Triển Khai Production

### A. 6 Validation Gates Nghiêm Ngặt
- **Gate 1: Linting** (`pnpm lint`) — ✅ **PASS 100% CLEAN** (0 errors, 0 warnings).
- **Gate 2: Web Diagnostics** (`pnpm -F @ziweiai/web check`) — ✅ **PASS 100%** (0 errors, 0 warnings).
- **Gate 3: Web Unit Tests** (`pnpm -F @ziweiai/web test`) — ✅ **PASS 74/74 test files (399/399 tests)**.
- **Gate 4: API Unit Tests** (`pnpm -F @ziweiai/api test`) — ✅ **PASS 85/85 suites (534/534 tests)**.
- **Gate 5: Typecheck Monorepo** (`pnpm typecheck`) — ✅ **PASS 10/10 packages**.
- **Gate 6: Monorepo Build** (`pnpm exec turbo run build`) — ✅ **PASS 6/6 packages**.

### B. Trạng Thái Git & Production Vercel
- **Branch:** `main` (clean working directory, không có file rác hay bí mật).
- **Commits Mới Nhất:**
  - `7788bea`: *feat(sprint-75): advanced ai astrological synthesis and enhanced social sharing*
  - `7104cb0`: *feat(sprint-76): deep audit, security hardening, dynamic imports and a11y polish*
  - `501102e`: *docs: add sprint 76 deep audit and hardening report*
- **Production URL:** `https://tuvitoantap.vercel.app` (Deployment ID: `dpl_7PobM52YVpcBGaGpPGvD7ZPFjyw5`).
- **Live Smoke Test:**
  - `GET /api/health` -> `200 OK` (version 0.1.0).
  - `GET /api/features` -> `200 OK` (10 feature flags active).
  - `GET /` -> `HTTP/2 200 OK`.

---

## 3. Định Hướng & Roadmap Đề Xuất Cho Sprint 77

### Chủ đề trọng tâm: **Sprint 77 — AI Astrological Audio/Voice Advisor & 2026-2027 Personalized Destiny Timeline**
1. **AI Voice & Ritual Audio Synthesis (Giọng Đọc Luận Giải Hoàng Triều):**
   - Tích hợp Web Speech API / TTS Serverless hỗ trợ đọc giọng truyền cảm, uy nghiêm bản Luận Giải Tam Hợp và Khí Vận Nhật Khóa.
   - Thêm nút "Nghe Luận Giải" với trình phát âm thanh hoàng cung (âm nhạc thiền định ngũ cung cổ truyền).
2. **Dòng Thời Gian Vận Hạn 2026 - 2027 (Personalized Destiny Timeline):**
   - Trực quan hóa timeline vận hạn 12 tháng năm 2026 và dự báo sớm 2027 theo từng nguyệt hạn.
   - Hệ thống chấm điểm chỉ số cát hung theo thời gian (Tháng phát tài, Tháng đề phòng tiểu nhân/sức khỏe).
3. **Affiliate & Referral Partner Dashboard (Trung Tâm Đối Tác Lan Tỏa):**
   - Bảng theo dõi số người đăng ký qua link giới thiệu, tổng XU hoa hồng đã nhận, bảng xếp hạng sứ giả lan tỏa.
   - Cơ chế rút thưởng hoặc đổi XU lấy ấn phẩm sách tử vi/vật phẩm phong thủy.

---

## 4. Prompt Sẵn Sàng Cho Session Mới (Copy & Paste)

Đại Ka chỉ cần sao chép đoạn prompt dưới đây và dán vào session mới:

```text
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã HOÀN THÀNH 100% SPRINT 75 & SPRINT 76 (Đã commit & push main 501102e, deploy Vercel Production https://tuvitoantap.vercel.app thành công).
Tài liệu chi tiết lưu tại docs/sprint-76-handover-and-sprint-77-roadmap.md và docs/sprint-76-deep-audit-security-hardening-and-performance-optimization-report.md.

BÂY GIỜ CHÚNG TA CHÍNH THỨC BƯỚC VÀO SPRINT 77 — AI ASTROLOGICAL AUDIO ADVISOR & 2026-2027 PERSONALIZED DESTINY TIMELINE:
1. Đọc lại docs/sprint-76-handover-and-sprint-77-roadmap.md để nắm chắc ngữ cảnh bàn giao.
2. Mục tiêu Sprint 77:
   - AI Voice / Audio Narrative: Thêm tính năng đọc giọng truyền cảm cho Đại Bản Luận Giải Tam Hợp và Nhật Khóa.
   - Personalized Destiny Timeline 2026-2027: Biểu đồ thời gian vận hạn 12 tháng trực quan hóa tháng cát hung.
   - Referral Partner Hub: Bảng theo dõi hoa hồng giới thiệu và bảng xếp hạng lan tỏa.
3. Luôn xưng hô "Đại Ka", trả lời bằng tiếng Việt, chuyên môn giữ English.
4. Tuân thủ Karpathy Guidelines: surgical changes, hoàn thành đủ 6 Validation Gates và deploy Vercel Production.

Hãy phân tích và tạo implementation plan cho Sprint 77 ngay em nhé!
```
