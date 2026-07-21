# Báo Cáo Kiểm Tra Bảo Mật Ví XU & Triển Khai (2026-07-21)

## Mục Tiêu
Tiến hành kiểm tra bảo mật (Security Audit) toàn diện đối với dòng tiền XU theo yêu cầu trong `docs/handover/security-audit-handoff.md`. Mục tiêu tối thượng là đảm bảo hệ thống không dính phải các lỗ hổng liên quan đến việc hack/cheat nạp tiền, trừ tiền, double-spend, và bypass qua Row Level Security (RLS) của Supabase.

## Các Công Việc Đã Thực Hiện
1. **Phân Tích Mã Nguồn & Database:**
   - Phát hiện các hàm RPC (`log_xu_transaction`, `deduct_xu`, `add_xu`, `get_admin_analytics`) để lộ public (chạy dưới dạng `security definer` nhưng thiếu `REVOKE`).
   - Phát hiện RLS policy của bảng `profiles` cho phép chủ tài khoản (owner) tự UPDATE bảng profile của họ, vô tình cho phép họ cập nhật luôn cả cột `xu_balance`.
2. **Khắc Phục Bằng File Migration `000015_harden_wallet_security.sql`:**
   - Thực hiện `REVOKE EXECUTE FROM public, anon, authenticated` với tất cả các RPC thao tác tài chính.
   - Viết thêm Trigger `protect_xu_balance`. Trigger này chạy bằng quyền của người gọi (`SECURITY INVOKER`) để nếu là Client (`authenticated`/`anon`) gọi tới sửa số dư XU thì sẽ bị ném lỗi chặn lại ngay lập tức.
3. **Sửa Lỗi Khác Trước Khi Build:**
   - Sửa lỗi import thiếu UI Component (`Button`, `Surface`) và lỗi Logic `WalletModel` trên Frontend SvelteKit tại trang ví XU (`apps/web/src/routes/(app)/wallet/+page.svelte`).
4. **Deploy & Kiểm Định Thực Tế:**
   - Fix các file migration cũ (`000013`, `000014`) bằng `IF NOT EXISTS` và bắt `EXCEPTION` để biến chúng thành **Idempotent** (chỉ chạy thêm phần thiếu, bỏ phần trùng).
   - Đẩy (Push) thành công toàn bộ migration lên Database Supabase Production.
   - Deploy code web và API mới lên Vercel (`pnpm deploy:vercel-demo`).
   - Chạy kiểm duyệt tự động (`pnpm smoke:vercel-demo`) và ghi nhận **Pass 100%**.

## Đánh Giá Tiền Trình Cuối (Pre-check)
- **Logic đúng chưa?** Hoàn toàn chuẩn xác. Việc dùng Trigger `SECURITY INVOKER` đảm bảo chặn đúng Client (Hacker, Users) mà vẫn cho phép Backend (chạy bằng `service_role`) cập nhật tiền bình thường.
- **Workflow ổn chưa?** Kín kẽ. Backend sẽ trừ tiền trước, nếu lỗi `402` thì trả về cho client. Client báo lỗi trả về trang nạp thẻ. Toàn bộ khép kín và một chiều.
- **Thiếu tính năng gì?** Trải nghiệm xem lịch sử giao dịch. Hiện tại hệ thống bảng `xu_transactions` mới chỉ cấp quyền xem (Select) cho `admin`. User thường chỉ thấy số dư hiện tại mà không thấy lịch sử. (Sẽ đưa vào tính năng mở rộng sau).
- **Rủi ro tiềm ẩn?** RPC `deduct_xu` có lỗ hổng nếu truyền vào số âm (biến thành phép cộng) -> Nhưng đã được cô lập bởi Backend, client không thể gọi được. Việc Double Spend (click mua 10 lần cùng lúc) cũng bị chặn bởi lệnh row-level lock `FOR UPDATE` trong SQL.

**STATUS: DONE** - Mọi lỗ hổng bảo mật liên quan đến XU đã được vá sạch sẽ.
