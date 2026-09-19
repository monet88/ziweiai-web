-- 000028_daily_checkin_streak.sql
-- Bổ sung checkin_streak vào bảng profiles và cập nhật RPC daily_checkin để cộng dồn chuỗi ngày liên tiếp (Streak)

alter table public.profiles
  add column if not exists checkin_streak integer not null default 0;

create or replace function public.daily_checkin(
  p_user_id uuid,
  p_referral_code text default null
)
returns integer
language plpgsql
security definer
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
begin
  -- Use UTC+7 (Vietnam time)
  today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  select last_checkin_date, coalesce(checkin_streak, 0)
  into current_last_checkin, current_streak
  from public.profiles
  where profiles.user_id = p_user_id
  for update; -- Lock row to prevent race conditions

  if current_last_checkin is null or current_last_checkin < today then
    -- Tính toán chuỗi ngày điểm danh liên tiếp (Streak)
    if current_last_checkin is not null and current_last_checkin = today - 1 then
      current_streak := current_streak + 1;
    else
      current_streak := 1;
    end if;

    -- Thưởng jackpot nếu đạt mốc 7 ngày liên tiếp (Day 7 = 10 XU thay vì 5 XU)
    if current_streak % 7 = 0 then
      reward_xu := 10;
    else
      reward_xu := 5;
    end if;

    total_reward := reward_xu;
    
    -- Cập nhật profile với streak và ngày điểm danh mới
    update public.profiles
    set 
      xu_balance = xu_balance + reward_xu,
      last_checkin_date = today,
      checkin_streak = current_streak
    where user_id = p_user_id;

    -- If this is their FIRST check-in and they provided a referral code
    if current_last_checkin is null and p_referral_code is not null then
      -- Find referrer
      select user_id into referrer_user_id
      from public.profiles
      where referral_code = p_referral_code
      for update; -- Lock referrer row

      if referrer_user_id is not null and referrer_user_id != p_user_id then
        -- Check daily referral cap of the referrer
        select count(*) into referrer_daily_ref_count
        from public.referrals
        where referrer_id = referrer_user_id
          and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = today;

        if referrer_daily_ref_count < daily_referral_limit then
          -- Insert referral record
          insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
          values (referrer_user_id, p_user_id, ref_reward_xu, 'completed', now())
          on conflict (referee_id) do nothing;
          
          if found then
            -- Give reward to referrer
            update public.profiles
            set xu_balance = xu_balance + ref_reward_xu
            where user_id = referrer_user_id;
            
            -- Give extra reward to referee
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
    
    return total_reward;
  else
    return 0;
  end if;
end;
$$;
