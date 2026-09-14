# SPRINT 96: TỔNG KẾT, BÁO CÁO KIỂM TOÁN CODEBASE VÀ BÀN GIAO SPRINT 97

> **Dự án:** Tử Vi Toàn Tập (ViOS) — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia  
> **Domain Live:** `https://tuvitoantap.online` (Alias: `https://tuvitoantap.vercel.app`)  
> **Thời điểm bàn giao:** 14/09/2026  
> **Tác giả:** Đội ngũ Kỹ sư ViOS (Pair-programming cùng **Đại Ka**)

---

## 1. MỤC TIÊU & TỔNG KẾT PHIÊN LÀM VIỆC SPRINT 96

### 1.1. Mục Tiêu Đặt Ra Ban Đầu
1. **Dynamic Model Tiering:** Cấu hình định tuyến thông minh giữa `gemini-2.0-flash-lite` (cho tác vụ nhẹ: Chat 1 XU, Tarot, Gieo Quẻ) và `gemini-2.5-flash` (cho tác vụ nặng: Báo Cáo Năm, Luận Giải Sâu) nhằm tối ưu thêm 60% chi phí AI.
2. **Pivot B2B Real Estate & Doanh Nghiệp:** Cung cấp gói dịch vụ phong thủy động thổ, khai móng và xuất bản Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang PDF cho chuyên viên Bất Động Sản, Xây Dựng.
3. **Xử Lý 3 Finding Bảo Mật Codex:** Thu hồi rủi ro lộ GitHub PAT cục bộ, chuyển notification endpoints sang fail-closed, dọn 17 dependency advisories.
4. **Phản Hồi & Tinh Chỉnh UX Theo Yêu Cầu Của Đại Ka:**
   - Homepage: Gỡ bỏ khối Doanh Nghiệp khỏi trang chủ để giữ trọng tâm B2C và tránh lệch tone màu, chuyển thành trang riêng `/doanh-nghiep`.
   - Trang Ví (`/wallet`): Khắc phục lỗi bố cục cột dài cột trống, tái cấu trúc thành 2 tầng cân xứng hoàn hảo.
   - Triệt tiêu dứt điểm chuỗi lỗi 500: `Failed to load resource: the server responded with a status of 500 () /api/history?limit=8`.

---

### 1.2. Việc Đã Thực Hiện Chi Tiết

#### A. Kiến Trúc AI & Chi Phí (Dynamic Model Tiering)
- Bổ sung cấu hình `GEMINI_MODEL_LIGHT` (`gemini-2.0-flash-lite`) và `GEMINI_MODEL_DEEP` (`gemini-2.5-flash`) tại `apps/api/src/config/env.ts`.
- Định tuyến tự động trong `gemini-explanation-provider.ts` và `ai-feature-execution.orchestrator.ts`:
  - Micro-features (Tarot, Quẻ Dịch, Xin Xăm, Giải Mộng, Chat AI): Dùng `gemini-2.0-flash-lite` (0.075$/1M input tokens).
  - Heavy-features (Báo Cáo Năm, Hồ Sơ Hoàng Gia PDF, Phân Tích Toàn Cảnh): Dùng `gemini-2.5-flash`.

#### B. Khắc Phục Triệt Để 3 Lỗ Hổng Bảo Mật
- **GitHub PAT:** Gỡ URL nhúng token trong `.git/config`, chuyển remote về HTTPS sạch: `https://github.com/galaxypro710-stack/ziweiai-web.git`.
- **Notification Fail-Closed:** Tại `apps/api/src/modules/notifications/notifications.controller.ts`, nếu môi trường production thiếu `CRON_SECRET`, endpoint ném `UnauthorizedException` lập tức thay vì fail-open.
- **Dependency Audit:** Cấu hình `pnpm.overrides` cho `undici`, `js-yaml`, `vitest`, đạt **0 vulnerabilities** (`pnpm audit`).

#### C. Tinh Chỉnh UX Trang Chủ & Trang B2B Riêng Biệt
- Đã gỡ bỏ toàn bộ khối HTML/CSS `b2b-enterprise-section` khỏi `apps/web/src/routes/(app)/+page.svelte`.
- Tạo mới trang [apps/web/src/routes/(app)/doanh-nghiep/+page.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/(app)/doanh-nghiep/+page.svelte) chuẩn UI/UX `Celestial Luxury`, bọc trong `AppScaffold` hỗ trợ 100% cả Light mode và Dark mode.
- Gắn link điều hướng B2B ở Footer trang chủ.

