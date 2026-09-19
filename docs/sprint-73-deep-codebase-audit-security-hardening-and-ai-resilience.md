# Sprint 73: Deep Codebase Audit, Security Hardening & AI Resilience

## 1. Tổng Quan Sprint 73
- **Mục tiêu:** Thực hiện kiểm tra toàn diện codebase (Deep Audit) sau Sprint 72, thắt chặt an ninh API & Frontend (Security Hardening), loại bỏ các rò rỉ bộ nhớ tiềm ẩn (Memory Leaks Elimination), dọn dẹp triệt để mã nguồn thừa (Code Integrity) và gia cố độ tin cậy của hạ tầng AI (AI Provider Resilience).
- **Trạng thái:** HOÀN THÀNH 100% (Passed 5/5 Validation Gates, 100% Lint Clean, 0 Typescript Errors, Production Verified).

---

## 2. Các Hạng Mục Đã Thực Hiện

### 2.1. Backend Security Hardening (`apps/api`)
1. **RBAC & Guard Protection cấp Endpoints:**
   - [admin.controller.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/admin/admin.controller.ts):
     - Gắn `@UseGuards(ModeratorGuard)` ở cấp độ class controller, ngăn chặn triệt để mọi truy cập trái phép từ user thông thường hoặc anonymous session.
     - Gắn `@UseGuards(SuperAdminGuard)` trực tiếp trên các mutation endpoints nhạy cảm: `POST /api/admin/users/:userId/topup`, `POST /api/admin/users/:userId/xu`, `POST /api/admin/cleanup-anon`, `PUT /api/admin/configs`, `POST /api/admin/reconcile`.
     - Bổ sung `currentUser?.email` vào `adminService.topupUser()` để phục vụ audit log chi tiết người thực hiện giao dịch nạp thủ công.
   - [admin.module.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/admin/admin.module.ts):
     - Khai báo và inject `ModeratorGuard` và `SuperAdminGuard` vào mảng `providers`.
2. **Sửa lỗi nhận diện Rate Limiting (`DynamicThrottlerGuard`):**
   - [dynamic-throttler.guard.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/common/guards/dynamic-throttler.guard.ts):
     - Sửa lỗi kiểm tra `request.user`: `SupabaseAuthGuard` lưu user vào `request.authenticatedUser`. Đã đồng bộ kiểm tra `const user = (req.authenticatedUser || req.user)`.
     - Khi đã đăng nhập, `getTracker()` sinh key `usr_${user.userId || user.id}` giúp áp dụng đúng hạn mức rate-limit dành riêng cho user đã xác thực thay vì fallback về IP tracker.

### 2.2. AI Provider Resilience & Fallback Chain (`apps/api`)
1. **Fallback Provider Chain Hoàn Hảo:**
   - [provider-router-base.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/providers/ai/provider-router-base.ts):
     - Trước đây, khi cấu hình `preference` (ví dụ `deepseek`, `gemini`, `openai-compat`), router chỉ trả về mảng đơn lẻ 1 provider, nếu provider ưu tiên bị downtime/timeout thì toàn bộ request thất bại.
     - Cải tiến: Trả về `[preferredProvider, ...remainingProviders]`, đảm bảo luôn có các provider khả dụng khác dự phòng phía sau.
2. **Transient Network Drop Auto-Retry:**
   - [llm-exchange.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/providers/ai/llm-exchange.ts):
     - Bổ sung hàm bọc `executeFetch` tự động retry 1 lần (delay 400ms) khi gặp lỗi kết nối tạm thời (`fetch failed`, `ECONNRESET`, `ETIMEDOUT`, HTTP 502/503/504), giúp giảm tỷ lệ rớt request do network jitter của các nhà mạng hoặc proxy.

