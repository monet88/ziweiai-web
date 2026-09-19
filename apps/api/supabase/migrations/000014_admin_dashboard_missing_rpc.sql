-- Create xu_transactions table for a complete ledger of XU changes
create table if not exists public.xu_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null, -- Can be negative for deduction
  transaction_type text not null, -- 'admin_topup', 'ai_usage', 'sepay_topup'
  actor_email text, -- Admin email if done by admin
  created_at timestamptz not null default now()
);

create index if not exists xu_transactions_user_id_idx on public.xu_transactions (user_id);
create index if not exists xu_transactions_created_at_idx on public.xu_transactions (created_at desc);

alter table public.xu_transactions enable row level security;
DO $$ BEGIN
  create policy "xu_transactions_select_admin" on public.xu_transactions
    for select using (
      exists (
        select 1 from public.admin_roles 
        where email = auth.jwt()->>'email' 
        and role in ('SUPER_ADMIN', 'MODERATOR')
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RPC for logging and performing XU transactions (e.g. Admin Topup)
create or replace function public.log_xu_transaction(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_actor_email text default null
) returns boolean
language plpgsql
security definer
as $$
declare
  current_balance integer;
begin
  -- Lock row
  select xu_balance into current_balance
  from public.profiles
  where user_id = p_user_id
  for update;

  if current_balance is null then
    return false; -- User not found
  end if;

  -- Prevent deduction if balance is insufficient
  if p_amount < 0 and current_balance + p_amount < 0 then
    return false;
  end if;

  -- Update profile balance
  update public.profiles
  set xu_balance = xu_balance + p_amount
  where user_id = p_user_id;

  -- Insert into ledger
  insert into public.xu_transactions (user_id, amount, transaction_type, actor_email)
  values (p_user_id, p_amount, p_transaction_type, p_actor_email);

  return true;
end;
$$;

-- RPC for Admin Analytics
create or replace function public.get_admin_analytics(days integer default 30)
returns json
language plpgsql
security definer
as $$
declare
  v_total_users integer;
  v_total_xu_topup integer;
  v_total_xu_consumed integer;
  v_daily_stats json;
begin
  -- Total users
  select count(*) into v_total_users from public.profiles;

  -- Total XU Topup (amount > 0)
  select coalesce(sum(amount), 0) into v_total_xu_topup 
  from public.xu_transactions 
  where amount > 0;

  -- Total XU Consumed (amount < 0)
  select coalesce(sum(abs(amount)), 0) into v_total_xu_consumed 
  from public.xu_transactions 
  where amount < 0;

  -- Daily stats for the last N days
  with date_series as (
    select generate_series(
      date_trunc('day', now() - (days || ' days')::interval),
      date_trunc('day', now()),
      '1 day'::interval
    ) as date
  ),
  daily_users as (
    select date_trunc('day', created_at) as date, count(*) as new_users
    from public.profiles
    where created_at >= now() - (days || ' days')::interval
    group by 1
  ),
  daily_xu as (
    select 
      date_trunc('day', created_at) as date,
      coalesce(sum(case when amount > 0 then amount else 0 end), 0) as xu_topup,
      coalesce(sum(case when amount < 0 then abs(amount) else 0 end), 0) as xu_consumed
    from public.xu_transactions
    where created_at >= now() - (days || ' days')::interval
    group by 1
  )
  select json_agg(
    json_build_object(
      'date', to_char(ds.date, 'YYYY-MM-DD'),
      'new_users', coalesce(du.new_users, 0),
      'xu_topup', coalesce(dx.xu_topup, 0),
      'xu_consumed', coalesce(dx.xu_consumed, 0)
    ) order by ds.date desc
  ) into v_daily_stats
  from date_series ds
  left join daily_users du on ds.date = du.date
  left join daily_xu dx on ds.date = dx.date;

  return json_build_object(
    'total_users', v_total_users,
    'total_xu_topup', v_total_xu_topup,
    'total_xu_consumed', v_total_xu_consumed,
    'daily_stats', coalesce(v_daily_stats, '[]'::json)
  );
end;
$$;
