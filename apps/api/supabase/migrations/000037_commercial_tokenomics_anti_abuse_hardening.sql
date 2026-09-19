-- Migration: 000037_commercial_tokenomics_anti_abuse_hardening.sql
-- Description: Khóa chốt an ninh kinh tế học đồng XU & Chống gian lận khai thác AI (Sybil Attack Hardening).
-- 1. Chặn cấp 15 XU cho tài khoản ẩn danh (Anonymous Session). Chỉ cấp 15 XU tân thủ duy nhất 1 lần cho tài khoản xác thực Email thật.
-- 2. Chặn tài khoản ẩn danh gọi RPC daily_checkin để farm XU điểm danh.
-- 3. Siết chặt Referral: Người mời và người được mời bắt buộc phải là tài khoản Email thật mới được nhận thưởng 10 XU.

-- 1. Cập nhật trigger handle_new_user() trên auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_initial_xu integer := 0;
begin
  -- CHỐT 1: Chống vòng lặp khai thác 15 XU (Sybil / Incognito Loop).
  -- Chỉ cấp 15 XU tân thủ cho tài khoản đăng ký bằng Email thật.
  -- Tài khoản ẩn danh (new.email IS NULL hoặc new.is_anonymous IS TRUE) nhận 0 XU.
  if new.email is not null and coalesce(new.is_anonymous, false) = false then
    v_initial_xu := 15;
  else
    v_initial_xu := 0;
  end if;

  insert into public.profiles (user_id, display_name, referral_code, xu_balance)
  values (
    new.id,
    new.email,
    upper(substr(md5(new.id::text || random()::text), 1, 8)),
    v_initial_xu
  )
  on conflict (user_id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

-- 2. Cập nhật trigger protect_profile_economic_columns() trên public.profiles
create or replace function public.protect_profile_economic_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
  v_is_service boolean := false;
begin
  -- Lấy role từ JWT claims an toàn
  v_jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  );

  if v_jwt_role = 'service_role' then
    v_is_service := true;
  elsif v_jwt_role is null and session_user in ('postgres', 'supabase_admin') then
    v_is_service := true;
  else
    v_is_service := false;
  end if;

  if TG_OP = 'INSERT' then
    if not v_is_service then
      -- Clients insert trực tiếp qua REST API không thể tự gán XU tùy ý
      NEW.xu_balance := 0;
      NEW.last_checkin_date := null;
      NEW.checkin_streak := 0;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if not v_is_service then
      -- Clients không thể sửa số dư, ngày điểm danh, hoặc streak qua REST update
      NEW.xu_balance := OLD.xu_balance;
      NEW.last_checkin_date := OLD.last_checkin_date;
      NEW.checkin_streak := OLD.checkin_streak;
    end if;
    return NEW;
  end if;
  return NEW;
end;
$$;

-- 3. Cập nhật RPC daily_checkin bảo vệ điểm danh và referral
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
begin
  -- CHỐT 2: Xác thực danh tính người dùng điểm danh
  select email, coalesce(is_anonymous, false)
  into v_user_email, v_is_anon
  from auth.users
  where id = p_user_id;

  if v_user_email is null or v_is_anon = true then
    raise exception 'Tính năng điểm danh và nhận thưởng XU yêu cầu tài khoản đăng nhập bằng Email.';
  end if;

  -- Sử dụng múi giờ Việt Nam (UTC+7)
  today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- Khóa dòng profile để ngăn chặn race conditions
  select last_checkin_date, coalesce(checkin_streak, 0)
  into current_last_checkin, current_streak
  from public.profiles
  where profiles.user_id = p_user_id
  for update;

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
    
    -- Cập nhật profile
    update public.profiles
    set 
      xu_balance = xu_balance + reward_xu,
      last_checkin_date = today,
      checkin_streak = current_streak
    where user_id = p_user_id;

    -- CHỐT 3: Kiểm soát thưởng Giới thiệu bạn bè (Referral)
    if current_last_checkin is null and p_referral_code is not null then
      select user_id into referrer_user_id
      from public.profiles
      where referral_code = p_referral_code
      for update;

      if referrer_user_id is not null and referrer_user_id != p_user_id then
        -- Kiểm tra người giới thiệu có phải là tài khoản email thật không
        select email, coalesce(is_anonymous, false)
        into v_referrer_email, v_referrer_is_anon
        from auth.users
        where id = referrer_user_id;

        if v_referrer_email is not null and v_referrer_is_anon = false then
          -- Kiểm tra trần referral trong ngày của người giới thiệu (tối đa 5 lượt/ngày)
          select count(*) into referrer_daily_ref_count
          from public.referrals
          where referrer_id = referrer_user_id
            and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = today;

          if referrer_daily_ref_count < daily_referral_limit then
            insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
            values (referrer_user_id, p_user_id, ref_reward_xu, 'completed', now())
            on conflict (referee_id) do nothing;
            
            if found then
              -- Thưởng 10 XU cho người giới thiệu
              update public.profiles
              set xu_balance = xu_balance + ref_reward_xu
              where user_id = referrer_user_id;
              
              -- Thưởng thêm 10 XU cho tân thủ được giới thiệu
              update public.profiles
              set 
                xu_balance = xu_balance + ref_reward_xu,
                referred_by = p_referral_code
              where user_id = p_user_id;
              
              total_reward := total_reward + ref_reward_xu;
            end if;
          end if;
        end if;
      end if;
    end if;
    
    return total_reward;
  else
    return 0; -- Đã điểm danh hôm nay
  end if;
end;
$$;
