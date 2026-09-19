-- Migration: 000032_atomic_payment_processing.sql
-- Description: Atomic payment processing RPC to ensure idempotency and prevent partial credit failures

create or replace function public.process_sepay_payment(
  p_sepay_transaction_id text,
  p_owner_user_id uuid,
  p_amount_vnd integer,
  p_xu_added integer,
  p_content text default null
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
  -- 1. Idempotency check with row lock
  select id into v_existing_id
  from public.transactions
  where sepay_transaction_id = p_sepay_transaction_id
  for update;

  if found then
    return jsonb_build_object(
      'status', 'already_processed',
      'transaction_id', v_existing_id
    );
  end if;

  -- 2. Insert transaction record
  insert into public.transactions (
    owner_user_id,
    amount_vnd,
    xu_added,
    sepay_transaction_id,
    content
  ) values (
    p_owner_user_id,
    p_amount_vnd,
    p_xu_added,
    p_sepay_transaction_id,
    p_content
  )
  returning id into v_existing_id;

  -- 3. If matched to a user, atomically credit XU and log ledger
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

revoke execute on function public.process_sepay_payment(text, uuid, integer, integer, text) from public, anon;
grant execute on function public.process_sepay_payment(text, uuid, integer, integer, text) to service_role;
