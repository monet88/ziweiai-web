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

## Cập nhật khi triển khai (US-009)

Giả định "backend KHÔNG cần sửa một dòng nào" hoá ra **gần đúng nhưng không tuyệt
đối**. Token ẩn danh Supabase phát ra trường `email: ""` (chuỗi rỗng, KHÔNG phải
null). `authenticatedUserSchema.email` là `z.email().nullable()` → `z.email()` reject
chuỗi rỗng → `verifyAccessToken` ném lỗi → guard trả **401** cho mọi request ẩn danh.

Sửa tối thiểu (không nới lỏng bảo mật, không đổi schema/guard/RLS/quota): trong
`supabase-auth.service.ts` đổi `email: payload.email ?? null` → `payload.email || null`
để coalesce chuỗi rỗng về null trước khi parse. Chữ ký ES256 (qua JWKS) + `userId` UUID
vẫn verify như cũ. Có test hồi quy cho token ẩn danh `email=""`.

Ngoài ra `config.toml` local bật `enable_anonymous_sign_ins = true` (mặc định `false`)
— đây là follow-up đã nêu sẵn bên dưới, cần bật ở cả project Supabase cloud trước release.

## Consequences

Positive:

- Backend gần như không đổi (chỉ một dòng coalesce email rỗng) → rủi ro thấp.
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
