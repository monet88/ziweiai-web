-- US-025 (decision 0021): context for the four time-based divination systems.
-- The chart_snapshots row stays pure engine output; the user's question + purpose
-- + cast moment live here, linked 1:1-ish to a snapshot. RLS is owner-scoped and
-- bound to the `authenticated` role (decision 0020).

create table if not exists public.divination_context (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  question text not null,
  purpose_key text not null check (purpose_key in ('career', 'love', 'wealth', 'health', 'decision', 'custom')),
  purpose_custom text,
  cast_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists divination_context_owner_created_idx
  on public.divination_context (owner_user_id, created_at desc);
create index if not exists divination_context_snapshot_idx
  on public.divination_context (chart_snapshot_id);

alter table public.divination_context enable row level security;

create policy "divination_context_owner_select" on public.divination_context
  for select to authenticated using (auth.uid() = owner_user_id);
create policy "divination_context_owner_insert" on public.divination_context
  for insert to authenticated with check (auth.uid() = owner_user_id);
create policy "divination_context_owner_update" on public.divination_context
  for update to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "divination_context_owner_delete" on public.divination_context
  for delete to authenticated using (auth.uid() = owner_user_id);

-- rollback note:
-- this migration creates the divination_context table with RLS; rollback is safe by dropping the table.
