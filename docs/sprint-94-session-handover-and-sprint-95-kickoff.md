# TÀI LIỆU BÀN GIAO SPRINT 94 VÀ KICKOFF SPRINT 95

> **Dự án:** Tử Vi Toàn Tập (ViOS) — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia  
> **Domain Live Production:** [https://tuvitoantap.online](https://tuvitoantap.online)  
> **Hiện trạng:** Sprint 94 đã hoàn thành xuất sắc 100% ➡️ Bàn giao sang **Sprint 95 (Phase 8)**  
> **Nhánh Git:** `main` (Clean working tree, đã sync với remote `origin/main`)  
> **Quality Gates:** 1000/1000 Tests Passing (572 API + 428 Web), `pnpm check:db` 100% PASSED, Svelte-check 0 errors 0 warnings, Turbo typecheck 10/10 tasks successful.

---

## 1. TÓM TẮT KẾT QUẢ SPRINT 94

### 1.1. Mục Tiêu Đề Ra:
1. Kiểm thử, Gỡ lỗi và Chuẩn hóa Mobile Web PWA trên Thiết Bị Thật (Samsung Galaxy A53 5G qua ADB Wi-Fi `192.168.1.10:45151`).
2. Điều tra và xử lý triệt để lỗi Điểm Danh (`/api/rewards/checkin` báo lỗi 400 và `Database error while checking in`).
3. Minh bạch hóa dữ liệu Sứ Giả Lan Tỏa (Referral Leaderboard): Phân định Real vs Seed Social Proof, sửa lỗi không tăng lượt mời thật khi có người tham gia.
4. Xây dựng giải pháp tự động hóa kiểm thử để chấm dứt vòng lặp test tay thủ công.

### 1.2. Việc Đã Làm & Kết Quả Đạt Được:
* **Kiểm thử thiết bị thật Samsung Galaxy A53**:
  * Đã đo lường Viewport CSS: `384px x 718px` (DPR = `2.8125`).
  * Xác nhận 0% lỗi cuộn ngang.
  * Tinh chỉnh padding chân trang `padding-bottom: calc(80px + env(safe-area-inset-bottom, 16px))` giúp thanh `MobileBottomNav` không còn che khuất footer bản quyền.
  * Bổ sung đầy đủ bộ icon PWA PNG (192px, 512px, maskable) và `apple-touch-icon.png` cho phép cài đặt Web App mượt mà.
* **Xử lý tận gốc lỗi Check-in**:
  * Phát hiện Schema Drift: Bảng `xu_transactions` trên Supabase thật thiếu 2 cột `balance_after` và `metadata`.
  * Đã chạy lệnh `ALTER TABLE` trực tiếp trên database production và tạo migration `000044_add_xu_transactions_ledger_columns.sql`.
  * Đã test thật với tài khoản `galaxypro710@gmail.com`: Điểm danh thành công, cộng 1 XU, chuỗi 2 ngày.
  * Loại bỏ cơ chế masking error ở NestJS để trả về thông điệp tiếng Việt cụ thể khi có lỗi.
* **Tối ưu Bảng Vinh Danh Sứ Giả**:
  * Sửa xong lỗi checkin giúp bảng `referrals` ghi nhận lượt mời thật ngay tức thì mà không bị rollback.
  * Hạ dải số hạt giống danh dự xuống dải tự nhiên từ 1 đến 18 lượt để người dùng thật dễ dàng leo rank Top 2 - Top 8.
* **Thiết lập công cụ tự động hóa kiểm toán**:
  * Tạo lệnh `pnpm check:db` ([`scripts/verify-live-db-integrity.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/scripts/verify-live-db-integrity.ts)) tự động kiểm tra tính toàn vẹn của bảng, cột và chạy Dry-Run SQL trong Transaction Rollback.
  * Kiểm tra hoạt động sẵn sàng của `codegraph` (v1.5.0) và `gitnexus` (v1.6.3) trên máy để phân tích Blast Radius.

---

## 2. TRẠNG THÁI GIT & DEPLOYMENT

* **Git Remote**: `https://github.com/galaxypro710-stack/ziweiai-web.git`
* **Nhánh**: `main`
* **Vercel Production**: `https://tuvitoantap.online` (Deployment ID: `dpl_Hg9ZDkZ3U18jmLuCexgoVn3i76g1`)
* **Vercel Demo**: `https://tuvitoantap.vercel.app`

---

## 3. LỘ TRÌNH SPRINT 95 TIẾP THEO (VIBE-ENGINEERING-WORKFLOW)

Sprint 95 sẽ tập trung vào 3 hạng mục trọng điểm:
1. **Playwright E2E Synthetic User Journey Automation**:
   * Viết script chạy Playwright tự động hóa toàn bộ hành trình người dùng (Đăng nhập -> Checkin -> Mở Sứ giả -> Nạp XU thử nghiệm -> Tạo lá số -> Luận giải AI).
   * Chạy tự động trong CI/CD hoặc bằng 1 lệnh trước mỗi lần deploy để không bao giờ phải click tay từng tính năng.
2. **Kích hoạt Kế hoạch Marketing & Phát Tán Link Viral (Commercial GTM Execution)**:
   * Ứng dụng công cụ `scripts/generate-campaign-links.ts` và Cẩm nang GTM 10 video ngắn TikTok/Reels tại `docs/marketing/sprint-94-commercial-gtm-playbook.md` để bắt đầu kéo traffic tự nhiên.
3. **Giám sát Sổ Cái XU & Bảng Vinh Danh Sứ Giả Thực Tế**:
   * Theo dõi các giao dịch điểm danh và giới thiệu bạn bè thực tế khi có luồng người dùng mới từ mạng xã hội đổ về.

---

## 4. PROMPT KHỞI ĐỘNG SESSION MỚI (COPY-PASTE READY)

Đại Ka chỉ cần copy toàn bộ đoạn prompt dưới đây để dán vào session mới:

```text
Chào bro! Chúng ta tiếp tục phát triển dự án "Tử Vi Toàn Tập (ViOS)" — domain production: https://tuvitoantap.online.

Hiện trạng dự án:
- Vừa hoàn thành Sprint 94 (Phase 8: Production Smoke, Real-Device Mobile PWA Hardening, Checkin & Referral Ledger Audit).
- Tài liệu bàn giao chi tiết: docs/sprint-94-session-handover-and-sprint-95-kickoff.md và docs/sprint-94-completion-behavior-audit-and-database-integrity.md.
- Nhánh git: main, working tree clean, 1000/1000 tests passed (572 API + 428 Web), svelte-check 0 errors 0 warnings, turbo typecheck 10/10 tasks successful.
- Lệnh kiểm toán database thật: "pnpm check:db" đạt chuẩn 100%.
- Lỗi Checkin (missing column balance_after) đã được sửa dứt điểm trên database và backend, bảng Sứ Giả Lan Tỏa đã thông suốt và rebalance mượt mà.
- Mobile PWA đã được kiểm thử trực tiếp trên điện thoại Samsung Galaxy A53 5G qua ADB Wi-Fi, đã chuẩn hóa icon PNG và fix lỗi padding footer.

Nhiệm vụ Sprint 95 (Phase 8 - Scale & Automated E2E Testing Matrix / Commercial Distribution):
1. Xây dựng bộ kịch bản kiểm thử tự động Playwright E2E mô phỏng toàn diện luồng người dùng (Synthetic User Journey) để loại bỏ 100% việc test tay.
2. Triển khai phân phối chiến dịch tiếp thị đa kênh theo Cẩm nang GTM (TikTok/Reels/Facebook Group) với bộ link UTM + Referral đã sinh.
3. Giám sát hệ thống kinh tế XU và vận hành ổn định trên domain live https://tuvitoantap.online.

Hãy áp dụng các quy tắc hành vi Karpathy, xưng hô "Đại Ka", trả lời bằng tiếng Việt (chuyên môn dùng English). Đồng ý tiến hành /vibe-git-manager /vibe-engineering-workflow /behavior-model-debugger. Hãy cho tôi biết kế hoạch hành động cụ thể cho Sprint 95.
```
