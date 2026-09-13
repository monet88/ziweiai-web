-- ==============================================================================
-- Migration 000039: Khắc phục triệt để các lỗi phản biện từ Codex
-- 1. [P0 Ledger Blocker]: Sửa toàn bộ các lệnh ghi log từ xu_ledger sang xu_transactions
-- 2. [P0 Anti-Sybil]: Bổ sung email & normalized_email vào welcome_bonus_claims triệt tiêu alias (+) và dot trick (.)
-- 3. [Compatibility]: Tạo view tương thích public.xu_ledger trỏ vào public.xu_transactions
-- ==============================================================================

-- 1. Bổ sung cột email và normalized_email vào bảng welcome_bonus_claims
alter table public.welcome_bonus_claims 
  add column if not exists email text,
  add column if not exists normalized_email text;

-- Cập nhật email và normalized_email từ auth.users cho các bản ghi cũ nếu có
update public.welcome_bonus_claims c
set 
  email = u.email,
  normalized_email = lower(trim(u.email))
from auth.users u
where c.user_id = u.id and c.normalized_email is null;

-- Tạo Unique Index trên normalized_email để chặn đứng hoàn toàn việc dùng trick email alias (+) hoặc dot (.)
create unique index if not exists welcome_bonus_claims_normalized_email_idx 
  on public.welcome_bonus_claims (normalized_email);

-- 2. Tạo View tương thích xu_ledger phòng ngừa code hoặc công cụ ngoài tìm bảng này
create or replace view public.xu_ledger as 
select 
  id,
  user_id,
  amount,
  transaction_type as reason,
  created_at
from public.xu_transactions;

-- 3. Hàm helper chuẩn hóa email (loại bỏ alias + và dấu chấm nếu là Gmail)
create or replace function public.normalize_email_address(p_email text)
returns text language plpgsql immutable as $$
declare
  v_email text;
  v_local text;
  v_domain text;
begin
  v_email := lower(trim(p_email));
  if position('@' in v_email) = 0 then
    return v_email;
  end if;

  v_local := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- Cắt bỏ phần sau dấu cộng (+)
  if position('+' in v_local) > 0 then
    v_local := split_part(v_local, '+', 1);
  end if;

  -- Nếu là Gmail / Googlemail, loại bỏ toàn bộ dấu chấm (.)
  if v_domain = 'gmail.com' or v_domain = 'googlemail.com' then
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;

  return v_local || '@' || v_domain;
end;
$$;

