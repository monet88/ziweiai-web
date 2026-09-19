# BÁO CÁO BÀN GIAO SPRINT 73 & LỘ TRÌNH SPRINT 74
**Dự Án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Thời gian:** Tháng 09/2026  
**Trạng thái:** HOÀN THÀNH 100% SPRINT 73 — ĐÃ PUSH COMMIT `a21e6cd` & DEPLOY PRODUCTION VERCEL THÀNH CÔNG

---

## I. TỔNG KẾT SPRINT 73 (DEEP CODEBASE AUDIT, SECURITY HARDENING & AI RESILIENCE)

### 1. Mục Tiêu Sprint 73
1. **Security & RBAC Hardening:** Khắc phục lỗ hổng phân quyền, bảo vệ toàn bộ endpoints `/api/admin/*` với các Guards phù hợp, chống giả mạo quyền truy cập (IDOR) và sửa lỗi nhận diện sai người dùng của hệ thống Rate Limiting (`DynamicThrottlerGuard`).
2. **Formula / CSV Injection Defense:** Ngăn ngừa lỗ hổng thực thi mã công thức độc hại khi xuất báo cáo Excel/CSV từ trang quản trị.
3. **Memory Leaks & Socket Cleanup:** Khắc phục tình trạng mở trùng lặp kết nối Supabase Realtime Channels và rò rỉ event listeners trên trình duyệt.
4. **Code Integrity & Linter Cleanliness:** Loại bỏ triệt để 100% dead code, mồ côi imports và sửa tất cả cảnh báo ESLint / Svelte-check.
5. **AI Hạ Tầng Bounded Resilience:** Thiết lập chuỗi fallback an toàn cho AI router và cơ chế tự động retry 1 lần cho lỗi rớt mạng tạm thời.
6. **Vượt Qua 5 Validation Gates & Deploy Production Vercel.**

---

### 2. Chi Tiết Các Công Việc Đã Thực Hiện

#### A. Backend (`apps/api`)
1. **Kiểm Soát Quyền Hạn Admin Cấp Controller & Endpoint:**
   - File: `apps/api/src/modules/admin/admin.controller.ts` & `admin.module.ts`.
   - Áp dụng `@UseGuards(ModeratorGuard)` cấp class cho toàn bộ AdminController.
   - Áp dụng `@UseGuards(SuperAdminGuard)` độc quyền cho các tác vụ nhạy cảm: `topup`, `topupUserXu`, `cleanup-anon`, `configs`, `reconcile`.
   - Truyền `currentUser?.email` vào `adminService.topupUser` để lưu audit log chính xác.
2. **Sửa Lỗi Rate Limiting DynamicThrottlerGuard:**
   - File: `apps/api/src/common/guards/dynamic-throttler.guard.ts`.
   - Khắc phục `request.user` -> `request.authenticatedUser || request.user`.
   - Định danh `usr_${user.userId || user.id}` giúp người dùng đã đăng nhập hưởng đúng hạn mức thay vì bị gộp IP.
3. **AI Provider Fallback & Auto-Retry:**
   - File: `apps/api/src/providers/ai/provider-router-base.ts`: Sửa `getProviderChain` trả về `[preferred, ...remaining]` đảm bảo fallback dự phòng luôn hoạt động.
   - File: `apps/api/src/providers/ai/llm-exchange.ts`: Bọc hàm `executeFetch` tự động retry 1 lần (delay 400ms) khi gặp lỗi kết nối tạm thời (`fetch failed`, `ECONNRESET`, `502/503/504`).

#### B. Frontend (`apps/web`)
1. **Phòng Chống CSV/Formula Injection:**
   - File: `apps/web/src/lib/utils/csv-sanitizer.ts` & `csv-sanitizer.test.ts`.
   - Escape dấu `"` thành `""` và thêm tiền tố `'` cho các ô bắt đầu bằng `=`, `+`, `-`, `@`, `\t`, `\r`.
   - Tích hợp vào `/admin/transactions` và `/admin/analytics`.
2. **Khắc Phục Memory Leaks & Realtime Duplicate Channels:**
   - File: `WalletIndicator.svelte` & `WalletBalance.svelte`: Chuyển sang dùng store dùng chung `getWalletStore()` từ Context.
   - File: `ExplanationToolbar.svelte`: Thêm `{ once: true }` cho listener `afterprint` và hook `onDestroy()`.