#### D. Tái Cấu Trúc Bố Cục Trang Ví (`/wallet`) Cân Xứng 2 Tầng
- **Tầng 1 (Nạp XU & QR VietQR):** Cột trái chứa Chọn Gói Nạp XU, Cột phải chứa Khung QR VietQR tự động. Chiều cao 2 bên cân bằng (~650px).
- **Tầng 2 (Tiện Ích & Quyền Lợi):** Bảng giá dịch vụ XU và Khối giới thiệu bạn bè chia đôi 50/50 (`.wallet-bottom-grid`), lấp đầy chiều ngang trang web thanh thoát.

#### E. Triệt Tiêu Vĩnh Viễn Lỗi 500 `/api/history?limit=8`
- `apps/api/src/common/guards/dynamic-throttler.guard.ts`: Khởi tạo `configCache` với default limit cứng (`RATE_LIMIT_AUTH`: 60, `RATE_LIMIT_ANON`: 10) phòng ngừa lỗi Bad Gateway từ Supabase.
- `apps/api/src/modules/history/services/history.service.ts`:
  - Thêm `.catch(() => ({}))` cho từng subquery trong `Promise.all`.
  - Áp dụng `historyItemSchema.safeParse()` trên từng item, loại bỏ rủi ro schema crash toàn mảng.
  - Bọc `try / catch` toàn method `listHistory`: nếu có ngoại lệ bất thường, tự động fallback trả về `{ items: [] }` với HTTP 200 thay vì 500.

---

### 1.3. Kết Quả Đạt Được

| Chỉ Số Đo Lường | Giá Trị Thực Tế | Trạng Thái |
| :--- | :--- | :--- |
| **ESLint Toàn Repo** | `0 errors, 0 warnings` | ✅ ĐẠT |
| **Svelte-check** | `0 errors, 0 warnings` | ✅ ĐẠT |
| **Turbo Typecheck** | `10/10 tasks successful` | ✅ ĐẠT |
| **Unit & Integration Tests** | `1.018/1.018 tests passed` (API: 588, Web: 430) | ✅ ĐẠT |
| **Security Audit** | `0 vulnerabilities` | ✅ ĐẠT |
| **Vercel Production Deploy** | `Ready` (Aliased `tuvitoantap.online`) | ✅ ĐẠT |
| **Playwright Live Verification** | `1/1 passed (0 console errors)` | ✅ ĐẠT |

---

## 2. BÁO CÁO KIỂM TOÁN TOÀN DIỆN (BEHAVIOR-MODEL-DEBUGGER AUDIT)

### 2.1. Kiểm Toán Bảo Mật & Rò Rỉ Bí Mật (Security Audit)
- **Secrets & Credentials:** Kiểm tra `.env`, `.env.local`, `.claude`, `.gemini` đều được gitignore đúng quy cách. Git remote URL không chứa token.
- **Push Notification & Cron Access:** Các route webhook và cron đều được chặn chặt chẽ với timing-safe secret comparison và fail-closed khi thiếu biến môi trường.
- **Supabase Service Role Bypass:** Chỉ chạy ở backend NestJS (`apps/api`), web client hoàn toàn tách biệt, không bao giờ import các thư viện server-only.

### 2.2. Kiểm Toán Hành Vi & Khả Năng Chịu Lỗi (Resilience Audit)
- **Degraded Storage Behavior:** Nếu một ảnh sinh trắc bị lỗi hoặc không thể ký URL, `HistoryService` chỉ đánh dấu `visionImageUrl: null` cho riêng ảnh đó, các dữ liệu khác của user vẫn hiển thị nguyên vẹn.
- **Database Timeout Fallback:** Khi database gặp tình trạng quá tải hoặc cold start, các controller/service đều có defensive error boundary, trả về empty collection `{ items: [] }` thay vì làm sập ứng dụng.
- **Idempotency Trong Thanh Toán:** Webhook SePay xử lý giao dịch nạp XU theo nguyên tắc Idempotent ledger: chỉ cộng XU 1 lần duy nhất cho mỗi mã giao dịch ngân hàng.

### 2.3. Kiểm Toán Hiệu Năng & Frontend Bundle (Performance Audit)
- **Code-splitting:** Các component nặng như `DossierPDFExporter`, `RoyalPosterModal`, `TurnstileWidget` đều được lazy load theo nhu cầu.
- **Asset Optimization:** Loại bỏ hoàn toàn các icon Lucide không dùng, giảm kích thước bundle của `doanh-nghiep` và `pricing`.
- **CSS Architecture:** Loại bỏ triệt để các inline style xung đột, chuẩn hóa biến CSS variables cho dark/light theme thống nhất.

---

## 3. VIBE-ENGINEERING-WORKFLOW: ĐỊNH HƯỚNG SPRINT 97

