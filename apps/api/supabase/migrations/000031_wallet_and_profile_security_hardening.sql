-- Migration: 000031_wallet_and_profile_security_hardening.sql
-- Description: Hardening profiles table against client-side balance minting, check-in reset, and securing daily_checkin RPC

-- 1. Tighten DELETE on profiles (Users cannot delete profile to bypass referral or reset checkin)
revoke delete on public.profiles from authenticated, anon, public;

-- 2. Create or replace trigger function to protect economic columns on profiles
create or replace function public.protect_profile_economic_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_service boolean := (auth.role() = 'service_role' or current_user = 'postgres' or current_user = 'service_role');
begin
  if TG_OP = 'INSERT' then
    if not is_service then
      -- Clients cannot insert arbitrary xu_balance or fake check-in records
      NEW.xu_balance := 15; -- Standard welcome bonus
      NEW.last_checkin_date := null;
      NEW.checkin_streak := 0;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if not is_service then
      -- Clients cannot manipulate balance, check-in dates, or streak via direct update
      NEW.xu_balance := OLD.xu_balance;
      NEW.last_checkin_date := OLD.last_checkin_date;
      NEW.checkin_streak := OLD.checkin_streak;
    end if;
    return NEW;
  end if;
  return NEW;
end;
$$;

-- Apply trigger before insert or update on profiles
drop trigger if exists trg_protect_profile_economic_columns on public.profiles;
create trigger trg_protect_profile_economic_columns
before insert or update on public.profiles
for each row
execute function public.protect_profile_economic_columns();

-- 3. Secure daily_checkin RPC against identity spoofing and anon access
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
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  yesterday date := today - 1;
  current_last_checkin date;
  current_streak integer := 0;
  reward_xu integer := 5;
  referrer_user_id uuid;
  ref_reward_xu integer := 10;
  total_reward integer := 0;
  daily_referral_limit integer := 5;
  referrer_daily_ref_count integer := 0;
begin
  -- Identity check: authenticated caller must match p_user_id unless called by service_role
  if auth.role() is not null and auth.role() != 'service_role' and auth.uid() is not null and auth.uid() != p_user_id then
    raise exception 'Unauthorized check-in attempt for user %', p_user_id;
  end if;

  -- Lock row to prevent concurrent check-in race conditions
  select last_checkin_date, coalesce(checkin_streak, 0)
  into current_last_checkin, current_streak
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    return 0;
  end if;

  -- Already checked in today
  if current_last_checkin = today then
    return 0;
  end if;

  -- Update streak
  if current_last_checkin = yesterday then
    current_streak := current_streak + 1;
  else
    current_streak := 1;
  end if;

  -- Reward: 10 XU on every 7th day of streak, 5 XU otherwise
  if current_streak % 7 = 0 then
    reward_xu := 10;
  else
    reward_xu := 5;
  end if;

  total_reward := reward_xu;
  
  -- Update profile with streak and new checkin date using service_role bypass via security definer
  update public.profiles
  set 
    xu_balance = xu_balance + reward_xu,
    last_checkin_date = today,
    checkin_streak = current_streak
  where user_id = p_user_id;

  -- Log ledger for checkin reward
  insert into public.xu_transactions (user_id, amount, transaction_type)
  values (p_user_id, reward_xu, 'checkin_reward');

  -- If this is their FIRST check-in and they provided a referral code
  if current_last_checkin is null and p_referral_code is not null then
    select user_id into referrer_user_id
    from public.profiles
    where referral_code = p_referral_code
    for update;

    if referrer_user_id is not null and referrer_user_id != p_user_id then
      select count(*) into referrer_daily_ref_count
      from public.referrals
      where referrer_id = referrer_user_id
        and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = today;

      if referrer_daily_ref_count < daily_referral_limit then
        insert into public.referrals (referrer_id, referee_id, reward_xu, status, completed_at)
        values (referrer_user_id, p_user_id, ref_reward_xu, 'completed', now())
        on conflict (referee_id) do nothing;
        
        if found then
          -- Give reward to referrer + log ledger
          update public.profiles
          set xu_balance = xu_balance + ref_reward_xu
          where user_id = referrer_user_id;
          
          insert into public.xu_transactions (user_id, amount, transaction_type)
          values (referrer_user_id, ref_reward_xu, 'referral_bonus');
          
          -- Give extra reward to referee + log ledger
          update public.profiles
          set 
            xu_balance = xu_balance + ref_reward_xu,
            referred_by = p_referral_code
          where user_id = p_user_id;

          insert into public.xu_transactions (user_id, amount, transaction_type)
          values (p_user_id, ref_reward_xu, 'referral_bonus');

          total_reward := total_reward + ref_reward_xu;
        end if;
      end if;
    end if;
  end if;

  return total_reward;
end;
$$;

-- Revoke execute from anon and public
revoke execute on function public.daily_checkin(uuid, text) from public, anon;
grant execute on function public.daily_checkin(uuid, text) to authenticated, service_role;
