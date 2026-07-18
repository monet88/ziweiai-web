-- Add XU balance to profiles
alter table public.profiles
  add column if not exists xu_balance integer not null default 0 check (xu_balance >= 0);

-- Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  amount_vnd numeric not null check (amount_vnd > 0),
  xu_added integer not null check (xu_added > 0),
  sepay_transaction_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists transactions_owner_created_idx
  on public.transactions (owner_user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "transactions_owner_select" on public.transactions
  for select using (auth.uid() = owner_user_id);

-- Transactions are inserted via Service Role (Webhook), users cannot insert/update/delete
create policy "transactions_owner_insert" on public.transactions
  for insert with check (false);

-- RPC for race-condition safe deduction of XU
create or replace function public.deduct_xu(user_id uuid, amount integer)
returns boolean
language plpgsql
security definer
as $$
declare
  current_balance integer;
begin
  select xu_balance into current_balance
  from public.profiles
  where profiles.user_id = deduct_xu.user_id
  for update; -- Lock row to prevent race conditions

  if current_balance >= amount then
    update public.profiles
    set xu_balance = xu_balance - amount
    where profiles.user_id = deduct_xu.user_id;
    return true;
  else
    return false;
  end if;
end;
$$;

-- RPC for race-condition safe addition of XU
create or replace function public.add_xu(user_id uuid, amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xu_balance = xu_balance + amount
  where profiles.user_id = add_xu.user_id;
end;
$$;
