# Báo Cáo Kiểm Toán & Đồng Bộ Kinh Tế XU: Thông Báo Khí Vận Nhật Khóa & Chuỗi Điểm Danh 7 Ngày

**Thời gian:** 15/09/2026  
**Chuyên đề:** Behavior Model Audit & Tokenomics Consistency (`/behavior-model-debugger`, `/vibe-engineering-workflow`, `/vibe-git-manager`)  
**Người duyệt:** Đại Ka  

---

## 1. Bối Cảnh & Vấn Đề Phát Hiện

### 1.1. Hiện tượng trên UI
- Tại ngăn kéo thông báo **"Thông Báo Hoàng Triều"** (`NotificationDrawer.svelte`), thẻ thông báo hệ thống nhắc nhở điểm danh hàng ngày hiển thị:
  - **Tiêu đề:** `Khí Vận Nhật Khóa — Điểm Danh Nhận XU`
  - **Nội dung:** `Hôm nay bạn chưa điểm danh. Hãy nhận 5 XU miễn phí để duy trì chuỗi hoàng đạo!`
  - **Huy hiệu:** `+5 XU`
- Trong khi đó, tại Widget chính thức **"Điểm Danh Khởi Vận 7 Ngày"** (`DailyCheckinWidget.svelte`) và quy chuẩn kinh tế XU backend (`RewardsService`), cơ chế điểm danh đã được thống nhất là:
  - **Mỗi ngày thường (Ngày 1 - 6):** `+1 XU`
  - **Jackpot chuỗi ngày thứ 7:** `+3 XU`

### 1.2. Phân tích Nguyên nhân gốc rễ (Root Cause Analysis)
- Tại `apps/api/src/modules/notifications/notifications.service.ts` (phương thức `getUserInAppNotifications`), dữ liệu thông báo nhắc nhở ngày chưa điểm danh (`daily-reminder-${today}`) bị gán cứng (hardcoded) giá trị lịch sử cũ `amountXu: 5` và nội dung copy `5 XU miễn phí`.
- Điều này gây xung đột nhận thức người dùng (cognitive dissonance): người dùng nhìn thấy thông báo hứa hẹn `+5 XU`, nhưng khi bấm vào điểm danh chỉ nhận được `+1 XU`.

---

## 2. Giải Pháp Thực Thi (Surgical Engineering)

### 2.1. Chuẩn hóa Backend `NotificationsService`
File sửa đổi: `apps/api/src/modules/notifications/notifications.service.ts`
- Tính toán chính xác số XU người dùng sẽ nhận được theo chuỗi điểm danh hiện tại:
  ```typescript
  const streak = profile?.checkin_streak || 0;
  const nextStreak = streak + 1;
  const rewardXu = nextStreak % 7 === 0 ? 3 : 1;
  ```
- Đồng bộ thông điệp nhắc nhở:
  - Ngày thường (1 - 6): `Hôm nay bạn chưa điểm danh. Hãy nhận 1 XU miễn phí để duy trì chuỗi hoàng đạo!` (amountXu: 1 ➔ Badge hiển thị `+1 XU`).
  - Ngày thứ 7 (Jackpot): `Hôm nay là ngày thứ 7 hoàng đạo! Hãy nhận 3 XU Jackpot miễn phí để hoàn tất chuỗi!` (amountXu: 3 ➔ Badge hiển thị `+3 XU`).

### 2.2. Kiểm Thử Tự Động (Automated Verification)
File bổ sung: `apps/api/src/modules/notifications/notifications.service.test.ts`
- Bổ sung 3 test cases cho `getUserInAppNotifications`:
  1. `should return empty list when Supabase client is not available`
  2. `should remind checkin with +1 XU when user has not checked in today (streak 0)` ➔ Khẳng định badge `1 XU`, nội dung không còn chứa `5 XU`.
  3. `should remind checkin with +3 XU jackpot when next streak is day 7` ➔ Khẳng định badge `3 XU Jackpot`.

---

## 3. Kết Quả Kiểm Chứng (Verification Gates)

| Gate | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **API Notifications Unit Tests** | `pnpm -F @ziweiai/api test src/modules/notifications/` | **PASS (18/18 tests)** | 100% xanh, không regression |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **PASS** | 0 error, 0 warning |
| **Web Svelte Diagnostics** | `pnpm -F @ziweiai/web check` | **PASS** | 0 error, 0 warning |
| **Web Unit & Component Tests** | `pnpm -F @ziweiai/web test` | **PASS (430/430 tests)** | 81/81 test files xanh hoàn toàn |

---

## 4. Cam Kết & Trạng Thái
- Hoàn toàn tuân thủ **Karpathy Behavioral Guidelines** (Surgical Changes, Simplicity First, Strict Verification).
- Hệ thống thông báo và widget điểm danh đã đồng bộ 100% mô hình kinh tế XU.
