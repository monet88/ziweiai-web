-- Migration: 000036_serialize_ad_reward_daily_cap.sql
-- Description:
-- 1. P0 Fix: Completely serialize claim_ad_reward per user using pessimistic row lock (SELECT FOR UPDATE on profiles) FIRST.
-- 2. Prevent race condition where concurrent requests with different impression IDs breach the 5 claims/day limit.
-- 3. Eliminate unnecessary insert-then-delete row churn by checking limit before inserting.

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
  c_max_daily_claims constant integer := 5; -- HARDCODED: max 5 claims / day
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

  -- 2. SERIALIZATION LOCK (P0 FIX FOR DAILY CAP RACE CONDITION):
  -- Pessimistic row-level lock on user profile.
  -- All concurrent requests for this user are strictly serialized.
  -- Request B is queued until Request A commits or rolls back.
  select xu_balance into v_new_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'User profile % not found', p_user_id;
  end if;

  -- 3. Check if impression ID was already claimed
  if exists (
    select 1 from public.ad_reward_claims
    where impression_id = v_trimmed_impression
  ) then
    return jsonb_build_object(
      'success', false,
      'message', 'Lượt xem quảng cáo này đã được nhận thưởng trước đó (Trùng lặp impression ID).',
      'code', 'ALREADY_CLAIMED'
    );
  end if;

  -- 4. Check daily ad reward limit (max 5 rewards / day in Asia/Ho_Chi_Minh)
  -- Because profile row lock is held, this count is guaranteed to be 100% accurate and fresh.
  select count(*) into v_daily_ad_count
  from public.ad_reward_claims
  where user_id = p_user_id
    and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_today;

  if v_daily_ad_count >= c_max_daily_claims then
    return jsonb_build_object(
      'success', false,
      'message', 'Đã đạt giới hạn nhận thưởng xem quảng cáo hôm nay (tối đa 5 lượt/ngày).',
      'code', 'DAILY_LIMIT_REACHED'
    );
  end if;

  -- 5. Insert claim record atomically with conflict safety
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

  -- 6. Credit XU and record transaction
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
