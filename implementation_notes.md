# Implementation Notes: Sprint 86 Web & Admin Dashboard Hardening

## 1. Unspecified & Implicit Decisions
- **Admin Ban/Unban API Routing:** Client `apps/web/src/lib/api-client/admin.ts` kỳ vọng endpoint `POST /admin/users/:userId/ban` và `POST /admin/users/:userId/unban`. Do backend trước đó chỉ có method trong repository `adminBanUser` mà chưa có controller route, chúng tôi đã tạo trực tiếp 2 endpoints này trên `AdminController` có bảo vệ bằng `SuperAdminGuard` và ghi nhận `actorEmail` vào audit logs.
- **Config Key-Value REST Flexibility:** Bổ sung `POST /admin/configs/:key` song song với `POST /admin/configs` để đáp ứng cả 2 phong cách request từ frontend, ngăn chặn mọi rủi ro lỗi 404/405 khi admin thao tác cấu hình cờ tính năng hoặc giá XU.

## 2. Deviations from Specification
- Không có sự sai lệch tiêu cực nào. Mọi thay đổi đều trực tiếp khép kín các API contract còn khuyết thiếu giữa Web và Backend API.

## 3. Considered Trade-offs
- **Fail-Closed cho Ad Rewards:** Cờ `ENABLE_AD_REWARDS=false` tiếp tục được duy trì trên Production để bảo vệ 100% ngân quỹ cho đến khi Google AdMob review xong app trên store.

## 4. Maintenance Notes
- Khi phân quyền tài khoản Super Admin, sử dụng bảng `admin_roles` trên Supabase (email hiện tại: `sevengotek@gmail.com`).
- Toàn bộ 966 unit & integration tests trong monorepo đều pass 100% trước mỗi lần deploy.
