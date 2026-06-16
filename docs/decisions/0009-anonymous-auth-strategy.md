# 0009 Khách không đăng nhập dùng Supabase anonymous sign-in

Date: 2026-06-16

## Status

Accepted

## Context

Sản phẩm muốn bỏ tường đăng nhập: khách lập + xem lá số mà không cần tài khoản
(giống tuvi.vn). Nhưng kiến trúc hiện tại chặn ẩn danh ở nhiều tầng:

- `SupabaseAuthGuard` là global `APP_GUARD` — mọi route (trừ `/health` `@Public`) bắt buộc Bearer.
- `@CurrentUser()` ném lỗi khi không có `request.authenticatedUser`.
- `owner_user_id` là `NOT NULL` + FK tới `auth.users` trên **cả 5 bảng** owned.
- `authenticatedUserSchema` ép `userId` phải là `z.uuid()`.
- RLS **không** phải hàng rào thật (backend dùng service-role key, bypass RLS); cô lập
  user nằm ở code ứng dụng (`.eq('owner_user_id', ...)`).

Tức "ẩn danh thật sự không token" buộc phải: nới `owner_user_id` thành nullable hoặc
thêm cột anon-token, sửa unique index (NULL distinct trong Postgres), sửa gateway, sửa
RLS, fallback quota theo IP (in-memory không bền cho per-day). Đây là thay đổi cắt
ngang schema + bảo mật, rủi ro cao.

## Decision

Khách không đăng nhập sẽ được cấp danh tính qua **Supabase anonymous sign-in**
(`supabase.auth.signInAnonymously()`), tạo một JWT thật + một dòng `auth.users` thật.

Hệ quả: contract Bearer, ownership, quota, FK, RLS **giữ nguyên không đổi**. Lá số ẩn
danh vẫn lưu/xem/history được trong phạm vi phiên ẩn danh đó. Sau này nâng cấp lên
email (`linkIdentity`) là đường tiến hóa tự nhiên.

`/history` và sidebar lịch sử vẫn **login-only** về mặt UX: anon session có history kỹ
thuật, nhưng UI chỉ mời "đăng nhập để lưu" cho phiên anon — quyết định sản phẩm, không
phải ràng buộc kỹ thuật.

## Alternatives Considered

1. **Token-less thật + nullable `owner_user_id`** — phải migration 5 bảng, sửa unique
   index theo anon-token, sửa RLS, fallback quota IP (in-memory không bền). Rủi ro
   bảo mật + scope lớn nhất. Loại.
2. **Public-read-by-id** (UUID làm capability) — biến UUID thành "khóa đọc", ai có id
   đọc được lá số người khác; chỉ chấp nhận nếu lá số không chứa PII. Không cần nếu
   dùng anon sign-in. Loại ở giai đoạn này.

## Consequences

Positive:

- Backend (guard/ownership/quota/FK/RLS) không đổi → rủi ro thấp nhất.
- Bất biến biên giới import + ngôn ngữ không bị động tới.
- Đường nâng cấp anon→email rõ ràng.

Tradeoffs:

- Phụ thuộc tính năng anonymous auth của Supabase (phải bật trong project settings).
- Anon session gắn `localStorage` của thiết bị/trình duyệt → xóa storage là mất lá số
  ẩn danh; chấp nhận được cho luồng "xem nhanh không đăng nhập".
- Quota theo `user:${userId}` vẫn áp cho anon (mỗi anon là 1 user) — không cần fallback IP.

## Follow-Up

- Bật Anonymous sign-in trong Supabase project (settings) trước khi release.
- US-009: `AuthStore.init()` gọi `signInAnonymously()` khi chưa có session; nới route
  guard để `/` + `/charts/[chartId]` render cho mọi danh tính, `/history` mời đăng nhập.
- Cân nhắc dọn dẹp anon users cũ (retention) — ghi backlog nếu cần.
