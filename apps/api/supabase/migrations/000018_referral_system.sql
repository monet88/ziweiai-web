-- 1. Add columns to profiles
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by text references public.profiles(referral_code);

-- 2. Backfill referral_code for existing users
update public.profiles
set referral_code = upper(substr(md5(user_id::text || random()::text), 1, 8))
where referral_code is null;

-- 3. Make referral_code NOT NULL
alter table public.profiles
  alter column referral_code set not null;

-- 4. Create referrals table
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(user_id) on delete cascade,
  referee_id uuid not null unique references public.profiles(user_id) on delete cascade,
  reward_xu integer not null default 10,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id, created_at desc);

alter table public.referrals enable row level security;

create policy "referrals_owner_select" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

create policy "referrals_owner_insert" on public.referrals
  for insert with check (false); -- Inserted via RPC only

-- 5. Drop the old daily_checkin since we change the return type
drop function if exists public.daily_checkin(uuid);

-- 6. Recreate daily_checkin RPC with referral support
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
  total_reward integer := 0;
  referrer_user_id uuid;
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
    
    return total_reward;
  else
    return 0;
  end if;
end;
$$;
