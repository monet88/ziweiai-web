-- 000021_daily_referral_cap.sql
-- Cập nhật RPC daily_checkin để kiểm soát trần nhận thưởng referral mỗi ngày (Daily Referral Cap: tối đa 5 lượt = 50 XU/ngày/referrer).

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
  today date;
  reward_xu constant integer := 5;
  ref_reward_xu constant integer := 10;
  daily_referral_limit constant integer := 5;
  total_reward integer := 0;
  referrer_user_id uuid;
  referrer_daily_ref_count integer := 0;
begin
  -- Use UTC+7 (Vietnam time)
  today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  select last_checkin_date into current_last_checkin
  from public.profiles
  where profiles.user_id = p_user_id
  for update; -- Lock row to prevent race conditions

  if current_last_checkin is null or current_last_checkin < today then
    total_reward := reward_xu;
    
    -- Basic check-in reward
    update public.profiles
    set 
      xu_balance = xu_balance + reward_xu,
      last_checkin_date = today
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
