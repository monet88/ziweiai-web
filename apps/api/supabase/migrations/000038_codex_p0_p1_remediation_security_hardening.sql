-- Migration: 000038_codex_p0_p1_remediation_security_hardening.sql
-- Description: Khắc phục triệt để toàn bộ các phát hiện P0/P1 từ đợt kiểm toán đối kháng độc lập của Codex:
-- 1. [P0 Sybil 15 XU]: Gán v_initial_xu := 0 trong handle_new_user(). Chỉ cho phép nhận 15 XU tân thủ sau khi email đã được xác minh (email_confirmed_at IS NOT NULL) qua bảng welcome_bonus_claims và RPC claim_welcome_bonus (service_role only).
-- 2. [P0 Turnstile Bypass & Caller Ownership]: Thu hồi quyền EXECUTE trên daily_checkin khỏi public/anon/authenticated. Chỉ service_role (NestJS API đã bọc Turnstile CAPTCHA) mới có quyền gọi. Khóa hàng profiles theo thứ tự cố định (alphabetical UUID) chống deadlock referral chéo.
-- 3. [P0 Direct Ad Reward Bypass]: Thu hồi quyền EXECUTE trên claim_ad_reward khỏi public/anon/authenticated. Chỉ service_role (Google AdMob SSV handler đã verify chữ ký ECDSA) mới được gọi.
-- 4. [P1 Client RLS Hardening]: Đảm bảo toàn bộ bảng kinh tế và RPC đều được khóa quyền chặt chẽ.

-- ============================================================================
-- 1. CẬP NHẬT TRIGGER handle_new_user() TRÊN auth.users
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- CHỐT 1: Không tự động cấp XU khi tạo tài khoản (Zero-Bonus at Signup).
  -- Dù là Anonymous hay Email, số dư ban đầu luôn là 0 XU.
  -- 15 XU tân thủ chỉ được nhận thông qua RPC claim_welcome_bonus sau khi email_confirmed_at có giá trị.
  insert into public.profiles (user_id, display_name, referral_code, xu_balance)
  values (
    new.id,
    new.email,
    upper(substr(md5(new.id::text || random()::text), 1, 8)),
    0
  )
  on conflict (user_id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

-- ============================================================================
-- 2. BẢNG GHI NHẬN & RPC NHẬN 15 XU TÂN THỦ (WELCOME BONUS CLAIMS)
-- ============================================================================
create table if not exists public.welcome_bonus_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  reward_xu integer not null default 15
);

alter table public.welcome_bonus_claims enable row level security;
revoke all on public.welcome_bonus_claims from public, anon, authenticated;
grant all on public.welcome_bonus_claims to service_role;