-- 4. CẬP NHẬT RPC claim_welcome_bonus: Ghi đúng vào xu_transactions & Chặn Sybil qua normalized_email
create or replace function public.claim_welcome_bonus(
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_normalized_email text;
  v_email_confirmed_at timestamptz;
  v_is_anonymous boolean;
  v_existing_claim uuid;
  v_new_balance integer;
  c_bonus_amount constant integer := 15;
begin
  -- 1. Kiểm tra tài khoản trong auth.users
  select 
    email,
    email_confirmed_at,
    coalesce(is_anonymous, false)
  into 
    v_email,
    v_email_confirmed_at,
    v_is_anonymous
  from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Người dùng không tồn tại.';
  end if;

  if v_is_anonymous or v_email is null or trim(v_email) = '' then
    raise exception 'Tài khoản ẩn danh không đủ điều kiện nhận 15 XU tân thủ. Vui lòng liên kết email.';
  end if;

  -- 2. Bắt buộc email đã được xác minh thực sự
  if v_email_confirmed_at is null then
    raise exception 'Vui lòng xác minh địa chỉ Email trước khi nhận 15 XU tân thủ.';
  end if;

  -- 3. Chuẩn hóa email để chống Sybil alias (+) và dot trick (.)
  v_normalized_email := public.normalize_email_address(v_email);

  -- 4. Kiểm tra đã nhận chưa theo user_id hoặc normalized_email
  select user_id into v_existing_claim
  from public.welcome_bonus_claims
  where user_id = p_user_id or normalized_email = v_normalized_email
  limit 1;

  if v_existing_claim is not null then
    raise exception 'Tài khoản hoặc địa chỉ email này đã nhận 15 XU quà tân thủ rồi.';
  end if;

  -- 5. Khóa hàng profiles của user chống race condition
  perform 1 from public.profiles
  where user_id = p_user_id
  for update;

  -- 6. Ghi nhận claim vào bảng welcome_bonus_claims
  insert into public.welcome_bonus_claims (user_id, email, normalized_email, reward_xu)
  values (p_user_id, v_email, v_normalized_email, c_bonus_amount);

  -- 7. Cộng 15 XU vào ví
  update public.profiles
  set xu_balance = coalesce(xu_balance, 0) + c_bonus_amount
  where user_id = p_user_id
  returning xu_balance into v_new_balance;

  -- 8. Ghi sổ chuẩn xác vào public.xu_transactions (FIX P0 RUNTIME BLOCKER)
  insert into public.xu_transactions (
    user_id, 
    amount, 
    transaction_type
  ) values (
    p_user_id, 
    c_bonus_amount, 
    'welcome_bonus'
  );

  return c_bonus_amount;
end;
$$;

-- Chỉ cấp quyền gọi cho service_role (NestJS API server)
revoke execute on function public.claim_welcome_bonus(uuid) from public, anon, authenticated;
grant execute on function public.claim_welcome_bonus(uuid) to service_role;


-- 5. CẬP NHẬT RPC daily_checkin: Ghi đúng vào xu_transactions & Chống Deadlock
create or replace function public.daily_checkin(
  p_user_id uuid,
  p_referral_code text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_last_checkin date;
  v_balance integer;
  v_streak integer := 1;
  v_reward integer := 5;
  v_new_balance integer;
  v_is_anonymous boolean;
  v_user_email text;
  v_referrer_id uuid;
  v_referrer_code text;
  v_referrer_balance integer;
  v_ref_new_balance integer;
  v_ref_today_count integer := 0;
  v_referrer_email text;
  v_first_id uuid;
  v_second_id uuid;
begin
  -- Giờ chuẩn Việt Nam (UTC+7)
  v_today := (timezone('Asia/Ho_Chi_Minh', now()))::date;

  -- 1. Chặn tài khoản ẩn danh
  select coalesce(is_anonymous, false), email 
  into v_is_anonymous, v_user_email
  from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Người dùng không tồn tại';
  end if;

  if v_is_anonymous or v_user_email is null or trim(v_user_email) = '' then
    raise exception 'Tính năng điểm danh và nhận thưởng XU yêu cầu tài khoản đăng nhập bằng Email.';
  end if;

  -- 2. Nếu có mã giới thiệu, tìm trước ID người giới thiệu
  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select user_id, referral_code into v_referrer_id, v_referrer_code
    from public.profiles
    where referral_code = upper(trim(p_referral_code));
  end if;

  -- 3. Khóa hàng chống deadlock (Deterministic Alphabetical Row Locking)
  if v_referrer_id is not null and v_referrer_id <> p_user_id then
    if p_user_id < v_referrer_id then
      v_first_id := p_user_id;
      v_second_id := v_referrer_id;
    else
      v_first_id := v_referrer_id;
      v_second_id := p_user_id;
    end if;

    perform 1 from public.profiles where user_id = v_first_id for update;
    perform 1 from public.profiles where user_id = v_second_id for update;
  else
    perform 1 from public.profiles where user_id = p_user_id for update;
  end if;

  -- 4. Đọc dữ liệu profile của user hiện tại
  select last_checkin_date, coalesce(xu_balance, 0), coalesce(checkin_streak, 0)
  into v_last_checkin, v_balance, v_streak
  from public.profiles
  where user_id = p_user_id;

  -- 5. Kiểm tra nếu đã điểm danh hôm nay
  if v_last_checkin = v_today then
    return 0;
  end if;

  -- 6. Tính chuỗi điểm danh (Streak)
  if v_last_checkin = v_today - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  -- Thưởng cơ bản 5 XU; mốc 7 ngày liên tiếp thưởng thêm +10 XU (= 15 XU)
  v_reward := 5;
  if v_streak % 7 = 0 then
    v_reward := v_reward + 10;
  end if;

  -- 7. Cập nhật ví và streak
  update public.profiles
  set
    xu_balance = xu_balance + v_reward,
    last_checkin_date = v_today,
    checkin_streak = v_streak
  where user_id = p_user_id
  returning xu_balance into v_new_balance;

  -- 8. Ghi sổ chuẩn xác vào public.xu_transactions (FIX P0 RUNTIME BLOCKER)
  insert into public.xu_transactions (
    user_id,
    amount,
    transaction_type
  ) values (
    p_user_id,
    v_reward,
    'daily_checkin'
  );

  -- 9. Xử lý nhận thưởng mã giới thiệu lần đầu
  if v_referrer_id is not null and v_referrer_id <> p_user_id then
    select email into v_referrer_email from auth.users where id = v_referrer_id;

    if v_referrer_email is not null and trim(v_referrer_email) <> '' then
      if not exists (select 1 from public.referrals where referee_id = p_user_id) then
        select count(*) into v_ref_today_count
        from public.referrals
        where referrer_id = v_referrer_id and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today;

        if v_ref_today_count < 5 then
          insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
          values (v_referrer_id, p_user_id, 10, 'completed', now());

          update public.profiles
          set xu_balance = xu_balance + 10
          where user_id = v_referrer_id
          returning xu_balance into v_ref_new_balance;

          -- Ghi sổ thưởng referral vào public.xu_transactions (FIX P0 RUNTIME BLOCKER)
          insert into public.xu_transactions (
            user_id,
            amount,
            transaction_type
          ) values (
            v_referrer_id,
            10,
            'referral_reward'
          );
        end if;
      end if;
    end if;
  end if;

  return v_reward;
end;
$$;

-- Chỉ cấp quyền gọi cho service_role
revoke execute on function public.daily_checkin(uuid, text) from public, anon, authenticated;
grant execute on function public.daily_checkin(uuid, text) to service_role;
