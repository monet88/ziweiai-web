-- Migration: 000023_welcome_bonus_xu.sql
-- Description: Cấp 15 XU tân thủ trải nghiệm khi khởi tạo tài khoản và đặt default xu_balance = 15

-- 1. Cập nhật giá trị mặc định cho cột xu_balance
ALTER TABLE public.profiles ALTER COLUMN xu_balance SET DEFAULT 15;

-- 2. Cập nhật trigger function handle_new_user() khởi tạo ngay 15 XU tân thủ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (user_id, display_name, referral_code, xu_balance)
  values (
    new.id,
    new.email,
    upper(substr(md5(new.id::text || random()::text), 1, 8)),
    15
  )
  on conflict (user_id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;