create or replace function public.claim_welcome_bonus(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_is_anon boolean;
  v_email_confirmed_at timestamptz;
  v_new_balance integer;
begin
  -- 1. Kiểm tra danh tính và trạng thái xác minh email
  select email, coalesce(is_anonymous, false), email_confirmed_at
  into v_email, v_is_anon, v_email_confirmed_at
  from auth.users
  where id = p_user_id;

  if v_email is null or v_is_anon = true then
    raise exception 'Tài khoản ẩn danh không đủ điều kiện nhận thưởng 15 XU tân thủ.';
  end if;

  if v_email_confirmed_at is null then
    raise exception 'Email chưa được xác minh. Vui lòng xác minh địa chỉ email trước khi nhận 15 XU tân thủ.';
  end if;

  -- 2. Kiểm tra xem đã nhận thưởng trước đó chưa
  perform 1 from public.welcome_bonus_claims where user_id = p_user_id for update;
  if found then
    raise exception 'Tài khoản này đã nhận thưởng 15 XU tân thủ trước đó.';
  end if;

  -- 3. Ghi nhận claim vào bảng chống duplicate
  insert into public.welcome_bonus_claims (user_id, reward_xu)
  values (p_user_id, 15);

  -- 4. Khóa hàng profile và cập nhật số dư XU
  select xu_balance into v_new_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  v_new_balance := coalesce(v_new_balance, 0) + 15;

  update public.profiles
  set xu_balance = v_new_balance
  where user_id = p_user_id;

  -- 5. Ghi sổ giao dịch ledger
  insert into public.xu_transactions (user_id, amount, transaction_type)
  values (p_user_id, 15, 'welcome_bonus');

  return 15;
end;
$$;

revoke execute on function public.claim_welcome_bonus(uuid) from public, anon, authenticated;
grant execute on function public.claim_welcome_bonus(uuid) to service_role;

-- ============================================================================
-- 3. CẬP NHẬT RPC daily_checkin: CHỐNG DEADLOCK & THU HỒI QUYỀN CLIENT TRỰC TIẾP
-- ============================================================================
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
  current_last_checkin date;
  current_streak integer := 0;
  today date;
  reward_xu integer := 5;
  ref_reward_xu constant integer := 10;
  daily_referral_limit constant integer := 5;
  total_reward integer := 0;
  referrer_user_id uuid;
  referrer_daily_ref_count integer := 0;
  v_user_email text;
  v_is_anon boolean := false;
  v_referrer_email text;
  v_referrer_is_anon boolean := false;
  v_first_lock_id uuid;
  v_second_lock_id uuid;
begin
  -- CHỐT 2: Kiểm tra caller ownership nếu có JWT context
  if nullif(current_setting('request.jwt.claim.sub', true), '') is not null then
    if current_setting('request.jwt.claim.sub', true)::uuid != p_user_id then
      raise exception 'Không thể thực hiện điểm danh thay cho tài khoản khác.';
    end if;
  end if;

  -- Xác thực danh tính người dùng điểm danh
  select email, coalesce(is_anonymous, false)
  into v_user_email, v_is_anon
  from auth.users
  where id = p_user_id;

  if v_user_email is null or v_is_anon = true then
    raise exception 'Tính năng điểm danh và nhận thưởng XU yêu cầu tài khoản đăng nhập bằng Email.';
  end if;

  -- Sử dụng múi giờ Việt Nam (UTC+7)
  today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- CHỐT 3: Tìm người giới thiệu trước để thực hiện deterministic locking
  if p_referral_code is not null and trim(p_referral_code) != '' then
    select user_id into referrer_user_id
    from public.profiles
    where referral_code = upper(trim(p_referral_code))
      and user_id != p_user_id;

    if referrer_user_id is not null then
      select email, coalesce(is_anonymous, false)
      into v_referrer_email, v_referrer_is_anon
      from auth.users
      where id = referrer_user_id;

      if v_referrer_email is null or v_referrer_is_anon = true then
        referrer_user_id := null;
      end if;
    end if;
  end if;

  -- Khóa hàng theo thứ tự UUID tăng dần để ngăn chặn hoàn toàn deadlock khi ref chéo
  if referrer_user_id is not null then
    if p_user_id < referrer_user_id then
      v_first_lock_id := p_user_id;
      v_second_lock_id := referrer_user_id;
    else
      v_first_lock_id := referrer_user_id;
      v_second_lock_id := p_user_id;
    end if;

    perform 1 from public.profiles where user_id = v_first_lock_id for update;
    perform 1 from public.profiles where user_id = v_second_lock_id for update;
  else
    perform 1 from public.profiles where user_id = p_user_id for update;
  end if;

  select last_checkin_date, coalesce(checkin_streak, 0)
  into current_last_checkin, current_streak
  from public.profiles
  where profiles.user_id = p_user_id;

  if current_last_checkin is null or current_last_checkin < today then
    -- Tính toán chuỗi ngày điểm danh liên tiếp (Streak)
    if current_last_checkin is not null and current_last_checkin = today - 1 then
      current_streak := current_streak + 1;
    else
      current_streak := 1;
    end if;

    -- Thưởng jackpot 10 XU cho ngày thứ 7 liên tiếp
    if current_streak % 7 = 0 then
      reward_xu := 10;
    else
      reward_xu := 5;
    end if;

    total_reward := reward_xu;
    
    -- Cập nhật profile người điểm danh
    update public.profiles
    set 
      xu_balance = xu_balance + reward_xu,
      last_checkin_date = today,
      checkin_streak = current_streak
    where profiles.user_id = p_user_id;

    -- Ghi sổ nhật ký điểm danh
    insert into public.xu_transactions (user_id, amount, transaction_type)
    values (p_user_id, reward_xu, 'daily_checkin');

    -- Xử lý thưởng Referral (nếu là lần đầu điểm danh)
    if current_streak = 1 and current_last_checkin is null and referrer_user_id is not null then
      if not exists (select 1 from public.referrals where referee_id = p_user_id) then
        select count(*) into referrer_daily_ref_count
        from public.referrals
        where referrer_id = referrer_user_id
          and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = today;

        if referrer_daily_ref_count < daily_referral_limit then
          insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
          values (referrer_user_id, p_user_id, ref_reward_xu, 'completed', now());

          update public.profiles
          set xu_balance = xu_balance + ref_reward_xu
          where profiles.user_id = referrer_user_id;

          insert into public.xu_transactions (user_id, amount, transaction_type)
          values (referrer_user_id, ref_reward_xu, 'referral_reward');
        end if;
      end if;
    end if;

    return total_reward;
  else
    return 0;
  end if;
end;
$$;

-- THU HỒI QUYỀN GỌI TRỰC TIẾP TỪ CLIENT TRÊN daily_checkin (Bắt buộc qua Backend NestJS + Turnstile)
revoke execute on function public.daily_checkin(uuid, text) from public, anon, authenticated;
grant execute on function public.daily_checkin(uuid, text) to service_role;

-- ============================================================================
-- 4. THU HỒI QUYỀN GỌI TRỰC TIẾP TỪ CLIENT TRÊN claim_ad_reward
-- ============================================================================
revoke execute on function public.claim_ad_reward(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_ad_reward(uuid, text) to service_role;
