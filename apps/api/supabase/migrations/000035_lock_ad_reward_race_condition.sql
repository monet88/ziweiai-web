-- Migration: 000035_lock_ad_reward_race_condition.sql
-- Description:
-- 1. P0 Fix: Eliminate race condition in claim_ad_reward by using atomic INSERT ... ON CONFLICT check FIRST.
-- 2. P0 Fix: Enforce p_impression_id is NOT NULL and NOT EMPTY.
-- 3. P0 Fix: Rollback claim record if daily limit is exceeded.

-- Drop previous function to allow removing default value on p_impression_id
drop function if exists public.claim_ad_reward(uuid, text);

create or replace function public.claim_ad_reward(
  p_user_id uuid,
  p_impression_id text
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
  v_trimmed_impression text;
  v_jwt_role text := coalesce(
    nullif(auth.role(), ''),
    nullif(current_setting('request.jwt.claim.role', true), '')
  );
begin
  -- 1. STRICT AUTHORIZATION: ONLY backend service_role or DB superuser can execute!
  if v_jwt_role is not null and v_jwt_role != 'service_role' then
    raise exception 'Permission denied: claim_ad_reward can only be invoked by authorized backend service';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id cannot be null';
  end if;

  v_trimmed_impression := trim(coalesce(p_impression_id, ''));
  if length(v_trimmed_impression) = 0 then
    raise exception 'p_impression_id cannot be empty';
  end if;

  -- 2. ATOMIC LOCK-BY-INSERT (PREVENT ALL RACE CONDITIONS):
  -- We attempt to insert into ad_reward_claims FIRST.
  -- The PRIMARY KEY on impression_id guarantees that concurrent requests with identical IDs
  -- are immediately stopped in their tracks without multiple balance increments!
  insert into public.ad_reward_claims (impression_id, user_id, reward_xu)
  values (v_trimmed_impression, p_user_id, c_reward_amount)
  on conflict (impression_id) do nothing;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Lượt xem quảng cáo này đã được nhận thưởng trước đó (Trùng lặp impression ID).',
      'code', 'ALREADY_CLAIMED'
    );
  end if;

  -- 3. Enforce daily ad reward limit (max 5 rewards / day in Asia/Ho_Chi_Minh)
  select count(*) into v_daily_ad_count
  from public.ad_reward_claims
  where user_id = p_user_id
    and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today;

  if v_daily_ad_count > 5 then
    -- Delete the claim row just inserted so limit isn't blocked by rejected attempts
    delete from public.ad_reward_claims where impression_id = v_trimmed_impression;
    return jsonb_build_object(
      'success', false,
      'message', 'Đã đạt giới hạn nhận thưởng xem quảng cáo hôm nay (tối đa 5 lượt/ngày).',
      'code', 'DAILY_LIMIT_REACHED'
    );
  end if;

  -- 4. Lock profile row and credit XU atomically
  select xu_balance into v_new_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    delete from public.ad_reward_claims where impression_id = v_trimmed_impression;
    raise exception 'User profile % not found', p_user_id;
  end if;

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

revoke execute on function public.claim_ad_reward(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_ad_reward(uuid, text) to service_role;
