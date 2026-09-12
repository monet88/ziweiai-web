-- Migration: 000034_secure_ad_reward_and_fix_accounting.sql
-- Description:
-- 1. P0 Fix: Revoke claim_ad_reward from authenticated/anon roles completely (only service_role allowed)
-- 2. P0 Fix: Hardcode fixed reward amount (5 XU) inside database, remove caller-controlled amount parameter
-- 3. P0 Fix: Add ad_reward_claims table to track impression_id and prevent replay attacks
-- 4. P1 Fix: Add currency and original_price columns to transactions table and update process_revenuecat_payment RPC

-- ============================================================================
-- 1. AD REWARD CLAIMS TABLE (Anti-replay & Idempotency)
-- ============================================================================
create table if not exists public.ad_reward_claims (
  impression_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_xu integer not null default 5,
  created_at timestamptz not null default now()
);

create index if not exists ad_reward_claims_user_created_idx
  on public.ad_reward_claims (user_id, created_at desc);

alter table public.ad_reward_claims enable row level security;
revoke all on public.ad_reward_claims from public, anon, authenticated;
grant all on public.ad_reward_claims to service_role;

-- ============================================================================
-- 2. SECURED ATOMIC CLAIM_AD_REWARD RPC (SERVICE_ROLE ONLY)
-- ============================================================================
-- Drop old 3-parameter function that allowed caller to specify reward amount
drop function if exists public.claim_ad_reward(uuid, integer, text);

create or replace function public.claim_ad_reward(
  p_user_id uuid,
  p_impression_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_reward_amount constant integer := 5; -- HARDCODED server-side constant: exactly 5 XU
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_daily_ad_count integer := 0;
  v_new_balance integer;
  v_jwt_role text := coalesce(
    nullif(auth.role(), ''),
    nullif(current_setting('request.jwt.claim.role', true), '')
  );
begin
  -- 1. STRICT ENFORCEMENT: ONLY service_role or DB superuser can execute this RPC!
  -- Direct execution by authenticated users via PostgREST client is strictly forbidden.
  if v_jwt_role is not null and v_jwt_role != 'service_role' then
    raise exception 'Permission denied: claim_ad_reward can only be invoked by authorized backend service';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id cannot be null';
  end if;

  -- 2. Anti-replay check via impression_id
  if p_impression_id is not null and length(trim(p_impression_id)) > 0 then
    if exists (select 1 from public.ad_reward_claims where impression_id = p_impression_id) then
      return jsonb_build_object(
        'success', false,
        'message', 'Lượt xem quảng cáo này đã được nhận thưởng trước đó (Trùng lặp token).',
        'code', 'ALREADY_CLAIMED'
      );
    end if;
  end if;

  -- 3. Lock profile row to serialize concurrent requests
  select xu_balance into v_new_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'User profile % not found', p_user_id;
  end if;

  -- 4. Enforce daily ad reward limit (max 5 rewards / day according to Asia/Ho_Chi_Minh)
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

  -- 5. Record impression claim if provided
  if p_impression_id is not null and length(trim(p_impression_id)) > 0 then
    insert into public.ad_reward_claims (impression_id, user_id, reward_xu)
    values (p_impression_id, p_user_id, c_reward_amount)
    on conflict (impression_id) do nothing;
  end if;

  -- 6. Credit balance and log ledger atomically
  update public.profiles
  set xu_balance = xu_balance + c_reward_amount
  where user_id = p_user_id
  returning xu_balance into v_new_balance;

  insert into public.xu_transactions (
    user_id,
    amount,
    transaction_type
  ) values (
    p_user_id,
    c_reward_amount,
    'ad_reward'
  );

  return jsonb_build_object(
    'success', true,
    'xu_added', c_reward_amount,
    'new_balance', v_new_balance
  );
end;
$$;

-- REVOKE ALL permissions from public, anon, and authenticated users
revoke execute on function public.claim_ad_reward(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_ad_reward(uuid, text) to service_role;

-- ============================================================================
-- 3. REVENUECAT CURRENCY & ORIGINAL PRICE ACCOUNTING FIX
-- ============================================================================
alter table public.transactions add column if not exists currency text default 'VND';
alter table public.transactions add column if not exists original_price numeric default null;

-- Update process_revenuecat_payment RPC to accept and record currency & original_price
create or replace function public.process_revenuecat_payment(
  p_rc_transaction_id text,
  p_owner_user_id uuid,
  p_amount_vnd integer,
  p_xu_added integer,
  p_currency text default 'VND',
  p_original_price numeric default null
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

  -- Insert transaction record with accurate currency & original_price
  insert into public.transactions (
    owner_user_id,
    amount_vnd,
    xu_added,
    revenuecat_transaction_id,
    currency,
    original_price
  ) values (
    p_owner_user_id,
    p_amount_vnd,
    p_xu_added,
    p_rc_transaction_id,
    coalesce(p_currency, 'VND'),
    p_original_price
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

revoke execute on function public.process_revenuecat_payment(text, uuid, integer, integer, text, numeric) from public, anon, authenticated;
grant execute on function public.process_revenuecat_payment(text, uuid, integer, integer, text, numeric) to service_role;
