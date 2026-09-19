-- Chạy script này trên Supabase SQL Editor để cấp quyền SUPER_ADMIN cho tài khoản của bạn.
-- Thay 'your_email@example.com' bằng email bạn dùng để đăng nhập.

INSERT INTO public.admin_roles (email, role)
VALUES ('your_email@example.com', 'SUPER_ADMIN')
ON CONFLICT (email) 
DO UPDATE SET role = 'SUPER_ADMIN', updated_at = NOW();
