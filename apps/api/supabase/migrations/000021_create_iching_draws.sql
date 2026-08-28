create table if not exists public.iching_draws (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  cast_array jsonb not null,
  primary_hexagram_id integer not null,
  changed_hexagram_id integer,
  ai_report text not null,
  created_at timestamptz not null default now()
);

create index if not exists iching_draws_owner_created_idx
  on public.iching_draws (owner_user_id, created_at desc);

alter table public.iching_draws enable row level security;

create policy "iching_draws_owner_select" on public.iching_draws
  for select using (auth.uid() = owner_user_id);
create policy "iching_draws_owner_insert" on public.iching_draws
  for insert with check (auth.uid() = owner_user_id);
create policy "iching_draws_owner_update" on public.iching_draws
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "iching_draws_owner_delete" on public.iching_draws
  for delete using (auth.uid() = owner_user_id);