3. **100% Linter Clean:**
   - Dọn sạch dead imports tại `admin/blog/+page.svelte`, `blog/+page.svelte`, `blog/[slug]/+page.svelte`.
   - Bổ sung định danh `key` cho tất cả các khối `{#each}`.
   - Chuẩn hóa việc render thẻ JSON-LD Schema.org qua Svelte derived script.

---

### 3. Kết Quả Kiểm Thử & Triển Khai (Validation Results)

| Gate | Lệnh Kiểm Tra | Kết Quả Chi Tiết |
|------|--------------|-------------------|
| **Gate 1** | `pnpm -F @ziweiai/api test` | **PASS** 84/84 test suites (524/524 tests) |
| **Gate 2** | `pnpm -F @ziweiai/web check` | **PASS** 0 errors, 0 warnings |
| **Gate 3** | `pnpm -F @ziweiai/web test` | **PASS** 70/70 test suites (382/382 tests) |
| **Gate 4** | `pnpm typecheck` | **PASS** 10/10 packages |
| **Gate 5** | `pnpm -F @ziweiai/web build` | **PASS** (12.05s) |
| **Lint** | `pnpm lint` | **PASS** 100% Clean |
| **Git Push** | `git push origin main` | **PASS** Commit `a21e6cd` pushed |
| **Vercel Deploy** | `pnpm deploy:vercel-demo` | **SUCCESS** `tuvitoantap.vercel.app` LIVE |
| **Production Health**| `curl /api/health` | **200 OK** (`{"status":"ok"}`) |
| **Production Features**| `curl /api/features` | **200 OK** (10/10 features active) |

---

## II. ĐỊNH HƯỚNG SPRINT 74 — CONVERSION FUNNEL BOOST, ADVANCED NOTIFICATIONS & USER RETENTION

Dựa trên lộ trình phát triển sản phẩm của ViOS Tử Vi Toàn Tập:
1. **Hệ Thống Thông Báo Thời Gian Thực (In-App Notification Center):**
   - Thông báo biến động số dư XU khi nạp tiền thành công qua SePay.
   - Thông báo kết quả luận giải AI khi hoàn thành chạy ngầm.
   - Nhắc nhở người dùng điểm danh nhận XU miễn phí mỗi ngày (Daily Check-in Streak).
2. **Tối Ưu Hóa Phễu Chuyển Đổi Nạp XU (Conversion Funnel Optimization):**
   - Popup One-Click Topup khi người dùng bấm vào các tính năng VIP (50 XU) mà không đủ số dư.
   - Tích hợp mã QR VietQR động hiển thị ngay trong modal nạp tiền thay vì chuyển hướng trang.
3. **PWA Push Notifications & Offline Caching:**
   - Cải thiện Service Worker để cache các tài nguyên tĩnh và các lá số đã lập gần đây để xem offline.

---

## III. PROMPT KHỞI ĐỘNG SESSION MỚI (COPY TO NEW CHAT)

```text
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã HOÀN THÀNH 100% SPRINT 73 (Đã commit & push main a21e6cd, deploy Vercel Production https://tuvitoantap.vercel.app thành công).
Tài liệu chi tiết lưu tại docs/sprint-73-handover-and-sprint-74-roadmap.md và docs/sprint-73-deep-codebase-audit-security-hardening-and-ai-resilience.md.

BÂY GIỜ CHÚNG TA CHÍNH THỨC BƯỚC VÀO SPRINT 74 — CONVERSION FUNNEL BOOST, IN-APP NOTIFICATIONS & USER RETENTION:
1. Đọc lại docs/sprint-73-handover-and-sprint-74-roadmap.md để nắm chắc ngữ cảnh bàn giao.
2. Mục tiêu Sprint 74:
   - Xây dựng Trung tâm thông báo người dùng (In-App Notification Drawer / Bell) báo biến động XU và trạng thái luận giải.
   - Tối ưu hóa phễu nạp tiền: One-click Topup Modal hiển thị mã VietQR động trực tiếp khi tài khoản không đủ XU xem tính năng VIP.
   - Gamification & Retention: Widget điểm danh nhận XU hằng ngày (Daily Check-in Streak) ngay trên Header/Dashboard.
3. Luôn tuân thủ quy tắc:
   - Luôn xưng hô "Đại Ka", trả lời bằng tiếng Việt, giữ thuật ngữ chuyên môn tiếng English.
   - Tuân thủ Karpathy Guidelines: surgical changes, lập plan trước khi code, vượt qua 5 Validation Gates và deploy Vercel Production sau khi hoàn thành.
```