### 2.3. Frontend Security & Memory Leak Elimination (`apps/web`)
1. **Chống tấn công Formula Injection (CSV Injection):**
   - [csv-sanitizer.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/utils/csv-sanitizer.ts):
     - Tạo hàm tiện ích `sanitizeCsvCell(val)` chuẩn OWASP: tự động escape dấu ngoặc kép (`""`) và thêm tiền tố nháy đơn (`'`) nếu ô dữ liệu bắt đầu bằng các ký tự công thức (`=`, `+`, `-`, `@`, `\t`, `\r`).
     - Đã viết unit test [csv-sanitizer.test.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/utils/csv-sanitizer.test.ts) (4/4 test cases pass).
   - [transactions/+page.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/(app)/admin/transactions/+page.svelte) & [analytics/+page.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/(app)/admin/analytics/+page.svelte):
     - Áp dụng `sanitizeCsvCell` cho toàn bộ các trường khi xuất file CSV giao dịch và báo cáo phân tích.
2. **Loại bỏ trùng lặp kết nối WebSocket Realtime:**
   - [WalletIndicator.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/features/payment/WalletIndicator.svelte) & [WalletBalance.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/features/payment/WalletBalance.svelte):
     - Chuyển sang sử dụng Context Store dùng chung `getWalletStore()` thay vì tự tạo các instance riêng lẻ gây xung đột và mở dư thừa kết nối Supabase Realtime channel.
3. **Dọn dẹp Window Event Listeners:**
   - [ExplanationToolbar.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/features/explanation/ExplanationToolbar.svelte):
     - Bổ sung `{ once: true }` cho listener `afterprint` và cleanup triệt để class `printing-explanation-scroll` trong hook `onDestroy()`.

### 2.4. Code Integrity & 100% Lint Cleanliness
- Dọn dẹp các biến và icon import mồ côi (dead code):
  - `admin/blog/+page.svelte`: Xóa `FileText`, `Share2`.
  - `blog/+page.svelte`: Xóa `BlogPost`, `BookOpen`, `Tag`.
  - `blog/[slug]/+page.svelte`: Xóa `Compass`.
- Khắc phục toàn bộ các cảnh báo svelte-check & ESLint:
  - Bổ sung định danh key `(item.slug)`, `(item.id)`, v.v. cho toàn bộ các khối `{#each}`.
  - Chuẩn hóa việc render thẻ JSON-LD Schema.org qua Svelte derived scripts nhằm tránh lỗi parser linter.
- Kết quả: `pnpm lint` đạt **100% Clean (0 errors, 0 warnings)**.

---

## 3. Kết Quả Kiểm Thử (Validation Gates)

| Gate | Lệnh Kiểm Tra | Kết Quả |
|------|--------------|---------|
| **Gate 1: API Unit & E2E Tests** | `pnpm -F @ziweiai/api test` | **PASS** (84/84 test suites passed, 524/524 tests) |
| **Gate 2: Web Svelte-Check** | `pnpm -F @ziweiai/web check` | **PASS** (0 errors, 0 warnings) |
| **Gate 3: Web Unit Tests** | `pnpm -F @ziweiai/web test` | **PASS** (70/70 test suites passed, 382/382 tests) |
| **Gate 4: Monorepo Typecheck** | `pnpm typecheck` | **PASS** (10/10 packages typechecked thành công) |
| **Gate 5: Web Production Build** | `pnpm -F @ziweiai/web build` | **PASS** (Build thành công trong 12.05s) |

---

## 4. Danh Sách Files Thay Đổi
- `apps/api/src/common/guards/dynamic-throttler.guard.ts`
- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/admin/admin.controller.test.ts`
- `apps/api/src/modules/admin/admin.module.ts`
- `apps/api/src/providers/ai/llm-exchange.ts`
- `apps/api/src/providers/ai/provider-router-base.ts`
- `apps/web/src/lib/features/explanation/ExplanationToolbar.svelte`
- `apps/web/src/lib/features/payment/WalletBalance.svelte`
- `apps/web/src/lib/features/payment/WalletIndicator.svelte`
- `apps/web/src/lib/utils/csv-sanitizer.ts` (NEW)
- `apps/web/src/lib/utils/csv-sanitizer.test.ts` (NEW)
- `apps/web/src/routes/(app)/admin/analytics/+page.svelte`
- `apps/web/src/routes/(app)/admin/blog/+page.svelte`
- `apps/web/src/routes/(app)/admin/transactions/+page.svelte`
- `apps/web/src/routes/(app)/blog/+page.svelte`
- `apps/web/src/routes/(app)/blog/[slug]/+page.svelte`