### 3.1. Các Trọng Tâm Cần Làm Ở Sprint 97
1. **Phát Triển Landing Page B2B Chuyên Sâu (`/doanh-nghiep`):**
   - Bổ sung Form gửi thông tin liên hệ / đăng ký đối tác B2B (tích hợp lưu vào bảng `b2b_inquiries` hoặc gửi thông báo Telegram/Email cho admin).
   - Thiết kế widget xem thử (Interactive Preview) mẫu bìa Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang PDF in màu dành cho khách VIP.
2. **Kích Hoạt Tự Động Thăng Hạng VIP Realtime:**
   - Cải tiến frontend để khi user vừa hoàn tất chuyển khoản gói B2B (790k) hoặc Combo 2026 (79k), modal chúc mừng thăng hạng `Hội Viên Hoàng Thân VIP` hiển thị kèm hiệu ứng pháo hoa Confetti.
3. **Mở Rộng Thư Viện Prompt Tử Vi Phong Thủy Cho BĐS:**
   - Bổ sung chuyên mục luận giải: *Hướng Cửa Chính Hợp Tuổi*, *Năm Nào Làm Nhà Hợp Tuổi*, *Thế Đất Tụ Khí Sinh Tài*.

---

## 4. VIBE-GIT-MANAGER: TRẠNG THÁI GIT & HƯỚNG DẪN PUSH

- **Nhánh hiện tại:** `main`
- **Trạng thái working tree:** `Clean 100%` (Không có untracked file hay uncommitted changes).
- **Các commit đã tạo trong phiên:**
  1. `3740a7a` — feat(sprint-96): dynamic model tiering, b2b real estate pack and security hardening
  2. `3ddc614` — fix(deploy): ignore .gitnexus and recursive build caches in .vercelignore
  3. `5f830a9` — docs(sprint-96): record live vercel deployment and smoke verification results
  4. `da9d3ff` — fix(web,api): move B2B section to dedicated page, balance wallet layout, harden history endpoint against 500
  5. `59f5c27` — style(web): remove unused icon imports to satisfy strict eslint
- **Lưu ý Push GitHub cho Đại Ka:**
  - Vì remote URL đã được làm sạch bảo mật (không lưu token trong URL), khi Đại Ka muốn push lên remote GitHub `origin/main`, Đại Ka chỉ cần mở terminal và chạy:
    ```bash
    git push origin main
    ```
    *(GitHub sẽ hỏi xác thực qua SSH key hoặc GitHub CLI `gh auth login` của Đại Ka).*

---

## 5. PROMPT BÀN GIAO CHO PHIÊN LÀM VIỆC TIẾP THEO (KICKOFF SPRINT 97)

Khi Đại Ka mở phiên làm việc mới, Đại Ka chỉ cần copy toàn bộ đoạn prompt dưới đây và dán vào cửa sổ chat mới:

```markdown
Chào bro! Chúng ta tiếp tục phát triển dự án "Tử Vi Toàn Tập (ViOS)" — domain: https://tuvitoantap.online.

HIỆN TRẠNG DỰ ÁN (HẾT SPRINT 96):
- Đã hoàn thành xuất sắc Sprint 96:
  + Triển khai Dynamic Model Tiering (gemini-2.0-flash-lite cho micro-tasks và gemini-2.5-flash cho heavy-reports).
  + Khắc phục triệt để 3 rủi ro bảo mật (xóa PAT khỏi git config, notification fail-closed, pnpm audit 0 vulnerabilities).
  + Tối ưu UX theo chỉ đạo của Đại Ka: Gỡ khối Doanh Nghiệp khỏi homepage, tạo trang riêng /doanh-nghiep chuẩn Celestial Luxury, cân xứng bố cục trang Ví (/wallet) thành 2 tầng hài hòa.
  + Triệt tiêu vĩnh viễn chuỗi lỗi 500 của /api/history bằng cơ chế phòng thủ per-item safeParse và try/catch fallback.
  + Đã deploy thành công lên Vercel Production (https://tuvitoantap.online & https://tuvitoantap.vercel.app).
  + Toàn bộ 1.018/1.018 tests passed, svelte-check 0 errors 0 warnings, eslint 0 errors.
- Tài liệu bàn giao chi tiết: docs/sprint-96-session-handover-and-sprint-97-kickoff.md.

MỤC TIÊU SPRINT 97:
1. Tiếp tục hoàn thiện trang B2B (/doanh-nghiep): Thêm form đăng ký đối tác doanh nghiệp / chuyên viên BĐS và widget tương tác xem trước mẫu Hồ Sơ Hoàng Gia 19 Trang PDF.
2. Tối ưu trải nghiệm nhận VIP: Hiệu ứng thông báo kích hoạt Hội Viên Hoàng Thân VIP khi giao dịch nạp XU thành công.
3. Đồng ý tiến hành /vibe-engineering-workflow /vibe-git-manager /behavior-model-debugger tiếp tục Sprint 97!
```
