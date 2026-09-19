-- Migration: 000033_commercial_launch_security_hardening.sql
-- Description: 
-- 1. Fix SECURITY DEFINER trigger bypass in protect_profile_economic_columns
-- 2. Add atomic process_revenuecat_payment RPC
-- 3. Add atomic claim_ad_reward RPC with daily cap enforcement
-- 4. Enable user select on xu_transactions (ledger visibility)

-- ============================================================================
-- 1. HARDEN PROFILE ECONOMIC COLUMNS TRIGGER
-- ============================================================================
-- In PostgreSQL SECURITY DEFINER functions, current_user is the function owner ('postgres').
-- Checking `current_user = 'postgres'` always evaluates to true, completely bypassing client guards!
-- We must inspect the Supabase JWT role: `auth.role()` or `request.jwt.claim.role`.
-- If the caller is an authenticated or anon user, economic columns MUST NOT be directly modified.

create or replace function public.protect_profile_economic_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text := coalesce(
    nullif(auth.role(), ''),
    nullif(current_setting('request.jwt.claim.role', true), '')
  );
  v_is_service boolean := false;
begin
  -- Explicitly verify if request originates from service_role or database superuser without JWT
  if v_jwt_role = 'service_role' then
    v_is_service := true;
  elsif v_jwt_role is null and session_user in ('postgres', 'supabase_admin') then
    v_is_service := true;
  else
    -- Any call with jwt_role in ('authenticated', 'anon') or unknown non-service role
    v_is_service := false;
  end if;

  if TG_OP = 'INSERT' then
    if not v_is_service then
      -- Clients cannot insert arbitrary xu_balance or fake check-in records
      NEW.xu_balance := 15; -- Standard welcome bonus
      NEW.last_checkin_date := null;
      NEW.checkin_streak := 0;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if not v_is_service then
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

-- Ensure trigger is attached
drop trigger if exists trg_protect_profile_economic_columns on public.profiles;
create trigger trg_protect_profile_economic_columns
before insert or update on public.profiles
for each row
execute function public.protect_profile_economic_columns();

-- ============================================================================
-- 2. ATOMIC REVENUECAT PAYMENT PROCESSING RPC
-- ============================================================================
create or replace function public.process_revenuecat_payment(
  p_rc_transaction_id text,
  p_owner_user_id uuid,
  p_amount_vnd integer,
  p_xu_added integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_new_balance integer;
begin
  -- Idempotency check with row lock
  select id into v_existing_id
  from public.transactions
  where revenuecat_transaction_id = p_rc_transaction_id
  for update;

  if found then
    return jsonb_build_object(
      'status', 'already_processed',
      'transaction_id', v_existing_id
    );
  end if;

  -- Insert transaction record
  insert into public.transactions (
    owner_user_id,
    amount_vnd,
    xu_added,
    revenuecat_transaction_id
  ) values (
    p_owner_user_id,
    p_amount_vnd,
    p_xu_added,
    p_rc_transaction_id
  )
  returning id into v_existing_id;

  -- Atomically credit XU and log ledger
  if p_owner_user_id is not null and p_xu_added > 0 then
    update public.profiles
    set xu_balance = xu_balance + p_xu_added
    where user_id = p_owner_user_id
    returning xu_balance into v_new_balance;

    insert into public.xu_transactions (
      user_id,
      amount,
      transaction_type
    ) values (
      p_owner_user_id,
      p_xu_added,
      'topup'
    );
  end if;

  return jsonb_build_object(
    'status', 'success',
    'transaction_id', v_existing_id,
    'new_balance', v_new_balance
  );
end;
$$;

revoke execute on function public.process_revenuecat_payment(text, uuid, integer, integer) from public, anon;
grant execute on function public.process_revenuecat_payment(text, uuid, integer, integer) to service_role;

-- ============================================================================
-- 3. ATOMIC AD REWARD CLAIM RPC
-- ============================================================================
create or replace function public.claim_ad_reward(
  p_user_id uuid,
  p_reward_amount integer default 5,
  p_ad_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_daily_ad_count integer := 0;
  v_new_balance integer;
begin
  -- 1. Authorization check
  if auth.role() is not null and auth.role() != 'service_role' and auth.uid() is not null and auth.uid() != p_user_id then
    raise exception 'Unauthorized ad reward attempt for user %', p_user_id;
  end if;

  -- 2. Lock profile row
  select xu_balance into v_new_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'User profile % not found', p_user_id;
  end if;

  -- 3. Count today ad rewards for this user atomically
  select count(*) into v_daily_ad_count
  from public.xu_transactions
  where user_id = p_user_id
    and transaction_type = 'ad_reward'
    and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today;

  if v_daily_ad_count >= 5 then
    return jsonb_build_object(
      'success', false,
      'message', 'Đã đạt giới hạn nhận thưởng xem quảng cáo hôm nay (tối đa 5 lượt/ngày).',
      'code', 'DAILY_LIMIT_REACHED'
    );
  end if;

  -- 4. Credit balance & record ledger in single transaction
  update public.profiles
  set xu_balance = xu_balance + p_reward_amount
  where user_id = p_user_id
  returning xu_balance into v_new_balance;

  insert into public.xu_transactions (
    user_id,
    amount,
    transaction_type
  ) values (
    p_user_id,
    p_reward_amount,
    'ad_reward'
  );

  return jsonb_build_object(
    'success', true,
    'xu_added', p_reward_amount,
    'new_balance', v_new_balance
  );
end;
$$;

revoke execute on function public.claim_ad_reward(uuid, integer, text) from public, anon;
grant execute on function public.claim_ad_reward(uuid, integer, text) to authenticated, service_role;

-- ============================================================================
-- 4. ENABLE USER SELECT ON XU_TRANSACTIONS
-- ============================================================================
DO $$ BEGIN
  create policy "xu_transactions_owner_select" on public.xu_transactions
    for select using (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
